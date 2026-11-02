import {z} from 'zod';
import {database} from './db.mjs';
export const fulfillmentSchema=z.object({status:z.enum(['confirmed','shipped','delivered']),version:z.number().int().nonnegative(),trackingNumber:z.string().trim().regex(/^[A-Za-z0-9-]{6,30}$/,'Enter a tracking number of 6–30 letters or digits').optional()}).strict();
const next={processing:'confirmed',confirmed:'shipped',shipped:'delivered'};
export function checkFulfillmentTransition(order,input){
 if(order.fulfillment_version!==input.version)throw Object.assign(new Error('Order changed. Refresh it before saving.'),{status:409});
 if(next[order.fulfillment_status]!==input.status)throw Object.assign(new Error('Follow the order stages in sequence.'),{status:409});
 if(!((!order.is_test&&order.status==='paid')||(order.is_test&&order.status==='test_paid')))throw Object.assign(new Error('Payment must be confirmed before processing this order.'),{status:409});
 if(input.status==='shipped'&&!input.trackingNumber)throw Object.assign(new Error('Enter the shipment tracking number.'),{status:400});
 if(input.status!=='shipped'&&input.trackingNumber)throw Object.assign(new Error('Tracking number is only set when shipping.'),{status:400});
}
export async function updateFulfillment(id,body,actor){
 const input=fulfillmentSchema.parse(body),sql=database();
 const [order]=await sql`SELECT id,status,is_test,fulfillment_status,fulfillment_version FROM orders WHERE id=${id}::uuid`;
 if(!order)throw Object.assign(new Error('Order not found'),{status:404});
 checkFulfillmentTransition(order,input);
 const [changed]=await sql`WITH changed AS (
 UPDATE orders SET fulfillment_status=${input.status},fulfillment_version=fulfillment_version+1,
 tracking_number=CASE WHEN ${input.status}='shipped' THEN ${input.trackingNumber||''} ELSE tracking_number END,
 confirmed_at=CASE WHEN ${input.status}='confirmed' THEN now() ELSE confirmed_at END,
 shipped_at=CASE WHEN ${input.status}='shipped' THEN now() ELSE shipped_at END,
 delivered_at=CASE WHEN ${input.status}='delivered' THEN now() ELSE delivered_at END
 WHERE id=${id}::uuid AND fulfillment_version=${input.version} AND fulfillment_status=${order.fulfillment_status} AND status=${order.status}
 RETURNING *), event AS (
 INSERT INTO order_fulfillment_events(order_id,actor_id,previous_status,status,tracking_number)
 SELECT id,${actor},${order.fulfillment_status},fulfillment_status,tracking_number FROM changed RETURNING id), audit AS (
 INSERT INTO audit_log(clerk_id,action,target) SELECT ${actor},${'order.'+input.status},id::text FROM changed RETURNING id)
 SELECT id,fulfillment_status,fulfillment_version,tracking_number,confirmed_at,shipped_at,delivered_at FROM changed`;
 if(!changed)throw Object.assign(new Error('Order changed. Refresh it before saving.'),{status:409});return changed;
}
export async function adminOrders(query){
 const input=z.object({page:z.coerce.number().int().min(1).max(10000).default(1),status:z.enum(['all','processing','confirmed','shipped','delivered']).default('all'),query:z.string().trim().max(100).default(''),mode:z.enum(['all','live','test']).default('all')}).strict().parse(query),sql=database();
 const result=await sql`SELECT *,count(*) OVER()::integer AS filtered_total FROM orders
 WHERE (${input.status}='all' OR fulfillment_status=${input.status})
 AND (${input.mode}='all' OR is_test=${input.mode==='test'})
 AND (${input.query}='' OR position(lower(${input.query}) in lower(concat(id::text,' ',customer->>'firstName',' ',customer->>'lastName',' ',customer->>'email',' ',customer->>'phone',' ',tracking_number)))>0)
 ORDER BY created_at DESC,id DESC LIMIT 30 OFFSET ${(input.page-1)*30}`;
 return {orders:result.map(({filtered_total,clerk_id,idempotency_key,request_hash,...order})=>order),total:result[0]?.filtered_total||0,page:input.page,pageSize:30};
}
