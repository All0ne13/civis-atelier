# Legal pages — review dated 27 October 2026

The public documents are Ukrainian-first, with English equivalents, at `/shipping-returns`, `/privacy` and `/terms`. They are server-rendered, readable without JavaScript, printable, and linked from checkout, the footer and the cookie notice. No authentication SDK loads on these pages.

## Sources and scope

- Consumer Rights Protection Law No. 1023-XII: https://zakon.rada.gov.ua/cgi-bin/laws/main.cgi?nreg=1023-12 — current text identifies the law as effective; exchange, quality claims and distance-contract withdrawal are distinguished.
- New Consumer Rights Protection Law No. 3153-IX: https://zakon.rada.gov.ua/laws/show/3153-20 — the official page identifies its general commencement as pending. Its future rules have not been substituted for the current law.
- E-commerce Law No. 675-VIII: https://zakon.rada.gov.ua/laws/show/675-19 — seller disclosures and electronic contracting.
- Personal Data Protection Law No. 2297-VI: https://zakon.rada.gov.ua/go/2297-17 — purposes, lawful grounds, information at collection, data-subject rights, access requests and international transfers.
- Cabinet Resolution No. 172: https://zakon.rada.gov.ua/laws/show/172-94-%D0%BF — exceptions for qualifying satisfactory-quality goods; not a blanket exclusion of all T-shirts or all clothing, and not an exclusion of defect remedies.
- Official personal-data guidance: https://ombudsman.gov.ua/uk/rekomendaciyi-ta-rozyasnennya/tipovij-poryadok-obrobki-personalnih-danih
- Official consumer guidance on statutory refund periods: https://dpss.gov.ua/news/rekomendatsii-spozhyvacham-iak-diiaty-koly-prodavets-vidmovliaie-u-povernenni-koshtiv-za-tovar-z-nedolikamy-chy-u-obmini-na-iakisnyi-tovar

These documents are practical store drafts, not a guarantee of full legal compliance. Review the applicable legislation and business practices again before live trading and after material changes.

## Owner-confirmed facts

- The intended future seller is the owner as a sole proprietor (FOP), not yet registered. The owner expressly requested leaving registration details blank.
- Dispatch: up to 10 business days. Carrier: Nova Poshta. The current checkout supports Ukrainian delivery details; international delivery is not offered by this implementation.
- No public support email, telephone, return recipient or address has been approved. The account owner's private email and telephone are not used as substitutes. No mailbox, domain or phone number was purchased or created for this task.

## Choices and current functionality

- The documents retain the 14-day distance-withdrawal rules and distinguish the 14-day exchange of unused satisfactory-quality goods from defect claims. They do not demand an unboxing video or an unopened package as a blanket condition.
- The store draft adopts refund on termination day or, where impossible, an agreed period of no more than 7 calendar days. This is a store policy; it does not incorrectly present Article 12(4)'s 30-day rule as universally applicable to distance contracts. Return costs are addressed using Article 12(5) as incorporated by Article 13(7), without a blanket “buyer pays all returns” clause.
- The privacy notice reflects the actual stack: Clerk, Vercel, Neon, WayForPay, Nova Poshta for fulfilment, the welcome-offer record and browser storage. It makes no Ukraine-only hosting claim, no promise of automatic deletion and no claim that the email offer is a newsletter subscription.
- The 5% offer is consumed when an eligible order is created; failed or abandoned payment does not automatically restore it. Test/live redemption is separate. Statutory remedies remain unaffected.
- API verification of payment remains authoritative. Browser returns are not proof of payment. These changes do not enable live payments or change STORE_MODE/PAYMENTS_MODE.

## Editing and readiness

“Сторінки магазину” in the admin area edits bilingual text; `## ` starts a section. Empty fields use the versioned source defaults. Existing saved CMS content is preserved. “Реквізити продавця” edits only public seller fields via administrator-protected endpoints. Blank values are allowed while preparing the shop; malformed identifiers, emails and phone numbers are rejected. No production settings were seeded with fabricated seller details.

Before live sales, complete and verify the registered seller identity, code, registered/correspondence address, tax status, actual contact channel and return details. Confirm the refund/delivery practices against these documents, provide legally sufficient durable order confirmation, and configure fiscal receipts/RRO/PRRO wherever required for the real payment model. Legal-page text alone does not implement fiscalisation or register a business.

## Verification

Unit tests cover bilingual CMS round-tripping, empty identity/draft status, profile validation and escaping of untrusted seller/CMS text. Browser tests cover three documents in both languages at 320/390/820/1024/1440px, anchored contents, no horizontal overflow, no auth SDK, cookie settings, print layout, JavaScript-disabled reading, trailing slashes and footer/back navigation. Checkout links and the dispatch disclosure preserve the invalid-field payment block. Admin editor submissions were intercepted in a browser fixture; no fictitious business information was written to the database.
