import test from'node:test';
import assert from'node:assert/strict';
import{pageFacts,isIndexingEnabled,publicHref,sitemapXml,jsonForHtml,catalogueSitemapEntries}from'../shared/seo.mjs';
import{socialMetadata}from'../shared/social-metadata.mjs';
import{seoHead}from'../server/seo.mjs';
import{validPublicLink,publicLinks,renderPublicLinks}from'../shared/public-links.mjs';
import{renderStore}from'../server/render-store.mjs';
const product={id:'numeric-jeans',name:'Numeric Jeans',nameUk:'Джинси з цифровими розмірами',description:'A relaxed denim silhouette.',descriptionUk:'Джинси вільного силуету.',category:'Jeans',collection:'Men',price:12900,stock:3,sizes:['32','44'],colors:['White'],media:[{color:'White',view:'front',file:'assets/products/cotton-white.jpg',width:598,height:550}],colorValues:{White:'#fff'},isNew:true};
const options={products:[product],categories:['Jeans'],pricing:{usdToUah:45},indexing:true,translations:{Jeans:'Джинси'}};

test('brand and distinct localized catalogue descriptions identify the page being indexed',()=>{
 const home=pageFacts({...options,path:'/'});assert.ok(home.title.startsWith('Civis Atelier —'));
 const queries=[{}, {category:'Jeans'}, {collection:'Men'}, {new:'1'}];
 for(const locale of ['uk','en']){
  const pages=queries.map(query=>pageFacts({...options,path:'/catalogue',locale,query}));
  assert.equal(new Set(pages.map(p=>p.description)).size,4);
  assert.ok(pages.every(p=>p.description.length<=175&&p.description.includes('Civis Atelier')));
  assert.ok(!pages[1].description.includes(locale==='uk'?'футболки':'T-shirts'));
 }
 const pdp=pageFacts({...options,path:'/product/numeric-jeans',locale:'en'});assert.ok(pdp.description.includes('Numeric Jeans'));assert.ok(pdp.description.includes('32, 44'));
});

test('product identity, colours, sizes and only supplied material are machine readable',()=>{
 const facts=pageFacts({...options,path:'/product/numeric-jeans'}),graph=facts.jsonLd['@graph'];
 const schema=graph.find(n=>n['@type']==='Product'),page=graph.find(n=>n['@type']==='ItemPage');
 assert.deepEqual(schema.color,['White']);assert.deepEqual(schema.size,['32','44']);assert.equal(schema.material,undefined);
 assert.equal(page.mainEntity['@id'],schema['@id']);assert.equal(schema.mainEntityOfPage['@id'],page['@id']);
 assert.equal(graph.find(n=>n['@type']==='WebSite').alternateName,'Civis-Atelier');
 const supplied=pageFacts({...options,products:[{...product,details:{composition:{en:'100% cotton',uk:'100% бавовна'}}}],locale:'en',path:'/product/numeric-jeans'});
 assert.equal(supplied.jsonLd['@graph'].find(n=>n['@type']==='Product').material,'100% cotton');
});

test('social previews follow the canonical host and do not invent dimensions for external images',()=>{
 const facts=pageFacts({...options,path:'/product/numeric-jeans',origin:'https://shop.example',locale:'en'});
 const images={[facts.cover]:{social:'assets/optimized/photo-social.jpg'}};
 const meta=socialMetadata(facts,images);
 assert.equal(meta.properties['og:image'],'https://shop.example/assets/optimized/photo-social.jpg');
 assert.equal(meta.properties['og:image:secure_url'],meta.properties['og:image']);assert.equal(meta.properties['og:image:width'],'1200');assert.equal(meta.properties['og:image:height'],'630');assert.equal(meta.properties['og:image:type'],'image/jpeg');
 assert.equal(meta.names['twitter:image:alt'],'Numeric Jeans');assert.equal(meta.names['twitter:card'],'summary_large_image');
 assert.equal(socialMetadata(facts).properties['og:image:width'],null);
 const head=seoHead(facts,images);assert.ok(head.includes('https://shop.example/assets/optimized/photo-social.jpg'));assert.ok(head.includes('twitter:image:alt'));
});

