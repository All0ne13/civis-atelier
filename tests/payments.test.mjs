import test from 'node:test';
import assert from 'node:assert/strict';
import { hmac,validSignature,purchaseFields,paymentConfig,checkoutSchema,customerSchema } from '../server/payments.mjs';
test('HMAC matches RFC 2202 and rejects tampering',()=>{
  assert.equal(hmac(['Hi There'],Buffer.alloc(16,0x0b)),'9294727a3638bb1c13f48ef8158bfc9d');
  const fields=['merchant','example.com','order-1',100,'45.99','UAH','Shirt',1,'45.99'];
  const signature=hmac(fields,'test-only');assert.equal(validSignature(fields,signature,'test-only'),true);assert.equal(validSignature([...fields,'tampered'],signature,'test-only'),false);assert.equal(validSignature(fields,'x','test-only'),false);
});
test('sandbox is isolated from real merchant credentials and never enables live payments implicitly',()=>{
  assert.equal(paymentConfig('test').merchant,'test_merch_n1');assert.equal(paymentConfig('test').isTest,true);assert.throws(()=>paymentConfig('invalid'));
});
test('payment form signs exact line prices and has no recurring charges',()=>{
  const order={id:'11111111-1111-4111-8111-111111111111',is_test:true,total_minor:4599,created_at:'2026-10-23T12:00:00Z',items:[{name:'Shirt',color:'Black',size:'M',qty:1,unitMinor:4599}],customer:{firstName:'Test',lastName:'Buyer',email:'test@example.com',phone:'+380991234567'}};
  const f=purchaseFields(order,'https://example.com','en');assert.equal(f.amount,'45.99');assert.deepEqual(f.productPrice,['45.99']);assert.equal(f.regularMode,'none');assert.equal(f.orderLifetime,900);assert.equal(f.serviceUrl,'https://example.com/api/payments/wayforpay/webhook');assert.ok(validSignature([f.merchantAccount,f.merchantDomainName,f.orderReference,f.orderDate,f.amount,f.currency,...f.productName,...f.productCount,...f.productPrice],f.merchantSignature,paymentConfig('test').secret));
  assert.equal(f.paymentSystems,'applePay;googlePay;card;privat24');
  for(const method of ['applePay','googlePay','card','privat24']){const wallet=purchaseFields(order,'https://example.com','en',method);assert.equal(wallet.defaultPaymentSystem,method);assert.equal(wallet.merchantSignature,f.merchantSignature);assert.equal(wallet.amount,f.amount);}
  assert.equal(purchaseFields(order,'https://example.com','en','payParts').defaultPaymentSystem,'card');
});
test('client cannot submit prices or invalid quantities and contact data',()=>{
  assert.equal(checkoutSchema.safeParse({items:[{id:'shirt',color:'Black',size:'M',qty:1,price:1}]}).success,false);
  assert.equal(checkoutSchema.safeParse({items:[{id:'shirt',color:'Black',size:'M',qty:-1}]}).success,false);
  assert.equal(customerSchema.safeParse({firstName:'A',lastName:'B',email:'bad',phone:'123',city:'Kyiv',branch:'1'}).success,false);
});
