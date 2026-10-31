// synced from templates/_core — edit there, then run `node scripts/templates/sync-core.mjs`
import { startCustomerSignIn, completeCustomerSignIn } from "./customer-sso";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useStore } from "./store-context";
import { useCatalog, usePageMeta } from "./queries";
import { useCart } from "./cart-store";
import {
  customerApi,
  customerConfig,
  customerLogout,
  customerPortalHref,
  customerSession,
} from "./customer";
import { signedFetch } from "@chepelcr/tsuru-storefront-sdk";
import { env } from "./env";
import type { CatalogItem } from "./types";

type Translate = (
  key: string,
  vars?: Record<string, string | number>,
) => string;
export function useCustomerAccount() {
  const [signedIn, setSignedIn] = useState(false),
    [ready, setReady] = useState(false);
  const refresh = async () => {
    try {
      setSignedIn(Boolean(await customerSession()));
    } catch {
      setSignedIn(false);
    } finally {
      setReady(true);
    }
  };
  useEffect(() => {
    void refresh();
    const handler = () => void refresh();
    window.addEventListener("tsuru-customer-session", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("tsuru-customer-session", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return { signedIn, ready, refresh };
}
export function CustomerSignInButton({
  t,
  returnPath,
}: {
  t: Translate;
  returnPath?: string;
}) {
  const { config, isDemo } = useStore();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <div>
      <button
        type="button"
        className="tsuru-customer-primary"
        disabled={busy || isDemo || !config?.orgId}
        onClick={() => {
          setBusy(true);
          setError("");
          void startCustomerSignIn(config!.orgId!, returnPath).catch(() => {
            setError(t("customer.authError"));
            setBusy(false);
          });
        }}
      >
        {busy ? t("customer.wait") : t("customer.login")}
      </button>
      {error && (
        <p className="tsuru-customer-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
export function CustomerSsoCallback({ t }: { t: Translate }) {
  const started = useRef(false),
    [error, setError] = useState("");
  useEffect(() => {
    if (!started.current) {
      started.current = true;
      void completeCustomerSignIn().catch(() =>
        setError(t("customer.authError")),
      );
    }
  }, [t]);
  return (
    <section className="tsuru-account-page">
      <h1>{t("customer.account")}</h1>
      {error ? (
        <>
          <p role="alert">{error}</p>
          <Link href="/account">{t("customer.login")}</Link>
        </>
      ) : (
        <p role="status">{t("customer.wait")}</p>
      )}
    </section>
  );
}
/**
 * The account links each template places in its own menus (not a bar of
 * their own): the store's barter page, and sign-in or the customer's
 * account. `key` is the dictionary key, for templates that gloss labels.
 */
export function useAccountLinks(t: Translate) {
  const { signedIn } = useCustomerAccount();
  const accountKey = signedIn ? "customer.account" : "customer.login";
  return {
    barter: { href: "/trueque", key: "barter.title", label: t("barter.title") },
    account: { href: "/account", key: accountKey, label: t(accountKey) },
  };
}
export function CustomerAccountEntry({ t }: { t: Translate }) {
  const { config, isDemo } = useStore(),
    account = useCustomerAccount();
  const settings = useQuery({
    queryKey: ["customer-config"],
    queryFn: customerConfig,
  });
  usePageMeta(t("customer.account"));
  const configured = Boolean(
    settings.data?.apiUrl && settings.data.userPoolId && settings.data.clientId,
  );
  const portal = settings.data
    ? customerPortalHref(settings.data, "/orders", config?.orgId)
    : null;
  return (
    <section className="tsuru-account-page">
      <h1>{t("customer.account")}</h1>
      <p>{t("customer.shared")}</p>
      {isDemo ? (
        <p className="tsuru-customer-note">{t("barter.demo")}</p>
      ) : settings.isPending ? (
        <p role="status">{t("state.loading")}</p>
      ) : !configured ? (
        <p className="tsuru-customer-note">{t("customer.unconfigured")}</p>
      ) : !account.signedIn ? (
        <CustomerSignInButton t={t} />
      ) : (
        <div className="tsuru-customer-auth">
          <h2>{t("customer.connected")}</h2>
          {portal && (
            <a className="tsuru-customer-primary" href={portal}>
              {t("customer.allOrders")}
            </a>
          )}
          <Link href="/trueque">{t("barter.explore")}</Link>
          <button
            type="button"
            className="tsuru-customer-secondary"
            onClick={() =>
              void customerLogout().then(() => {
                window.dispatchEvent(new Event("tsuru-customer-session"));
                void account.refresh();
              })
            }
          >
            {t("customer.logout")}
          </button>
        </div>
      )}
    </section>
  );
}
export function barterDetails(item: CatalogItem) {
  const raw = item.raw.raw || {};
  return {
    enabled: raw.accepts_barter === true || raw.acceptsBarter === true,
    wants: String(raw.barter_wants || raw.barterWants || ""),
  };
}
export function StoreBarterPage({ t }: { t: Translate }) {
  const catalog = useCatalog(),
    { config, isDemo, organization } = useStore(),
    account = useCustomerAccount();
  const [search, setSearch] = useState(""),
    [selected, setSelected] = useState<CatalogItem | null>(null),
    [quantity, setQuantity] = useState("1"),
    [offered, setOffered] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false),
    [retryKey, setRetryKey] = useState(() => crypto.randomUUID());
  const settings = useQuery({
    queryKey: ["customer-config"],
    queryFn: customerConfig,
  });
  usePageMeta(t("barter.title"));
  const eligible = catalog.items.filter((item) => barterDetails(item).enabled),
    items = eligible.filter((item) =>
      item.searchText.includes(
        search
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase(),
      ),
    );
  const choose = (item: CatalogItem) => {
    setSelected(item);
    setQuantity("1");
    setOffered("");
    setMessage("");
    setError("");
    setSaved(false);
    setRetryKey(crypto.randomUUID());
    requestAnimationFrame(() =>
      document
        .getElementById("tsuru-barter-proposal")
        ?.scrollIntoView({ behavior: "auto", block: "start" }),
    );
  };
  useEffect(() => {
    const productId = new URLSearchParams(window.location.search).get(
      "product",
    );
    const item = catalog.items.find(
      (value) => value.id === productId && barterDetails(value).enabled,
    );
    if (item && !selected) choose(item);
  }, [catalog.items]);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected || !config?.orgId || isDemo) return;
    setBusy(true);
    setError("");
    try {
      await customerApi(
        `/api/customer/me/shops/${encodeURIComponent(config.orgId)}/barter-proposals`,
        {
          product_id: selected.id,
          quantity,
          offered_description: offered,
          message,
        },
        "POST",
        retryKey,
      );
      setSaved(true);
    } catch (e) {
      setError(
        (e as { status?: number }).status === 409
          ? t("barter.changed")
          : (e as { status?: number }).status === 404
            ? t("barter.unavailable")
            : (e as { status?: number }).status === 401 ||
                (e as { status?: number }).status === 403
              ? t("customer.authAgain")
              : t("barter.error"),
      );
    } finally {
      setBusy(false);
    }
  };
  const portal = settings.data
    ? customerPortalHref(settings.data, "/barter", config?.orgId)
    : null;
  const ready = Boolean(
    settings.data?.apiUrl && settings.data.userPoolId && settings.data.clientId,
  );
  return (
    <section className="tsuru-barter-page">
      <header className="tsuru-barter-heading">
        <p className="tsuru-customer-eyebrow">{organization?.name}</p>
        <h1>{t("barter.title")}</h1>
        <p>{t("barter.intro")}</p>
        <p className="tsuru-customer-note">{t("barter.signInHint")}</p>
      </header>
      <label className="tsuru-barter-search">
        {t("catalog.search")}
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("barter.search")}
        />
      </label>
      {catalog.isLoading ? (
        <p role="status">{t("state.loading")}</p>
      ) : catalog.isError ? (
        <div role="alert">
          <p>{t("catalog.error.title")}</p>
          <button
            className="tsuru-customer-secondary"
            onClick={catalog.refetch}
          >
            {t("state.retry")}
          </button>
        </div>
      ) : !items.length ? (
        <div className="tsuru-barter-empty">
          <h2>{t("barter.empty")}</h2>
          <p>
            {t(eligible.length ? "catalog.empty.body" : "barter.emptyBody")}
          </p>
          <Link href="/products">{t("catalog.viewAll")}</Link>
        </div>
      ) : (
        <div className="tsuru-barter-grid">
          {items.map((item) => (
            <article className="tsuru-barter-card" key={item.id}>
              {item.imageUrl && (
                <Link href={`/products/${encodeURIComponent(item.id)}`}>
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    loading="lazy"
                    width={400}
                    height={320}
                  />
                </Link>
              )}
              <div>
                <span className="tsuru-barter-badge">{t("barter.badge")}</span>
                <h2>
                  <Link href={`/products/${encodeURIComponent(item.id)}`}>
                    {item.name}
                  </Link>
                </h2>
                <p>{barterDetails(item).wants || t("barter.open")}</p>
                <button
                  className="tsuru-customer-primary"
                  type="button"
                  disabled={isDemo || item.availability.state === "sold_out"}
                  onClick={() => choose(item)}
                >
                  {item.availability.state === "sold_out"
                    ? t("barter.soldOut")
                    : t("barter.propose")}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      {isDemo && <p className="tsuru-customer-note">{t("barter.demo")}</p>}
      {selected && (
        <section id="tsuru-barter-proposal" className="tsuru-barter-proposal">
          <div className="tsuru-barter-proposal-heading">
            <h2>{t("barter.proposeFor", { name: selected.name })}</h2>
            <button
              type="button"
              className="tsuru-customer-secondary"
              onClick={() => setSelected(null)}
              disabled={busy}
            >
              {t("nav.close")}
            </button>
          </div>
          {!ready ? (
            <p>{t("customer.unconfigured")}</p>
          ) : !account.signedIn ? (
            <CustomerSignInButton
              t={t}
              returnPath={`/trueque?product=${encodeURIComponent(selected.id)}#tsuru-barter-proposal`}
            />
          ) : saved ? (
            <div role="status">
              <h3>{t("barter.sent")}</h3>
              <p>{t("barter.sentBody")}</p>
              {portal && <a href={portal}>{t("barter.follow")}</a>}
            </div>
          ) : (
            <form onSubmit={submit}>
              <label>
                {t("barter.quantity")}
                <input
                  type="number"
                  min="0.00001"
                  step="0.00001"
                  required
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(e.target.value);
                    setRetryKey(crypto.randomUUID());
                  }}
                />
              </label>
              <label>
                {t("barter.offered")}
                <textarea
                  required
                  minLength={3}
                  maxLength={500}
                  value={offered}
                  onChange={(e) => {
                    setOffered(e.target.value);
                    setRetryKey(crypto.randomUUID());
                  }}
                />
              </label>
              <label>
                {t("barter.message")}
                <textarea
                  maxLength={500}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    setRetryKey(crypto.randomUUID());
                  }}
                />
              </label>
              <p className="tsuru-customer-note">{t("barter.noPayment")}</p>
              {error && (
                <p role="alert" className="tsuru-customer-error">
                  {error}
                </p>
              )}
              <button className="tsuru-customer-primary" disabled={busy}>
                {busy ? t("customer.wait") : t("barter.send")}
              </button>
            </form>
          )}
        </section>
      )}
    </section>
  );
}
export function AccountCheckoutLink({
  t,
  items,
}: {
  t: Translate;
  items?: { productId: string; quantity: number }[];
}) {
  const { config, isDemo } = useStore(),
    cartLines = useCart((s) => s.lines);
  const lines =
    items ??
    cartLines.map((line) => ({
      productId: line.productId,
      quantity: line.quantity,
    }));
  const settings = useQuery({
    queryKey: ["customer-config"],
    queryFn: customerConfig,
  });
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  if (
    isDemo ||
    !settings.data ||
    !customerPortalHref(settings.data, "/") ||
    !config?.orgId
  )
    return null;
  const open = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await signedFetch(
        `${env.apiHost}/api/organizations/${encodeURIComponent(config.orgId!)}/customer-checkout-intents`,
        env.region,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: lines.map((l) => ({
              product_id: l.productId,
              quantity: l.quantity,
            })),
          }),
        },
      );
      if (!response.ok) throw Error(t("customer.checkoutError"));
      const result = (await response.json()) as { intent_id: string };
      const url = customerPortalHref(
        settings.data!,
        `/checkout/${encodeURIComponent(result.intent_id)}`,
      );
      if (url) window.location.assign(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("customer.checkoutError"));
      setBusy(false);
    }
  };
  return (
    <div className="tsuru-checkout-account">
      <p>{t("customer.checkoutHint")}</p>
      <button
        type="button"
        className="tsuru-customer-secondary"
        disabled={busy || lines.length === 0}
        onClick={() => void open()}
      >
        {busy ? t("customer.wait") : t("customer.checkout")}
      </button>
      {error && (
        <p role="alert" className="tsuru-customer-error">
          {error}
        </p>
      )}
      <small>{t("customer.guestKept")}</small>
    </div>
  );
}
