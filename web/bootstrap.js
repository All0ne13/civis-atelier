(()=>{
 const script=(src,attrs={})=>new Promise((resolve,reject)=>{
  const el=document.createElement('script');el.src=window.CIVIS_ASSET_URLS?.[src]||src;el.crossOrigin='anonymous';for(const[key,value]of Object.entries(attrs))el.setAttribute(key,value);
  el.onload=resolve;el.onerror=()=>{el.remove();reject(new Error('Authentication service could not be loaded'));};document.head.append(el);
 });
 let authPromise,authLocale;
 const localizations=new Map();
 function selectedLocale(locale){
  if(locale==='uk'||locale==='en')return locale;
  const query=new URLSearchParams(location.search).get('lang');if(query==='uk'||query==='en')return query;
  if(['uk','en'].includes(document.documentElement.lang))return document.documentElement.lang;
  try{return JSON.parse(localStorage.getItem('civis-atelier-preview')||'null')?.locale==='en'?'en':'uk';}catch{return'uk';}
 }
 function localizationFor(locale){
  if(!localizations.has(locale))localizations.set(locale,fetch(`/clerk-${locale}.json`).then(response=>{if(!response.ok)throw new Error('Unable to load account translations');return response.json();}).catch(error=>{localizations.delete(locale);throw error;}));
  return localizations.get(locale);
 }
 async function loadAuth(locale){
  const key=window.CIVIS_RUNTIME.publishableKey,domain=atob(key.split('_')[2]).replace(/\$$/,'');
  const[, ,localization]=await Promise.all([
   window.__internal_ClerkUICtor?undefined:script(`https://${domain}/npm/@clerk/ui@1/dist/ui.browser.js`),
   window.Clerk?undefined:script(`https://${domain}/npm/@clerk/clerk-js@6/dist/clerk.browser.js`,{'data-clerk-publishable-key':key}),
   localizationFor(locale)
  ]);
  await window.Clerk.load({localization,ui:{ClerkUI:window.__internal_ClerkUICtor}});
  authLocale=locale;
  if(window.Clerk.user)await window.CivisWelcome?.claimPending().catch(()=>{});
  if(window.Clerk.user){const token=await window.Clerk.session.getToken();const response=await fetch('/api/session',{headers:{Authorization:`Bearer ${token}`}});if(response.ok)window.CIVIS_IS_ADMIN=!!(await response.json()).isAdmin;}
  window.CivisStore?.refreshHeader();return window.Clerk;
 }
 window.CivisAuth={async ensure({locale}={}){
  locale=selectedLocale(locale);
  if(!authPromise)authPromise=loadAuth(locale).catch(error=>{authPromise=null;throw error;});
  const clerk=await authPromise;
  if(authLocale!==locale){
   // Clerk JS v6 uses this options bridge for already-mounted UI providers.
   await clerk.__internal_updateProps({options:{localization:await localizationFor(locale)}});
   authLocale=locale;
  }
  return clerk;
 }};
 const privatePage=/^\/(admin|checkout|account|login|register|forgot)(\/|$)/.test(location.pathname);
 async function start(){
  if(privatePage)await window.CivisAuth.ensure();
  if(location.pathname==='/admin')return script('/admin.js');
  if(location.pathname.startsWith('/checkout'))return script('/checkout.js');
  if(!Array.isArray(window.CATALOGUE))throw new Error('The product catalogue is unavailable');
  await script('/app.js');
  // Returning customers get their account state; browsing as a guest loads no auth SDK.
  if(!privatePage&&document.cookie.split(';').some(cookie=>/^\s*__(session|client_uat)(?:_[^=]+)?=(?!0(?:;|$))[^;]+/.test(cookie)))window.CivisAuth.ensure().catch(()=>{});
 }
 document.addEventListener('pointerover',event=>{if(event.target.closest('[data-action=account],a[href="/account"]'))window.CivisAuth.ensure().catch(()=>{});},{passive:true});
 start().catch(error=>{const host=document.querySelector('#main')||document.body,p=document.createElement('p');p.style.cssText='padding:40px;max-width:700px;margin:auto';p.setAttribute('role','alert');p.textContent=`${error.message}. Please reload the page or try again later.`;host.append(p);});
})();
