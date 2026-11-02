# Civis Atelier

The agreed storefront is now the source for a server-backed store. Express runs on Vercel, Clerk handles Google/email authentication and verification, Neon stores products and administrator access, and Vercel Blob stores new product photographs.

## Local development

Use Node.js 24. Link the existing Vercel project `civis-atelier` under `vlasdkalfb-4977`, then pull development environment variables into `.env.local`. Never commit this file. Required keys are listed in `.env.example`.

```sh
npm ci
npm run build
npm run db:migrate
npm run db:seed
npm start
```

Open `http://localhost:3000` or `http://127.0.0.1:3000`. Both loopback addresses serve this same application. Stop any older development server on port 3000 before starting it. Root `index.html` and `store.html` now redirect to this application; the retired preview toolbar no longer serves a separate storefront.

`scripts/build.mjs` creates `public/` from `web/store-shell.html`, root design files, `web/` components and assets. Mock `account.js`, secrets and review files are excluded. `public/` is generated; edit source files and rebuild.

The build uses Sharp for responsive WebP photographs and esbuild for minified, content-hashed scripts and bundled styles. Install development dependencies in the build environment. Client updates use keyed DOM reconciliation in `web/dom-patch.js`; public browsing initializes Clerk only when needed. See [performance verification](PERFORMANCE.md) for production measurements and functional checks.

## Store management

Open `/admin` and sign in using the verified owner email in `ADMIN_BOOTSTRAP_EMAIL`. No visitor receives administration rights merely by signing up. Authorization is checked on every admin API request; the initial verified owner is recorded in `admin_users`.

Administrators can create, edit and remove products, set USD prices in minor units, stock, category, collection, sizes, colors, front/back/detail photographs, new-arrival status and visibility. Removed products are retained internally for order history but leave the storefront and editor list. Categories can be created, renamed or deleted; categories containing products require reassignment before deletion. Every available color needs a front photograph and a hex swatch. Stock is the total quantity for the product, not a separately invented quantity for every variant.

The size availability checkboxes disable individual product sizes without deleting them from the assortment. Remove a size from the Sizes field to hide it entirely. Disabled sizes cannot be added or quoted at checkout. The inline quick-add circle uses one sector per configured size, with each label centered in its sector; it does not open a modal or lock page scrolling.

Size labels are entered manually per product, for example `28, 30, 32` or `W32/L34, W34/L34`. Up to 12 unique labels of 12 characters each are supported, including letters, numbers, spaces, `/`, `.`, `×` and `-`. Their saved order is shared by quick-add, product options and size-guide rows; catalogue size filters are derived from products. New products have no assumed sizes. Existing product labels remain unchanged until the owner supplies actual availability.

The product editor includes bilingual description, information, composition, story, manufacturing, care, packaging and delivery fields. Empty detail panels are hidden. The Store Pages editor controls bilingual contact, shipping, privacy and terms content. These are plain text fields; HTML is escaped on the storefront.

All edits validate on the server. Versions prevent one editor from silently overwriting another editor. Images are limited to PNG/JPEG/WebP, checked by signature, and stored in Blob. Database modifications leave an audit trail. Re-running the seed does not overwrite existing products or prices.

## Authentication and launch status

Clerk currently uses a **development instance**. Google, email/password, email verification codes and password reset are enabled. Verification messages are handled by Clerk, not by local mock code. Real owner Google sign-in and delivery to a real mailbox require a manual check; automated development tests do not prove real email deliverability.

Before commercial launch: configure a production Clerk instance and its domain/OAuth settings, verify real email delivery, activate the merchant account and payouts, confirm store policies and product/material data, review inventory per size/color if needed, and choose a Vercel plan permitting commercial use. Search indexing is controlled separately by `SEO_INDEXING`; see [SEO setup](docs/seo.md) for indexing and search-engine verification settings.

## Payments

The footer registration offer activates `WELCOME5` after the submitted email is verified in the signed-in account. It applies 5% to merchandise on the first placed order, excluding delivery. A redemption is recorded atomically when the order is created; a repeated payment request with the same idempotency key reuses that order. One offer is allowed per account/email, with separate sandbox and live redemptions. It is not a mailing-list subscription. The server checks eligibility, calculates integer kopecks and signs matching line prices; the browser cannot grant or choose its own discount. Existing paid/refunded customers do not qualify. Abandoned/expired orders do not automatically reset a redeemed first-order offer.

The homepage editorial compositions and footer form are implemented in `views.js`, `web/home-editorial.css` and `web/welcome.js`. New image assets and generation prompts are recorded in [editorial assets](docs/editorial-assets.md).

`/checkout` uses the current database catalogue, checks size/color/stock and computes the UAH total on the server. The signed handoff opens WayForPay's hosted payment page; the store never receives card numbers or CVV. Contact and delivery details are validated and order snapshots are stored in Postgres. Customers must sign in before placing an order. Orders are accessible in My Account and in the protected administration order list. Nova Poshta branches are entered manually; there is no automatic branch lookup or shipping-label integration yet. Delivery is paid separately to the carrier.

`PAYMENTS_MODE=test` is the default and uses the official publicly documented sandbox merchant, independently of the stored real merchant key. Sandbox callbacks are explicitly recorded as test payments and cannot change real stock or create paid commercial orders. Provider notifications verify merchant, HMAC signature, currency and amount. Returning to the site does not prove payment. The browser reads the database status and polls while a callback is pending.

For a reviewed commercial release, configure `WAYFORPAY_MERCHANT_ACCOUNT`, `WAYFORPAY_MERCHANT_SECRET`, `APP_ORIGIN`, `STORE_MODE=live` and `PAYMENTS_MODE=live`. The merchant account must be activated in WayForPay first. The service URL is `/api/payments/wayforpay/webhook`. Live orders reserve aggregate stock for 15 minutes under row locks; duplicate requests reuse the same order, and duplicate callbacks never deduct stock twice. Late approved payments that cannot be fulfilled are flagged `paid_review` for the merchant. Refund notifications update payment state but do not automatically restock dispatched goods.

Private integration variables have been changed to Secret type in Vercel. This changes visibility; it is not credential rotation at the provider. Never expose or put these values in public assets. The Clerk publishable key is deliberately public.

The UAH display uses the explicit `pricing` record imported from the existing preview snapshot. It is not represented as a live exchange feed. Base product prices remain in USD.

## Verification

```sh
npm test
```

Tests cover monetary/inventory validation and image URL restrictions. Integration checks additionally verify real Clerk authentication, customer denial, Neon product create/update/publish/hide, write-origin checks and version conflicts. Temporary integration records are removed after testing.

Database migrations run explicitly against the linked database; deployment builds never run migrations or seed automatically.
