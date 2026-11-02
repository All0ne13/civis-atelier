# Civis Atelier motion direction

The previous generic fade/translate and per-photo scroll handlers are replaced by GSAP 3.15.0, ScrollTrigger and SplitText, bundled and served locally. No animation CDN, smooth-scroll replacement or paid service is required.

The storefront has six related treatments:

1. Campaigns: an outgoing photo remains under the incoming photo's wipe, with masked line entrances and synchronized copy. The cutout model changes with an opaque wipe, rather than two translucent people overlapping. Both campaigns retain eight seconds of dwell after their transition. Images decode before committing a slide.
2. Collection: native scrolling on every screen. No sticky scene, additional scroll height or scrub lag. A 0.75-second photo settle and 0.65-second masked heading entrance run once when entering the viewport. The heading stays in its layout position.
3. Product photos: a staggered mask opening, with controls and labels staying in place and interactive.
4. MOVE/FORM: the SVG orbit is always closed, without stroke dashes or scroll-dependent drawing. The figure has one brief entrance; the poster headline has no scrubbed translation or SplitText line mask. Caveat strokes overhang their text boxes, so MOVE/FORM remains a whole, unwrapped word and only its opacity changes briefly during swaps. Slideshow animation owns the inner image; the entrance owns its parent figure, preventing competing transforms. Both slides retain automatic timed changes.
5. Brand story/newsletter: brief line masks, photo framing and a traced divider. The editorial title stays in normal document flow; it does not stick to the viewport or drift with scroll. Photo entrances finish within 0.75 seconds and clear their transforms.
6. Interaction: button fill/underline responses, photo hover and drawer/authentication entrances, respecting touch input and reduced motion.

`web/scroll-reveal.js` owns GSAP contexts, SplitText instances, media queries and transitions. `beforeRender` disposes them **before** changing route, product or language, so reverting old text cannot overwrite newly rendered content. Static home scene nodes are preserved by `web/dom-patch.js` during ordinary cart/wishlist renders. Dynamic product controls/results are updated normally; filtered cards get fresh animations and detached contexts are removed. Resize re-splits lines and rebuilds desktop/compact ScrollTriggers; fonts are self-hosted. A text entrance is marked complete only in its tween's completion callback, so a font-driven re-split before entering the viewport cannot silently cancel it. Campaign text waits for fonts, then re-checks its controller's cancellation token before committing. All cleanup paths restore readable static content.

Reduced motion removes entrance scenes, masks and hover movement; campaigns change content instantly. There are no sticky editorial scenes in either mode. Without JS, all copy, photographs, navigation and shopping controls remain visible. Browser history, scrolling, selection and keyboard focus retain their native behaviour.

Sources reviewed for implementation:

- https://gsap.com/docs/v3/Plugins/ScrollTrigger/ — scrub, responsive scenes, refresh and cleanup.
- https://gsap.com/docs/v3/Plugins/SplitText/ — masks, automatic line reflow and accessible labels.
- https://gsap.com/docs/v3/GSAP/gsap.context()/ — scoped teardown.
- https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/ — responsive/reduced-motion setup.
- https://web.dev/articles/animations-and-performance/ — prefer composited transforms/opacity; avoid animating page geometry.
