import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { StorefrontOrganization } from '@chepelcr/tsuru-storefront-sdk';
import { getSubdomain } from '@/lib/subdomain';
import { getApiClient } from '@/lib/api';

interface BucketConfig {
  templateId?: string;
  orgId?: string;
  /** config.json says "live" for org stores; anything but "demo" reads the org. */
  mode: 'demo' | 'prod' | 'live';
}

interface SubdomainContextValue {
  subdomain: string | null;
  /** The store's own identity (live: the org; demo: the template itself). */
  organization: StorefrontOrganization | null;
  config: BucketConfig | null;
  isLoading: boolean;
  error: Error | null;
}

const SubdomainContext = createContext<SubdomainContextValue | undefined>(undefined);

export function SubdomainProvider({ children }: { children: ReactNode }) {
  const [subdomain, setSubdomain] = useState<string | null>(null);
  const [config, setConfig] = useState<BucketConfig | null>(null);

  useEffect(() => {
    const currentSubdomain = getSubdomain();
    setSubdomain(currentSubdomain);

    fetch('/config.json')
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(() => setConfig(null));
  }, []);

  const isDemo = config?.mode === 'demo';
  const id = isDemo ? config?.templateId : config?.orgId;

  const { data: organization, isLoading, error } = useQuery<StorefrontOrganization>({
    queryKey: ['organization', config?.mode, id],
    queryFn: () => getApiClient(isDemo ? 'demo' : 'prod', id!).getOrganization(),
    enabled: !!id,
  });

  // The tab shows the store, not the template it was built from.
  useEffect(() => {
    if (!organization) return;
    document.title = organization.name;
    if (organization.logoUrl) {
      const icon = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (icon) {
        icon.removeAttribute('type');
        icon.href = organization.logoUrl;
      }
    }
  }, [organization]);

  const value: SubdomainContextValue = {
    subdomain,
    organization: organization ?? null,
    config,
    isLoading,
    error: error as Error | null,
  };

  return (
    <SubdomainContext.Provider value={value}>
      {children}
    </SubdomainContext.Provider>
  );
}

export function useSubdomainContext() {
  const context = useContext(SubdomainContext);
  if (context === undefined) {
    throw new Error('useSubdomainContext must be used within a SubdomainProvider');
  }
  return context;
}
