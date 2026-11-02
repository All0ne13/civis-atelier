import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {SplitText} from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger,SplitText);
ScrollTrigger.config({ignoreMobileResize:true});
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const scopes=new Map(),owners=new WeakMap(),swaps=new Map(),cards=new Map();
let routeKey='',frame=0;
const locale=()=>document.documentElement.lang;
const above=node=>node.getBoundingClientRect().bottom<0;
const headerHeight=()=>document.querySelector('.site-header')?.offsetHeight||0;

function text(node,{delay=0,duration=1,trigger,once=true}={}){
 if(!node)return null;
 let completed=false;
 return SplitText.create(node,{type:'lines',mask:'lines',linesClass:'motion-line',autoSplit:true,aria:'auto',onSplit(self){
  if(completed){gsap.set(self.lines,{yPercent:0,rotation:0});node.dataset.motionText='complete';return;}
  node.dataset.motionText='ready';
  return gsap.fromTo(self.lines,{yPercent:115,rotation:2},{yPercent:0,rotation:0,stagger:.09,duration,delay,ease:'power4.out',onStart:()=>{node.dataset.motionText='playing';},onComplete:()=>{completed=true;node.dataset.motionText='complete';},scrollTrigger:trigger?{trigger,start:'top 88%',once}:undefined});
 }});
}

function scene(node,setup,{preserve=true}={}){
 if(!node||scopes.has(node))return;
 const cleanups=[];
 const ctx=gsap.context(()=>setup({text:(n,options)=>{const split=text(n,options);if(split)cleanups.push(()=>split.revert());return split;},cleanup:fn=>cleanups.push(fn)}),node);
 node.dataset.motionScene='ready';
 scopes.set(node,{ctx,cleanups,locale:locale()});
 if(preserve)owners.set(node,{locale:locale(),tag:node.tagName,classes:[...node.classList]});
}

function disposeScope(node){
 const item=scopes.get(node);if(!item)return;
 item.ctx.revert();for(const cleanup of item.cleanups)cleanup();
 node.removeAttribute('data-motion-scene');owners.delete(node);scopes.delete(node);
}

function clearSwap(root){
 const item=swaps.get(root);if(!item)return;
 item.timeline?.kill();item.split?.revert();item.overlay?.remove();
 gsap.set(item.photo,{clearProps:'transform,clipPath,opacity'});
 if(item.kind==='movement')gsap.set(item.title,{clearProps:'opacity'});
 const copy=root.querySelector('[data-campaign-intro],.movement-caption p');if(copy)gsap.set(copy,{clearProps:'transform,clipPath'});
 swaps.delete(root);item.resolve?.();
}

function cleanup(){
 cancelAnimationFrame(frame);frame=0;
 for(const root of [...swaps.keys()])clearSwap(root);
 for(const node of [...scopes.keys()])disposeScope(node);
 for(const {ctx}of cards.values())ctx.revert();cards.clear();
 document.documentElement.removeAttribute('data-civis-motion');
}

function refresh(){
 if(frame)return;
 frame=requestAnimationFrame(()=>{frame=0;document.documentElement.style.setProperty('--motion-header',headerHeight()+'px');ScrollTrigger.refresh();});
}

function mountCards(){
 for(const [node,{ctx}]of cards)if(!node.isConnected){ctx.revert();cards.delete(node);}
 for(const node of document.querySelectorAll('.weekly-section .card-photo,.catalogue-grid .card-photo,.product-related .card-photo')){
  if(cards.has(node)||above(node))continue;
  const ctx=gsap.context(()=>{
   const row=[...node.closest('.product-grid,.carousel-track')?.querySelectorAll('.card-photo')||[]].indexOf(node);
   gsap.fromTo(node,{clipPath:'inset(0% 0% 100% 0%)'},{clipPath:'inset(0% 0% 0% 0%)',duration:.95,delay:(Math.max(0,row)%4)*.075,ease:'power3.inOut',scrollTrigger:{trigger:node.closest('.card-media'),start:'top 92%',once:true}});
  },node);
  cards.set(node,{ctx});
 }
}

