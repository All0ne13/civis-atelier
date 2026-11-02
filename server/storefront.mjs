import{readFile}from'node:fs/promises';
import{catalogue,database}from'./db.mjs';
import{publicLinks}from'../shared/public-links.mjs';
import{seoConfig,seoHead,pageFacts}from'./seo.mjs';
import{renderStore}from'./render-store.mjs';
const escape=value=>String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function storefrontData(){
 const sql=database();
 const[products,categories,settings,text]=await Promise.all([
  catalogue(),sql`SELECT name,name_uk FROM categories ORDER BY position,name`,sql`SELECT key,value FROM store_settings WHERE key IN ('pricing','content','public_links')`,readFile(new URL('../public/translations.json',import.meta.url),'utf8')
 ]);
 const translations=JSON.parse(text),media={},colors={};
 for(const product of products){translations[product.name]=product.nameUk;translations[product.description]=product.descriptionUk;media[product.id]=product.media;Object.assign(colors,product.colorValues);}
 for(const category of categories)translations[category.name]=category.name_uk;
 const values=Object.fromEntries(settings.map(row=>[row.key,row.value]));
 return{CATALOGUE:products,UK:translations,CIVIS_MEDIA:media,CIVIS_COLOR_VALUES:colors,CIVIS_CATEGORIES:categories.map(category=>category.name),CIVIS_PRICING:values.pricing,CIVIS_CONTENT:values.content||{},CIVIS_PUBLIC_LINKS:publicLinks(values.public_links),CIVIS_SEO:seoConfig()};
}
export const publicGlobals=data=>Object.entries(data).map(([key,value])=>`window.${key}=${JSON.stringify(value).replace(/</g,'\\u003c')};`).join('\n');
export async function storefrontHtml(path,query={}){
 const[data,template,images]=await Promise.all([storefrontData(),readFile(new URL('../public/store.html',import.meta.url),'utf8'),readFile(new URL('../public/image-manifest.json',import.meta.url),'utf8').then(JSON.parse)]);
 const facts=pageFacts({path,query,products:data.CATALOGUE,categories:data.CIVIS_CATEGORIES,pricing:data.CIVIS_PRICING,translations:data.UK,links:data.CIVIS_PUBLIC_LINKS,...data.CIVIS_SEO,imageUrl:file=>new URL(images[file]?.src||file,data.CIVIS_SEO.origin+'/').href});
 const {product,title,description}=facts;
 if(facts.status===404)return {status:404,html:notFoundHtml(facts.locale)};
 let html=template.replace(/<meta name="robots" content="noindex, follow" data-shell-only>/,'').replace(/<script\s+[^>]*src="\/store-data\.js"[^>]*><\/script>/,`<script>${publicGlobals(data)}</script>`).replace(/<title>.*?<\/title>/,`<title>${escape(title)}</title>`);
 const source=path==='/'?'assets/campaign/home-campaign-v3.png':product?.media.find(image=>image.view==='front'&&image.color===product.colors[0])?.file,optimized=source?images[source.replace(/^\//,'')]:undefined;
 const preload=optimized?`<link rel="preload" as="image" href="/${optimized.src}" imagesrcset="${optimized.variants.map(v=>'/'+v.url+' '+v.width+'w').join(', ')}" imagesizes="${path==='/'?'(max-width:600px) calc(100vw - 40px), 66vw':'(min-width:1000px) 50vw, 100vw'}" fetchpriority="high">`:'';
 if(['home','catalogue','product'].includes(path==='/'?'home':path.split('/')[1])){const rendered=await renderStore(data,{path,locale:facts.locale,facets:facts.facets});for(const[id,tag,key]of[['header','header','header'],['main','main','main'],['footer','footer','footer']])html=html.replace(new RegExp(`(<${tag}[^>]*id="${id}"[^>]*>)(</${tag}>)`),(_all,start,end)=>start+rendered[key]+end);}
 html=html.replace('lang="uk"',`lang="${facts.locale}"`);
 return {status:200,html:html.replace('</head>',`<meta name="description" content="${escape(description)}"><link rel="canonical" href="${escape(facts.url)}">${seoHead(facts,images)}${preload}</head>`)};
}
export const notFoundHtml=(locale='uk')=>`<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>404 — Civis Atelier</title><link rel="stylesheet" href="/fonts.css"><style>body{margin:0;background:#f2f3ef;color:#18211c;font-family:'Manrope Variable',sans-serif}main{max-width:640px;margin:15vh auto;padding:24px}h1{font:600 64px 'Oswald Variable',sans-serif}a{color:#294e3c}img{width:160px;height:auto}</style></head><body><main><a href="/"><img src="/assets/brand/civis-atelier.svg" alt="Civis Atelier"></a><h1>404</h1><p>${locale==='uk'?'Цю сторінку не знайдено. Товар міг бути знятий із публікації.':'This page could not be found. The product may no longer be published.'}</p><a href="/catalogue${locale==='en'?'?lang=en':''}">${locale==='uk'?'Переглянути колекції':'Explore collections'}</a></main></body></html>`;
