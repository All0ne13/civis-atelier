const {chromium}=require('playwright');
const {pathToFileURL}=require('url');
const path=require('path');
const assert=require('assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const page=await browser.newPage();const errors=[];const report=[];
 page.on('pageerror',e=>errors.push(e.message));
 const url=pathToFileURL(path.resolve('store.html')).href;
 async function layout(label){
   await page.locator('img').evaluateAll(async imgs=>{await Promise.all(imgs.map(i=>{i.loading='eager';return i.decode().catch(()=>{})}))});
   const result=await page.evaluate(()=>({width:innerWidth,doc:document.documentElement.scrollWidth,broken:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.getAttribute('src')),overflow:[...document.querySelectorAll('main *,header *')].filter(e=>{const r=e.getBoundingClientRect(),c=getComputedStyle(e);return (!e.closest('.product-carousel-track')||e.matches('.product-carousel-track'))&&c.display!=='none'&&r.width>0&&(r.right>innerWidth+1||r.left< -1)}).slice(0,8).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent.slice(0,40)}))}));
   assert.equal(result.broken.length,0,`${label} broken images: ${result.broken}`);
   assert.ok(result.doc<=result.width+1,`${label} horizontal overflow ${JSON.stringify(result)}`);
   assert.equal(result.overflow.length,0,`${label} overflowing elements ${JSON.stringify(result.overflow)}`);
   report.push(`${label}: images and viewport OK`);
 }
 for(const width of [360,390,430,768,1440]){
  await page.setViewportSize({width,height:1000});await page.goto(url);await page.locator('.hero').waitFor();await layout(`${width} Home`);
  await page.locator('.hero-cta').click();await page.locator('#results').waitFor();await layout(`${width} Catalogue`);
  if(width<850){await page.getByRole('button',{name:/Фільтри/}).click();await page.locator('#drawer').waitFor({state:'visible'});assert.ok(await page.locator('#drawer').evaluate(d=>d.getBoundingClientRect().width<=innerWidth));await page.keyboard.press('Escape');await page.locator('#drawer').waitFor({state:'hidden'});}
  await page.locator('[data-product="techwear-hoodie"]').first().click();await page.locator('.product-layout').waitFor();await layout(`${width} Product`);
 }
 await page.setViewportSize({width:390,height:844});await page.goto(url);
 await page.locator('.hero-cta').click();
 await page.locator('[data-action=category][data-value=Hoodies]').click();assert.equal(await page.locator('#results article').count(),1);
 await page.locator('#results [data-product=techwear-hoodie]').first().click();
 await page.locator('[data-action=add]').click();assert.equal(await page.locator('#product-error').isVisible(),true);
 await page.locator('[data-action=size][data-value=M]').click();await page.locator('[data-action=add]').click();await page.locator('#toast').waitFor({state:'visible'});assert.match(await page.locator('.cart-control').getAttribute('aria-label'),/1/);
 await page.locator('.cart-control').click();await page.locator('.cart-item').waitFor();assert.match(await page.locator('.variant-caption').textContent(),/M/);
 await page.locator('[data-action=cart-plus]').click();assert.equal(await page.locator('.cart-item output').textContent(),'2');
 await page.locator('[data-action=checkout]').click();await page.locator('.integration').waitFor();assert.match(await page.locator('.integration').textContent(),/не підключені/);await page.keyboard.press('Escape');
 await page.locator('.product-title-row [data-action=wish]').click();assert.equal(await page.locator('.product-title-row [data-action=wish]').getAttribute('aria-pressed'),'true');
 await page.locator('[data-action=locale]').first().click();assert.equal(await page.locator('html').getAttribute('lang'),'en');assert.equal(await page.locator('h1').textContent(),'Techwear Hoodie');assert.match(await page.locator('.product-info>.price').textContent(),/159/);
 await page.locator('.search-icon').click();await page.locator('#search-input').fill('Basic');assert.equal(await page.locator('.search-result').count(),2);await page.locator('#search-input').press('Enter');assert.equal(await page.locator('#results article').count(),2); // Global search searches the complete catalogue.
 await page.locator('#catalogue-query').fill('');assert.equal(await page.locator('#results article').count(),10);
 await page.locator('#sort').selectOption('low');assert.equal(await page.locator('#results article').first().locator('[data-product]').first().getAttribute('data-product'),'cotton-white');
 await page.locator('#results [data-product=blurred-print]').first().click();assert.equal(await page.locator('[data-purchase-primary]').isEnabled(),true);
 await page.locator('.breadcrumbs [data-page=catalogue]').click();await page.locator('#results [data-product=essential-cream]').first().click();assert.equal(await page.locator('h1').textContent(),'Basic Slim Fit T-Shirt');assert.match(await page.locator('.product-photo img').getAttribute('src'),/essential-cream/);
 await page.locator('[data-action=color][data-value=White]').click();assert.equal(await page.locator('[data-action=color][data-value=White]').getAttribute('aria-pressed'),'true');assert.match(await page.locator('.product-photo img').getAttribute('src'),/essential-cream/);
 await page.locator('.studio-view-tabs [data-action=product-view][data-value=photo]').click();await page.locator('[data-action=zoom].gallery-zoom').click();assert.equal(await page.locator('#zoom').isVisible(),true);await page.keyboard.press('Escape');
 report.push('Navigation, filters, sort, search, size validation, color selection, Cart mutations, checkout disclosure, Wishlist, locale, sold-out and gallery dialog OK');
 await page.locator('.breadcrumbs [data-page=catalogue]').click();
 await page.locator('[data-action=filters]').click();
 await page.locator('#drawer [data-filter=collection][value=Women]').check();assert.equal(await page.locator('#results article').count(),3);
 await page.locator('#drawer [data-filter=availability][value=out]').check();assert.equal(await page.locator('#results article').count(),1);
 await page.locator('#drawer [data-action=reset]').click();
 await page.locator('#drawer [data-filter=category][value=Hoodies]').check();
 await page.locator('#drawer [data-action=filter-size][data-value=XS]').click();assert.equal(await page.locator('#results article').count(),0);
 await page.locator('#drawer [data-action=reset]').click();
 await page.locator('#drawer [data-filter=color][value=Mint]').check();assert.equal(await page.locator('#results article').count(),1);
 await page.locator('#drawer [data-action=reset]').click();
 await page.locator('#drawer-min-price').fill('100');await page.locator('#drawer-min-price').dispatchEvent('change');assert.equal(await page.locator('#results article').count(),3);
 await page.locator('#drawer-max-price').fill('130');await page.locator('#drawer-max-price').dispatchEvent('change');assert.equal(await page.locator('#results article').count(),2);
 await page.locator('#drawer [data-action=reset]').click();await page.locator('#drawer [data-filter=new]').check();assert.equal(await page.locator('#results article').count(),8);
 await page.locator('#drawer [data-action=reset]').click();await page.keyboard.press('Escape');
 assert.equal(await page.locator('#drawer').isVisible(),false);
 await page.locator('#results [data-product=techwear-hoodie]').first().click();
 await page.locator('[data-action=size][data-value=L]').click();
 for(let i=0;i<5;i++)await page.locator('[data-action=qty-plus]').click();
 assert.equal(await page.locator('#product-quantity').textContent(),'6');
 await page.locator('[data-action=add]').click();assert.equal(await page.locator('[data-purchase-primary]').isEnabled(),true);
 await page.locator('.cart-control').click();assert.equal(await page.locator('[data-action=cart-plus]:enabled').count(),0);await page.keyboard.press('Escape');
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('.search-icon').click();
 const dialogMotion=await page.locator('#drawer').evaluate(e=>getComputedStyle(e).animationName);assert.equal(dialogMotion,'none');
 assert.equal(await page.locator('#drawer').evaluate(d=>d.contains(document.activeElement)),true);await page.keyboard.press('Escape');
 assert.equal(await page.locator('html').evaluate(()=>document.activeElement.closest('.search-icon')!==null),true);
 report.push('All filter groups, USD price bounds, aggregate stock cap across sizes, modal focus return, and reduced motion OK');

 await page.goto(pathToFileURL(path.resolve('index.html')).href);await page.locator('iframe').waitFor();const frame=page.frameLocator('#store');await frame.locator('.hero').waitFor();await page.locator('[data-page=product]').click();await frame.locator('.product-layout').waitFor();assert.match(await frame.locator('h1').textContent(),/Techwear/);await page.locator('[data-device=mobile]').click();assert.equal(await page.locator('#store').evaluate(e=>Math.round(e.getBoundingClientRect().width)),390);await page.locator('#width').selectOption('360');assert.equal(await page.locator('#store').evaluate(e=>Math.round(e.getBoundingClientRect().width)),360);report.push('Review toolbar page navigation and 360/390 px iframe sizing OK');
 assert.equal(errors.length,0,errors.join('\n'));report.push('No browser JavaScript errors');console.log(report.join('\n'));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
