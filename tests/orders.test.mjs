import test from 'node:test';
import assert from 'node:assert/strict';
import {checkFulfillmentTransition,fulfillmentSchema} from '../server/orders.mjs';
const order={fulfillment_status:'processing',fulfillment_version:0,status:'paid',is_test:false};
test('order processing is separate from payment and follows its stages',()=>{
 assert.doesNotThrow(()=>checkFulfillmentTransition(order,{status:'confirmed',version:0}));
 assert.throws(()=>checkFulfillmentTransition({...order,status:'pending'},{status:'confirmed',version:0}));
 assert.throws(()=>checkFulfillmentTransition({...order,status:'refunded'},{status:'confirmed',version:0}));
 assert.throws(()=>checkFulfillmentTransition(order,{status:'shipped',version:0,trackingNumber:'12345678901234'}));
 assert.throws(()=>checkFulfillmentTransition(order,{status:'confirmed',version:1}));
 assert.throws(()=>checkFulfillmentTransition({...order,fulfillment_status:'confirmed'},{status:'shipped',version:0}));
 assert.doesNotThrow(()=>checkFulfillmentTransition({...order,fulfillment_status:'confirmed'},{status:'shipped',version:0,trackingNumber:'12345678901234'}));
 assert.throws(()=>checkFulfillmentTransition({...order,is_test:false,status:'test_paid'},{status:'confirmed',version:0}));
 assert.doesNotThrow(()=>checkFulfillmentTransition({...order,is_test:true,status:'test_paid'},{status:'confirmed',version:0}));
});
test('admin order fields cannot overwrite payments or insert tracking markup',()=>{
 for(const value of [{status:'paid',version:0},{status:'confirmed',version:0,is_test:false},{status:'shipped',version:0,trackingNumber:'<script>'},{status:'confirmed',version:-1}])assert.equal(fulfillmentSchema.safeParse(value).success,false);
});
