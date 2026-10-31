import { Moon, Sun } from 'lucide-react';
import { useColorScheme } from '@/core';
import { useI18n } from '@/i18n';

export function ThemeToggle() {
  const { scheme, toggle } = useColorScheme();
  const { t } = useI18n();
  const dark = scheme === 'dark';
  const Icon = dark ? Sun : Moon;
  const label = t(dark ? 'theme.toLight' : 'theme.toDark');
  return (
    <button type="button" className="icon-btn theme-toggle shrink-0" onClick={toggle} aria-label={label} title={label} aria-pressed={dark}>
      <Icon key={scheme} aria-hidden="true" className="theme-toggle-icon h-5 w-5" />
    </button>
  );
}