test('image sitemap exposes real product photographs, languages and non-empty collections',()=>{
 const data={CATALOGUE:[product],CIVIS_CATEGORIES:['Jeans','Empty']};
 const entries=catalogueSitemapEntries(data);assert.ok(entries.some(e=>e.path==='/product/numeric-jeans'&&e.images.includes(product.media[0].file)));assert.ok(!entries.some(e=>e.facets?.category==='Empty'));
 const source=sitemapXml([{path:'/product/numeric-jeans',images:['assets/photo.jpg','assets/photo.jpg','https://images.example/art.jpg?a=1&b=2','javascript:alert(1)']}]);
 assert.ok(source.includes('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"'));assert.equal((source.match(/<image:image>/g)||[]).length,4);assert.ok(source.includes('a=1&amp;b=2'));assert.ok(!source.includes('javascript:'));assert.ok(!source.includes('<lastmod>'));
});
test('indexing is explicitly enabled independently from payment mode and stays off on previews',()=>{
 assert.equal(isIndexingEnabled({SEO_INDEXING:'enabled',STORE_MODE:'staging',PAYMENTS_MODE:'test',VERCEL_ENV:'production'}),true);
 for(const env of[{},{SEO_INDEXING:'enabled',VERCEL_ENV:'preview'},{SEO_INDEXING:'enabled',VERCEL_ENV:'development'}])assert.equal(isIndexingEnabled(env),false);
 for(const path of['/admin','/account','/checkout','/login','/api/orders'])assert.equal(pageFacts({...options,path}).indexable,false);
});
test('localized canonical pages filter real catalogue data and noindex duplicate or invalid facets',()=>{
 const en=pageFacts({...options,path:'/product/numeric-jeans',query:{lang:'en'}});assert.equal(en.title,'Numeric Jeans — Civis Atelier');assert.equal(en.url,'https://civis-atelier.vercel.app/product/numeric-jeans?lang=en');assert.equal(en.alternates.uk,'https://civis-atelier.vercel.app/product/numeric-jeans');
 const cat=pageFacts({...options,path:'/catalogue',query:{category:'Jeans'}});assert.equal(cat.listing.length,1);assert.equal(cat.indexable,true);assert.ok(cat.title.includes('Джинси'));
 for(const query of[{category:'Bogus'},{category:'Jeans',collection:'Men'},{size:'32'},{lang:'bad'},{category:['Jeans','Shirts']}])assert.equal(pageFacts({...options,path:'/catalogue',query}).indexable,false);
 assert.equal(pageFacts({...options,path:'/product/deleted-product'}).status,404);
});
test('structured data never advertises real offers in a test checkout and escapes script injection',()=>{
 const data=pageFacts({...options,path:'/product/numeric-jeans'}).jsonLd['@graph'].find(item=>item['@type']==='Product');assert.equal(data.offers,undefined);
 const live=pageFacts({...options,path:'/product/numeric-jeans',liveSales:true}).jsonLd['@graph'].find(item=>item['@type']==='Product');assert.equal(live.offers.price,'5805.00');assert.equal(live.offers.priceCurrency,'UAH');assert.equal(live.offers.availability,'https://schema.org/InStock');assert.equal(live.aggregateRating,undefined);
 assert.equal(jsonForHtml({name:'</script><img onerror=alert(1)>'}).includes('</script>'),false);
});
test('bilingual sitemap contains only supplied routes, valid escaped facets and reciprocal alternates',()=>{
 const xml=sitemapXml([{path:'/catalogue',facets:{category:'T-shirts & tops'}},{path:'/product/numeric-jeans'}]);assert.equal((xml.match(/<url>/g)||[]).length,4);assert.ok(xml.includes('hreflang="uk"'));assert.ok(xml.includes('hreflang="en"'));assert.ok(xml.includes('&amp;lang=en'));assert.ok(!xml.includes('/admin'));assert.ok(!xml.includes('<lastmod>'));
 assert.equal(publicHref('/catalogue','en',{category:'Jeans'}),'/catalogue?category=Jeans&lang=en');
});
test('social placeholders are honest and configured contacts reject unsafe or wrong-service URLs',()=>{
 assert.deepEqual(publicLinks(),{instagram:'',tiktok:'',telegram:'',email:''});assert.equal((renderPublicLinks().match(/disabled/g)||[]).length,4);assert.ok(!renderPublicLinks().includes('href='));
 for(const value of['javascript:alert(1)','https://instagram.com.evil.test/shop','http://instagram.com/shop','https://user:secret@instagram.com/shop','https://instagram.com/'])assert.equal(validPublicLink('instagram',value),false);
 assert.equal(validPublicLink('instagram','https://www.instagram.com/civis.example/'),true);assert.equal(validPublicLink('email','shop@example.com?subject=bad'),false);assert.equal(validPublicLink('email','hello@example.com'),true);
});
test('SSR renders the same product interface, numeric sizes and bilingual content without a browser',async()=>{
 const data={CATALOGUE:[product],UK:{[product.name]:product.nameUk,[product.description]:product.descriptionUk},CIVIS_MEDIA:{[product.id]:product.media},CIVIS_COLOR_VALUES:product.colorValues,CIVIS_CATEGORIES:['Jeans'],CIVIS_PRICING:{usdToUah:45},CIVIS_PUBLIC_LINKS:{},CIVIS_CONTENT:{}};
 const uk=await renderStore(data,{path:'/product/numeric-jeans',locale:'uk'}),en=await renderStore(data,{path:'/product/numeric-jeans',locale:'en'});assert.ok(uk.main.includes('<h1>'+product.nameUk+'</h1>'));assert.ok(en.main.includes('<h1>Numeric Jeans</h1>'));assert.ok(en.main.includes('data-value="32"'));assert.ok(en.main.includes('data-value="44"'));assert.ok(uk.footer.includes('footer-socials'));assert.ok(en.footer.includes('coming soon'));assert.ok(!en.main.includes(product.nameUk));
});
