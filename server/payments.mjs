import { createHmac, timingSafeEqual, createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { database, catalogue } from './db.mjs';
import { productSizeSchema } from './validation.mjs';
import {welcomeEligibility,applyWelcomeDiscount} from './welcome.mjs';
import { customerFields,normalizeCustomer,validateCustomer } from '../shared/checkout-validation.mjs';
export const checkoutSchema=z.object({items:z.array(z.object({id:z.string().regex(/^[a-z0-9-]+$/).max(100),color:z.string().min(1).max(40),size:productSizeSchema,qty:z.number().int().min(1).max(100)}).strict()).min(1).max(30),locale:z.enum(['uk','en']).default('uk')}).strict();
export const customerSchema=z.object(Object.fromEntries(customerFields.map(key=>[key,z.string().max(500)]))).strict().transform(normalizeCustomer).superRefine((data,ctx)=>{for(const [field,code] of Object.entries(validateCustomer(data)))ctx.addIssue({code:'custom',path:[field],message:code});});
export function paymentConfig(mode=process.env.PAYMENTS_MODE||'test', verificationOnly=false) {
  if(mode==='test')return {isTest:true,merchant:'test_merch_n1',secret:'flk3409refn54t54t*FNJRET'}; // Official public sandbox credentials: wiki.wayforpay.com/view/852472
  if(mode!=='live'||(!verificationOnly&&process.env.STORE_MODE!=='live')||!process.env.WAYFORPAY_MERCHANT_ACCOUNT||!process.env.WAYFORPAY_MERCHANT_SECRET)throw Object.assign(new Error('Payments are not activated'),{status:503});
  return {isTest:false,merchant:process.env.WAYFORPAY_MERCHANT_ACCOUNT,secret:process.env.WAYFORPAY_MERCHANT_SECRET};
}
export const hmac=(fields,secret)=>createHmac('md5',secret).update(fields.map(v=>String(v??'')).join(';'),'utf8').digest('hex');
export function validSignature(fields,signature,secret){if(typeof signature!=='string'||!/^[a-f0-9]{32}$/i.test(signature))return false;return timingSafeEqual(Buffer.from(hmac(fields,secret),'hex'),Buffer.from(signature,'hex'));}
export const decimal=minor=>(minor/100).toFixed(2);
export async function quoteCart(body,userId=null){
  const {items,locale}=checkoutSchema.parse(body),products=await catalogue(),sql=database();
  const [setting]=await sql`SELECT value FROM store_settings WHERE key='pricing'`;
  const rate=Number(setting?.value.usdToUah);if(!(rate>0&&rate<1000))throw new Error('Invalid exchange rate');
  const combined=new Map();
  for(const item of items){const key=JSON.stringify([item.id,item.color,item.size]);const previous=combined.get(key);combined.set(key,{...item,qty:item.qty+(previous?.qty||0)});}
  const totals=new Map();for(const item of combined.values())totals.set(item.id,(totals.get(item.id)||0)+item.qty);
  const lines=[...combined.values()].map(item=>{
    const p=products.find(p=>p.id===item.id);
    if(!p||!p.colors.includes(item.color)||!p.sizes.includes(item.size)||p.unavailableSizes?.includes(item.size)||p.stock<totals.get(item.id))throw Object.assign(new Error('Some pieces are unavailable. Please review your cart.'),{status:409});
    return {...item,name:locale==='uk'?p.nameUk:p.name,unitMinor:Math.round(p.price*rate),usdMinor:p.price,version:p.version,image:p.media.find(m=>m.color===item.color&&m.view==='front')?.file};
  });
  const totalMinor=lines.reduce((s,item)=>s+item.unitMinor*item.qty,0);if(totalMinor<=0||totalMinor>14999900)throw Object.assign(new Error('Order total is outside the supported payment range'),{status:400});
  const isTest=paymentConfig().isTest,offerEmail=await welcomeEligibility(userId,isTest);
  return {...(offerEmail?applyWelcomeDiscount(lines):{items:lines,totalMinor,subtotalMinor:totalMinor,discountMinor:0}),currency:'UAH',exchangeRate:rate,isTest};
}
export async function createCheckout(body,userId,origin){
  const parsed=z.object({items:checkoutSchema.shape.items,locale:checkoutSchema.shape.locale,customer:customerSchema,paymentMethod:z.enum(['card','applePay','googlePay','privat24']).default('card'),idempotencyKey:z.uuid(),expectedTotalMinor:z.number().int().positive()}).strict().parse(body);
  const mode=paymentConfig().isTest,sql=database();
  const requestHash=createHash('sha256').update(JSON.stringify({items:parsed.items,customer:parsed.customer,total:parsed.expectedTotalMinor,isTest:mode})).digest('hex');
  const[existing]=await sql`SELECT * FROM orders WHERE idempotency_key=${parsed.idempotencyKey}::uuid`;
  if(existing){
    if(existing.clerk_id!==userId||existing.request_hash!==requestHash)throw Object.assign(new Error('Order retry does not match the original request.'),{status:409});
    if(existing.status!=='pending'||new Date(existing.expires_at)<=new Date())throw Object.assign(new Error('Payment session expired. Refresh checkout.'),{status:409});
    return {orderId:existing.id,isTest:existing.is_test,action:'https://secure.wayforpay.com/pay',fields:purchaseFields(existing,origin,parsed.locale,parsed.paymentMethod)};
  }
  const quote=await quoteCart({items:parsed.items,locale:parsed.locale},userId);
  if(quote.totalMinor!==parsed.expectedTotalMinor)throw Object.assign(new Error('Prices changed. Refresh the order total before paying.'),{status:409});
  const offerEmail=quote.discountMinor?await welcomeEligibility(userId,quote.isTest):null;
  const payload={id:randomUUID(),clerkId:userId,idempotencyKey:parsed.idempotencyKey,requestHash,customer:parsed.customer,...quote,offerEmail};
  let row;try{[row]=await sql`SELECT create_welcome_order(${JSON.stringify(payload)}::jsonb) AS result`;}catch(error){if(error.message.includes('WELCOME_UNAVAILABLE'))throw Object.assign(new Error('Your welcome discount has already been applied to an order. Refresh checkout.'),{status:409});throw error;}
  const order=row.result;return {orderId:order.id,isTest:order.is_test,action:'https://secure.wayforpay.com/pay',fields:purchaseFields(order,origin,parsed.locale,parsed.paymentMethod)};
}
export function purchaseFields(order,origin,locale='uk',paymentMethod='card'){
  const config=paymentConfig(order.is_test?'test':'live'),base=new URL(origin);
  const names=order.items.map(i=>`${i.name} / ${i.color} / ${i.size}`),counts=order.items.map(i=>i.qty),prices=order.items.map(i=>decimal(i.unitMinor));
  const fields={merchantAccount:config.merchant,merchantAuthType:'SimpleSignature',merchantDomainName:base.hostname,merchantTransactionSecureType:'AUTO',orderReference:order.id,orderDate:Math.floor(new Date(order.created_at).getTime()/1000),amount:decimal(order.total_minor),currency:'UAH',orderLifetime:900,orderTimeout:900,language:locale==='uk'?'UA':'EN',returnUrl:`${base.origin}/checkout/return?order=${order.id}`,serviceUrl:`${base.origin}/api/payments/wayforpay/webhook`,productName:names,productCount:counts,productPrice:prices,clientFirstName:order.customer.firstName,clientLastName:order.customer.lastName,clientEmail:order.customer.email,clientPhone:order.customer.phone,regularMode:'none'};
  fields.paymentSystems='applePay;googlePay;card;privat24';
  fields.defaultPaymentSystem=['card','applePay','googlePay','privat24'].includes(paymentMethod)?paymentMethod:'card';
  fields.merchantSignature=hmac([fields.merchantAccount,fields.merchantDomainName,fields.orderReference,fields.orderDate,fields.amount,fields.currency,...names,...counts,...prices],config.secret);return fields;
}
export async function processWebhook(body){
  const parsed=z.object({orderReference:z.uuid(),merchantAccount:z.string().max(100),merchantSignature:z.string().max(64),amount:z.union([z.number(),z.string().max(24)]),currency:z.string().max(3),authCode:z.union([z.string().max(100),z.number()]).optional(),cardPan:z.string().max(50).optional(),transactionStatus:z.string().max(60),reasonCode:z.union([z.number(),z.string().max(30)]).optional()}).passthrough().parse(body);
  const sql=database();const [order]=await sql`SELECT id,total_minor,is_test FROM orders WHERE id=${parsed.orderReference}`;
  if(!order)throw Object.assign(new Error('Unknown order'),{status:404});
  const config=paymentConfig(order.is_test?'test':'live',true);
  const fields=[parsed.merchantAccount,parsed.orderReference,parsed.amount,parsed.currency,parsed.authCode,parsed.cardPan,parsed.transactionStatus,parsed.reasonCode];
  if(parsed.merchantAccount!==config.merchant||!validSignature(fields,parsed.merchantSignature,config.secret)||!Number.isFinite(Number(parsed.amount))||Math.round(Number(parsed.amount)*100)!==order.total_minor||parsed.currency!=='UAH')throw Object.assign(new Error('Invalid payment notification'),{status:403});
  if(['Approved','Declined','Expired','Refunded','Voided'].includes(parsed.transactionStatus)){
    if(parsed.transactionStatus==='Refunded')await sql`UPDATE orders SET status='refunded',provider_status='Refunded' WHERE id=${order.id} AND status='paid'`;
    else await sql`SELECT settle_store_order(${order.id}::uuid,${parsed.transactionStatus})`;
  }
  const time=Math.floor(Date.now()/1000);return {orderReference:order.id,status:'accept',time,signature:hmac([order.id,'accept',time],config.secret)};
}
