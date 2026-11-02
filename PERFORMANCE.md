# Performance verification — 24 October 2026

## 27 October 2026 — public SEO and footer update

Production now permits public-page indexing explicitly via `SEO_INDEXING=enabled`, independently of the test payment/store mode. Public pages have actual initial HTML, bilingual canonical/hreflang, metadata, structured data and a live sitemap. Private pages remain noindex. The earlier SEO 66 measurements below describe the former staging configuration.

The production audit returned Accessibility 100, Best Practices 100 and SEO 100. Both attempts to record the production performance trace failed with Lighthouse `NO_NAVSTART`; the runner's printed Performance 0 is a null-score conversion, **not a valid performance score**. No production LCP/TBT/CLS result is claimed for this release. Resource auditing recorded about 558 kB transferred. A diagnostic local run before the final image-sizing correction was valid (Performance 84, TBT 42.5 ms, CLS 0), but used an uncompressed local server and is not comparable with the compressed production baselines.

The final build corrects hero, movement-model and story-image `sizes` to their actual layout rather than requesting oversized variants. Share-image derivatives are not loaded as page content. The production HTML and static resources use Brotli compression. Browser verification passed on 320/390/820/1024/1440px, including initial HTML without JavaScript, locale preferences and Back navigation, footer typography and placeholder icons, legal pages, wishlist-to-cart confirmation and mouse/touch carousel dragging. All 27 automated tests passed.

Published to https://civis-atelier.vercel.app/.

## Measurements

Lighthouse 13.5.0, headless Chrome, fresh browser profile, production URL. The desktop before/after runs used the same machine and desktop preset. Scores vary with network and server conditions; these are individual lab runs, not field percentiles.

| Desktop metric | Before | After |
| --- | ---: | ---: |
| Performance | 65 | 99 |
| Accessibility | 100 | 100 |
| Best Practices | 77 | 100 |
| SEO | 54 | 66 |
| LCP | 6.465 s | 0.772 s |
| Total Blocking Time | 5 ms | 0 ms |
| Cumulative Layout Shift | 0.078 | 0 |
| Transferred data | 18,219,775 bytes | 647,176 bytes |

The mobile preset scored 92 / 100 / 100 / 66, with LCP 3.224 s, TBT 44.5 ms and CLS 0. There is no comparable mobile baseline. Staging intentionally retains `noindex, nofollow`; removing it just to increase SEO would publish an unfinished test shop to search engines.

A separate browser smoke run checked home, catalogue and a product page. Each completed without layout shifts. Transferred data was approximately 0.51 / 0.29 / 0.27 MB respectively. These browser measurements use a different collection window from Lighthouse and should not be mixed with its figures.

## Changes

- Product selection, quantity, cart and filters update affected DOM nodes while retaining existing images, gallery and unchanged cards. Route and language changes reconcile the page rather than replace its entire DOM.
- Guest storefront browsing no longer waits for Clerk or its development handshake. Sign-in loads on demand; private API routes still verify sessions and administrator authorization.
- Public catalogue data is embedded in the initial HTML. Independent database reads run in parallel.
- Existing local photographs get responsive WebP variants during builds. Original source images remain intact. Future remote uploads retain their original URL until image processing for uploads is implemented.
- Scripts are bundled/minified, styles are combined, and content-hashed assets receive immutable caching. Production responses were checked for Brotli and immutable cache headers.
- Required fonts and initial campaign/product imagery are preloaded. Variant images load on demand. Campaign animation pauses offscreen and in background tabs.
- Initial content reserves page height to prevent the footer shifting during startup. Route titles, descriptions and canonical URLs are generated consistently.

## Functional verification

15 unit tests passed. Browser checks covered DOM-node retention during product/cart/filter actions, real Clerk development sign-in and recovery, customer denial from admin APIs, size availability, cookie consent, fonts, 320px layout, browser history, inline quick-buy and checkout validation. Temporary integration fixtures were removed.

After deployment, the production browser check again verified guest navigation without Clerk redirects, responsive WebP delivery, one stylesheet, retained DOM nodes during interactions and lazy sign-in. Build outputs are generated under `public/`; source edits require rebuilding.
## Brand ribbon and scroll reveals — 25 October 2026

- Replaced the blank collection-to-campaign margin with a full-width ink/ivory brand ribbon. Checked Ukrainian and English at 320, 390, 430, 768, 820, 1024, 1440 and 1756 px, including portrait and landscape tablet viewports. Browser emulation was used; these are not physical-device Safari tests.
- Native IntersectionObserver and Web Animations API reveal below-fold headings, photography and action links once. The first viewport/LCP image remains static. No scroll handler, animation dependency, persistent will-change or CSS-hidden content. Reduced motion disables reveals; failure to load the optional script leaves content visible. Minified script: 1,458 bytes before compression.
- Added 960px responsive WebP between 720px and 1440px. Verified a 412px / DPR 1.75 viewport selects it. The first campaign file is 110,244 bytes at 960px versus 189,084 bytes at 1440px. Preloading the next hero slide now waits 6 seconds instead of 2.5 seconds.

Production Lighthouse, separate sequential runs on the same workstation:

| Metric | Mobile before | Mobile final | Desktop final |
|---|---:|---:|---:|
| Performance | 94 | 93 | 100 |
| LCP | 3.008 s | 2.907 s | 0.662 s |
| TBT | 41.5 ms | 54.5 ms | 0 ms |
| CLS | 0 | 0 | 0 |
| Transfer bytes | 829,103 | 675,121 | 674,879 |

Accessibility and Best Practices scored 100 in the final runs. SEO remains 66 because staging intentionally blocks indexing. Scores are individual lab measurements and vary with network/cache conditions; reduced transfer size does not imply every score will increase. Browser checks cover the continuous ribbon geometry, responsive text, one-time animation, reduced-motion behaviour and optional-script failure.
