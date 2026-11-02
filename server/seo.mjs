import{pageFacts,siteOrigin,isIndexingEnabled,jsonForHtml}from'../shared/seo.mjs';
import{socialMetadata}from'../shared/social-metadata.mjs';
const e=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const seoConfig=()=>({origin:siteOrigin(process.env.SITE_URL),indexing:isIndexingEnabled(process.env),liveSales:process.env.STORE_MODE==='live'&&process.env.PAYMENTS_MODE==='live'});
export function seoHead(facts,images={}){
 const social=socialMetadata(facts,images),tags=(values,attribute)=>Object.entries(values).filter(([,value])=>value!==null).map(([key,value])=>`<meta ${attribute}="${key}" content="${e(value)}">`).join('');
 return `<meta name="robots" content="${e(facts.robots)}">${tags(social.properties,'property')}${tags(social.names,'name')}${Object.entries({...facts.alternates,'x-default':facts.alternates.uk}).map(([lang,url])=>`<link rel="alternate" hreflang="${lang}" href="${e(url)}">`).join('')}<script type="application/ld+json" id="page-schema">${jsonForHtml(facts.jsonLd)}</script>${process.env.GOOGLE_SITE_VERIFICATION?`<meta name="google-site-verification" content="${e(process.env.GOOGLE_SITE_VERIFICATION)}">`:''}${process.env.BING_SITE_VERIFICATION?`<meta name="msvalidate.01" content="${e(process.env.BING_SITE_VERIFICATION)}">`:''}`;
}
export {pageFacts};
