// synced from templates/_core — edit there, then run `node scripts/templates/sync-core.mjs`
import {
  CognitoUser,
  CognitoUserPool,
  CognitoUserSession,
  CognitoIdToken,
  CognitoAccessToken,
  CognitoRefreshToken,
} from "amazon-cognito-identity-js";
import { customerConfig, customerPortalHref } from "./customer";
const KEY = "tsuru-customer-sso";
const encode = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
const random = () => encode(crypto.getRandomValues(new Uint8Array(32)));
export async function startCustomerSignIn(
  shopId: string,
  returnPath = window.location.pathname +
    window.location.search +
    window.location.hash,
) {
  const config = await customerConfig(),
    portal = customerPortalHref(config, "/sso");
  if (
    !portal ||
    !config.apiUrl ||
    !config.userPoolId ||
    !config.clientId ||
    !shopId
  )
    throw Error("El acceso de clientes todavía no está disponible.");
  if (
    !returnPath.startsWith("/") ||
    returnPath.startsWith("//") ||
    returnPath.includes("\\")
  )
    throw Error("No se pudo preparar el regreso a la tienda.");
  const verifier = random(),
    state = random();
  const challenge = encode(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)),
    ),
  );
  const pending = JSON.stringify({
    verifier,
    state,
    shopId,
    returnPath,
    expires: Date.now() + 30 * 60_000,
  });
  sessionStorage.setItem(KEY, pending);
  // Email links can finish in a new tab; only an opaque PKCE/state record is
  // shared at the store origin, never a password or account token.
  localStorage.setItem(KEY + ":" + state, pending);
  const url = new URL(portal);
  for (const [name, value] of Object.entries({
    shop: shopId,
    return_path: returnPath,
    state,
    code_challenge: challenge,
  }))
    url.searchParams.set(name, value);
  window.location.assign(url.href);
}
export async function completeCustomerSignIn(): Promise<void> {
  const params = new URLSearchParams(window.location.search),
    code = params.get("code"),
    state = params.get("state");
  const pending = JSON.parse(
    (state ? localStorage.getItem(KEY + ":" + state) : null) ||
      sessionStorage.getItem(KEY) ||
      "null",
  ) as {
    verifier: string;
    state: string;
    shopId: string;
    returnPath: string;
    expires: number;
  } | null;
  // Remove the short-lived code before any further navigation or asset request.
  history.replaceState(null, "", "/auth/callback");
  if (
    !code ||
    !state ||
    !pending ||
    state !== pending.state ||
    pending.expires < Date.now()
  )
    throw Error(
      "El acceso venció. Iniciá sesión nuevamente desde esta tienda.",
    );
  const config = await customerConfig(),
    endpoint = new URL(config.apiUrl + "/api/customer/auth/token");
  if (endpoint.protocol !== "https:")
    throw Error("No se pudo validar el acceso de clientes.");
  const response = await fetch(endpoint, {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, code_verifier: pending.verifier }),
  });
  if (!response.ok)
    throw Error(
      "No se pudo completar el acceso. Volvé a iniciar sesión desde esta tienda.",
    );
  const result = (await response.json()) as {
    shop_id: string;
    return_path: string;
    tokens: { id_token: string; access_token: string; refresh_token: string };
  };
  if (
    result.shop_id !== pending.shopId ||
    result.return_path !== pending.returnPath ||
    !result.return_path.startsWith("/") ||
    result.return_path.startsWith("//") ||
    result.return_path.includes("\\")
  )
    throw Error("El regreso no coincide con esta tienda.");
  const idToken = new CognitoIdToken({ IdToken: result.tokens.id_token }),
    claims = idToken.decodePayload();
  if (
    claims.aud !== config.clientId ||
    claims.iss !==
      `https://cognito-idp.${config.userPoolId.split("_")[0]}.amazonaws.com/${config.userPoolId}` ||
    claims.token_use !== "id" ||
    !claims["cognito:username"]
  )
    throw Error("La cuenta no corresponde a este entorno.");
  const session = new CognitoUserSession({
    IdToken: idToken,
    AccessToken: new CognitoAccessToken({
      AccessToken: result.tokens.access_token,
    }),
    RefreshToken: new CognitoRefreshToken({
      RefreshToken: result.tokens.refresh_token,
    }),
  });
  if (!session.isValid())
    throw Error("La sesión venció. Iniciá sesión nuevamente.");
  new CognitoUser({
    Username: claims["cognito:username"],
    Pool: new CognitoUserPool({
      UserPoolId: config.userPoolId,
      ClientId: config.clientId,
    }),
  }).setSignInUserSession(session);
  sessionStorage.removeItem(KEY);
  localStorage.removeItem(KEY + ":" + state);
  window.dispatchEvent(new Event("tsuru-customer-session"));
  window.location.replace(result.return_path);
}
