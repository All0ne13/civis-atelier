(()=>{
 const locale=document.documentElement.lang;
 // Language links are real URLs; keep the storefront preference in sync.
 try{const saved=JSON.parse(localStorage.getItem('civis-atelier-preview')||'{}');saved.locale=locale;localStorage.setItem('civis-atelier-preview',JSON.stringify(saved));}catch{}
 document.querySelector('[data-print]')?.addEventListener('click',()=>window.print());
 document.querySelector('[data-open-cookie]:not([data-cookie-settings])')?.addEventListener('click',()=>window.CivisConsent?.show());
 const toc=document.querySelector('.legal-toc');if(toc&&matchMedia('(min-width:761px)').matches)toc.open=true;
})();
