import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { signedFetch } from '@chepelcr/tsuru-storefront-sdk';
import { getSubdomain } from '@/lib/subdomain';
import type { Organization } from '@/models';

const PUBLIC_API_HOST =
  (import.meta.env.VITE_PUBLIC_API_URL as string | undefined) ?? 'https://public-api.tsuru.jcampos.dev';
const REGION = (import.meta.env.VITE_AWS_REGION as string | undefined) ?? 'us-east-1';

interface BucketConfig {
  templateId?: string;
  orgId?: string;
  mode: 'demo' | 'prod';
}

interface SubdomainContextValue {
  subdomain: string | null;
  organization: Organization | null;
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

  const { data: organization, isLoading, error } = useQuery<Organization>({
    queryKey: ['organization', config?.mode, config?.orgId, config?.templateId],
    queryFn: async () => {
      if (!config) return null;

      // Signed (guest SigV4) store-identity fetch via the public API. Demo reads
      // the template row; live reads the org's public theme (carries orgId).
      const path =
        config.mode === 'demo' && config.templateId
          ? `/api/templates/${config.templateId}`
          : config.orgId
          ? `/api/public/organizations/${config.orgId}/theme`
          : null;
      if (!path) return null;

      const response = await signedFetch(PUBLIC_API_HOST + path, REGION);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!config && (!!config.orgId || !!config.templateId),
  });

  const value: SubdomainContextValue = {
    subdomain,
    organization: organization || null,
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
