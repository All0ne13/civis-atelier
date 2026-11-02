# Search visibility

Canonical production site: https://civis-atelier.vercel.app/

Public indexing is controlled by `SEO_INDEXING=enabled` in Vercel Production. Preview and Development deployments remain excluded, independently of payment mode. Keep account, checkout, admin, API, missing products and invalid filter URLs out of search results.

The server renders page content, unique localized titles/descriptions, canonicals, Ukrainian/English alternates, social image metadata and JSON-LD before JavaScript runs. Client navigation updates the same metadata. The sitemap lists current public pages, non-empty collections, published products and their actual images. No artificial modification dates, ratings, seller details or live offers are generated.

## Google Search Console

1. Sign in to https://search.google.com/search-console/welcome with the owner's Google account.
2. Add the URL-prefix property `https://civis-atelier.vercel.app/`. A Domain property requires control over the parent domain's DNS; use URL-prefix for this Vercel subdomain.
3. Choose HTML-tag verification. Copy the public value from `content="..."`, add it as `GOOGLE_SITE_VERIFICATION` in Vercel Production, then redeploy. The code is an ownership-verification value, not an account password or private API key.
4. Complete Verify in Search Console. Submit `sitemap.xml` in Sitemaps.
5. Inspect the homepage and key catalogue/product URLs. Run the live test, then Request indexing. Review Page indexing, Sitemaps and Crawl stats for the actual Google status. Public `site:` search alone is not a complete index report.

If verification already exists through another method, retain that ownership. Do not replace another owner's account or ask for a Google password.

## Bing and AI search

https://www.bing.com/webmasters/ supports a separate verified property or importing an owned Search Console property. An HTML-tag value can be configured as `BING_SITE_VERIFICATION`; the server emits `msvalidate.01` only when supplied. Submit the same sitemap after ownership is verified.

The wildcard Allow rule in `/robots.txt` permits public search crawlers, including OAI-SearchBot, and blocks `/api/`. No special AI-only meta tag or llms.txt is required for Google AI search. Discovery, actual crawler IP access, indexing and search placement remain decisions of each search provider. A simulated user-agent request is a response check, not proof that the provider has indexed the site.

No Search Console/Bing property, sitemap submission or indexing request should be claimed until it is actually performed in the verified owner account. Never use Google's job/live-stream Indexing API for this clothing store or obsolete sitemap-ping endpoints.

## Verification after deployment

- Fetch `/robots.txt` and `/sitemap.xml` without authentication.
- Check each sitemap URL returns 200, a single title/description/canonical, reciprocal language alternates and indexable visible content.
- Check social images load and image metadata uses their actual dimensions/type.
- Verify Product schema matches the real title, photos, colours and size labels; offers appear only when commercial payments are live.
- Navigate catalogue → product → Back and switch locale. Metadata must follow the visible page without duplicate or stale tags.
- Re-check private routes, invalid filters and missing products remain noindex/404 as appropriate.

References: [Google recrawl requests](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl), [Google AI search guidance](https://developers.google.com/search/docs/appearance/ai-features), [OpenAI search crawler](https://developers.openai.com/api/docs/bots).
