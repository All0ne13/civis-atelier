export const emptyPublicLinks={instagram:'',tiktok:'',telegram:'',email:''};
const hosts={instagram:['instagram.com','www.instagram.com'],tiktok:['tiktok.com','www.tiktok.com'],telegram:['t.me','telegram.me']};
export function validPublicLink(key,value){
 if(value==='')return true;
 if(typeof value!=='string'||value.length>500)return false;
 if(key==='email')return /^[a-z0-9.!#$%&'*+/=^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(value)&&value.length<=200;
 try{const url=new URL(value);return url.protocol==='https:'&&hosts[key]?.includes(url.hostname)&&!url.username&&!url.password&&url.pathname!=='/';}catch{return false;}
}
export function publicLinks(value){return Object.fromEntries(Object.keys(emptyPublicLinks).map(key=>[key,validPublicLink(key,value?.[key])?value[key]:'']));}
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons={instagram:'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none"/>',tiktok:'<path d="M14 3v12a4 4 0 1 1-4-4m4-8c1 4 3 5 6 5v4c-2 0-4-1-6-2"/>',telegram:'<path d="m3 11 18-7-4 17-6-6-4 3 1-6 9-5-6 8"/>',email:'<rect x="3" y="5" width="18" height="14" rx="1"/><path d="m3 6 9 7 9-7"/>'};
export function renderPublicLinks(value,locale='uk'){
 const links=publicLinks(value),L=(uk,en)=>locale==='uk'?uk:en,labels={instagram:'Instagram',tiktok:'TikTok',telegram:'Telegram',email:L('Робоча пошта','Work email')};
 return `<div class="footer-socials" role="group" aria-label="${L('Соцмережі та зв’язок','Social media and contact')}">${Object.keys(links).map(key=>{const svg=`<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[key]}</svg>`,label=labels[key];return links[key]?`<a class="footer-social-link" href="${escape(key==='email'?'mailto:'+links[key]:links[key])}" ${key==='email'?'':'target="_blank" rel="noopener noreferrer"'} aria-label="${escape(label)}" title="${escape(label)}">${svg}</a>`:`<button class="footer-social-link" type="button" disabled aria-label="${escape(label)} — ${L('незабаром','coming soon')}" title="${escape(label)} — ${L('незабаром','coming soon')}">${svg}</button>`;}).join('')}</div>${Object.values(links).every(value=>!value)?`<p class="footer-social-note">${L('Соцмережі та зв’язок — незабаром','Social media and contact — coming soon')}</p>`:''}`;
}
