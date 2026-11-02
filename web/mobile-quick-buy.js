(()=>{
 let active;
 const ns='http://www.w3.org/2000/svg';
 const bagIcon='<svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 8h14l1 13H4L5 8Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/></svg>';
 const point=(radius,angle)=>{const radians=angle*Math.PI/180;return[50+radius*Math.cos(radians),50+radius*Math.sin(radians)];};
 function sectorPath(start,end){
  const a=point(50,start),b=point(50,end),c=point(18,end),d=point(18,start),large=end-start>180?1:0;
  return `M${a} A50 50 0 ${large} 1 ${b} L${c} A18 18 0 ${large} 0 ${d} Z`;
 }
 function close(focus=false){
  if(!active)return;const{panel,card,trigger,observer}=active;active=null;observer.disconnect();
  if(panel.hidePopover&&panel.matches(':popover-open'))panel.hidePopover();panel.remove();card.classList.remove('has-quick-picker');
  card.querySelectorAll('[data-action=card-flip]').forEach(button=>button.setAttribute('aria-expanded','false'));
  if(focus&&trigger.isConnected)trigger.focus({preventScroll:true});
 }
 function position(){
  if(!active)return;const{panel,card}=active,rect=card.querySelector('.card-photo').getBoundingClientRect(),width=Math.min(220,Math.max(144,rect.width*.72));
  panel.style.width=`${width}px`;panel.classList.toggle('is-compact',width<180);
  panel.style.left=`${Math.max(8,Math.min(innerWidth-width-8,rect.left+(rect.width-width)/2))}px`;
  panel.style.top=`${rect.bottom-width*.84}px`;if(active.labelWidth!==width){active.labelWidth=width;fitLabels();}
 }
 function fitLabels(){
  if(!active)return;const wheel=active.panel.querySelector('.quick-wheel'),bounds=wheel.getBoundingClientRect(),radius=bounds.width/2,center={x:bounds.left+radius,y:bounds.top+radius};
  for(const button of wheel.querySelectorAll('.radial-size')){
   button.style.removeProperty('font-size');const initial=parseFloat(getComputedStyle(button).fontSize),sector=wheel.querySelector(`.quick-wheel-sector[data-index="${button.dataset.index}"]`),start=+sector.dataset.start,end=+sector.dataset.end;
   function fits(){
    const range=document.createRange();range.selectNodeContents(button);const rects=[...range.getClientRects()].filter(rect=>rect.width&&rect.height);
    return rects.every(rect=>[[rect.left,rect.top],[rect.right,rect.top],[rect.right,rect.bottom],[rect.left,rect.bottom]].every(([x,y])=>{
     const dx=x-center.x,dy=y-center.y,r=Math.hypot(dx,dy)/radius*50;if(r<19||r>48)return false;
     if(end-start>=359)return true;const angle=(Math.atan2(dy,dx)*180/Math.PI-start+720)%360;return angle>=1&&angle<=end-start-1;
    }));
   }
   for(let size=initial;size>6&&!fits();size-=.5)button.style.fontSize=`${size-.5}px`;
  }
 }
 function open(card,trigger){
  if(active?.card===card){close(true);return;}close();
  const uk=document.documentElement.lang!=='en',L=(u,e)=>uk?u:e;
  const panel=document.createElement('div');panel.className='card-quick-inline';panel.setAttribute('popover','auto');panel.setAttribute('role','group');panel.setAttribute('aria-label',L('Швидка покупка: ','Quick add: ')+card.querySelector('.card-title').textContent);
  const content=document.createElement('article');content.className='product-card quick-purchase-card';content.dataset.productId=card.dataset.productId;
  const purchase=card.querySelector('.quick-purchase').cloneNode(true),select=purchase.querySelector('select'),colors=[...purchase.querySelectorAll('[data-action=quick-add]')];
  const wheel=document.createElement('div');wheel.className='quick-wheel';wheel.setAttribute('role','group');wheel.setAttribute('aria-label',L('Оберіть розмір','Choose a size'));
  const segments=document.createElementNS(ns,'svg');segments.classList.add('quick-wheel-segments');segments.setAttribute('viewBox','0 0 100 100');segments.setAttribute('aria-hidden','true');wheel.append(segments);
  const feedback=purchase.querySelector('.quick-feedback'),bag=document.createElement('button');bag.type='button';bag.className='radial-bag';bag.dataset.action='quick-add';bag.disabled=true;bag.setAttribute('aria-label',L('Додати в кошик','Add to cart'));bag.innerHTML=bagIcon;
  const options=[...select.options].filter(option=>option.value),span=options.length<=4?180:360,step=span/options.length,start=span===360?-90-step/2:-180;
  options.forEach((option,index)=>{
   const from=start+index*step,to=from+step,angle=options.length===1?-90:(from+to)/2,[x,y]=point(34,angle);
   const path=document.createElementNS(ns,'path');path.classList.add('quick-wheel-sector');path.dataset.size=option.value;path.dataset.start=String(from);path.dataset.end=String(to);
   path.dataset.index=String(index);path.setAttribute('d',options.length===1?'M50 0 A50 50 0 1 1 50 100 A50 50 0 1 1 50 0 M50 32 A18 18 0 1 0 50 68 A18 18 0 1 0 50 32 Z':sectorPath(from,to));path.setAttribute('fill-rule','evenodd');segments.append(path);
   const button=document.createElement('button');button.type='button';button.className='radial-size';button.textContent=option.value;button.dataset.size=option.value;button.dataset.angle=String(angle);button.disabled=select.disabled||option.disabled;button.setAttribute('aria-pressed','false');
   if(button.disabled){button.setAttribute('aria-label',option.value+' · '+L('Немає в наявності','Sold out'));path.classList.add('is-unavailable');}
   button.dataset.index=String(index);if(option.value.length>3)button.classList.add('radial-size-long');
   if(option.value.length>6&&option.value.includes('/')){button.classList.add('radial-size-pair');button.replaceChildren();const slash=option.value.indexOf('/');for(const text of [option.value.slice(0,slash+1),option.value.slice(slash+1)]){const line=document.createElement('span');line.textContent=text;button.append(line);}}
   button.style.setProperty('--x',`${x}%`);button.style.setProperty('--y',`${y}%`);
   button.onclick=()=>{select.value=option.value;wheel.querySelectorAll('.radial-size').forEach(node=>node.setAttribute('aria-pressed',String(node===button)));segments.querySelectorAll('path').forEach(node=>node.classList.toggle('is-selected',node===path));bag.disabled=colors.every(node=>node.disabled);bag.setAttribute('aria-label',L('Додати в кошик, розмір ','Add to cart, size ')+option.value);feedback.textContent=L('Обрано розмір ','Selected size ')+option.value;};
   path.onclick=()=>{if(!button.disabled)button.click();};wheel.append(button);
  });
  wheel.append(bag);
  const picker=document.createElement('div');picker.className='radial-colors';picker.setAttribute('role','group');picker.setAttribute('aria-label',L('Колір','Color'));
  colors.forEach((original,index)=>{
   const button=document.createElement('button');button.type='button';button.title=original.querySelectorAll('span')[1].textContent;button.setAttribute('aria-label',button.title);button.setAttribute('aria-pressed',String(index===0));button.append(original.querySelector('.color-dot').cloneNode(true));
   button.onclick=()=>{bag.dataset.color=original.dataset.color;picker.querySelectorAll('button').forEach(node=>node.setAttribute('aria-pressed',String(node===button)));};picker.append(button);if(index===0)bag.dataset.color=original.dataset.color;
  });
  const previewIndex=colors.findIndex(button=>button.dataset.color===card.dataset.previewColor);if(previewIndex>0)picker.children[previewIndex].click();
  if(options.length>4)picker.classList.add('radial-colors-under');wheel.append(picker);
  const dialog=card.closest('dialog[open]');
  purchase.querySelector('.quick-head').remove();purchase.querySelector('.quick-size').hidden=true;purchase.querySelector('.quick-colors').hidden=true;feedback.classList.add('visually-hidden');content.append(wheel,purchase);panel.append(content);
  // A modal makes DOM outside it inert, even when a popover is drawn above it.
  // Keep the picker in its source dialog so size and colour controls receive clicks.
  (dialog||document.body).append(panel);
  const observer=new MutationObserver(()=>{if(!card.isConnected||(dialog&&!dialog.open))close();});observer.observe(dialog||document.querySelector('#main'),{childList:true,subtree:true,attributes:true,attributeFilter:['open']});active={panel,card,trigger,observer};
  panel.addEventListener('toggle',event=>{if(event.newState==='closed'&&active?.panel===panel)close();});
  card.classList.add('has-quick-picker');card.querySelectorAll('[data-action=card-flip]').forEach(button=>button.setAttribute('aria-expanded','true'));
  if(panel.showPopover)panel.showPopover();position();panel.tabIndex=-1;(wheel.querySelector('.radial-size:not(:disabled)')||panel).focus({preventScroll:true});
 }
 document.addEventListener('click',event=>{
  const trigger=event.target.closest('[data-action=card-flip]');
  if(trigger){const card=trigger.closest('.product-card');if(card){event.preventDefault();event.stopImmediatePropagation();open(card,trigger);return;}}
  if(active&&!active.panel.contains(event.target))close();
 },true);
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&active){event.preventDefault();close(true);}});
 addEventListener('popstate',()=>close());addEventListener('resize',position);addEventListener('scroll',position,{passive:true,capture:true});
 addEventListener('civis:cart-added',event=>{if(active?.card.dataset.productId===event.detail?.product)close(true);});
})();
