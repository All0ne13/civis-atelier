/* The lower campaign owns its timer and updates only its own slide. */
(()=>{
 let dispose=()=>{},position=0,previousRoot,previousLocale;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 window.CivisMotion={mount(locale){
  const root=document.querySelector('[data-motion-carousel]');if(root&&root===previousRoot&&locale===previousLocale)return;
  dispose();if(!root){previousRoot=null;dispose=()=>{};return;}
  if(root!==previousRoot){position=0;}previousRoot=root;previousLocale=locale;root.dataset.motionLocale=locale;
  const controller=new AbortController(),{signal}=controller,L=(u,e)=>locale==='uk'?u:e;
  const slides=[
   {src:'assets/campaign/atelier-movement-v1.png',title:L('РУХ','MOVE'),label:L('ПРОСТІР ДЛЯ СЕБЕ','ROOM FOR YOURSELF'),copy:L('Менше зайвого.<br>Більше свободи.','Less distraction.<br>More freedom.'),category:'Hoodies',alt:L('Модель у вільному зеленому костюмі в русі','Model in a relaxed forest-green outfit in motion')},
   {src:'assets/campaign/atelier-motion-02-v1.png',title:L('ФОРМА','FORM'),label:L('ХАРАКТЕР У ДЕТАЛЯХ','CHARACTER IN THE DETAILS'),copy:L('Твоя форма.<br>Твій характер.','Your shape.<br>Your character.'),category:'Shirts',alt:L('Модель у молочній сорочці та вільних темних брюках','Model in an ivory shirt and charcoal wide-leg trousers')}
  ];
  const photo=root.querySelector('.movement-figure img'),title=root.querySelector('h2'),caption=root.querySelector('.movement-caption'),link=root.querySelector('.movement-link'),dots=[...root.querySelectorAll('[data-motion-slide]')],status=root.querySelector('[data-motion-status]');
  let timer=0,visible=false,focused=false,request=0,loading=false,initialized=false;
  const images=new Map();
  function imageFor(index){if(!images.has(index)){const image=new Image();image.fetchPriority='low';window.CivisImages.apply(image,slides[index].src,'(max-width:600px) 84vw,48vw');images.set(index,image);}return images.get(index);}
  function schedule(){const playing=visible&&!focused&&!document.hidden&&!loading;root.dataset.autoplay=playing?'playing':'paused';if(!playing){clearTimeout(timer);timer=0;return;}if(!timer)timer=setTimeout(()=>{timer=0;show(position+1);},8000);}
  async function show(next,manual=false){
   clearTimeout(timer);timer=0;const ticket=++request,index=(next+slides.length)%slides.length,item=slides[index];loading=true;
   try{await imageFor(index).decode();}catch{if(ticket===request&&!signal.aborted){loading=false;schedule();}return;}
   if(signal.aborted||ticket!==request)return;
   const initial=!initialized;
   const commit=()=>{position=index;root.dataset.slide=String(index);initialized=true;
   window.CivisImages.apply(photo,item.src,'(max-width:600px) 84vw,48vw');photo.alt=item.alt;photo.width=images.get(index).naturalWidth;photo.height=images.get(index).naturalHeight;
   title.textContent=item.title;caption.querySelector('span').textContent=`0${index+1} / ${item.label}`;caption.querySelector('p').innerHTML=item.copy;link.querySelector('span').textContent=L('Переглянути колекцію','Explore collection');delete link.dataset.category;link.dataset.reset='true';link.href='/catalogue'+(locale==='en'?'?lang=en':'');
   const noteTitle=root.querySelector('[data-motion-note-title]'),noteCopy=root.querySelector('[data-motion-note-copy]'),noteList=root.querySelector('[data-motion-note-list]');
   if(noteTitle)noteTitle.innerHTML=index===0?L('Простір<br> для руху.','Room<br> to move.'):L('Характер<br> у деталях.','Character<br> in the details.');
   if(noteCopy)noteCopy.textContent=index===0?L('Вільні форми для вашого щоденного ритму.','Relaxed shapes for your everyday rhythm.'):L('Виразні поєднання, у яких ви залишаєтесь собою.','Expressive combinations that feel like you.');
   if(noteList){const notes=index===0?[L('Вільні силуети','Relaxed silhouettes'),L('Легкі поєднання','Easy combinations'),L('Власний ритм','Your own rhythm')]:[L('Виразні форми','Expressive shapes'),L('Спокійні відтінки','Quiet tones'),L('Особистий акцент','A personal touch')];[...noteList.children].forEach((node,i)=>node.textContent=notes[i]);}
   dots.forEach((dot,i)=>dot.setAttribute('aria-pressed',String(i===index)));};
   if(window.CivisFX)await window.CivisFX.swap({root,photo,title,kind:'movement',commit,initial,valid:()=>!signal.aborted&&ticket===request});else commit();
   if(signal.aborted||ticket!==request)return;
   if(manual)status.textContent=L(`Слайд ${index+1} з 2: ${item.title}`,`Slide ${index+1} of 2: ${item.title}`);
   loading=false;schedule();
  }
  dots.forEach((dot,index)=>dot.addEventListener('click',()=>show(index,true),{signal}));
  root.addEventListener('focusin',event=>{focused=event.target.matches(':focus-visible');schedule();},{signal});
  root.addEventListener('focusout',event=>{focused=root.contains(event.relatedTarget)&&event.relatedTarget.matches(':focus-visible');schedule();},{signal});
  document.addEventListener('visibilitychange',schedule,{signal});
  reduced.addEventListener('change',schedule,{signal});
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){imageFor((position+1)%slides.length);if(!initialized&&!loading)show(position);}schedule();},{threshold:.2});observer.observe(root);
  dispose=()=>{controller.abort();clearTimeout(timer);observer.disconnect();window.CivisFX?.cancel(root);};
  // Render remounts retain the chosen slide without fetching offscreen assets.
  if(position!==0)show(position);else root.dataset.slide='0';
  schedule();
 }};
})();
