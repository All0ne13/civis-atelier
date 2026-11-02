(()=>{
 const key='civis-cookie-consent',maxAge=180*24*60*60*1000;
 const valid=value=>value?.version===1&&['accepted','rejected'].includes(value.choice)&&Number.isFinite(value.at)&&value.at<=Date.now()+300000&&Date.now()-value.at<maxAge;
 function savedChoice(){
  let saved=null;
  try{const stored=JSON.parse(localStorage.getItem(key)||'null');if(valid(stored))saved=stored;}catch{}
  try{const raw=document.cookie.split('; ').find(item=>item.startsWith(key+'='));if(raw){const stored=JSON.parse(decodeURIComponent(raw.slice(key.length+1)));if(valid(stored)&&(!saved||stored.at>saved.at))saved=stored;}}catch{}
  return saved;
 }
 let current=savedChoice(),banner,language,editing=false;
 const locale=()=>document.documentElement.lang==='en'?'en':'uk';
 function render(){
  language=locale();const L=(u,e)=>language==='uk'?u:e;
  banner.innerHTML=`<h2 id="cookie-consent-title">${L('Ваш вибір cookies','Your cookie choice')}</h2><p>${L('Необхідне зберігання забезпечує вхід і роботу кошика. Додаткові cookies — лише з вашої згоди. Вибір можна змінити внизу сайту.','Essential storage keeps sign-in and your cart working. Optional cookies require your consent. You can change your choice in the site footer.')} <a class="cookie-policy" href="/privacy${language==='en'?'?lang=en':''}#cookies">${L('Cookies та дані','Cookies and data')}</a></p><div class="cookie-consent-actions"><button type="button" data-cookie-choice="rejected">${L('Відхилити','Reject')}</button><button type="button" data-cookie-choice="accepted">${L('Прийняти','Accept')}</button></div>`;
 }
 function choose(choice){
  current={version:1,choice,at:Date.now()};
  editing=false;
  try{localStorage.setItem(key,JSON.stringify(current));}catch{}
  try{document.cookie=`${key}=${encodeURIComponent(JSON.stringify(current))}; Path=/; Max-Age=${maxAge/1000}; SameSite=Lax${location.protocol==='https:'?'; Secure':''}`;}catch{}
  banner.hidden=true;window.dispatchEvent(new CustomEvent('civis:consentchange',{detail:{...current}}));
 }
 function show(){editing=true;render();banner.hidden=false;banner.querySelector('button').focus({preventScroll:true});}
 function sync(){
  const stored=savedChoice(),changed=stored?.choice!==current?.choice||stored?.at!==current?.at;
  current=stored;
  if(!editing)banner.hidden=!!current;
  if(changed)window.dispatchEvent(new CustomEvent('civis:consentchange',{detail:current?{...current}:null}));
 }
 function mountFooter(){
  if(language!==locale())render();
  const footer=document.querySelector('.footer-bottom,.checkout-footer');if(!footer)return;
  let button=footer.querySelector('[data-cookie-settings]');
  if(!button){button=document.createElement('button');button.type='button';button.dataset.cookieSettings='';button.className='cookie-preferences-link';button.onclick=show;footer.append(button);}
  button.onclick=show;
  const text=locale()==='uk'?'Налаштування cookies':'Cookie settings';if(button.textContent!==text)button.textContent=text;
 }
 banner=document.createElement('section');banner.className='cookie-consent';banner.setAttribute('role','region');banner.setAttribute('aria-labelledby','cookie-consent-title');banner.hidden=!!current;render();
 banner.addEventListener('click',event=>{const button=event.target.closest('[data-cookie-choice]');if(button)choose(button.dataset.cookieChoice);});document.body.append(banner);
 window.CivisConsent={get:()=>current?{...current}:null,allows:category=>category==='necessary'||(['analytics','marketing','preferences'].includes(category)&&current?.choice==='accepted'),show};
 window.addEventListener('storage',event=>{if(event.key===key||event.key===null)sync();});
 window.addEventListener('pageshow',sync);
 window.addEventListener('focus',sync);
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')sync();});
 new MutationObserver(mountFooter).observe(document.body,{childList:true,subtree:true});new MutationObserver(mountFooter).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});mountFooter();
})();

