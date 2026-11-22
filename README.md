# Civis Atelier

Portfolio e-commerce storefront for an independent fashion label. The project combines a polished, responsive customer experience with a protected back office, server-side checkout validation, and search-ready metadata.

**Live demo:** [civis-atelier.vercel.app](https://civis-atelier.vercel.app/)

## What is included

- Responsive catalogue, product pages, collection filters, quick add, shopping bag and account flow.
- Secure customer authentication with Clerk and a protected `/admin` workspace.
- Product, category, stock, image and content management backed by Neon Postgres and Vercel Blob.
- Server-side checkout and inventory validation, idempotent order handling and WayForPay handoff.
- Ukrainian/English storefront content, SEO metadata, sitemap, robots rules and Open Graph sharing cards.
- Performance-conscious image handling, client bundling and motion that honours reduced-motion preferences.

## Technology

| Area | Implementation |
| --- | --- |
| Application | Node.js, Express, ES modules |
| Front end | HTML, CSS, vanilla JavaScript, GSAP |
| Identity | Clerk |
| Data and media | Neon Postgres, Vercel Blob |
| Payments | WayForPay hosted checkout |
| Build and deployment | esbuild, Sharp, Vercel |
| Tests | Node test runner |

## Project structure

```text
assets/       Product and editorial visual assets
db/           Versioned database migrations
docs/         Design, SEO, performance and legal implementation notes
scripts/      Build, development, optimisation and seed scripts
server/       API routes, rendering, validation and payment services
shared/       Shared validation, SEO and UI utilities
src/          Express application entry point
tests/        Automated unit and integration-oriented tests
web/          Storefront, account, checkout and admin interfaces
```

## Run locally

Requires Node.js 24 or later. Copy `.env.example` to `.env.local` and provide your own service credentials; no production secrets are committed to this repository.

```bash
npm ci
npm run build
npm run db:migrate
npm run db:seed
npm start
```

Open [http://localhost:3000](http://localhost:3000).

## Verification

```bash
npm test
```

The suite covers checkout input validation, inventory and order behaviour, access rules, SEO output and storefront rendering. Supporting technical notes are available in [`docs/`](docs).

## Portfolio note

This repository is published for code review and portfolio evaluation. Credentials, private local configuration, deployment linkage, generated test artifacts and unrelated project folders are intentionally excluded.

## License

Copyright © 2026 Vladislav Marchenko. See [LICENSE](LICENSE).
