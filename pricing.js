/* Offline preview snapshot. Original catalogue prices remain integer USD cents.
   Production must use the real store's approved daily rate and checkout validation. */
window.CIVIS_PRICING=Object.freeze({
  usdToUah:45.0510,
  asOf:'2026-10-23',
  source:'https://worldbank.org.ua/kurs-valiut/usd?period=year',
  sourceCheck:'https://ecofin.in.ua/currency/usd',
  mode:'offline-preview-snapshot'
});
