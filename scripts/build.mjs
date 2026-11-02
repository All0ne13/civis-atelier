import { mkdir, readFile, writeFile, cp } from 'node:fs/promises';
import vm from 'node:vm';
import { ukUA, enUS } from '@clerk/localizations';
import {build} from 'esbuild';
import {optimizeImages} from './optimize-images.mjs';
import {optimizeClient} from './optimize-client.mjs';
await mkdir('public', { recursive:true });
await cp('shared/checkout-validation.mjs','public/checkout-validation.mjs');
await cp('web/payment-widget.mjs','public/payment-widget.mjs');
await cp('web/fonts.css','public/fonts.css');
await cp('web/design-system.css','public/design-system.css');
await cp('web/admin-size-availability.js','public/admin-size-availability.js');
await cp('web/welcome.js','public/welcome.js');
await cp('web/motion-carousel.js','public/motion-carousel.js');
await build({entryPoints:['web/scroll-reveal.js'],bundle:true,format:'iife',target:'es2020',minify:true,legalComments:'eof',outfile:'public/scroll-reveal.js'});
await cp('web/motion-system.css','public/motion-system.css');
for(const file of ['legal.html','legal.css','legal.js'])await cp(`web/${file}`,`public/${file}`);
await cp('web/footer-social.css','public/footer-social.css');
await cp('web/footer.css','public/footer.css');
await build({entryPoints:['shared/footer.mjs'],bundle:true,format:'esm',target:'es2020',minify:true,outfile:'public/footer-component.mjs'});
await cp('web/company.css','public/company.css');
await writeFile('public/legal.html',(await readFile('public/legal.html','utf8')).replace('</head>','<meta name="robots" content="noindex, follow" data-shell-only><link rel="stylesheet" href="/footer-social.css"></head>'));
await writeFile('public/legal.html',(await readFile('public/legal.html','utf8')).replace('</head>','<link rel="stylesheet" href="/company.css"></head>'));
await writeFile('public/legal.html',(await readFile('public/legal.html','utf8')).replace('</head>','<link rel="stylesheet" href="/footer.css"></head>'));
await cp('web/home-editorial.css','public/home-editorial.css');
await cp('web/cover-and-actions.css','public/cover-and-actions.css');
await writeFile('public/legal.html',(await readFile('public/legal.html','utf8')).replace('</head>','<link rel="stylesheet" href="/cover-and-actions.css"></head>'));
await writeFile('public/legal.html',(await readFile('public/legal.html','utf8')).replace('</head>','<script defer src="/scroll-reveal.js"></script></head>'));
for(const file of ['order-status.js','order-status.css'])await cp(`web/${file}`,`public/${file}`);
for(const file of ['mobile-quick-buy.js','mobile-quick-buy.css'])await cp(`web/${file}`,`public/${file}`);
for(const file of ['cookie-consent.js','cookie-consent.css'])await cp(`web/${file}`,`public/${file}`);
for(const file of ['size-guide.js','size-guide.css','admin-size-guide.js'])await cp(`web/${file}`,`public/${file}`);
// Keep the customer-facing brand independent of the authentication instance name.
// Clerk's Ukrainian dictionary omits these keys and otherwise falls back to English.
const ukAuthPlaceholders={
 formFieldInputPlaceholder__emailAddress:'Введіть електронну пошту',
 formFieldInputPlaceholder__emailAddress_username:'Введіть пошту або ім’я користувача',
 formFieldInputPlaceholder__password:'Введіть пароль',
 formFieldInputPlaceholder__signUpPassword:'Створіть пароль',
 formFieldInputPlaceholder__firstName:'Ім’я',
 formFieldInputPlaceholder__lastName:'Прізвище',
 formFieldInputPlaceholder__phoneNumber:'Введіть номер телефону',
 formFieldInputPlaceholder__username:'Введіть ім’я користувача',
 formFieldInputPlaceholder__backupCode:'Введіть резервний код',
 formFieldInputPlaceholder__confirmDeletionUserAccount:'Видалити акаунт',
 socialButtonsBlockButton:'Продовжити з {{provider|titleize}}'
};
for (const [locale, strings] of Object.entries({uk:ukUA,en:enUS})) {
  const localization=locale==='uk'?{...strings,...ukAuthPlaceholders}:strings;
  await writeFile(`public/clerk-${locale}.json`, JSON.stringify(localization).replaceAll('{{applicationName}}','Civis Atelier'));
}
await cp('assets', 'public/assets', { recursive:true });
const imageManifest=await optimizeImages();
for (const file of ['styles.css','editorial.css','account.css','carousel.js','interactions.js']) await cp(file, `public/${file}`);
for (const file of ['auth-live.js','auth-modal.css','bootstrap.js','admin.html','admin.js','admin.css','admin-orders.js','admin-cms.js','checkout.html','checkout.css','checkout.js','product-details.js','mobile-menu.js','mobile-menu.css']) await cp(`web/${file}`, `public/${file}`);
const checkoutHtml=await readFile('public/checkout.html','utf8');
await writeFile('public/checkout.html',checkoutHtml.replace('</head>','<link rel="stylesheet" href="/footer-social.css"><link rel="stylesheet" href="/footer.css"></head>'));
await writeFile('public/checkout.html',(await readFile('public/checkout.html','utf8')).replace('</head>','<link rel="stylesheet" href="/cover-and-actions.css"></head>'));
await writeFile('public/checkout.html',(await readFile('public/checkout.html','utf8')).replace('</head>','<link rel="stylesheet" href="/order-status.css"><script defer src="/order-status.js"></script><link rel="stylesheet" href="/cookie-consent.css"><script defer src="/cookie-consent.js"></script><link rel="stylesheet" href="/fonts.css"></head>'));
await writeFile('public/checkout.html',(await readFile('public/checkout.html','utf8')).replace('<script defer src="/bootstrap.js"','<script defer src="/welcome.js"></script><script defer src="/bootstrap.js"'));
const adminHtml=await readFile('public/admin.html','utf8');
await writeFile('public/admin.html',adminHtml.replace('</head>','<link rel="stylesheet" href="/fonts.css"></head>').replace('<body>','<body class="font-admin">'));
const context = { window:{} };
vm.runInNewContext(await readFile('data.js','utf8'), context);
await writeFile('public/translations.json', JSON.stringify(context.window.UK));
let html = await readFile('web/store-shell.html','utf8');
html=html.replace('</head>','<link rel="stylesheet" href="/home-editorial.css"></head>');
html=html.replace('</head>','<link rel="stylesheet" href="/footer-social.css"></head>');
html=html.replace('</head>','<link rel="stylesheet" href="/footer.css"></head>');
html=html.replace('</head>','<link rel="stylesheet" href="/cover-and-actions.css"></head>');
html = html.replace(/<script[^>]*><\/script>/g, '').replace('<head>','<head><base href="/">');
html = html.replace('</head>','<link rel="stylesheet" href="/mobile-menu.css"><script src="/product-details.js" defer></script><script src="/mobile-menu.js" defer></script></head>');
html = html.replace('</head>','<link rel="stylesheet" href="/size-guide.css"><script src="/size-guide.js" defer></script></head>');
html = html.replace('</head>','<link rel="stylesheet" href="/order-status.css"><script src="/order-status.js" defer></script></head>');
html = html.replace('</head>','<link rel="stylesheet" href="/mobile-quick-buy.css"><script src="/mobile-quick-buy.js" defer></script></head>');
html = html.replace('</head>','<link rel="stylesheet" href="/cookie-consent.css"><script src="/cookie-consent.js" defer></script></head>');
html = html.replace('</head>','<link rel="stylesheet" href="/auth-modal.css"><script src="/runtime.js" defer></script><script src="/store-data.js" defer></script><script src="/views.js" defer></script><script src="/carousel.js" defer></script><script src="/interactions.js" defer></script><script src="/auth-live.js" defer></script><script src="/bootstrap.js" defer></script></head>');
html=html.replace('</head>','<link rel="stylesheet" href="/fonts.css"><script src="/images.js" defer></script></head>');
html=html.replace('<script src="/views.js"', '<script src="/images.js" defer></script><script src="/views.js"');
html=html.replace('<script src="/interactions.js"','<script src="/motion-carousel.js" defer></script><script src="/interactions.js"');
html=html.replace('<script src="/interactions.js"','<script src="/scroll-reveal.js" defer></script><script src="/interactions.js"');
html=html.replace('<script src="/auth-live.js"','<script src="/welcome.js" defer></script><script src="/auth-live.js"');
html=html.replace('<link rel="stylesheet" href="/fonts.css"><script src="/images.js" defer>', '<link rel="stylesheet" href="/fonts.css">');
await writeFile('public/store.html', html);
let app = await readFile('app.js','utf8');
app=app.replace('<fieldset class="variant-group"><legend>${t(\'Size\')}', '<fieldset class="variant-group size-variant-group"><legend>${t(\'Size\')}');
app=app.replace('</legend><div class="variant-options">${p.sizes.map', '</legend>${window.CivisSizeGuide.trigger(p,{locale:state.locale})}<div class="variant-options">${p.sizes.map');
app = app.replace('const colors={', 'const colors={...window.CIVIS_COLOR_VALUES,');
app = app.replaceAll("['Shirts','T-shirts','Jeans','Hoodies']", 'window.CIVIS_CATEGORIES');
app = app.replace("window.CivisGarments?.destroy();", "window.CivisAccount.destroy();window.CivisGarments?.destroy();");
app = app.replace('renderFooter();renderPurchaseDock();', 'window.CivisAccount.mount(state.page);renderFooter();renderPurchaseDock();');
app = app.replace('page=window.CivisAccount.guard(page);', "page=window.CivisAccount.guard(page);if(['login','register','forgot'].includes(page)){closeDrawer();window.CivisAccount.open(page,{locale:state.locale});return;}");
app = app.replace("if(action==='account'){navigate('account');return;}", "if(action==='account'){navigate('account');return;}if(action==='checkout'){location.assign('/checkout');return;}");
app = app.replace("L('Оформлення · майбутня інтеграція','Checkout · future integration')", "L('Оформити замовлення','Checkout')");
app = app.replace("L('Доставка й податки потребують перевірки у справжньому магазині.','Shipping and tax require verification in the real store.')", "L('Вартість доставки — за тарифами перевізника.','Delivery is charged at the carrier’s rates.')");
app = app.replace(/<div class="details"><details open>[\s\S]*?<\/details><\/div><\/section>/, '${window.CivisDetails.render(p,{locale:state.locale,t,L,esc})}</section>');
app = app.replace('<span class="turn-material"><b>', '${window.CivisDetails.flip(p,{locale:state.locale,esc})}<span class="turn-material"><b>');
app = app.replace("const pinned=type==='filters'", "$('#drawer').classList.toggle('atelier-menu',type==='menu');window.CivisMenu.mount({state,t,L,icon,productPhoto,products});const pinned=type==='filters'");
app = app.replace('function integration(topic){', `function integration(topic){const content=window.CIVIS_CONTENT?.[topic]?.[state.locale];if(content)return '<div class="integration"><p style="white-space:pre-line">'+esc(content)+'</p></div>';`);
app = app.replace("const p=pById('techwear-hoodie');state.product", "const p=pById('techwear-hoodie')||products[0];state.product");
const compiled=await build({stdin:{contents:app,resolveDir:process.cwd(),sourcefile:'app.js'},bundle:true,format:'iife',target:'es2020',minify:true,write:false,legalComments:'eof'});
await writeFile('public/app.js', compiled.outputFiles[0].text);
let views = await readFile('views.js','utf8');
views = views.replace('.map(pById);', '.map(pById).filter(Boolean);');
views = views.replace("['All','Shirts','T-shirts','Jeans','Hoodies']", "['All',...window.CIVIS_CATEGORIES]");
views = views.replace("['T-shirts','Shirts','Hoodies','Jeans']", 'window.CIVIS_CATEGORIES');
views=views.replace(/src="(assets\/[^"']+\.(?:png|jpe?g))"/g,(_,src)=>{const sizes=src.includes('home-campaign')?'(max-width:600px) calc(100vw - 40px), 66vw':src.includes('atelier-movement')?'(max-width:600px) 84vw, 48vw':src.includes('atelier-story')?'(max-width:600px) calc(100vw - 40px), 46vw':'(max-width:600px) 100vw, 100vw';return `\${window.CivisImages.attributes('${src}','${sizes}')}`;});
await writeFile('public/views.js', views);
await optimizeClient();
console.log('Production storefront built. Preview wrapper and mock authentication excluded.');
