import morphdom from 'morphdom';

export function patchContents(selector,html){
 const node=typeof selector==='string'?document.querySelector(selector):selector;if(!node)return;
 if(window.CIVIS_SSR){node.innerHTML=html;return;}
 const target=node.cloneNode(false);target.innerHTML=html;
 morphdom(node,target,{childrenOnly:true,getNodeKey:element=>element.id||element.dataset?.cartKey||(element.matches?.('article.product-card')?'product:'+element.dataset.productId:undefined),onBeforeElUpdated(from,to){if(from.isEqualNode(to)||window.CivisReveal?.owns(from,to))return false;if((from.matches('[data-motion-carousel]')&&to.matches('[data-motion-carousel]')&&from.dataset.motionLocale===document.documentElement.lang)||(from.matches('[data-campaign]')&&to.matches('[data-campaign]')&&from.dataset.campaignLocale===document.documentElement.lang))return false;if(from.tagName==='DETAILS')to.open=from.open;return true;}});
}
export function patchElement(selector,html){
 const node=typeof selector==='string'?document.querySelector(selector):selector;if(!node)return;
 const template=document.createElement('template');template.innerHTML=html;
 morphdom(node,template.content.firstElementChild,{onBeforeElUpdated(from,to){if(from.isEqualNode(to))return false;if(from.tagName==='DETAILS')to.open=from.open;return true;}});
}
