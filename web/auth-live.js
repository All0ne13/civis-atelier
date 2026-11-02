(() => {
  let mounted, dialog, origin, ordersTimer,previousPath='/', previousScroll=0, bodyStyles={},previousState=null,closingFromHistory=false,closeHandled=true;
  const escape=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const closeIcon='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6"/></svg>';
  const appearance={
    layout:{socialButtonsVariant:'blockButton',socialButtonsPlacement:'top'},
    variables:{colorPrimary:'#294e3c',colorBackground:'#f2f3ef',colorText:'#18211c',colorTextSecondary:'#61685f',colorInputBackground:'#ffffff',colorInputText:'#18211c',fontFamily:'Manrope Variable, Arial, sans-serif',fontSize:'16px',borderRadius:'0px',spacingUnit:'16px'},
    elements:{rootBox:'atelier-clerk-root',cardBox:'atelier-clerk-box',card:'atelier-clerk-card',headerTitle:'atelier-clerk-title',headerSubtitle:'atelier-clerk-subtitle',formFieldInput:'atelier-clerk-input',formButtonPrimary:'atelier-clerk-submit',socialButtonsBlockButton:'atelier-clerk-social',footer:'atelier-clerk-footer',footerAction:'atelier-clerk-footer-action'}
  };
  function unmount(){clearInterval(ordersTimer);if(mounted){window.Clerk?.[`unmount${mounted.type}`]?.(mounted.node);mounted=null;}}
  function close(){
    if(!dialog?.open)return;
    if(dialog.dataset.mode!=='logout'&&history.state?.civisAuth){history.back();return;}
    dialog.close();
  }
  window.addEventListener('popstate',()=>{
    if(dialog?.open&&!['/login','/register','/forgot'].includes(location.pathname)){
      closingFromHistory=true;dialog.close();
    }
  });
  function ensureDialog(){
    if(dialog)return;
    dialog=document.createElement('dialog');dialog.className='atelier-auth';dialog.setAttribute('aria-labelledby','atelier-auth-title');document.body.append(dialog);
    dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();}});
    dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
    const finishClose=()=>{if(closeHandled||dialog.open)return;closeHandled=true;if(dialog.dataset.mode!=='logout')unmount();Object.assign(document.body.style,bodyStyles);if(!closingFromHistory&&dialog.dataset.mode!=='logout')history.replaceState(previousState,'',previousPath);closingFromHistory=false;window.scrollTo({top:previousScroll,behavior:'instant'});if(origin?.isConnected)origin.focus({preventScroll:true});else document.querySelector('[data-action=account]')?.focus({preventScroll:true});};
    const nativeClose=dialog.close.bind(dialog);dialog.close=(...args)=>{nativeClose(...args);finishClose();};
    dialog.addEventListener('close',finishClose);
    dialog.addEventListener('click',event=>{
      const button=event.target.closest('[data-auth-mode],[data-auth-close],[data-confirm-signout]');
      if(button){event.preventDefault();event.stopPropagation();if(button.hasAttribute('data-auth-close'))close();else if(button.hasAttribute('data-confirm-signout')){button.disabled=true;window.Clerk.signOut({redirectUrl:'/'}).catch(()=>{button.disabled=false;});}else open(button.dataset.authMode,{locale:dialog.dataset.locale});return;}
      const link=event.target.closest('a[href]');if(link){const url=new URL(link.href,location.href);if(url.origin===location.origin&&!url.hash&&['/login','/register'].includes(url.pathname)){event.preventDefault();event.stopPropagation();open(url.pathname.slice(1),{locale:dialog.dataset.locale});}}
    },true);
  }
  async function open(page,{locale='uk',history:writeHistory=true}={}){
    const requestedPath=location.pathname;
    try{await window.CivisAuth?.ensure({locale});}catch{const notice=document.querySelector('#toast');if(notice){notice.textContent=locale==='uk'?'Не вдалося завантажити вхід. Спробуйте ще раз.':'Unable to load sign in. Please try again.';notice.hidden=false;}return;}
    if(location.pathname!==requestedPath)return;
    if(!writeHistory&&dialog?.open&&dialog.dataset.mode===page)return;
    if(window.Clerk.user&&page!=='logout'){window.CivisStore?.navigate('account');return;}
    ensureDialog();const uk=locale==='uk',L=(u,e)=>uk?u:e;
    if(!dialog.open){window.CivisStore?.rememberPage();previousState=window.history.state;origin=document.activeElement;previousScroll=window.scrollY;previousPath=['/login','/register','/forgot'].includes(location.pathname)?'/':location.pathname+location.search;bodyStyles=Object.fromEntries(['overflow','paddingRight','position','top','width'].map(k=>[k,document.body.style[k]]));const gutter=innerWidth-document.documentElement.clientWidth;Object.assign(document.body.style,{overflow:'hidden',position:'fixed',top:`-${previousScroll}px`,width:'100%'});if(gutter)document.body.style.paddingRight=`${gutter}px`;}
    closeHandled=false;
    if(page!=='logout')unmount();dialog.dataset.locale=locale;dialog.dataset.mode=page;
    if(page==='logout'){
      dialog.classList.add('atelier-auth-compact');dialog.innerHTML=`<div class="atelier-signout"><button class="atelier-auth-close" data-auth-close aria-label="${L('Закрити','Close')}">${closeIcon}</button><p class="atelier-auth-kicker">CIVIS ATELIER / ACCOUNT</p><h2 id="atelier-auth-title">${L('До зустрічі?','Until next time?')}</h2><p>${L('Ви вийдете з акаунта на цьому пристрої. Повернутися можна будь-якої миті.','You will sign out on this device. Your account will be here whenever you return.')}</p><button class="atelier-auth-primary" data-confirm-signout>${L('Вийти з акаунта','Sign out')}</button><button class="atelier-auth-secondary" data-auth-close>${L('Залишитися','Stay signed in')}</button></div>`;
    }else{
      dialog.classList.remove('atelier-auth-compact');
      const title=page==='register'?L('Свій погляд.\nСвій простір.','Your point of view.\nYour own space.'):page==='forgot'?L('Повернімо\nвам доступ.','Let’s get\nyou back in.'):L('Раді знову\nбачити вас.','Good to have\nyou back.');
      const art=page==='register'?'assets/campaign/atelier-auth-register-v1.png':'assets/campaign/atelier-auth-v1.png';
      const artEdition=L('АТЕЛЬЄ','THE ATELIER');
      const artDetail=L('ПРОДУМАНО В КОЖНІЙ ДЕТАЛІ.','CONSIDERED IN EVERY DETAIL.');
      const artCaption=L('Ваш власний<br>погляд.','Your own<br>point of view.');
      dialog.innerHTML=`<div class="atelier-auth-layout"><aside class="atelier-auth-art"><img ${window.CivisImages?window.CivisImages.attributes(art,'(max-width:760px) 0px, 400px'):'src="/'+art+'"'} width="1086" height="1448" alt=""/><span class="atelier-auth-edition">${artEdition} / ${page==='register'?'02':'01'}</span><div class="atelier-auth-art-copy"><span>${artDetail}</span><p>${artCaption}</p></div></aside><section class="atelier-auth-panel"><button class="atelier-auth-close" data-auth-close aria-label="${L('Закрити','Close')}">${closeIcon}</button><img class="atelier-auth-logo" src="/assets/brand/civis-atelier.svg" alt="Civis Atelier" width="132" height="52"><div class="atelier-auth-tabs" role="group" aria-label="${L('Ваш акаунт','Your account')}"><button data-auth-mode="login" aria-pressed="${page!=='register'}">${L('Увійти','Sign in')}</button><button data-auth-mode="register" aria-pressed="${page==='register'}">${L('Створити акаунт','Create account')}</button></div><div class="atelier-auth-heading"><h2 id="atelier-auth-title">${escape(title).replace(/\n/g,'<br>')}</h2></div><div class="atelier-auth-component"><div id="clerk-component"></div></div><p class="atelier-auth-fine">${L('Є питання? Ми поруч.','Need a hand? We’re here.')} <a href="/" data-auth-close>${L('Повернутися до магазину','Back to the store')}</a></p></section></div>`;
      const node=dialog.querySelector('#clerk-component'),type=page==='register'?'SignUp':'SignIn';
      const redirect=previousPath.startsWith('/checkout')?previousPath:'/account';
      if(writeHistory){const method=dialog.open?'replaceState':'pushState';window.history[method]({civisAuth:true},'','/'+page);}
      const welcomeEmail=localStorage.getItem('civis-welcome-email');
      window.Clerk[`mount${type}`](node,{routing:'hash',appearance,...(page==='register'&&welcomeEmail?{initialValues:{emailAddress:welcomeEmail}}:{}),signInUrl:'/login',signUpUrl:'/register',fallbackRedirectUrl:redirect,forceRedirectUrl:redirect});mounted={type,node};
    }
    if(!dialog.open)dialog.showModal();dialog.querySelector('[data-auth-close]').focus({preventScroll:true});
  }
  window.CivisAccount={current:()=>window.Clerk?.user||null,
    guard(page){return page==='account'&&!this.current()?'login':['login','register','forgot'].includes(page)&&this.current()?'account':page;},open,close,
    destroy(){if(!dialog?.open)unmount();},
    render(_page,{locale}){const uk=locale==='uk',L=(u,e)=>uk?u:e;return `<section class="atelier-profile"><div class="atelier-profile-heading"><div><p class="atelier-auth-kicker">CIVIS ATELIER / YOUR SPACE</p><h1>${L('Мій профіль','My account')}</h1><p>${escape(window.Clerk.user?.primaryEmailAddress?.emailAddress)}</p></div><div class="atelier-profile-actions">${window.CIVIS_IS_ADMIN?`<a class="atelier-auth-primary" href="/admin">${L('Управління магазином','Store administration')}</a>`:''}<button class="atelier-auth-secondary" id="real-sign-out">${L('Вийти','Sign out')}</button></div></div><div id="clerk-profile"></div></section>`;},
    mount(page){
      if(page!=='account')return;const node=document.querySelector('#clerk-profile');if(!node)return;
      window.Clerk.mountUserProfile(node,{routing:'hash',appearance});mounted={type:'UserProfile',node};
      const locale=document.documentElement.lang==='en'?'en':'uk',L=(u,e)=>locale==='uk'?u:e;
      document.querySelector('#real-sign-out').onclick=()=>open('logout',{locale});
      const orders=document.createElement('section');orders.className='account-orders';orders.innerHTML=`<h2>${L('Мої замовлення','My orders')}</h2><p>${L('Завантаження…','Loading…')}</p>`;node.before(orders);
      const refresh=()=>window.Clerk.session.getToken().then(token=>fetch('/api/orders',{headers:{Authorization:`Bearer ${token}`}})).then(r=>{if(!r.ok)throw new Error();return r.json();}).then(rows=>{
        const labels={pending:L('Очікує оплати','Awaiting payment'),paid:L('Оплачено','Paid'),paid_review:L('Перевірка наявності','Checking availability'),declined:L('Не оплачено','Not paid'),test_paid:L('Тестова оплата','Test payment'),test_declined:L('Тест не завершено','Test incomplete'),refunded:L('Повернено','Refunded')};
        orders.innerHTML=`<h2>${L('Мої замовлення','My orders')}</h2>${rows.length?rows.map(order=>`<a class="account-order" href="/checkout/return?order=${order.id}"><span>${new Date(order.created_at).toLocaleDateString(locale==='uk'?'uk-UA':'en-GB')}<small>${order.is_test?L('Тестове замовлення','Test order'):escape(order.id.slice(0,8))}</small></span><span>${window.CivisOrderStatus.label(order.fulfillment_status,locale)}<small>${labels[order.status]||escape(order.status)}</small>${order.tracking_number?`<small>${L('Накладна','Tracking')}: ${escape(order.tracking_number)}</small>`:''}</span><strong>${new Intl.NumberFormat(locale==='uk'?'uk-UA':'en-US',{style:'currency',currency:'UAH'}).format(order.total_minor/100)}</strong></a>`).join(''):`<p>${L('Тут з’являться ваші замовлення.','Your orders will appear here.')}</p>`}`;
      }).catch(()=>{orders.innerHTML=`<h2>${L('Мої замовлення','My orders')}</h2><p>${L('Не вдалося завантажити замовлення. Спробуйте оновити сторінку.','Unable to load your orders. Please refresh the page.')}</p>`;}).finally(()=>{const button=document.createElement('button');button.className='account-orders-refresh';button.textContent=L('Оновити статуси','Refresh status');button.onclick=()=>{button.disabled=true;refresh();};orders.querySelector('h2').after(button);});
      refresh();clearInterval(ordersTimer);ordersTimer=setInterval(()=>{if(orders.isConnected&&!document.hidden)refresh();},30000);
    }
  };
})();
