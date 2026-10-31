import {StoreBarterPage, CustomerSsoCallback, CustomerAccountEntry} from '@/core';
import { QueryClientProvider } from '@tanstack/react-query';
import { useCallback } from 'react';
import { Route, Switch } from 'wouter';
import {
  createStoreQueryClient,
  LegacyOrNotFound,
  LiveRegion,
  MAIN_ID,
  RouteFocus,
  SkipLink,
  StoreProvider,
  StoreRouter,
  useCartReconciliation,
  useCatalog,
  useStore,
} from '@/core';
import { I18nProvider, useI18n } from '@/i18n';
import { CartSheet } from '@/components/CartSheet';
import { Checkout } from '@/components/Checkout';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { StoreError, StoreUnconfigured } from '@/components/StoreStates';
import { themeDefaults } from '@/theme/defaults';
import About from '@/pages/About';
import Catalog from '@/pages/Catalog';
import Contact from '@/pages/Contact';
import Home from '@/pages/Home';
import NotFound from '@/pages/NotFound';
import ProductPage from '@/pages/ProductPage';

const queryClient = createStoreQueryClient();

function Shell() {
  const { status, retry } = useStore();
  const { t } = useI18n();
  const catalog = useCatalog();
  const removedMessage = useCallback((names: string) => t('cart.removedUnavailable', { names }), [t]);
  useCartReconciliation(catalog.items, !catalog.isLoading && !catalog.isError, removedMessage);

  if (status === 'unconfigured') return <StoreUnconfigured />;
  if (status === 'error') return <StoreError onRetry={retry} />;

  return (
    <>
      <SkipLink label={t('skip.content')} />
      <Header />
      <main id={MAIN_ID}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/auth/callback"><CustomerSsoCallback t={t} /></Route>
          <Route path="/trueque"><StoreBarterPage t={t} /></Route>
          <Route path="/barter"><StoreBarterPage t={t} /></Route>
          <Route path="/account"><CustomerAccountEntry t={t} /></Route>
          <Route path="/products" component={Catalog} />
          <Route path="/products/:id" component={ProductPage} />
          <Route path="/about" component={About} />
          <Route path="/contact" component={Contact} />
          <Route>
            <LegacyOrNotFound notFound={NotFound} />
          </Route>
        </Switch>
      </main>
      <Footer />
      <CartSheet />
      <Checkout />
      <RouteFocus />
      <LiveRegion />
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <StoreProvider theme={themeDefaults}>
          <StoreRouter>
            <Shell />
          </StoreRouter>
        </StoreProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
