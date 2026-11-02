import{jsonForHtml}from'../shared/seo.mjs';
import{socialMetadata}from'../shared/social-metadata.mjs';
export function applySeo(facts){
 document.title=facts.title;
 const meta=(key,value,property=false)=>{let node=document.head.querySelector(`meta[${property?'property':'name'}="${key}"]`);if(value===null){node?.remove();return;}if(!node){node=document.createElement('meta');node.setAttribute(property?'property':'name',key);document.head.append(node);}node.content=value;};
 meta('description',facts.description);meta('robots',facts.robots);
 const social=socialMetadata(facts,window.CIVIS_IMAGE_MANIFEST);
 for(const[key,value]of Object.entries(social.properties))meta(key,value,true);
 for(const[key,value]of Object.entries(social.names))meta(key,value);
 for(const[lang,href]of Object.entries({canonical:facts.url,...facts.alternates,'x-default':facts.alternates.uk})){const selector=lang==='canonical'?'link[rel="canonical"]':`link[rel="alternate"][hreflang="${lang}"]`;let node=document.head.querySelector(selector);if(!node){node=document.createElement('link');node.rel=lang==='canonical'?'canonical':'alternate';if(lang!=='canonical')node.hreflang=lang;document.head.append(node);}node.href=href;}
 let schema=document.getElementById('page-schema');if(!schema){schema=document.createElement('script');schema.id='page-schema';schema.type='application/ld+json';document.head.append(schema);}schema.textContent=jsonForHtml(facts.jsonLd);
}
