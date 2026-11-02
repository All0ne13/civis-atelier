import{database}from'./db.mjs';

export async function welcomeEligibility(userId,isTest){
 if(!userId)return null;
 const[offer]=await database()`SELECT email FROM welcome_offers w WHERE clerk_id=${userId}
 AND NOT EXISTS(SELECT 1 FROM welcome_redemptions r WHERE r.email=w.email AND r.is_test=${isTest})
 AND NOT EXISTS(SELECT 1 FROM orders o WHERE o.is_test=${isTest} AND (o.clerk_id=w.clerk_id OR lower(o.customer->>'email')=w.email) AND o.status IN('paid','paid_review','test_paid','refunded'))`;
 return offer?.email||null;
}

// Allocate integer kopecks to units so the signed provider line sum equals the total.
export function applyWelcomeDiscount(items){
 const subtotalMinor=items.reduce((sum,item)=>sum+item.unitMinor*item.qty,0),discountMinor=Math.round(subtotalMinor*5/100),totalMinor=subtotalMinor-discountMinor;
 let extra=totalMinor-items.reduce((sum,item)=>sum+Math.floor(item.unitMinor*95/100)*item.qty,0);
 const discounted=items.flatMap(item=>{const unit=Math.floor(item.unitMinor*95/100),higher=Math.min(item.qty,extra);extra-=higher;return[{...item,originalUnitMinor:item.unitMinor,unitMinor:unit+1,qty:higher},{...item,originalUnitMinor:item.unitMinor,unitMinor:unit,qty:item.qty-higher}].filter(line=>line.qty>0);});
 return{items:discounted,subtotalMinor,discountMinor,totalMinor,discountCode:'WELCOME5'};
}
