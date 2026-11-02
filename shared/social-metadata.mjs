// One source for server-rendered previews and metadata updated by SPA navigation.
export function socialMetadata(facts,images={}){
 const source=images[facts.cover.replace(/^\//,'')];
 const image=new URL(source?.social||source?.src||facts.cover,new URL(facts.url).origin+'/').href;
 const alt=facts.product?(facts.locale==='uk'?facts.product.nameUk:facts.product.name):'Civis Atelier — Collection XIV';
 const extension=new URL(image).pathname.split('.').pop().toLowerCase();
 const type={jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',avif:'image/avif'}[extension];
 return{
  names:{'application-name':'Civis Atelier','twitter:card':'summary_large_image','twitter:title':facts.title,'twitter:description':facts.description,'twitter:image':image,'twitter:image:alt':alt},
  properties:{'og:site_name':'Civis Atelier','og:type':facts.kind,'og:title':facts.title,'og:description':facts.description,'og:url':facts.url,'og:locale':facts.locale==='uk'?'uk_UA':'en_US','og:locale:alternate':facts.locale==='uk'?'en_US':'uk_UA','og:image':image,'og:image:secure_url':image.startsWith('https:')?image:null,'og:image:alt':alt,'og:image:type':type||null,'og:image:width':source?.social?'1200':null,'og:image:height':source?.social?'630':null}
 };
}
