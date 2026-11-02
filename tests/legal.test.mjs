import test from'node:test';
import assert from'node:assert/strict';
import{legalDocuments,defaultLegalText}from'../server/legal-documents.mjs';
import{emptyLegalProfile,legalProfileSchema,publicLegalProfile,hasSellerDetails}from'../server/legal-profile.mjs';
import{legalSections,renderLegalContent}from'../server/legal.mjs';
test('all bilingual legal documents round-trip through the existing CMS without exceeding its limit',()=>{
 for(const key of Object.keys(legalDocuments))for(const locale of['uk','en']){
  const text=defaultLegalText(key,locale);assert.ok(text.length>3000&&text.length<=10000);
  const sections=legalSections(key,locale,text);assert.equal(sections.length,legalDocuments[key].sections.length);
  assert.equal(new Set(sections.map(s=>s.id)).size,sections.length);
  assert.ok(sections.every(s=>s.title&&s.text));
 }
});
test('unpublished seller identity stays blank and produces an explicit draft notice',()=>{
 assert.deepEqual(publicLegalProfile({ownerEmail:'private@example.com',secret:'private'}),emptyLegalProfile);
 assert.equal(hasSellerDetails(emptyLegalProfile),false);
 const html=renderLegalContent('terms','en',emptyLegalProfile,'',{isTest:true});
 assert.ok(html.includes('These documents are drafts'));assert.ok(html.includes('no real funds are charged'));
 assert.ok(!html.includes('private@example.com'));assert.ok(!html.includes('mailto:'));
 assert.ok(!html.includes('id="seller"'));assert.ok(!html.includes('href="#seller"'));assert.ok(!html.includes('Not yet published'));
});
test('public seller inputs validate identity and contacts and reject unrelated private fields',()=>{
 const value={...emptyLegalProfile,name:'Fixture Seller',registrationCode:'1234567890',legalAddress:'Fixture address',vatStatus:'not-vat',email:'seller@example.com',returnRecipient:'Fixture Recipient',returnAddress:'Fixture return address'};
 assert.equal(hasSellerDetails(legalProfileSchema.parse(value)),true);
 assert.equal(legalProfileSchema.safeParse({...value,registrationCode:'abc'}).success,false);
 assert.equal(legalProfileSchema.safeParse({...value,email:'not-an-email'}).success,false);
 assert.equal(legalProfileSchema.safeParse({...value,phone:'javascript:alert(1)'}).success,false);
 assert.equal(legalProfileSchema.safeParse({...value,password:'private'}).success,false);
});
test('CMS legal text and public seller strings render as text, not executable markup',()=>{
 const html=renderLegalContent('privacy','en',{...emptyLegalProfile,name:'<img src=x onerror=alert(1)>'},'## <script>alert(1)</script>\n\n<img src=x onerror=alert(2)>',{isTest:false});
 assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img src=x'));
 const repeated=legalSections('privacy','en','## Cookies and browser storage\n\na\n\n## Cookies and browser storage\n\nb');
 assert.equal(new Set(repeated.map(s=>s.id)).size,2);
});
