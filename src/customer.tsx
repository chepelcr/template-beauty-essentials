import { useCartStore } from "@/store/cart";
import type { ReactNode } from "react";
import {
  StoreProvider,
  AccountCheckoutLink,
  StoreAccountBar,
  StoreBarterPage,
  CustomerSsoCallback,
  CustomerAccountEntry,
  createI18n,
  baseEs,
  baseEn,
  type ThemeDefaults,
} from "@/core";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
const { I18nProvider, useI18n } = createI18n({
  dictionaries: { es: baseEs, en: baseEn },
  defaultLang: "es",
  fallback: ["es", "en"],
  locales: { es: "es-CR", en: "en-US" },
});
const defaults: ThemeDefaults = {
  brand: "#8A4B68",
  brand2: "#79553D",
  surface: "#FFFFFF",
  darkSurface: "#171716",
  displayFont: "Georgia, serif",
  bundledFonts: [],
};
export function CustomerStoreProvider({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <StoreProvider theme={defaults}>{children}</StoreProvider>
    </I18nProvider>
  );
}
export function CustomerBar() {
  const { t } = useI18n();
  return <StoreAccountBar t={t} />;
}
export function BarterPage() {
  const { t } = useI18n();
  return (
    <>
      <Navbar />
      <StoreBarterPage t={t} />
      <Footer />
    </>
  );
}
export function AccountPage() {
  const { t } = useI18n();
  return (
    <>
      <Navbar />
      <CustomerAccountEntry t={t} />
      <Footer />
    </>
  );
}

export function CustomerCheckoutEntry() {
  const { t } = useI18n();
  const items = useCartStore((state) => state.items);
  return (
    <AccountCheckoutLink
      t={t}
      items={items.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
      }))}
    />
  );
}

export function AuthCallbackPage() {
  const { t } = useI18n();
  return (
    <>
      <Navbar />
      <CustomerSsoCallback t={t} />
      <Footer />
    </>
  );
}
