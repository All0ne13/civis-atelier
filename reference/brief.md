Create an independent, polished visual prototype for Civis Atelier. This is a redesign PREVIEW ONLY, not a migration or implementation in the real cloth-store application.

CONFIRMED BRIEF
Goal: launch a product / fashion e-commerce storefront.
Scope: small multi-page website with Home, Products catalogue, and Product detail.
Character: editorial bold, expressive typography and strong contrast.
Deliver desktop and mobile layouts for all three pages. Use one cohesive, sophisticated streetwear art direction.

PROJECT BOUNDARY
Work only inside this new OpenDesign project. Do not read or change the actual cloth-store source, configuration, environment, database, payments, or deployments. Do not publish. Do not invoke the OpenDesign plugin or create another workflow. The prototype is isolated from the working store. Use only local prototype state for interactions; no real orders or payments.

ORIGINAL DESIGN IS THE FOUNDATION
Figma reference: https://www.figma.com/design/USQtHyp9LFYB7nETwIX2Ui/Cloth-Store?node-id=0-1
Figma MCP currently denies access. Do not claim that you accessed that Figma file. All available local exported screens were copied into reference/figma/. Read reference/figma/index.json to identify each export. Analyze these images first, including desktop Home and full Home, Products listing/detail/cart/checkout, alternate Techwear Hoodie detail, mobile product detail, profile and navigation drawers. Admin and authentication exports are context, not extra deliverable pages. Preserve recognizable brand identity, content and shopping flows; radically improve execution, not the store's identity.
Never use full-page screen images as the interface: build actual semantic HTML/CSS/JS.
Original exact font files, full-resolution original product photographs, different color photos, extra product angles and video are unavailable. Use supplied imagery honestly; do not invent extra photography, reviews, promotional claims, policies, or stock.

BRAND AND CONTENT MUST STAY
Brand name: Civis Atelier, never rename it or replace it with Cloth Store as the brand.
Use assets/brand/civis-atelier.svg, the supplied transparent black logo, as the primary identity; do not redraw or invent a substitute. Keep its aspect ratio, no white image box.
Use reference/catalogue.json for exact existing product IDs, names, categories, colors, sizes, base prices and image keys. Prices are integer USD cents.
Navigation: Home, Collections, New; global Search, Cart, Wishlist, locale and account controls. Use Cart consistently, never Bag.
Categories: Shirts, T-shirts, Jeans, Hoodies. Collection filters: Men, Women, Kids.
Home content foundation: New Collection / Summer 2024, New This Week, XIV Collections / 25-26, Our Approach to Fashion Design. Do not put a separate invented Techwear Hoodie promo section on Home.
The obsolete vertical Men/Women/Kids list above the home hero was explicitly removed by the owner. Keep categories accessible inside catalogue/mobile navigation.
Locales: Ukrainian default, English second. reference/uk.ts contains existing translations. Use natural Ukrainian, not literal broken line-by-line translations. Preserve product names in the English view. Currency UX must distinguish UAH for Ukrainian and USD for English; do not invent a live conversion rate. If needed, label preview-only price snapshots and document the need for the real store's current daily rate. Do not alter the fixed base catalogue prices.

VISUAL EVOLUTION
Make a decisive modern editorial streetwear redesign, not minor spacing changes to the old page. Keep the recognizable handmade logo and fashion imagery. Explore generous but disciplined whitespace, a refined paper/ink foundation with one restrained contemporary accent, confident typography with Cyrillic support, clean grid rhythm, purposeful imagery, precise alignment and polished controls.
Use compact logo and navigation actions, consistent container edges, readable labels and filters, no microscopic desktop text, no oversized mobile icons. Product photos should have consistent art direction and proportions.
No generic SaaS landing page patterns, fake analytics dashboards, random store names, neon gradient clutter, or unrelated stock imagery.

PAGES
1. Home: compact aligned navigation and discoverable search; strong editorial New Collection hero with supplied photos; clear shop CTA; New This Week product selection; XIV Collections and brand approach/editorial content; existing footer sections Products, Company, Notes, Account.
2. Catalogue: preserve search and result counts, category shortcuts, size, availability, category, color, price range, collection and new-arrival filters; sort selector; attractive uniform product cards and sold-out state. Desktop sidebar must be readable. Mobile filters open an accessible drawer/sheet with useful tap targets. Avoid native blue select styling; keep visible designed keyboard focus states.
3. Product: default to Techwear Hoodie to demonstrate evolution of the alternate supplied product concept. Preserve the product's name, silhouette image, variant selectors, quantity, stock rules, price, Cart CTA, wishlist, gallery controls and supporting info/story/manufacturing/packaging content where actually supplied. Use image contain with no amputated silhouette. Also make catalogue cards open matching existing product data/images so the product template can be reviewed with regular T-shirts. Do not pretend cropped copies are extra product angles or an unavailable intro video.

INTERACTIONS AND MOBILE
Working navigation between the three pages, local search/filter/sort, product variant selection, visible animated Cart feedback and a lightweight Cart preview, Wishlist toggle, Ukrainian/English switching. Account and checkout can be clearly marked links to the future real store integration, not dead buttons masquerading as completed features. Preserve all existing shopping flows as integration requirements, without implementing real services.
Test at 360/390/430px mobile, 768px tablet and 1440px desktop. No horizontal overflow, clipped text, overlapping controls or unreadable miniature filters. Use >=44px mobile hit areas, keyboard accessible dialogs/drawers, meaningful button labels, reduced-motion support.
Provide a simple review toolbar outside the store composition to switch Home / Catalogue / Product and Desktop / Mobile previews. Keep developer explanations out of the shopping UI.

DELIVERY
Produce a fully viewable responsive prototype with a clear entry file, preferably standalone index.html plus sibling files/assets, so OpenDesign can render it. Keep all three page views connected and use local assets.
Verify all images resolve and navigation works. Deliver an actual visual artifact, not only a markdown plan. Return a concise Russian explanation of design decisions, the three page views, responsive coverage, and any unavailable resources. Do not claim the actual Next.js store was changed.
