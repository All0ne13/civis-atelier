import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeCustomer,normalizePhone,formatPhone,validateCustomer} from '../shared/checkout-validation.mjs';
import {customerSchema} from '../server/payments.mjs';
const valid={firstName:'Анна-Марія',lastName:'О’Коннор',email:'anna.maria+shop@example.com',phone:'+380671234567',city:'Кам’янець-Подільський',branch:'Поштомат № 12345, вул. Шевченка, 10'};
test('checkout accepts real multilingual names and delivery data and normalizes the phone',()=>{
 for(const phone of ['0671234567','380671234567','00380671234567','+380 (67) 123-45-67']){
  const data={...valid,phone};assert.deepEqual(validateCustomer(data),{});assert.equal(customerSchema.parse(data).phone,valid.phone);assert.equal(normalizePhone(formatPhone(phone)),valid.phone);
 }
 for(const firstName of ['Li','Jean-Luc','D’Arcy','Марія'])assert.equal(customerSchema.safeParse({...valid,firstName,branch:'1'}).success,true);
});
test('every checkout field rejects punctuation, missing data and malformed values on the server',()=>{
 const cases={firstName:['`','  ','123','A1','<script>'],lastName:['`','--','42'],email:['`@aa.cc','a..b@example.com','x@localhost','a b@example.com'],phone:['+380111111111','+380011111111','+38067123','+3806712345678','+14155552671','abc+380671234567'],city:['`','123','<Kyiv>'],branch:['`','0','-1','---','Somewhere']};
 for(const [field,values] of Object.entries(cases))for(const value of values){const data={...valid,[field]:value};assert.ok(validateCustomer(data)[field],`${field}: ${value}`);assert.equal(customerSchema.safeParse(data).success,false);}
 for(const field of Object.keys(valid))assert.equal(customerSchema.safeParse({...valid,[field]:''}).success,false);
 assert.equal(customerSchema.safeParse({...valid,firstName:'A'.repeat(81)}).success,false);
});
test('phone formatting preserves partial edits and never turns an overlong or foreign number into a valid Ukrainian one',()=>{
 assert.equal(formatPhone('0671234567'),'+380 (67) 123-45-67');
 for(const phone of ['+380 (67) 123-45-678','+14155552671'])assert.ok(validateCustomer({...valid,phone:formatPhone(phone)}).phone);
 assert.equal(formatPhone(''), '');assert.equal(formatPhone('+380'),'+380');
 assert.equal(normalizeCustomer({...valid,firstName:'  Анна   Марія  '}).firstName,'Анна Марія');
});
