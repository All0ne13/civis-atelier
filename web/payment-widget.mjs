let loading;
const providerOrigin='https://secure.wayforpay.com';
export function preparePaymentWidget(){
  if(window.Wayforpay)return Promise.resolve();
  if(!loading)loading=new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.id='widget-wfp-script';script.src=providerOrigin+'/server/pay-widget.js';script.async=true;
    const timeout=setTimeout(fail,15000);
    function fail(){clearTimeout(timeout);script.remove();reject(new Error('Payment window could not be loaded. Please try again.'));}
    script.onload=()=>{clearTimeout(timeout);if(window.Wayforpay)resolve();else fail();};script.onerror=fail;document.head.append(script);
  }).catch(error=>{loading=null;throw error;});
  return loading;
}
export async function openPaymentWidget(payment){
  if(payment.action!==providerOrigin+'/pay'||!/^[a-f0-9-]{36}$/i.test(payment.orderId))throw new Error('Unexpected payment destination');
  await preparePaymentWidget();
  const widget=new window.Wayforpay(),previousFocus=document.activeElement;
  return new Promise((resolve,reject)=>{
    let finished=false,observer;
    function finish(error,status='closed'){if(finished)return;finished=true;observer?.disconnect();window.removeEventListener('keydown',key);widget.closeit();previousFocus?.focus({preventScroll:true});if(error)reject(error);else resolve({status});}
    function key(event){if(event.key==='Escape'){event.preventDefault();finish();}}
    function receipt(){finish(undefined,'redirecting');location.assign('/checkout/return?order='+encodeURIComponent(payment.orderId));}
    // The payment status is always read from our server, never trusted from browser messages.
    const original=widget.widgetListener;
    widget.widgetListener=function(instance,event){if(finished||event.origin!==providerOrigin||event.source!==widget.frame?.contentWindow)return;original.call(this,instance,event);};
    try{
      widget.run({...payment.fields,authorizationType:'SimpleSignature',straightWidget:true},receipt,()=>finish(),receipt);
      widget.frame?.setAttribute('title','WayForPay — secure payment');
      window.addEventListener('keydown',key);
      observer=new MutationObserver(()=>{if(!document.getElementById('wfp-container'))finish();});observer.observe(document.body,{childList:true});
    }catch(error){finish(error);}
  });
}