function mount(){
 for(const node of [...scopes.keys()])if(!node.isConnected)disposeScope(node);
 for(const root of [...swaps.keys()])if(!root.isConnected)clearSwap(root);
 if(reduced.matches){cleanup();return;}
 document.documentElement.dataset.civisMotion='ready';
 document.documentElement.style.setProperty('--motion-header',headerHeight()+'px');

 scene(document.querySelector('.weekly-section .section-head'),({text})=>{
  const head=document.querySelector('.weekly-section .section-head');
  if(!above(head))text(head.querySelector('h2'),{trigger:head});
 });

 const cover=document.querySelector('.collection-cover');
 scene(cover,({text})=>{
  const art=cover.querySelector('.collection-cover-art'),image=art.querySelector('img'),caption=cover.querySelector('.collection-cover-caption');
  if(above(cover))return;
  text(caption.querySelector('h2'),{trigger:art,duration:.65});
  gsap.fromTo(image,{scale:1.045},{scale:1,duration:.75,ease:'power2.out',clearProps:'transform',scrollTrigger:{trigger:art,start:'top 90%',once:true}});
 });

 const movement=document.querySelector('.movement-editorial');
 scene(movement,()=>{
  if(above(movement))return;
  const stage=movement.querySelector('.movement-stage');
  // A closed orbit and stable headline at every scroll position, including mid-swap.
  gsap.fromTo(stage.querySelector('.movement-figure'),{y:20,scale:.98},{y:0,scale:1,duration:.7,ease:'power3.out',clearProps:'transform',scrollTrigger:{trigger:stage,start:'top 90%',once:true}});
  gsap.fromTo(movement.querySelector('.movement-caption'),{clipPath:'inset(0% 0% 100% 0%)'},{clipPath:'inset(0% 0% 0% 0%)',duration:.55,ease:'power3.out',clearProps:'clipPath',scrollTrigger:{trigger:movement.querySelector('.movement-caption'),start:'top 94%',once:true}});
 });

 const brand=document.querySelector('.brand-editorial');
 scene(brand,({text})=>{
  const photo=brand.querySelector('.brand-editorial-photo'),title=brand.querySelector('h2'),copy=brand.querySelector('.brand-editorial-copy');
  if(above(brand))return;
  text(title,{trigger:title,duration:.65});text(copy.querySelector('h3'),{trigger:copy,duration:.65});
  gsap.fromTo(photo,{clipPath:'inset(0% 8% 0% 8%)'},{clipPath:'inset(0% 0% 0% 0%)',duration:.7,ease:'power3.out',clearProps:'clipPath',scrollTrigger:{trigger:photo,start:'top 92%',once:true}});
  gsap.fromTo(photo.querySelector('img'),{scale:1.05},{scale:1,duration:.75,ease:'power2.out',clearProps:'transform',scrollTrigger:{trigger:photo,start:'top 92%',once:true}});
  gsap.fromTo(copy.querySelectorAll('p,.line-link'),{y:16,clipPath:'inset(0% 0% 100% 0%)'},{y:0,clipPath:'inset(0% 0% 0% 0%)',stagger:.07,duration:.5,ease:'power3.out',clearProps:'transform,clipPath',scrollTrigger:{trigger:copy,start:'top 90%',once:true}});
 });

 const welcome=document.querySelector('.welcome-signup');
 scene(welcome,({text})=>{
  const copy=welcome.querySelector(':scope>div');
  owners.set(copy,{locale:locale(),tag:copy.tagName,classes:[...copy.classList]});
  if(!above(copy))text(copy.querySelector('h2'),{trigger:copy});
  gsap.fromTo(welcome,{'--motion-rule':0},{'--motion-rule':1,duration:1.2,ease:'power3.inOut',scrollTrigger:{trigger:welcome,start:'top 90%',once:true}});
 },{preserve:false});

 for(const node of document.querySelectorAll('.company-about-copy,.company-contact-hero,.company-section-heading,.company-manifesto,.company-faq,.legal-hero')){
  scene(node,({text})=>{const heading=node.querySelector('h1,h2');if(heading&&!above(node))text(heading,{trigger:node});},{preserve:false});
 }
 scene(document.querySelector('.company-about-photo'),()=>{
  const photo=document.querySelector('.company-about-photo');
  gsap.fromTo(photo,{clipPath:'inset(0% 0% 100% 0%)'},{clipPath:'inset(0% 0% 0% 0%)',duration:1.25,ease:'power3.inOut'});
 },{preserve:false});
 const gallery=document.querySelector('#product-gallery');
 scene(gallery,()=>{
  const photo=gallery.querySelector('.product-turn-front img');
  if(photo)gsap.fromTo(photo,{scale:1.075,clipPath:'inset(0% 0% 100% 0%)'},{scale:1,clipPath:'inset(0% 0% 0% 0%)',duration:1.1,ease:'power3.inOut',clearProps:'transform,clipPath'});
 },{preserve:false});
 const pageHeading=document.querySelector('.catalogue-heading .heading-row,.product-title-row');
 scene(pageHeading,()=>{const heading=pageHeading.querySelector('h1');if(heading)gsap.fromTo(heading,{clipPath:'inset(0% 0% 100% 0%)',y:16},{clipPath:'inset(0% 0% 0% 0%)',y:0,duration:.8,ease:'power3.out',clearProps:'clipPath,transform'});},{preserve:false});
 mountCards();refresh();
}

