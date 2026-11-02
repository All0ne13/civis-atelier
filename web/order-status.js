(()=>{
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const stages=['processing','confirmed','shipped','delivered'],labels={uk:['В обробці','Підтверджено','Відправлено','Отримано'],en:['Processing','Confirmed','Shipped','Delivered']};
 window.CivisOrderStatus={label:(status,locale='uk')=>(labels[locale]||labels.uk)[Math.max(0,stages.indexOf(status))],render(order,locale='uk'){
  const uk=locale==='uk',status=order.fulfillment_status||'processing',index=Math.max(0,stages.indexOf(status)),dates=[order.created_at,order.confirmed_at,order.shipped_at,order.delivered_at];
  return `<section class="order-progress" aria-label="${uk?'Обробка замовлення':'Order progress'}"><h2>${uk?'Статус замовлення':'Order status'}</h2><ol>${stages.map((stage,i)=>`<li class="${i<=index?'is-complete':''}" ${i===index?'aria-current="step"':''}><span class="order-step-number">${i<index?'✓':i+1}</span><span>${labels[uk?'uk':'en'][i]}${dates[i]?`<small>${esc(new Date(dates[i]).toLocaleString(uk?'uk-UA':'en-GB'))}</small>`:''}</span></li>`).join('')}</ol>${order.tracking_number?`<div class="order-tracking"><span>${uk?'Нова пошта · номер накладної':'Nova Poshta · tracking number'}</span><strong>${esc(order.tracking_number)}</strong></div>`:''}</section>`;
 }};
})();
