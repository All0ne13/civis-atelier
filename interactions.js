/* Local campaign slideshow and recommendation-card interactions. No services. */
(() => {
  let dispose=()=>{},position=0,previousRoot,previousLocale;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  window.CivisCampaign={mount(locale){
    window.CivisReveal?.mount();
    window.CivisMotion?.mount(locale);
    const root=document.querySelector('[data-campaign]');if(root&&root===previousRoot&&locale===previousLocale)return;
    dispose();if(!root){previousRoot=null;dispose=()=>{};return;}if(root!==previousRoot)position=0;previousRoot=root;previousLocale=locale;root.dataset.campaignLocale=locale;
    const controller=new AbortController(),signal=controller.signal,uk=locale==='uk',L=(u,e)=>uk?u:e;
    const slides=[
      {src:'assets/campaign/home-campaign-v3.png',title:L('Нова<br> колекція','New<br> collection'),intro:L('Продумані форми. Виразні деталі. Ваш власний погляд.','Considered shapes. Expressive details. Your point of view.'),note:L('Одяг. Характер.<br>Твій погляд.','Clothing. Character.<br>Your point of view.'),alt:L('Двоє моделей у чорно-білих образах у міському дворі','Two models wearing black and white in an urban courtyard'),cta:L('До магазину','Go To Shop')},
      {src:'assets/campaign/campaign-slide-02.png',title:L('Свобода<br> руху','Room<br> to move'),intro:L('Вільні силуети та прості поєднання. Футболки для твого щоденного ритму.','Relaxed silhouettes and simple combinations. T-shirts for your everyday rhythm.'),note:L('Менше зайвого.<br>Більше свободи.','Less distraction.<br>More freedom.'),alt:L('Моделі у світлій сорочці та чорній футболці на міській прогулянці','Models in a white shirt and black T-shirt walking through the city'),cta:L('Дивитися футболки','Explore T-shirts'),category:'T-shirts'},
      {src:'assets/campaign/campaign-slide-03.png',title:L('Власний<br> характер','Your own<br> character'),intro:L('Темні відтінки, виразні форми. Обери сорочку та створи власне поєднання.','Dark tones and expressive shapes. Choose a shirt and make the combination your own.'),note:L('Твій стиль.<br>Твої правила.','Your style.<br>Your rules.'),alt:L('Двоє моделей у темних образах біля зеленої брами','Two models in dark outfits beside a green gate'),cta:L('Дивитися сорочки','Explore shirts'),category:'Shirts'}
    ];
    const images=new Map(),heroSizes='(max-width:600px) calc(100vw - 40px), 66vw';
    function loadImage(index){if(!images.has(index)){const image=new Image();image.fetchPriority=index===position?'high':'low';window.CivisImages.apply(image,slides[index].src,heroSizes);images.set(index,image);}return images.get(index);}
    let preloadTimer=0,visible=true;
    let frame=0,elapsed=0,last=0,request=0,loading=true;
    const progress=root.querySelector('[data-campaign-progress]');
    root.dataset.autoplay='playing';
    function tick(now){
      if(!loading){
        elapsed=Math.min(8000,elapsed+(last?now-last:0));progress.style.transform=`scaleX(${elapsed/8000})`;
        if(elapsed>=8000){loading=true;show(position+1);}
      }
      last=now;if(!signal.aborted&&visible&&!document.hidden)frame=requestAnimationFrame(tick);else frame=0;
    }
    async function show(next){
      const token=++request,index=(next+slides.length)%slides.length,item=slides[index];
      try{await loadImage(index).decode()}catch{}
      if(signal.aborted||token!==request)return;
      const initial=root.dataset.slide===undefined,photo=root.querySelector('.campaign-photo img');
      const commit=()=>{position=index;root.dataset.slide=String(index);window.CivisImages.apply(photo,item.src,heroSizes);photo.alt=item.alt;
      root.querySelector('#home-title').innerHTML=item.title;
      root.querySelector('[data-campaign-intro]').textContent=item.intro;
      root.querySelector('.hero-note').innerHTML=item.note;
      const cta=root.querySelector('.hero-cta');cta.textContent=item.cta;
      cta.href='/catalogue'+(item.category?'?category='+encodeURIComponent(item.category)+(uk?'':'&lang=en'):(uk?'':'?lang=en'));
      if(item.category)cta.dataset.category=item.category;else delete cta.dataset.category;
      const count=root.querySelector('[data-campaign-count]');count.textContent=`0${index+1} / 03`;count.setAttribute('aria-label',`${index+1} / 3`);};
      if(window.CivisFX)await window.CivisFX.swap({root,photo,title:root.querySelector('#home-title'),kind:'campaign',commit,initial,valid:()=>!signal.aborted&&token===request});else commit();
      if(signal.aborted||token!==request)return;
      elapsed=0;last=performance.now();loading=false;progress.style.transform='scaleX(0)';clearTimeout(preloadTimer);preloadTimer=setTimeout(()=>{if(visible&&!document.hidden)loadImage((index+1)%slides.length);},6000);
    }
    function resume(){last=performance.now();if(visible&&!document.hidden&&!frame)frame=requestAnimationFrame(tick);else if((!visible||document.hidden)&&frame){cancelAnimationFrame(frame);frame=0;}}
    const visibility=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;resume();});visibility.observe(root);
    document.addEventListener('visibilitychange',resume,{signal});
    dispose=()=>{cancelAnimationFrame(frame);clearTimeout(preloadTimer);visibility.disconnect();controller.abort();window.CivisFX?.cancel(root)};show(position);frame=requestAnimationFrame(tick);

  }};

  const colorPhotos=new Map();
  function readyColorPhoto(photo){
    if(!colorPhotos.has(photo.file)){const image=new Image();window.CivisImages.apply(image,photo.file,'(max-width:600px) 50vw,25vw');colorPhotos.set(photo.file,image.decode().then(()=>image).catch(()=>null));}
    return colorPhotos.get(photo.file);
  }
  document.addEventListener('pointerover',e=>{const card=e.target.closest('.product-card');if(card&&!card.contains(e.relatedTarget)){/* Color photographs load on demand, without preloading every variant. */}});
  function previewColor(button){
    const card=button.closest('[data-product-id]');if(!card)return;
    const color=button.dataset.cardColor,product=window.CATALOGUE.find(p=>p.id===card.dataset.productId),photo=window.CIVIS_MEDIA?.[product.id]?.find(i=>i.color===color&&i.view==='front');
    card.dataset.previewColor=color;
    if(photo){const image=card.querySelector('.card-photo img');if(image&&image.dataset.original!==photo.file)readyColorPhoto(photo).then(loaded=>{if(!loaded||!image.isConnected||card.dataset.previewColor!==color)return;window.CivisImages.apply(image,photo.file,'(max-width:600px) 50vw,25vw');image.width=photo.width;image.height=photo.height;image.alt=product.name+': '+color;});}
    card.querySelectorAll('[data-card-color]').forEach(node=>node.setAttribute('aria-pressed',String(node.dataset.cardColor===color)));
    card.querySelectorAll('[data-product]').forEach(link=>link.dataset.productColor=color);
  }
  document.addEventListener('pointerover',e=>{const swatch=e.target.closest('[data-card-color]');if(swatch)previewColor(swatch);});
  document.addEventListener('focusin',e=>{const swatch=e.target.closest('[data-card-color]');if(swatch)previewColor(swatch)});
  document.addEventListener('click',e=>{const swatch=e.target.closest('[data-card-color]');if(swatch){e.preventDefault();previewColor(swatch)}});
})();