async function swap({root,photo,title,kind,commit,initial=false,valid=()=>root.isConnected}){
 clearSwap(root);
 if(document.fonts.status==='loading')await document.fonts.ready;
 if(!valid())return;
 if(reduced.matches){commit();return;}
 const overlay=initial?null:photo.cloneNode(true);
 if(overlay){overlay.removeAttribute('id');overlay.setAttribute('aria-hidden','true');overlay.alt='';overlay.className='motion-slide-outgoing';photo.parentElement.append(overlay);}
 commit();
 return new Promise(resolve=>{
  const item={photo,title,kind,overlay,resolve,timeline:null,split:null};swaps.set(root,item);
  const complete=()=>{if(swaps.get(root)!==item)return;overlay?.remove();gsap.set(photo,{clearProps:'transform,clipPath,opacity'});item.split?.revert();swaps.delete(root);resolve();};
  const tl=gsap.timeline({onComplete:complete,onInterrupt:resolve});item.timeline=tl;
  if(kind==='campaign'){
   if(overlay)tl.to(overlay,{xPercent:-12,duration:1.2,ease:'power3.inOut'},0);
   tl.fromTo(photo,{scale:1.1,clipPath:initial?'inset(0% 0% 0% 0%)':'inset(0% 0% 0% 100%)'},{scale:1,clipPath:'inset(0% 0% 0% 0%)',duration:1.2,ease:'power3.inOut'},0);
  }else{
   if(overlay)tl.to(overlay,{xPercent:-14,clipPath:'inset(0% 100% 0% 0%)',duration:.5,ease:'power3.inOut'},0);
   tl.fromTo(photo,{xPercent:14,clipPath:initial?'inset(0% 0% 0% 0%)':'inset(0% 0% 0% 100%)'},{xPercent:0,clipPath:'inset(0% 0% 0% 0%)',duration:1.1,ease:'power3.out'},.1);
  }
  if(kind==='movement'){
   // Handwritten glyphs extend beyond their text boxes. Line masks cut those
   // strokes until SplitText reverts, so keep the complete word unwrapped.
   tl.fromTo(title,{opacity:.65},{opacity:1,duration:.35,clearProps:'opacity'},0);
  }else{
   item.split=SplitText.create(title,{type:'lines',mask:'lines',linesClass:'motion-line',aria:'auto'});
   tl.fromTo(item.split.lines,{yPercent:115,rotation:2},{yPercent:0,rotation:0,stagger:.1,duration:.95,ease:'power4.out'},.16);
  }
  const copy=root.querySelector(kind==='campaign'?'[data-campaign-intro]':'.movement-caption p');
  if(copy)tl.fromTo(copy,{clipPath:'inset(0% 0% 100% 0%)',y:16},{clipPath:'inset(0% 0% 0% 0%)',y:0,duration:.7,ease:'power3.out',clearProps:'clipPath,transform'},.4);
 });
}

window.CivisFX={swap,cancel:clearSwap,version:'gsap-3.15.0'};
window.CivisReveal={mount,owns(from,to){const item=owners.get(from);return Boolean(item&&item.locale===locale()&&from.tagName===to.tagName&&item.classes.every(name=>to.classList.contains(name)));},beforeRender({page,product,locale}){const key=`${page}:${page==='product'?product:''}:${locale}`;if(routeKey&&key!==routeKey)cleanup();routeKey=key;},diagnostics(){return{scenes:scopes.size,cards:cards.size,transitions:swaps.size,triggers:ScrollTrigger.getAll().length,version:'gsap-3.15.0',reduced:reduced.matches};}};
reduced.addEventListener('change',()=>{cleanup();mount();});
document.addEventListener('focusin',event=>{for(const animation of gsap.getTweensOf(event.target))if(animation.scrollTrigger)animation.progress(1);});
document.fonts.ready.then(()=>{if(document.querySelector('.company-main,.legal-document'))mount();else refresh();});
window.addEventListener('pageshow',refresh);
