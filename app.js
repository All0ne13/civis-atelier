import {patchContents,patchElement} from './web/dom-patch.js';
import {footerContent} from './shared/footer.mjs';
import {publicHref,pageFacts} from './shared/seo.mjs';
import {applySeo} from './web/seo-client.js';
(() => {
  'use strict';
  const products=window.CATALOGUE, uk=window.UK;
  const emptyFilters=()=>({category:[],collection:[],size:[],color:[],availability:[],new:false,min:'',max:''});
  let searchDraft='';
  const state={page:'home',locale:'uk',product:'techwear-hoodie',color:'Petrol',size:'',qty:1,cart:[],wish:[],query:'',sort:'featured',filters:{category:[],collection:[],size:[],color:[],availability:[],new:false,min:'',max:''},scroll:{},drawer:null};
  const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cleanLabel=s=>String(s).replace(/\s*\u2197/g,'');
  const t=s=>cleanLabel(state.locale==='uk'?(uk[s]||uk[s+' \u2197']||s):s);
  const L=(u,e)=>cleanLabel(state.locale==='uk'?u:e);
  const colors={Black:'#222825',Cream:'#e7e1ce',White:'#fff',Olive:'#686b50',Mint:'#b8c9b6',Petrol:'#315851'};
  const dimensions={'abstract-black':[728,746],'blurred-print':[598,550],'botanical-shirt':[523,620],'cotton-white':[598,550],'essential-cream':[523,620],'heavy-black':[523,620],seersucker:[598,550],'summer-white':[728,746],'techwear-hoodie':[1300,1780],'zipper-shirt':[475,550],'editorial-city':[625,770],'editorial-street':[625,770]};
  const imagePath=key=>key.startsWith('editorial-')?`assets/editorial/${key}.jpg`:`assets/products/${key}.${key==='techwear-hoodie'?'png':'jpg'}`;
  const imageAttrs=(src,sizes='(max-width:600px) calc((100vw - 52px) / 2), (max-width:1000px) 33vw, 25vw')=>window.CivisImages.attributes(src,sizes);
  const img=(key,alt,extra='')=>`<img ${imageAttrs(imagePath(key))} width="${dimensions[key][0]}" height="${dimensions[key][1]}" alt="${esc(alt)}" ${extra}>`;
  const paths={left:'<path d="m14.5 5-7 7 7 7"/>',right:'<path d="m9.5 5 7 7-7 7"/>',search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',heart:'<path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z"/>',cart:'<path d="M3 3h2l2 13h12l2-9H6M9 7V3m8 4V3"/><circle cx="9" cy="21" r="1"/><circle cx="18" cy="21" r="1"/>',user:'<circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',close:'<path d="m5 5 14 14M5 19 19 5"/>',menu:'<path d="M4 6h16M4 12h16M4 18h10"/>',filter:'<path d="M4 6h16M4 12h16M4 18h16"/><path d="M9 3v6m6 0v6m-6 0v6"/>',plus:'<path d="M12 4v16M4 12h16"/>',minus:'<path d="M4 12h16"/>',zoom:'<circle cx="10" cy="10" r="6.5"/><path d="m15 15 6 6M7 10h6m-3-3v6"/>',check:'<path d="m4 12 5 5L20 6"/>'};
  const icon=name=>`<svg class="od-icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name]||''}</svg>`;
  const currencyCode=()=>state.locale==='uk'?'UAH':'USD';
  const localMinor=amount=>state.locale==='uk'?Math.round(amount*window.CIVIS_PRICING.usdToUah):amount;
  const formatMoney=amount=>new Intl.NumberFormat(state.locale==='uk'?'uk-UA':'en-US',{style:'currency',currency:currencyCode(),currencyDisplay:'narrowSymbol',maximumFractionDigits:2,minimumFractionDigits:0}).format(amount/100);
  const money=(amount,qty=1)=>formatMoney(localMinor(amount)*qty);
  const priceLocal=amount=>`<span class="od-nowrap">${esc(formatMoney(amount))}</span>`;
  const price=(amount,qty=1)=>priceLocal(localMinor(amount)*qty);
  const currencyNote=()=>'';
  const pById=id=>products.find(p=>p.id===id);
  const cartQty=id=>state.cart.filter(x=>x.id===id).reduce((sum,x)=>sum+x.qty,0);
  const remain=p=>Math.max(0,p.stock-cartQty(p.id));
  const sizeAvailable=(p,size)=>p.sizes.includes(size)&&!p.unavailableSizes?.includes(size);
  const cartCount=()=>state.cart.reduce((sum,x)=>sum+x.qty,0);
  const save=()=>{try{localStorage.setItem('civis-atelier-preview',JSON.stringify({cart:state.cart,wish:state.wish,locale:state.locale}))}catch{}};
  try{const saved=JSON.parse(localStorage.getItem('civis-atelier-preview')||'null');if(saved){state.locale=saved.locale==='en'?'en':'uk';state.wish=(saved.wish||[]).filter(id=>pById(id));for(const x of saved.cart||[]){const p=pById(x.id);if(!p||!p.colors.includes(x.color)||!p.sizes.includes(x.size))continue;const qty=Math.min(Math.max(0,Math.floor(Number(x.qty)||0)),remain(p));if(qty)state.cart.push({...x,qty});}}}catch{}
  const routeLink=(page,label,extra='')=>`<a href="${esc(publicHref(page==='home'?'/':'/'+page,state.locale,{category:extra.match(/data-category="([^"]+)"/)?.[1],new:extra.includes('data-new="true"')}))}" data-page="${page}" ${extra}>${esc(cleanLabel(label))}</a>`;
  function renderHeader(){
    patchContents('#header',`<nav class="desktop-nav" aria-label="${esc(t('Main'))}">${routeLink('home',t('Home'),state.page==='home'?'aria-current="page"':'')}${routeLink('catalogue',t('Collections'),'data-reset="true" '+(state.page==='catalogue'&&!state.filters.new?'aria-current="page"':''))}${routeLink('catalogue',L('Новинки','New'),'data-new="true" '+(state.page==='catalogue'&&state.filters.new?'aria-current="page"':''))}</nav><button class="icon-button menu-button" data-action="menu" aria-label="${esc(t('Open menu'))}">${icon('menu')}</button><a href="${publicHref('/',state.locale)}" data-page="home" class="brand" aria-label="${esc(t('Civis Atelier home'))}"><img src="assets/brand/civis-atelier.svg" width="1315" height="512" alt="Civis Atelier"></a><div class="header-actions"><button class="icon-button search-icon" data-action="search" aria-label="${esc(t('Search'))}">${icon('search')}</button><button class="icon-button wishlist-control" data-action="wishlist" aria-label="${esc(t('Wishlist'))} (${state.wish.length})">${icon('heart')}</button><button class="locale" data-action="locale" aria-label="${state.locale==='uk'?'УКР':'EN'}: ${L('Змінити мову на англійську','Switch language to Ukrainian')}">${state.locale==='uk'?'УКР':'EN'}</button><button class="icon-button account-control ${window.CivisAccount.current()?'is-signed-in':''}" data-action="account" aria-label="${esc(t('My account'))}">${icon('user')}</button><button class="cart-control" data-action="cart" aria-label="${esc(t('Cart'))} ${cartCount()}"><span class="cart-label">${t('Cart')}</span>${icon('cart')}<span class="count">${cartCount()}</span></button></div>`);
    document.documentElement.lang=state.locale;
    const skip=$('.skip');skip.textContent=L('Перейти до вмісту','Skip to content');
    $('#drawer [data-action=close]').innerHTML=icon('close');$('#drawer [data-action=close]').setAttribute('aria-label',L('Закрити','Close'));
    $('#zoom [data-action=close-zoom]').innerHTML=icon('close');$('#zoom [data-action=close-zoom]').setAttribute('aria-label',L('Закрити','Close'));
  }
  let footerLocale;
  function renderFooter(){if(footerLocale===state.locale)return;footerLocale=state.locale;
    $('#footer').innerHTML=window.CivisWelcome.footer({L,icon})+footerContent({locale:state.locale,links:window.CIVIS_PUBLIC_LINKS,categories:window.CIVIS_CATEGORIES,translations:uk,spa:true,path:pagePath()});
  }
  function searchStrip(){return '';}
  const imageGrounds={'abstract-black':'#eeeff4','heavy-black':'#eeeff4','essential-cream':'#f0f1f6','botanical-shirt':'#f1f2f7',seersucker:'#f1f2f7','cotton-white':'#f1f2f7','blurred-print':'#f1f2f7','zipper-shirt':'#f1f2f7','summer-white':'#f3f3f3','techwear-hoodie':'#ffffff'};
  function productPhoto(p,color=p.colors[0],extra=''){
    const photo=window.CIVIS_MEDIA?.[p.id]?.find(i=>i.color===color&&i.view==='front');
    return photo?`<img ${imageAttrs(photo.file)} width="${photo.width}" height="${photo.height}" alt="${esc(t(p.name)+': '+t(color))}" ${extra}>`:img(p.image,t(p.name),extra);
  }
  function card(p,interactive=false){
    const saved=state.wish.includes(p.id),available=remain(p)>0&&p.sizes.some(size=>sizeAvailable(p,size));
    const status=(!p.stock||!p.sizes.some(size=>sizeAvailable(p,size)))?`<span class="card-tag sold">${t('Sold out')}</span>`:p.isNew?`<span class="card-tag">${t('New')}</span>`:'<span></span>';
    return `<article class="product-card od-tile flip-product-card" data-product-id="${p.id}" data-preview-color="${p.colors[0]}" style="--image-bg:#f1f2f0"><div class="card-media"><div class="card-tools">${status}<button class="icon-button card-wish" data-action="wish" data-id="${p.id}" aria-pressed="${saved}" aria-label="${esc(t('Add to wishlist')+': '+t(p.name))}">${icon('heart')}</button></div><div class="card-turn-scene"><div class="card-turn-inner"><div class="card-turn-front"><a class="card-photo" href="${esc(publicHref('/product/'+p.id,state.locale))}" data-product="${p.id}" data-product-color="${p.colors[0]}" aria-label="${esc(t(p.name))}">${productPhoto(p,p.colors[0],'loading="lazy"')}</a><button class="icon-button card-quick-open" data-action="card-flip" aria-haspopup="dialog" aria-expanded="false" aria-label="${esc(t('Add to cart')+': '+t(p.name))}">${icon('plus')}</button></div><div class="card-color-back" inert><div class="quick-purchase"><div class="quick-head"><span>${L('Обрати свій колір','Choose your color')}</span><button class="icon-button" data-action="card-flip" aria-label="${L('Повернути фото','Back to photo')}">${icon('close')}</button></div><label class="quick-size">${t('Size')}<select aria-label="${esc(t('Size')+': '+t(p.name))}" ${!available?'disabled':''}><option value="">${L('Оберіть розмір','Choose size')}</option>${p.sizes.map(size=>`<option value="${size}" ${sizeAvailable(p,size)?'':'disabled'}>${size}</option>`).join('')}</select></label><div class="quick-colors">${p.colors.map(c=>`<button data-action="quick-add" data-color="${c}" ${!available?'disabled':''} aria-label="${esc(t('Add to cart')+': '+t(p.name)+', '+t(c))}"><span class="color-dot" style="--swatch:${colors[c]}"></span><span>${t(c)}</span>${icon('plus')}</button>`).join('')}</div><p class="quick-feedback" role="status">${!p.stock?t('Sold out'):!available?L('Усе вже у кошику','All available units are in Cart'):L('Оберіть розмір і натисніть колір, щоб додати в кошик.','Choose a size, then click a color to add to Cart.')}</p></div></div></div></div></div><div class="card-body"><div class="card-meta"><span>${t(p.category)}</span></div><h3><a class="card-title" href="${esc(publicHref('/product/'+p.id,state.locale))}" data-product="${p.id}" data-product-color="${p.colors[0]}">${esc(t(p.name))}</a></h3><div class="card-bottom"><div class="card-price">${price(p.price)}</div><div class="swatches" role="group" aria-label="${t('Colors')}">${p.colors.map((c,i)=>`<button class="card-swatch" data-card-color="${c}" aria-pressed="${i===0}" aria-label="${esc(t(p.name)+': '+t(c))}" title="${t(c)}"><span style="--swatch:${colors[c]}"></span></button>`).join('')}</div><button class="mobile-color-summary" data-action="card-flip" aria-expanded="false" aria-label="${esc(t('Colors')+': '+p.colors.map(t).join(', '))}">${p.colors.map(c=>`<span style="--swatch:${colors[c]}" aria-hidden="true"></span>`).join('')}</button></div></div></article>`;
  }
  function renderRelatedProducts(p){
    const related=products.filter(item=>item.id!==p.id);
    return `<section class="product-related product-carousel" data-carousel data-carousel-key="related-${p.id}" role="region" aria-roledescription="${L('слайдер','carousel')}" aria-labelledby="related-title"><div class="section-head related-head"><h2 class="section-title" id="related-title">${L('Ще один погляд.','Another point of view.')}</h2><div class="related-actions">${routeLink('catalogue',L('Усі товари','All pieces'),'class="line-link"')}<div class="carousel-controls"><span class="carousel-position" data-carousel-status role="status" aria-live="polite" aria-atomic="true"></span><button class="icon-button carousel-arrow" data-carousel-prev aria-controls="related-track" aria-label="${L('Попередні товари','Previous products')}">${icon('left')}</button><button class="icon-button carousel-arrow" data-carousel-next aria-controls="related-track" aria-label="${L('Наступні товари','Next products')}">${icon('right')}</button></div></div></div><div class="product-grid product-carousel-track" id="related-track" data-carousel-track tabindex="0" aria-label="${L('Рекомендовані товари. Гортайте стрілками ліворуч і праворуч.','Suggested products. Use the left and right arrow keys to browse.')}">${related.map(item=>card(item,true)).join('')}</div></section>`;
  }
  function renderHome(){return window.CivisViews.home({products,pById,searchStrip,img,L,t,icon,card,currencyNote,routeLink,productPhoto,href:(path,facets)=>esc(publicHref(path,state.locale,facets))});}
  function matches(p){const f=state.filters,q=state.query.trim().toLocaleLowerCase();return (!q||[p.name,uk[p.name],p.category,uk[p.category],p.collection,uk[p.collection]].filter(Boolean).some(v=>v.toLocaleLowerCase().includes(q)))&&(!f.category.length||f.category.includes(p.category))&&(!f.collection.length||f.collection.includes(p.collection))&&(!f.size.length||f.size.some(s=>p.sizes.includes(s)))&&(!f.color.length||f.color.some(c=>p.colors.includes(c)))&&(!f.availability.length||f.availability.includes(p.stock?'in':'out'))&&(!f.new||p.isNew)&&(f.min===''||localMinor(p.price)>=Number(f.min)*100)&&(f.max===''||localMinor(p.price)<=Number(f.max)*100)}
  function filtered(){const list=products.filter(matches);if(state.sort==='low')list.sort((a,b)=>a.price-b.price);if(state.sort==='high')list.sort((a,b)=>b.price-a.price);if(state.sort==='name')list.sort((a,b)=>t(a.name).localeCompare(t(b.name),state.locale));return list}
  const filterCount=()=>Object.entries(state.filters).reduce((n,[k,v])=>n+(Array.isArray(v)?v.length:typeof v==='boolean'?Number(v):v!==''?1:0),0);
  function filterBlock(label,key,options){return `<div class="filter-block"><fieldset><legend>${esc(t(label))}</legend><div class="filter-options ${key==='color'?'filter-colors':''}">${options.map(o=>{const value=typeof o==='string'?o:o[0],name=typeof o==='string'?t(o):o[1];return `<label><input type="checkbox" data-filter="${key}" value="${esc(value)}" ${state.filters[key].includes(value)?'checked':''}>${key==='color'?`<span class="color-dot" style="--swatch:${colors[value]}" aria-hidden="true"></span>`:''}<span>${esc(name)}</span></label>`}).join('')}</div></fieldset></div>`}
  function priceBounds(){const maximum=Math.max(...products.map(p=>localMinor(p.price)/100)),step=state.locale==='uk'?500:50;return Math.ceil(maximum/step)*step;}
  function priceFilter(scope){
    const bound=priceBounds(),low=Number(state.filters.min)||0,high=state.filters.max===''?bound:Number(state.filters.max);
    return `<div class="filter-block price-filter"><fieldset><legend>${t('Price range')}</legend><div class="price-slider" style="--range-start:${low/bound*100}%;--range-end:${high/bound*100}%"><div class="price-slider-track" aria-hidden="true"></div><input type="range" min="0" max="${bound}" step="1" value="${low}" data-price-range="min" aria-label="${L('Мінімальна ціна','Minimum price')}" aria-valuetext="${esc(formatMoney(low*100))}"><input type="range" min="0" max="${bound}" step="1" value="${high}" data-price-range="max" aria-label="${L('Максимальна ціна','Maximum price')}" aria-valuetext="${esc(formatMoney(high*100))}"></div><div class="price-fields">${['min','max'].map(key=>`<label class="price-field" for="${scope}-${key}-price"><span>${key==='min'?L('Від','From'):L('До','To')}</span><div><input id="${scope}-${key}-price" type="number" min="0" max="${bound}" step="0.01" data-price="${key}" value="${esc(state.filters[key])}" placeholder="${key==='min'?0:bound}" inputmode="decimal"><span class="price-field-currency">${state.locale==='uk'?'₴':'$'}</span></div></label>`).join('')}</div></fieldset></div>`;
  }
  function syncPriceFilters(){const bound=priceBounds(),low=Number(state.filters.min)||0,high=state.filters.max===''?bound:Number(state.filters.max);document.querySelectorAll('.price-slider').forEach(slider=>{slider.style.setProperty('--range-start',low/bound*100+'%');slider.style.setProperty('--range-end',high/bound*100+'%');});document.querySelectorAll('[data-price-range]').forEach(input=>{const value=input.dataset.priceRange==='min'?low:high;input.value=value;input.setAttribute('aria-valuetext',formatMoney(value*100));});document.querySelectorAll('[data-price]').forEach(input=>{if(input!==document.activeElement)input.value=state.filters[input.dataset.price];});}
  function setPriceFilter(input,range=false){const key=range?input.dataset.priceRange:input.dataset.price,bound=priceBounds(),other=key==='min'?(state.filters.max===''?bound:Number(state.filters.max)):(Number(state.filters.min)||0);let value=input.value===''?'':Math.min(bound,Math.max(0,Number(input.value)||0));if(value!=='')value=key==='min'?Math.min(value,other):Math.max(value,other);state.filters[key]=value===''||(key==='min'&&value===0)||(key==='max'&&value===bound)?'':String(value);input.value=range?(key==='min'?(Number(state.filters.min)||0):(state.filters.max===''?bound:Number(state.filters.max))):state.filters[key];syncPriceFilters();updateResults();}
  function filterUI(scope='sidebar'){return `<div class="filter-head"><h2>${t('Filters')}</h2><button class="text-button" data-action="reset">${t('Reset')}</button></div><div class="filter-block"><fieldset><legend>${t('Size')}</legend><div class="size-filters">${[...new Set(products.flatMap(p=>p.sizes))].map(s=>`<button class="size-filter ${state.filters.size.includes(s)?'selected':''}" data-action="filter-size" data-value="${s}" aria-pressed="${state.filters.size.includes(s)}">${s}</button>`).join('')}</div></fieldset></div>${filterBlock('Availability','availability',[['in',`${t('In stock')} (${products.filter(p=>p.stock).length})`],['out',`${t('Sold out')} (${products.filter(p=>!p.stock).length})`]])}${filterBlock('Category','category',['Shirts','T-shirts','Jeans','Hoodies'])}${filterBlock('Colors','color',Object.keys(colors))}${priceFilter(scope)}${filterBlock('Collection','collection',['Men','Women','Kids'])}<div class="filter-block"><label class="od-row od-touch"><input type="checkbox" data-filter="new" ${state.filters.new?'checked':''}><span>${t('New arrivals only')}</span></label></div>`}
  function resultsMarkup(){const list=filtered();return list.length?`<div class="product-grid catalogue-grid">${list.map(item=>card(item)).join('')}</div>`:`<div class="empty"><h2>${t('No matching pieces')}</h2><p>${t('Try a different search or clear your filters.')}</p><button class="button" data-action="reset">${t('Reset')}</button></div>`}
  function resultCount(){return `${filtered().length} / ${products.length} ${L('товарів','pieces')}${state.query?` · “${esc(state.query)}”`:''}`}
  function activeFilters(){
    const items=[];
    for(const key of ['category','collection','size','color','availability'])for(const value of state.filters[key])items.push({key,value,label:key==='availability'?t(value==='in'?'In stock':'Sold out'):t(value)});
    if(state.filters.new)items.push({key:'new',value:'true',label:t('New arrivals only')});
    for(const key of ['min','max'])if(state.filters[key]!=='')items.push({key,value:state.filters[key],label:(key==='min'?L('Від','From'):L('До','To'))+' '+formatMoney(Number(state.filters[key])*100)});
    return items.map(x=>`<button class="active-filter" data-action="remove-filter" data-key="${x.key}" data-value="${esc(x.value)}" aria-label="${L('Прибрати фільтр','Remove filter')}: ${esc(x.label)}">${esc(x.label)}${icon('close')}</button>`).join('');
  }
  function catalogueHeading(){return state.filters.category.length===1?t(state.filters.category[0]):state.filters.collection.length===1?t(state.filters.collection[0]):state.filters.new?L('Новинки','New arrivals'):L('КОЛЕКЦІЇ','COLLECTIONS');}
  function renderCatalogue(){return window.CivisViews.catalogue({state,products,productPhoto,searchStrip,routeLink,t,L,icon,filterCount,filterUI,resultCount,currencyNote,resultsMarkup,esc,activeFilters,heading:catalogueHeading()});}
  function syncFilterControls(){
    document.querySelectorAll('[data-filter]').forEach(input=>{const value=state.filters[input.dataset.filter];input.checked=Array.isArray(value)?value.includes(input.value):Boolean(value);});
    document.querySelectorAll('[data-action=filter-size]').forEach(button=>{const selected=state.filters.size.includes(button.dataset.value);button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));});
    const query=$('#catalogue-query');if(query&&query.value!==state.query)query.value=state.query;syncPriceFilters();
  }
  function updateResults(){if(state.page!=='catalogue')return;queueMicrotask(()=>window.CivisReveal?.mount());history.replaceState(history.state,'',routeUrl());updatePageMetadata();const heading=$('.catalogue-heading h1');if(heading)heading.textContent=catalogueHeading();patchContents('#results',resultsMarkup());syncFilterControls();$('#result-count').innerHTML=resultCount();if($('#active-filters'))patchContents('#active-filters',activeFilters());const fb=$('.filter-toggle');if(fb)fb.innerHTML=`${icon('filter')}${t('Filters')} (${filterCount()})`;$$('[data-action=category]').forEach(b=>{const active=b.dataset.value==='All'?!state.filters.category.length:state.filters.category.includes(b.dataset.value);b.classList.toggle('selected',active);b.setAttribute('aria-pressed',active)});const apply=$('[data-action=apply-filters]');if(apply)apply.textContent=`${L('Показати','Show')} ${filtered().length} ${L('товарів','pieces')}`}
  function productPurchaseControls(p){
    state.qty=Math.max(1,Math.min(state.qty,remain(p)));
    if(!p.stock||!p.sizes.some(size=>sizeAvailable(p,size)))return `<div class="purchase-state"><button class="button full" data-purchase-primary="true" disabled>${t('Sold out')}</button></div>`;
    if(!remain(p))return `<div class="purchase-state"><p>${L(`Усі ${p.stock} од. цього товару вже у кошику. Змініть кількість або видаліть товар у кошику, щоб додати його знову.`,`All ${p.stock} available units of this product are in your cart. Adjust the quantity or remove it in Cart to add it again.`)}</p><button class="button dark full" data-action="cart" data-purchase-primary="true">${L('Перейти в кошик','Go to Cart')}</button></div>`;
    return `<label class="eyebrow quantity-label" for="product-quantity">${L('Кількість','Quantity')}</label><div class="purchase-row"><div class="quantity"><button class="icon-button" data-action="qty-minus" aria-label="${L('Зменшити кількість','Decrease quantity')}" ${state.qty<=1?'disabled':''}>${icon('minus')}</button><output id="product-quantity">${state.qty}</output><button class="icon-button" data-action="qty-plus" aria-label="${L('Збільшити кількість','Increase quantity')}" ${state.qty>=remain(p)?'disabled':''}>${icon('plus')}</button></div><button class="button dark" data-action="add" data-purchase-primary="true">${t('Add to cart')}</button></div>`;
  }
  function productStockText(p){
    if(!p.stock||!p.sizes.some(size=>sizeAvailable(p,size)))return t('Sold out');
    return remain(p)?`${t('In stock')} · ${L(`можна додати ${remain(p)} од.`,`you can add ${remain(p)} units`)}`:L(`У кошику: ${cartQty(p.id)} із ${p.stock} од.`,`In your cart: ${cartQty(p.id)} of ${p.stock} units`);
  }
  const galleryPositions=new Map();
  let productView='photo';
  function galleryItems(p){
    const media=window.CIVIS_MEDIA?.[p.id];
    if(media?.length){return [...media].sort((a,b)=>Number(b.color===state.color&&b.view==='front')-Number(a.color===state.color&&a.view==='front')).map(i=>({src:i.file,width:i.width,height:i.height,label:`${t(i.color)} / ${i.view==='back'?L('Вигляд ззаду','Back view'):L('Вигляд спереду','Front view')}`,demo:true}));}
    return [{src:imagePath(p.image),width:dimensions[p.image][0],height:dimensions[p.image][1],label:L('Оригінальне фото','Original photograph'),demo:false}];
  }
  function galleryCurrent(p){const items=galleryItems(p);return items[(galleryPositions.get(p.id)||0)%items.length];}
  function galleryImage(p,item,extra=''){return `<img ${imageAttrs(item.src,extra.includes('data-thumbnail')?'72px':'(min-width:1000px) 50vw, 100vw')} width="${item.width}" height="${item.height}" alt="${esc(t(p.name)+': '+item.label)}" ${extra}>`;}
  function renderProductGallery(p){
    const items=galleryItems(p),index=(galleryPositions.get(p.id)||0)%items.length,item=items[index];
    return `<section id="product-gallery" class="product-visual studio-gallery multi-gallery" aria-label="${t('Product views')}"><div class="visual-top"><span>CIVIS ATELIER / ${t(p.category)}</span><span>${String(index+1).padStart(2,'0')} / ${String(items.length).padStart(2,'0')}</span></div>
      <div class="gallery-image-frame"><button class="product-photo product-turn-button" data-action="product-flip" aria-pressed="false" aria-label="${L('Перевернути: інформація про виріб','Turn over for garment information')}"><span class="product-turn-inner"><span class="product-turn-front">${galleryImage(p,item,'fetchpriority="high"')}</span><span class="product-turn-back" aria-hidden="true"><span class="turn-kicker">CIVIS ATELIER / ${t(p.category)}</span><strong>${esc(t(p.name))}</strong><span class="turn-description">${esc(t(p.description))}</span><span class="turn-material"><b>${L('Кольори','Colors')}</b><span>${p.colors.map(t).join(' / ')}</span></span><span class="turn-sizes"><b>${t('Size')}</b><span>${p.sizes.join(' / ')}</span></span><span class="turn-return">${L('Натисніть, щоб повернутися до фото','Click to return to the photograph')}</span></span></span></button><div class="gallery-controls">${items.length>1?`<button class="icon-button gallery-arrow" data-action="gallery-prev" aria-label="${L('Попереднє фото','Previous photograph')}">${icon('left')}</button>`:''}${items.length>1?`<button class="icon-button gallery-arrow" data-action="gallery-next" aria-label="${L('Наступне фото','Next photograph')}">${icon('right')}</button>`:''}</div></div>
      <div class="gallery-bar"><p class="gallery-caption">${item.label}</p></div>
      <div class="gallery-thumbnails" role="group" aria-label="${L('Обрати фото','Choose photograph')}">${items.map((image,i)=>`<button class="gallery-thumbnail" data-action="gallery-thumb" data-index="${i}" aria-pressed="${index===i}" aria-label="${esc(`${i+1} / ${items.length}: ${image.label}`)}">${galleryImage(p,image,'loading="lazy" data-thumbnail')}</button>`).join('')}</div></section>`;
  }
  function moveGallery(direction,index,focusAction){
    const p=pById(state.product),items=galleryItems(p),current=galleryPositions.get(p.id)||0;
    productView='photo';
    galleryPositions.set(p.id,index===undefined?(current+direction+items.length)%items.length:index);
    patchElement('#product-gallery',renderProductGallery(p));window.CivisGarments?.mount();
    if(focusAction)restoreFocus(`[data-action="${focusAction}"]${focusAction==='gallery-thumb'?`[data-index="${galleryPositions.get(p.id)}"]`:''}`);
  }
  function renderProduct(){const p=pById(state.product),saved=state.wish.includes(p.id);return `${searchStrip()}<div class="product-page"><nav class="breadcrumbs" aria-label="${L('Навігаційний шлях','Breadcrumb')}">${routeLink('home',t('Home'))}<span>/</span>${routeLink('catalogue',t('Collections'))}<span>/</span><span>${esc(t(p.name))}</span></nav><div class="product-layout">${renderProductGallery(p)}<section class="product-info"><p class="eyebrow">${p.id==='techwear-hoodie'?L('СИЛУЕТ МІСТА / TECHWEAR','SHAPED BY THE CITY / TECHWEAR'):t(p.collection)+' / COLLECTION XIV'}</p><div class="product-title-row"><h1>${esc(t(p.name))}</h1><button class="icon-button" data-action="wish" data-id="${p.id}" aria-pressed="${saved}" aria-label="${esc(t(saved?'Remove from wishlist':'Add to wishlist'))}">${icon('heart')}</button></div><div class="price">${price(p.price)}</div><p class="product-description">${esc(t(p.description))}</p><fieldset class="variant-group"><legend>${t('Color')} — <strong>${t(state.color)}</strong></legend><div class="variant-options">${p.colors.map(c=>`<button class="variant ${state.color===c?'selected':''}" data-action="color" data-value="${c}" aria-pressed="${state.color===c}"><span class="color-dot" style="--swatch:${colors[c]}"></span>${t(c)}</button>`).join('')}</div>${p.colors.length>1?`<p class="photo-disclaimer">${L('Обраний колір показано на фото.','The selected color is shown in the photo.')}</p>`:''}</fieldset><fieldset class="variant-group"><legend>${t('Size')}${state.size?' — <strong>'+state.size+'</strong>':''}</legend><div class="variant-options">${p.sizes.map(s=>`<button class="variant ${state.size===s?'selected':''}" data-action="size" data-value="${s}" ${sizeAvailable(p,s)&&remain(p)?'':'disabled'} aria-pressed="${state.size===s}">${s}</button>`).join('')}</div></fieldset><div class="stock-line">${productStockText(p)}</div><div class="purchase-controls">${productPurchaseControls(p)}</div><p class="error" id="product-error" role="alert" hidden></p><div class="product-notes"><span>CIVIS ATELIER / XIV</span><span>${L('ПРОДУМАНИЙ СИЛУЕТ','A CONSIDERED SILHOUETTE')}</span></div><div class="details"><details open><summary>${t('Info')}</summary><p>${esc(t(p.description))}</p></details><details><summary>${L('Історія','Story')}</summary><p>${p.id==='techwear-hoodie'?t('Inspired by the movement of the city. Layered shapes, functional details and a bold point of view.'):t('Considered shapes. Expressive details. Your point of view.')}</p></details><details><summary>${L('Виробництво','Manufacturing')}</summary><p>${t('Exact fabric composition, production origin and care instructions are awaiting confirmation.')}</p></details><details><summary>${L('Пакування','Packaging')}</summary><p>${L('Деталі пакування ще не надано. Інформація потребує підтвердження перед запуском.','Packaging details have not been supplied and require confirmation before launch.')}</p></details></div></section></div>${renderRelatedProducts(p)}</div>`}
  function updatePageMetadata(){
    const query=Object.fromEntries(new URLSearchParams(location.search));if(state.page==='catalogue'){delete query.category;delete query.collection;delete query.new;if(state.filters.category.length===1)query.category=state.filters.category[0];if(state.filters.collection.length===1)query.collection=state.filters.collection[0];if(state.filters.new)query.new='1';if(state.query||state.filters.size.length||state.filters.color.length||state.filters.availability.length||state.filters.category.length>1||state.filters.collection.length>1||state.filters.min!==''||state.filters.max!=='')query.filtered='1';}
    applySeo(pageFacts({path:pagePath(),query,locale:state.locale,products,categories:window.CIVIS_CATEGORIES,pricing:window.CIVIS_PRICING,translations:uk,links:window.CIVIS_PUBLIC_LINKS,...window.CIVIS_SEO}));
  }
  function render(){window.CivisReveal?.beforeRender({page:state.page,product:state.product,locale:state.locale});updatePageMetadata();window.CivisGarments?.destroy();window.CivisCarousels?.capture();renderHeader();patchContents('#main',state.page==='home'?renderHome():state.page==='catalogue'?renderCatalogue():state.page==='product'?renderProduct():window.CivisAccount.render(state.page,{locale:state.locale,icon,navigate,refresh:()=>render()}));renderFooter();renderPurchaseDock();window.CivisCarousels?.mount();window.CivisCampaign?.mount(state.locale);window.CivisGarments?.mount();try{parent.postMessage({civis:'page',page:state.page,product:state.page==='product'?state.product:null},'*')}catch{}}
  let historyReady=false, restoringHistory=false, scrollTimer;
  const pagePath=()=>state.page==='home'?'/':state.page==='product'?'/product/'+encodeURIComponent(state.product):'/'+state.page;
  if(window.CIVIS_SSR){window.CivisSsr={render({path,locale,facets={}}){state.locale=locale;state.page=path==='/catalogue'?'catalogue':path.startsWith('/product/')?'product':'home';if(state.page==='product'){state.product=path.split('/')[2];state.color=pById(state.product).colors[0];}state.filters.category=facets.category?[facets.category]:[];state.filters.collection=facets.collection?[facets.collection]:[];state.filters.new=Boolean(facets.new);renderHeader();renderFooter();return{header:$('#header').innerHTML,footer:$('#footer').innerHTML,main:state.page==='home'?renderHome():state.page==='catalogue'?renderCatalogue():renderProduct()};}};return;}
  const routeUrl=()=>publicHref(pagePath(),state.locale,state.page==='catalogue'?{category:state.filters.category.length===1?state.filters.category[0]:undefined,collection:state.filters.collection.length===1?state.filters.collection[0]:undefined,new:state.filters.new}:{});
  function rememberPage(){
    if(!historyReady||restoringHistory||location.pathname!==pagePath())return;
    const top=document.body.style.position==='fixed'?Math.max(0,-parseFloat(document.body.style.top)||0):window.scrollY;
    const snapshot={page:state.page,product:state.product,color:state.color,size:state.size,qty:state.qty,query:state.query,sort:state.sort,filters:state.filters,locale:state.locale,top,gallery:galleryPositions.get(state.product)};
    history.replaceState({...history.state,civisPage:JSON.parse(JSON.stringify(snapshot))},'');
  }
  function restorePage(){
    const languageQuery=new URLSearchParams(location.search);if(!historyReady&&!languageQuery.has('lang')&&state.locale==='en'){languageQuery.set('lang','en');history.replaceState(history.state,'',location.pathname+'?'+languageQuery+location.hash);}state.locale=languageQuery.get('lang')==='en'?'en':'uk';
    const page=location.pathname.split('/')[1]||'home';
    if(['login','register','forgot'].includes(page)){
      if(!historyReady)render();
      window.CivisAccount.open(page,{locale:state.locale,history:false});return;
    }
    const saved=history.state?.civisPage;
    // Clerk owns the hash routes inside the account page.
    if(page===state.page&&location.hash&&historyReady)return;
    restoringHistory=true;
    document.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());
    state.drawer=null;
    state.page=['home','catalogue','product','account'].includes(page)?page:'home';
    if(saved?.page===state.page){
      for(const key of ['product','color','size','qty','query','sort'])if(saved[key]!==undefined)state[key]=saved[key];
      state.filters={...emptyFilters(),...saved.filters};
      if(saved.locale!==state.locale)for(const key of ['min','max'])state.filters[key]='';
      if(saved.gallery!==undefined)galleryPositions.set(state.product,saved.gallery);
    }
    if(state.page==='product'){
      const p=pById(decodeURIComponent(location.pathname.split('/')[2]||''));
      if(p){state.product=p.id;if(!p.colors.includes(state.color))state.color=p.colors[0];}else state.page='catalogue';
    }
    if(state.page==='catalogue'&&!saved){const query=new URLSearchParams(location.search);state.filters=emptyFilters();if(window.CIVIS_CATEGORIES.includes(query.get('category')))state.filters.category=[query.get('category')];if(['Men','Women','Kids'].includes(query.get('collection')))state.filters.collection=[query.get('collection')];state.filters.new=query.get('new')==='1';}
    const needsLogin=state.page==='account'&&window.CivisAccount.guard('account')!=='account';
    if(needsLogin){state.page='home';history.replaceState({},'','/');}
    render();
    const top=saved?.page===state.page?saved.top||0:0;
    window.scrollTo({top,behavior:'instant'});
    requestAnimationFrame(()=>{window.scrollTo({top,behavior:'instant'});restoringHistory=false;rememberPage();if(needsLogin)window.CivisAccount.open('login',{locale:state.locale});});
  }
  function navigate(page,{product,color,newOnly,category,collection,back=false,resetFilters=false,query}={}){
    if(!['home','catalogue','product','login','register','forgot','account'].includes(page))return;
    rememberPage();const previousPath=pagePath();
    page=window.CivisAccount.guard(page);
    state.scroll[state.page]=window.scrollY;closeDrawer();
    if(resetFilters){state.query='';state.filters=emptyFilters();}
    if(query!==undefined)state.query=query;
    if(product){const p=pById(product);if(!p)return;state.product=p.id;state.color=p.colors.includes(color)?color:p.colors[0];galleryPositions.delete(p.id);state.size='';state.qty=1;}
    else if(page==='product'&&state.page!=='product'){const p=pById('techwear-hoodie')||products[0];state.product=p.id;state.color=p.colors[0];galleryPositions.delete(p.id);state.size='';state.qty=1;}
    if(newOnly!==undefined)state.filters.new=newOnly;if(category)state.filters.category=[category];if(collection)state.filters.collection=[collection];
    state.page=page;
    if(pagePath()!==previousPath||resetFilters||category||collection||query!==undefined)history.pushState({},'',routeUrl());
    render();window.scrollTo({top:back?(state.scroll[page]||0):0,behavior:'instant'});rememberPage();$('#main').focus({preventScroll:true});
  }
  let drawerTrigger=null;
  function openDrawer(type){if(type==='search')searchDraft=state.query;if($('#drawer').open)$('#drawer').close();state.drawer=type;drawerTrigger=document.activeElement;renderDrawer();$('#drawer').showModal();const target=type==='search'?$('#search-input'):$('#drawer [data-action=close]');target?.focus();}
  function closeDrawer(){if($('#drawer').open)$('#drawer').close();state.drawer=null;}
  $('#drawer').addEventListener('close',()=>{if($('#drawer').open)return;state.drawer=null;const fallback=$('.cart-control');(drawerTrigger?.isConnected?drawerTrigger:fallback)?.focus({preventScroll:true})});
  function stockMessage(p){
    const left=remain(p);
    if(!left)return L(`У кошику всі ${p.stock} од. цього товару.`, `All ${p.stock} available units of this product are in your cart.`);
    return L(`Ще можна додати: ${left} од. цього товару.`, `You can add ${left} more units of this product.`);
  }
  function cartItem(x,index){
    const p=pById(x.id),limited=!remain(p),noteId=`cart-stock-${index}`;
    return `<article class="cart-item" data-cart-key="${esc(JSON.stringify([x.id,x.color,x.size]))}">${productPhoto(p,x.color)}<div><h3><a href="${esc(publicHref('/product/'+p.id,state.locale))}" data-product="${p.id}">${esc(t(p.name))}</a></h3><p class="variant-caption">${t(x.color)} / ${x.size}</p><div class="quantity"><button class="icon-button" data-action="cart-minus" data-index="${index}" aria-label="${L('Зменшити кількість','Decrease quantity')}: ${esc(t(p.name))}" ${x.qty<=1?'disabled':''}>${icon('minus')}</button><output>${x.qty}</output><button class="icon-button" data-action="cart-plus" data-index="${index}" aria-label="${L('Збільшити кількість','Increase quantity')}: ${esc(t(p.name))}" aria-describedby="${noteId}" ${limited?'disabled':''}>${icon('plus')}</button></div><p class="cart-stock-note ${limited?'stock-limit':''}" id="${noteId}">${stockMessage(p)}</p><div class="cart-item-footer"><div class="price">${price(p.price,x.qty)}</div><button class="text-button" data-action="remove-cart" data-index="${index}">${L('Видалити','Remove')}</button></div></div></article>`;
  }
  function integration(topic){const copy={account:[L('Акаунт — наступний етап','Account — future integration'),L('Вхід, реєстрація, відновлення пароля, профіль, адреси та історія замовлень будуть підключені до справжнього магазину. У цьому прев’ю особисті дані не збираються.','Sign in, registration, password reset, profile, addresses and order history will connect to the real store. This preview collects no personal data.')],checkout:[L('Оформлення — наступний етап','Checkout — future integration'),L('Кошик збережено у прев’ю. Оформлення замовлення та оплата тут не підключені.','Your preview cart is retained. Order creation and payment are not connected here.')],contact:[L('Контакти','Contact'),L('Підтверджені контакти магазину ще не надано.','Confirmed store contact details have not been supplied.')],shipping:[t('Shipping & returns'),L('Умови доставки й повернення потрібно підтвердити у власника перед запуском.','Delivery and return policies require confirmation from the owner before launch.')],privacy:[L('Конфіденційність','Privacy'),L('Це локальне прев’ю. Кошик та обране можуть зберігатися лише у вашому браузері.','This is a local preview. Cart and wishlist preferences may be stored in your browser only.')],terms:[L('Умови магазину','Store terms'),L('Остаточні умови магазину ще не надано. Реальні замовлення та платежі у прев’ю недоступні.','Final store terms have not been supplied. Real orders and payments are unavailable in this preview.')]};const [title,body]=copy[topic]||copy.account;return `<div class="integration"><h3>${title}</h3><p>${body}</p>${topic==='checkout'?`<p class="flow">${L('Контактні дані · Доставка · Оплата · Підтвердження замовлення','Contact information · Shipping · Payment · Order confirmation')}</p><p>${L('Актуальний курс, ціни й залишки перевірятиме справжній магазин. Жодних списань коштів тут немає.','The real store will verify the current exchange rate, prices and stock. No money moves here.')}</p>`:''}</div><button class="button full drawer-action" data-action="close">${L('Повернутися','Back to browsing')}</button>`}
  function renderDrawer(){let title='',body='';const type=state.drawer;
    if(type==='menu'){title=L('Навігація','Navigation');body=`<nav class="drawer-nav">${routeLink('home',t('Home'))}${routeLink('catalogue',t('Collections'))}${routeLink('catalogue',t('New'),'data-new="true"')}</nav><h3 class="drawer-subtitle">${t('Categories')}</h3><div class="od-cluster">${['Shirts','T-shirts','Jeans','Hoodies'].map(c=>routeLink('catalogue',t(c),`class="chip" data-category="${c}"`)).join('')}</div><h3 class="drawer-subtitle">${t('Collection')}</h3><div class="od-cluster">${['Men','Women','Kids'].map(c=>routeLink('catalogue',t(c),`class="chip" data-collection="${c}"`)).join('')}</div><h3 class="drawer-subtitle">${L('Ваш простір','Your space')}</h3><div class="drawer-nav"><a href="#wishlist" data-action="wishlist">${t('Wishlist')} (${state.wish.length}) ${icon('heart')}</a><a href="#account" data-action="account">${t('My account')} ${icon('user')}</a></div><button class="text-button drawer-action" data-action="locale">${state.locale==='uk'?'English / USD':'Українська / UAH'}</button>`;}
    else if(type==='filters'){title=t('Filters');body=`${filterUI('drawer')}<button class="button dark full drawer-action" data-action="apply-filters">${L('Показати','Show')} ${filtered().length} ${L('товарів','pieces')}</button>`;}
    else if(type==='search'){title=t('Search');body=`<label class="search-label" for="search-input">${t('Search products')}</label><div class="search-form"><input type="search" id="search-input" autocomplete="off" value="${esc(searchDraft)}"><button class="icon-button" data-action="search-submit" aria-label="${t('Search')}"></button></div><div id="search-results">${searchResults()}</div><button class="button full drawer-action" data-action="search-submit">${t('View all products')}</button>`;}
    else if(type==='wishlist'){title=t('Wishlist');const list=products.filter(p=>state.wish.includes(p.id));body=list.length?`<div class="product-grid">${list.map(item=>card(item)).join('')}</div>`:`<div class="empty"><h2>${t('A place for your favorites')}</h2><p>${t('Save pieces you love with the heart on each product page.')}</p>${routeLink('catalogue',t('Explore the collection'),'class="button"')}</div>`;}
    else if(type==='cart'){title=`${t('Cart')} (${cartCount()})`;const total=state.cart.reduce((sum,x)=>sum+localMinor(pById(x.id).price)*x.qty,0);body=state.cart.length?`${state.cart.map(cartItem).join('')}<div class="cart-summary"><div class="total"><span>${L('Разом','Subtotal')}</span><div>${priceLocal(total)}</div></div><p>${L('Доставка й податки потребують перевірки у справжньому магазині.','Shipping and tax require verification in the real store.')}</p><button class="button dark full drawer-action" data-action="checkout">${L('Оформлення · майбутня інтеграція','Checkout · future integration')}</button><button class="text-button drawer-action" data-action="close">${t('Continue shopping')}</button></div>`:`<div class="empty"><h2>${t('Your cart is waiting')}</h2><p>${t('Discover considered pieces for your everyday wardrobe.')}</p>${routeLink('catalogue',t('Explore the collection'),'class="button"')}</div>`;}
    else{title=type==='checkout'?L('Оформлення','Checkout'):type==='account'?t('My account'):L('Інформація','Information');body=integration(type);}
    $('#drawer-title').textContent=title;patchContents('#drawer-body',body);
    const footer=$('#drawer-footer');footer.replaceChildren();
    const pinned=type==='filters'?$('#drawer-body [data-action=apply-filters]'):type==='cart'?$('#drawer-body .cart-summary'):null;
    if(pinned)footer.append(pinned);footer.hidden=!pinned;
    $('#drawer').setAttribute('data-kind',type);

  }
  function searchResults(){const q=searchDraft.trim().toLocaleLowerCase(),list=q?products.filter(p=>[p.name,uk[p.name],p.category,uk[p.category],p.collection,uk[p.collection]].filter(Boolean).some(v=>v.toLocaleLowerCase().includes(q))):products.slice(0,4);return `<p class="drawer-subtitle">${q?`${list.length} ${L('результатів','results')}`:L('З колекції','From the collection')}</p>${list.length?list.map(p=>`<a class="search-result" href="${esc(publicHref('/product/'+p.id,state.locale))}" data-product="${p.id}">${productPhoto(p,p.colors[0])}<div><h3>${esc(t(p.name))}</h3><div class="price">${price(p.price)}</div></div></a>`).join(''):`<p>${t('No matching pieces')}</p>`}`}
  function submitSearch(){navigate('catalogue',{resetFilters:true,query:searchDraft});}
  function renderPurchaseDock(){
    const dock=$('#purchase-dock');
    if(state.page!=='product'){dock.hidden=true;document.body.classList.remove('has-purchase-dock');return;}
    const p=pById(state.product),inCart=p.stock>0&&!remain(p);
    const action=!p.stock?'dock-browse':inCart?'cart':state.size?'dock-add':'dock-select';
    dock.setAttribute('aria-label',L('Швидке додавання в кошик','Quick add to cart'));
    dock.innerHTML=`<div class="dock-copy"><span class="dock-name">${esc(t(p.name))}</span><span class="dock-price">${esc(money(p.price))}${state.size?' / '+state.size:''}</span></div><button class="button dark" ${!p.stock?'disabled':`data-action="${action}"`}>${!p.stock?t('Sold out'):inCart?L('До кошика','Go to Cart'):state.size?t('Add to cart'):L('Обрати розмір','Choose size')}</button>`;
    updatePurchaseDock();
  }
  function updatePurchaseDock(){
    const dock=$('#purchase-dock'),button=$('[data-purchase-primary]'),info=$('.product-info');
    if(!dock||!button||!info||state.page!=='product'||innerWidth>600){if(dock)dock.hidden=true;document.body.classList.remove('has-purchase-dock');return;}
    const r=button.getBoundingClientRect(),shown=info.getBoundingClientRect().top<innerHeight*.7&&(r.top>=innerHeight||r.bottom<=0);
    dock.hidden=!shown;document.body.classList.toggle('has-purchase-dock',shown);
  }
  let dockFrame=0;
  function scheduleDock(){if(!dockFrame)dockFrame=requestAnimationFrame(()=>{dockFrame=0;updatePurchaseDock()});}
  window.addEventListener('scroll',scheduleDock,{passive:true});window.addEventListener('resize',scheduleDock,{passive:true});
  function restoreFocus(selector){const node=$(selector);if(!node||node.disabled)return false;node.focus({preventScroll:true});return true;}
  function refreshProduct(action,value){
    const p=pById(state.product);
    if(action==='color')patchElement('#product-gallery',renderProductGallery(p));
    for(const group of document.querySelectorAll('.product-info .variant-group')){
      const buttons=group.querySelectorAll('[data-action=color],[data-action=size]');if(!buttons.length)continue;
      const kind=buttons[0].dataset.action,current=state[kind];
      buttons.forEach(button=>{const selected=button.dataset.value===current;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));});
      const legend=group.querySelector('legend');patchContents(legend,kind==='color'?t('Color')+' — <strong>'+esc(t(current))+'</strong>':t('Size')+(current?' — <strong>'+esc(current)+'</strong>':''));
    }
    patchContents('.stock-line',productStockText(p));
    if(action==='qty-plus'||action==='qty-minus'){
      $('#product-quantity').textContent=state.qty;
      $('.purchase-row [data-action=qty-minus]').disabled=state.qty<=1;
      $('.purchase-row [data-action=qty-plus]').disabled=state.qty>=remain(p);
    }else if(action==='add'){
      const controls=$('.product-info .purchase-controls');patchContents(controls,productPurchaseControls(p));renderHeader();
      document.querySelectorAll('.product-info [data-action=size]').forEach(button=>button.disabled=!remain(p)||!sizeAvailable(p,button.dataset.value));
    }
    const error=$('#product-error');if(state.size&&error)error.hidden=true;
    renderPurchaseDock();rememberPage();
    if(!restoreFocus(`[data-action="${action}"]${value?`[data-value="${value}"]`:''}`))restoreFocus('[data-purchase-primary]');
  }
  let toastTimer;
  function toast(){clearTimeout(toastTimer);const notice=$('#toast'),dialog=document.activeElement?.closest('dialog[open]')||$('dialog[open]');(dialog||document.body).append(notice);notice.innerHTML=`<div class="od-row">${icon('check')}<p>${t('Added to your cart.')}</p><button data-action="cart">${t('Cart')}</button><button class="icon-button" data-action="close-toast" aria-label="${t('Close notification')}">${icon('close')}</button></div>`;notice.hidden=false;toastTimer=setTimeout(()=>notice.hidden=true,5000)}
  document.addEventListener('close',event=>{const notice=$('#toast');if(event.target.matches?.('dialog')&&!event.target.open&&event.target.contains(notice)){clearTimeout(toastTimer);notice.hidden=true;document.body.append(notice);}},true);
  function reset(){state.query='';state.filters={category:[],collection:[],size:[],color:[],availability:[],new:false,min:'',max:''};if(state.drawer==='filters'){renderDrawer();updateResults();restoreFocus('#drawer [data-action=reset]')}else{updateResults();restoreFocus('[data-action=category]')}}
  document.addEventListener('click',e=>{
    const b=e.target.closest('button,a');if(!b)return;
    if(b.matches('#product-gallery .product-photo')&&performance.now()<gallerySwipeUntil){e.preventDefault();return;}
    if(b.dataset.product){e.preventDefault();navigate('product',{product:b.dataset.product,color:b.dataset.productColor});return;}
    if(b.dataset.page){e.preventDefault();navigate(b.dataset.page,{resetFilters:b.dataset.reset==='true'||b.dataset.new==='true'||Boolean(b.dataset.category||b.dataset.collection),newOnly:b.dataset.new==='true'?true:undefined,category:b.dataset.category,collection:b.dataset.collection,back:b.dataset.page==='catalogue'&&state.page==='product'});return;}
    const action=b.dataset.action;if(!action)return;e.preventDefault();const p=pById(state.product);
    if(action==='product-flip'){const turned=b.classList.toggle('is-turned');b.setAttribute('aria-pressed',turned);b.querySelector('.product-turn-front').setAttribute('aria-hidden',turned);b.querySelector('.product-turn-back').setAttribute('aria-hidden',!turned);return;}
    if(action==='card-flip'){const card=b.closest('.product-card'),turned=card.classList.toggle('colors-open');b.blur();card.querySelector('.card-turn-front').inert=turned;card.querySelector('.card-color-back').inert=!turned;card.querySelectorAll('[data-action=card-flip]').forEach(button=>button.setAttribute('aria-expanded',turned));if(e.detail===0){const target=turned?card.querySelector('.quick-head button'):card.querySelector('.card-photo');target?.focus({preventScroll:true});}return;}
    if(action==='quick-add'){
      const card=b.closest('.product-card'),item=pById(card.dataset.productId),size=card.querySelector('.quick-size select'),message=card.querySelector('.quick-feedback'),color=b.dataset.color;
      if(!sizeAvailable(item,size.value)){message.textContent=t('Choose a size before adding to your cart.');size.setAttribute('aria-invalid','true');size.focus({preventScroll:true});return;}
      size.removeAttribute('aria-invalid');if(!remain(item)){message.textContent=t('You have added all available stock.');return;}
      const existing=state.cart.find(x=>x.id===item.id&&x.color===color&&x.size===size.value);if(existing)existing.qty++;else state.cart.push({id:item.id,color,size:size.value,qty:1});save();renderHeader();toast();
      message.textContent=L('Додано: ','Added: ')+t(color)+' / '+size.value;$('#feedback').textContent=t('Added to your cart.')+' '+t(item.name);queueMicrotask(()=>window.dispatchEvent(new CustomEvent('civis:cart-added',{detail:{product:item.id}})));
      if(!remain(item))document.querySelectorAll('.product-card').forEach(c=>{if(c.dataset.productId===item.id)c.querySelectorAll('[data-action=quick-add]').forEach(button=>button.disabled=true)});
      return;
    }
    if(action==='product-view'){productView=b.dataset.value;$('#product-gallery').outerHTML=renderProductGallery(p);window.CivisGarments?.mount();restoreFocus(`[data-action="product-view"][data-value="${productView}"]`);return;}
    if(action==='model-left'||action==='model-right'){window.CivisGarments?.rotate(action==='model-left'?-.4:.4);return;}
    if(action==='model-reset'){window.CivisGarments?.reset();return;}
    if(action==='gallery-prev'||action==='gallery-next'||action==='gallery-thumb'){moveGallery(action==='gallery-prev'?-1:1,action==='gallery-thumb'?Number(b.dataset.index):undefined,action);return;}
    if(action==='dock-select'){const size=$('[data-action=size]');size?.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});size?.focus({preventScroll:true});return;}
    if(action==='dock-browse'){navigate('catalogue');return;}
    if(action==='dock-add'){$('.purchase-row [data-action=add]')?.click();return;}
    if(action==='account'){navigate('account');return;}
    if(action==='menu'||action==='search'||action==='filters'||action==='wishlist'||action==='cart'||action==='account'||action==='checkout'){if(action==='cart')$('#toast').hidden=true;openDrawer(action);return;}
    if(action==='close'){closeDrawer();return;}
    if(action==='info'){openDrawer(b.dataset.topic);return;}
    if(action==='apply-filters'){closeDrawer();if(state.page==='catalogue'){updateResults();restoreFocus('[data-action=filters]')}return;}
    if(action==='locale'){const type=state.drawer;const factor=state.locale==='uk'?1/window.CIVIS_PRICING.usdToUah:window.CIVIS_PRICING.usdToUah;for(const key of ['min','max'])if(state.filters[key]!=='')state.filters[key]=String(Math.round(Number(state.filters[key])*factor*100)/100);state.locale=state.locale==='uk'?'en':'uk';history.replaceState(history.state,'',routeUrl());save();const y=window.scrollY;render();window.scrollTo({top:y,behavior:'instant'});if(type){state.drawer=type;renderDrawer();restoreFocus('#drawer [data-action=close]')}else restoreFocus('[data-action=locale]');return;}
    if(action==='wish'){const id=b.dataset.id;state.wish=state.wish.includes(id)?state.wish.filter(x=>x!==id):[...state.wish,id];save();$('#feedback').textContent=(state.wish.includes(id)?L('Збережено в обраному','Saved to wishlist'):L('Прибрано з обраного','Removed from wishlist'))+': '+t(pById(id).name);renderHeader();$$(`[data-action=wish][data-id="${id}"]`).forEach(node=>{node.setAttribute('aria-pressed',state.wish.includes(id));node.setAttribute('aria-label',t(state.wish.includes(id)?'Remove from wishlist':'Add to wishlist')+': '+t(pById(id).name))});if(state.drawer==='wishlist'){renderDrawer();restoreFocus(`#drawer [data-id="${id}"]`);if(!document.activeElement?.closest('#drawer'))restoreFocus('#drawer [data-action=close]')}return;}
    if(action==='remove-filter'){
      const key=b.dataset.key,value=b.dataset.value;
      if(Array.isArray(state.filters[key]))state.filters[key]=state.filters[key].filter(x=>x!==value);
      else state.filters[key]=key==='new'?false:'';
      updateResults();restoreFocus('#catalogue-query');return;
    }
    if(action==='category'){state.filters.category=b.dataset.value==='All'?[]:[b.dataset.value];updateResults();restoreFocus(`[data-action=category][data-value="${b.dataset.value}"]`);return;}
    if(action==='reset'){reset();return;}
    if(action==='filter-size'){const value=b.dataset.value;state.filters.size=state.filters.size.includes(value)?state.filters.size.filter(x=>x!==value):[...state.filters.size,value];b.classList.toggle('selected',state.filters.size.includes(value));b.setAttribute('aria-pressed',state.filters.size.includes(value));updateResults();return;}
    if(action==='size'&&!sizeAvailable(p,b.dataset.value))return;
    if(action==='color'||action==='size'){if(action==='color')galleryPositions.delete(p.id);state[action]=b.dataset.value;refreshProduct(action,b.dataset.value);return;}
    if(action==='qty-plus'||action==='qty-minus'){state.qty=Math.max(1,Math.min(remain(p),state.qty+(action==='qty-plus'?1:-1)));refreshProduct(action);return;}
    if(action==='add'){if(!state.size||!sizeAvailable(p,state.size)){$('#product-error').textContent=t('Choose a size before adding to your cart.');$('#product-error').hidden=false;restoreFocus('[data-action=size]');return;}if(remain(p)<state.qty){$('#product-error').textContent=t('You have added all available stock.');$('#product-error').hidden=false;return;}const existing=state.cart.find(x=>x.id===p.id&&x.color===state.color&&x.size===state.size);if(existing)existing.qty+=state.qty;else state.cart.push({id:p.id,color:state.color,size:state.size,qty:state.qty});save();state.qty=1;refreshProduct('add');toast();return;}
    if(action==='cart-plus'||action==='cart-minus'||action==='remove-cart'){const index=Number(b.dataset.index),x=state.cart[index];if(!x)return;if(action==='remove-cart')state.cart.splice(index,1);else if(action==='cart-plus'&&remain(pById(x.id))>0)x.qty++;else if(action==='cart-minus'&&x.qty>1)x.qty--;save();renderHeader();if(state.page==='product')refreshProduct('add');renderDrawer();restoreFocus(`#drawer [data-action="${action}"][data-index="${index}"]`);if(!document.activeElement?.closest('#drawer'))restoreFocus('#drawer [data-action=close]');return;}
    if(action==='search-submit'){submitSearch();return;}
    if(action==='approach'){if(state.page!=='home')navigate('home');$('#approach').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});return;}
    if(action==='close-toast'){$('#toast').hidden=true;return;}
    if(action==='zoom'){const item=galleryCurrent(p);$('#zoom-title').textContent=t(p.name);$('#zoom-body').innerHTML=`${galleryImage(p,item)}<p>${item.demo?L('Згенероване тестове зображення. Не фактична зйомка товару.','Generated test image. Not actual product photography.'):L('Оригінальне надане фото.','Original supplied photograph.')}</p>`;$('#zoom').showModal();$('#zoom [data-action=close-zoom]').focus();return;}
    if(action==='close-zoom'){$('#zoom').close();restoreFocus('[data-action=zoom]');}
  });
  document.addEventListener('keydown',e=>{
    if(!e.target.closest('[data-garment-main]')&&e.target.closest('#product-gallery')&&galleryItems(pById(state.product)).length>1&&['ArrowLeft','ArrowRight'].includes(e.key)){
      e.preventDefault();moveGallery(e.key==='ArrowLeft'?-1:1,undefined,e.target.dataset.action||'gallery-next');
    }
  });
  let galleryTouch=null,gallerySwipeUntil=0;
  document.addEventListener('touchstart',e=>{const touch=e.changedTouches[0];galleryTouch=null;if(touch.clientX>24&&touch.clientX<innerWidth-24&&e.target.closest('#product-gallery .product-photo'))galleryTouch={x:touch.clientX,y:touch.clientY};},{passive:true});
  document.addEventListener('touchend',e=>{if(!galleryTouch)return;const dx=e.changedTouches[0].clientX-galleryTouch.x,dy=e.changedTouches[0].clientY-galleryTouch.y;galleryTouch=null;if(e.target.closest('#product-gallery .product-photo')&&Math.abs(dx)>48&&Math.abs(dx)>Math.abs(dy)*1.5){gallerySwipeUntil=performance.now()+500;moveGallery(dx<0?1:-1);}}, {passive:true});
  document.addEventListener('change',e=>{const el=e.target;if(el.matches('[data-filter]')){const key=el.dataset.filter;if(key==='new')state.filters.new=el.checked;else state.filters[key]=el.checked?[...new Set([...state.filters[key],el.value])]:state.filters[key].filter(v=>v!==el.value);updateResults();}if(el.matches('[data-price]'))setPriceFilter(el);if(el.id==='sort'){state.sort=el.value;updateResults();}});
  document.addEventListener('input',e=>{if(e.target.matches('[data-price-range]')){setPriceFilter(e.target,true);return;}if(e.target.id==='catalogue-query'){state.query=e.target.value;updateResults();}if(e.target.id==='search-input'){searchDraft=e.target.value;$('#search-results').innerHTML=searchResults();}});
  document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='search-input'){e.preventDefault();submitSearch();}else if(e.key==='/'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!e.target.matches('input,textarea,select,[contenteditable=true]')&&!$('#drawer').open&&!$('#zoom').open){e.preventDefault();openDrawer('search');}});
  $('#drawer').addEventListener('click',e=>{if(e.target===$('#drawer')){const r=$('#drawer').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right)closeDrawer();}});
  window.addEventListener('message',e=>{
    if(e.source!==parent||e.data?.civis!=='navigate')return;
    const {page,product}=e.data;
    // A repeated preview notification must not rebuild the current page or reset scroll.
    if(page===state.page&&(!product||product===state.product))return;
    navigate(page,{product});
  });
  window.CivisStore={navigate,render,rememberPage,refreshHeader:renderHeader};
  history.scrollRestoration='manual';
  window.addEventListener('popstate',restorePage);
  window.addEventListener('scroll',()=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(rememberPage,120);},{passive:true});
  window.addEventListener('pagehide',rememberPage);
  for(const event of ['click','input','change'])document.addEventListener(event,()=>queueMicrotask(rememberPage));
  restorePage();historyReady=true;if(['#wishlist','#cart'].includes(location.hash))openDrawer(location.hash.slice(1));
})();
