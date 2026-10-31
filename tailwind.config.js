/** @type {import('tailwindcss').Config} */
// Colours and fonts come from src/theme/tokens.css (semantic layer), so the
// store's branding and the template palette stay in one place.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: { DEFAULT: 'var(--surface)', quiet: 'var(--surface-quiet)', raised: 'var(--surface-raised)', deep: 'var(--surface-deep)', 'deep-raised': 'var(--surface-deep-raised)' },
        ink: { DEFAULT: 'var(--ink)', soft: 'var(--ink-soft)', 'on-deep': 'var(--ink-on-deep)', 'on-deep-soft': 'var(--ink-on-deep-soft)' },
        heading: 'var(--heading)',
        rule: { DEFAULT: 'var(--rule)', deep: 'var(--rule-on-deep)' },
        accent: { DEFAULT: 'var(--accent)', ink: 'var(--accent-ink)', text: 'var(--accent-text)', 2: 'var(--accent-2)', '2-ink': 'var(--accent-2-ink)' },
        offer: 'var(--offer)',
        danger: 'var(--danger)',
        success: 'var(--success)',
        focus: { DEFAULT: 'var(--focus)', deep: 'var(--focus-on-deep)' },
      },
      fontFamily: {
        display: 'var(--font-display)',
        text: 'var(--font-text)',
      },
      borderRadius: {
        frame: 'var(--radius-frame)',
        'frame-sm': 'var(--radius-frame-sm)',
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
        lift: 'var(--shadow-lift)',
      },
      maxWidth: { page: 'var(--max)' },
      minHeight: { tap: 'var(--tap)' },
      minWidth: { tap: 'var(--tap)' },
      transitionTimingFunction: { out: 'var(--ease-out)', in: 'var(--ease-in)' },
    },
  },
  plugins: [],
};
