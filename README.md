# Beauty Essentials — storefront template

An arched mirror of light for cosmetics, skincare, salons and nail or lash
studios: arch-framed products and treatments with their durations, rituals as
small mirrors, and a glint that follows the pointer across the hero. Design
plan: [`DESIGN.md`](DESIGN.md).

## How it works

React 18 + Vite + Tailwind. Everything the store shows is data — branding,
CMS copy (`home`, `about`, `products`, `contact`), products and services,
categories, contact — read through `src/core/`, vendored from the monorepo's
`templates/_core` (do not edit it here). Template code is the design:
`src/components`, `src/pages`, `src/theme`, `src/i18n`.

`/config.json`: `{ "mode": "demo", "templateId": … }` shows the template's demo
rows; a provisioned store gets `{ "mode": "live", "orgId": … }`.

## Pages

`/` · `/products` (`?type=`, `?category=`, `?sale=1`, `?q=`, `?sort=`) ·
`/products/:id` · `/about` · `/contact` · `/trueque` (barter) · `/account`
(Tsuru account) · 404. Old URLs (`/deals`, `/services`, `/login`,
`/register`, `/category/:slug`…) redirect into the store.

## Effects

CSS only: the mirror's glint follows the pointer and the add button ripples.
Reduced motion (the system setting or `?motion=reduce`) and touch screens keep
the glint still. Light and dark themes follow the visitor's choice.

## Development

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # tsc + vite build → dist/
```

Against a local management-be: `TSURU_DEV_API=http://localhost:5000
VITE_PUBLIC_API_URL=http://localhost:5173 pnpm dev`.

## Deployment

`.github/workflows/deploy.yml`: `develop` → GitHub Pages
(`beauty-essentials.examples.tsuru.jcampos.dev`, dev); `main` → production
example hosting (`beauty-essentials.examples.tsuru.lat`); each deploy
notifies the provisioner to refresh stores using this template.
