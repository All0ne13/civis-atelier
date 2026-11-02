import test from'node:test';
import assert from'node:assert/strict';
import{renderCompanyContent}from'../server/company.mjs';
import{pageFacts,publicPaths}from'../shared/seo.mjs';

test('company pages have complete bilingual initial content, real navigation and crawlable metadata',()=>{
 for(const page of['about','contacts'])for(const locale of['uk','en']){
  const html=renderCompanyContent(page,locale);assert.equal((html.match(/<h1>/g)||[]).length,1);assert.ok(html.length>4000);assert.ok(html.includes('href="/catalogue'+(locale==='en'?'?lang=en':'')+'"'));assert.ok(html.includes('data-open-cookie'));assert.ok(!html.includes('<form'));assert.ok(publicPaths.includes('/'+page));
  const facts=pageFacts({path:'/'+page,locale,indexing:true});assert.equal(facts.indexable,true);assert.equal(facts.jsonLd['@graph'][2]['@type'],page==='about'?'AboutPage':'ContactPage');assert.ok(!facts.title.includes('Your account'));assert.ok(facts.description.length>80);
 }
});
test('contact channels show honest placeholders and publish only validated work contacts',()=>{
 const empty=renderCompanyContent('contacts','en');assert.equal((empty.match(/class="company-channel is-pending"/g)||[]).length,4);assert.ok(!empty.includes('mailto:'));assert.ok(!empty.includes('href="#"'));
 const filled=renderCompanyContent('contacts','en',{links:{email:'hello@example.com',instagram:'https://www.instagram.com/fixture/',telegram:'javascript:alert(1)'},profile:{ownerEmail:'private@example.com'},contactCopy:'<img src=x onerror=alert(1)>'});assert.ok(filled.includes('href="mailto:hello@example.com"'));assert.ok(filled.includes('href="https://www.instagram.com/fixture/"'));assert.ok(!filled.includes('javascript:'));assert.ok(!filled.includes('private@example.com'));assert.ok(filled.includes('&lt;img'));assert.ok(!filled.includes('<img src=x'));
});
