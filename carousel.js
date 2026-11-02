/* Native scrolling, touch swipes and keyboard controls. No animation dependency. */
(() => {
  const positions=new Map();let observers=[];
  const reduced=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
  function geometry(track){
    const card=track.querySelector('.product-card');
    if(!card)return {step:1,visible:1,max:0};
    const gap=parseFloat(getComputedStyle(track).columnGap)||0;
    const step=card.getBoundingClientRect().width+gap;
    const visible=Math.max(1,Math.floor((track.clientWidth+gap)/step+.01));
    return {step,visible,max:Math.max(0,track.children.length-visible)};
  }
  function capture(){document.querySelectorAll('[data-carousel]').forEach(region=>{const track=region.querySelector('[data-carousel-track]');if(track)positions.set(region.dataset.carouselKey,Math.round(track.scrollLeft/geometry(track).step));});}
  function installDrag(track,signal){
    let drag=null,ignoreClickUntil=0;
    track.addEventListener('dragstart',event=>event.preventDefault(),{signal});
    track.addEventListener('pointerdown',event=>{
      if(event.pointerType!=='mouse'||!event.isPrimary||event.button!==0||event.target.closest('button,input,select,textarea,[contenteditable=true]'))return;
      drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:track.scrollLeft,moved:false,dx:0};
    },{signal});
    track.addEventListener('pointermove',event=>{
      if(!drag||drag.id!==event.pointerId)return;
      const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
      if(!drag.moved){
        if(Math.abs(dy)>8&&Math.abs(dy)>Math.abs(dx)){drag=null;return;}
        if(Math.abs(dx)<6)return;
        drag.moved=true;track.classList.add('is-dragging');track.setPointerCapture(event.pointerId);
      }
      event.preventDefault();drag.dx=dx;track.scrollLeft=drag.left-dx;
    },{signal});
    const finish=event=>{
      if(!drag||drag.id!==event.pointerId)return;
      const current=drag;drag=null;
      const left=track.scrollLeft;track.classList.remove('is-dragging');
      if(track.hasPointerCapture(current.id))track.releasePointerCapture(current.id);
      if(!current.moved)return;
      ignoreClickUntil=performance.now()+350;
      const {step,max}=geometry(track),start=Math.round(current.left/step);let next=Math.round(left/step);
      if(event.type==='pointerup'&&next===start&&Math.abs(current.dx)>Math.min(60,step*.2))next+=current.dx<0?1:-1;
      track.scrollTo({left:Math.max(0,Math.min(max,next))*step,behavior:reduced()?'instant':'smooth'});
    };
    for(const type of ['pointerup','pointercancel','lostpointercapture'])track.addEventListener(type,finish,{signal});
    track.addEventListener('click',event=>{if(event.detail&&performance.now()<ignoreClickUntil){event.preventDefault();event.stopImmediatePropagation();}},{capture:true,signal});
    signal.addEventListener('abort',()=>{const previous=drag;drag=null;track.classList.remove('is-dragging');if(previous&&track.hasPointerCapture(previous.id))track.releasePointerCapture(previous.id);},{once:true});
  }
  function mount(){
    observers.forEach(o=>o.disconnect());observers=[];
    document.querySelectorAll('[data-carousel]').forEach(region=>{
      const track=region.querySelector('[data-carousel-track]'),status=region.querySelector('[data-carousel-status]');
      if(!track)return;
      const controller=new AbortController(),{signal}=controller;observers.push({disconnect:()=>controller.abort()});installDrag(track,signal);
      const update=()=>{const {step,visible,max}=geometry(track),start=Math.min(max,Math.max(0,Math.round(track.scrollLeft/step)));positions.set(region.dataset.carouselKey,start);if(status)status.textContent=`${String(start+1).padStart(2,'0')}—${String(Math.min(track.children.length,start+visible)).padStart(2,'0')} / ${String(track.children.length).padStart(2,'0')}`;};
      const move=direction=>{const {step,visible,max}=geometry(track),start=Math.round(track.scrollLeft/step);const next=direction>0?(start>=max?0:Math.min(max,start+visible)):(start<=0?max:Math.max(0,start-visible));positions.set(region.dataset.carouselKey,next);track.scrollTo({left:next*step,behavior:reduced()?'instant':'smooth'});};
      region.querySelector('[data-carousel-prev]')?.addEventListener('click',()=>move(-1),{signal});
      region.querySelector('[data-carousel-next]')?.addEventListener('click',()=>move(1),{signal});
      track.addEventListener('keydown',e=>{if(e.altKey||e.ctrlKey||e.metaKey)return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();move(e.key==='ArrowRight'?1:-1)}if(e.key==='Home'||e.key==='End'){e.preventDefault();track.scrollTo({left:e.key==='Home'?0:track.scrollWidth,behavior:reduced()?'instant':'smooth'})}},{signal});
      let frame=0;track.addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(()=>{frame=0;update()})},{passive:true,signal});observers.push({disconnect:()=>cancelAnimationFrame(frame)});
      let lastWidth=track.clientWidth;
      const resize=new ResizeObserver(()=>{const width=track.clientWidth;if(Math.abs(width-lastWidth)>.5){const index=positions.get(region.dataset.carouselKey)||0;track.scrollTo({left:Math.min(index,geometry(track).max)*geometry(track).step,behavior:'instant'});}lastWidth=width;update()});resize.observe(track);observers.push(resize);
      track.scrollTo({left:(positions.get(region.dataset.carouselKey)||0)*geometry(track).step,behavior:'instant'});update();
    });
  }
  window.CivisCarousels={capture,mount};
})();
