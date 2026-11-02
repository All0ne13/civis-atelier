import test from'node:test';import assert from'node:assert/strict';
import{applyWelcomeDiscount}from'../server/welcome.mjs';
import{purchaseFields}from'../server/payments.mjs';
test('welcome offer takes exactly 5% with integer rounding and signed line totals matching the amount',()=>{
 for(const price of [1,19,99,100,999,446005])for(const qty of [1,3,100]){
  const result=applyWelcomeDiscount([{id:'one',unitMinor:price,qty},{id:'two',unitMinor:125,qty:2}]);
  const subtotal=price*qty+250;assert.equal(result.discountMinor,Math.round(subtotal*.05));assert.equal(result.totalMinor,subtotal-result.discountMinor);
  assert.equal(result.items.reduce((sum,item)=>sum+item.qty*item.unitMinor,0),result.totalMinor);
  assert.equal(result.items.filter(item=>item.id==='one').reduce((sum,item)=>sum+item.qty,0),qty);
  assert.ok(result.items.every(item=>Number.isInteger(item.unitMinor)&&item.unitMinor>=0&&item.qty>0));
  const fields=purchaseFields({id:'11111111-1111-4111-8111-111111111111',created_at:'2026-10-24',is_test:true,total_minor:result.totalMinor,items:result.items.map(item=>({...item,name:'Shirt',size:'M',color:'Green'})),customer:{}},'https://civis-atelier.vercel.app');
  assert.equal(Math.round(Number(fields.amount)*100),result.totalMinor);
  assert.equal(fields.productPrice.reduce((sum,price,index)=>sum+Math.round(Number(price)*100)*fields.productCount[index],0),result.totalMinor);
 }
});
