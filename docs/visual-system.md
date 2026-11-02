# Civis Atelier visual system

`web/design-system.css` is bundled last into the storefront, company/legal, checkout and admin stylesheets. Change shared typography and action states here, rather than introducing another page-specific font stack.

- Logo: the original hand-drawn SVG, unchanged.
- Reading face: self-hosted Manrope Variable for descriptions, metadata, labels, forms, controls and product information. Caveat Variable is reserved for large editorial headings, brand navigation and footer links/headings. Latin and Cyrillic subsets cover English and Ukrainian; no runtime Google Fonts requests.
- Type scale: body 16 px, small copy 12-14 px, labels 14 px, buttons 16 px; desktop page titles 72 px, section titles 54 px, subheadings 34 px. Tablet and phone roles scale through shared variables. Poster lettering keeps its artwork scale.
- Footer: column headings 34 px / 700; child links 24 px / 500. Mobile headings are 32 px. The original logo remains unchanged.
- Product type: card names 16 px (14 px phone), prices 17 px (16 px phone), PDP names 44 / 36 / 30 px and descriptions 16 px. Product information uses Manrope; surrounding section headings remain Caveat.
- Gallery and product-carousel controls use directional SVG chevrons with accessible localized labels and 44 px targets. They remain hidden on the information side of a flipped photograph. Promotional action buttons keep their text-only treatment.
- Primary actions: forest green with a darker fill, subtle lift and shadow on hover. Photo-banner actions use a light fill that remains light and readable on hover. Keyboard focus is visible. Disabled controls retain their disabled state. No decorative action arrows.

Both homepage campaigns rotate every 8 seconds while visible. The lower MOVE/FORM campaign does not freeze when the pointer enters it or clicks a dot. Keyboard focus pauses that campaign for interaction; hidden/offscreen campaigns stop their clocks. Ordinary cart/wishlist renders preserve each campaign's live DOM, slide and controller. Locale changes refresh localized copy. The lower campaign's CTA always opens the full catalogue and clears previous facets.

Motion is now coordinated by locally bundled GSAP/ScrollTrigger/SplitText: masked typography, layered campaign wipes, a desktop collection scene, product-photo masks and separate artwork depths. The old generic fade/translate and photo scroll handlers are removed. See [motion-system.md](motion-system.md) for responsive behaviour, cleanup, accessibility and implementation sources.

Header New opens `new=1`, displays real `isNew` products and owns the active navigation state; Collections clears that filter. Verify both languages and widths 320, 390, 768, 820, 1024 and 1440 px after changing shared styles.

The MOVE/FORM spread uses two small editorial side notes on desktop, with localized copy updated by the same slideshow controller. They sit in a two-column strip below the artwork at widths up to 850 px. The orbit remains closed and the handwritten poster word is never split into clipping masks. No extra image or animation dependency is added.

The design-direction review approved only the welcome signup panel. It uses a
soft-green surface, a thin border, 40 px desktop padding and two balanced columns;
on phones the copy and form stack with 28/20 px padding. The 5% offer, validation
and account-verification flow are unchanged. All other prototype layout changes
remain isolated under `.preview-checks/design-direction/` and are not approved.
