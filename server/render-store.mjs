import{readFile}from'node:fs/promises';
import vm from'node:vm';
let scriptsPromise;
export async function renderStore(data,options){
 const files=[new URL('../public/images.js',import.meta.url),new URL('../public/views.js',import.meta.url),new URL('../public/product-details.js',import.meta.url),new URL('../public/size-guide.js',import.meta.url),new URL('../public/welcome.js',import.meta.url),new URL('../public/app.js',import.meta.url)];
 scriptsPromise??=Promise.all(files.map(async file=>new vm.Script(await readFile(file,'utf8'),{filename:file.pathname.split('/').at(-1)})));
 const nodes=new Map(),node=selector=>{if(!nodes.has(selector))nodes.set(selector,{innerHTML:'',textContent:'',setAttribute(){}});return nodes.get(selector);};
 const storage={getItem:()=>null,setItem(){},removeItem(){}},document={querySelector:node,querySelectorAll:()=>[],createElement:()=>({}),documentElement:{lang:options.locale},addEventListener(){}};
 // Each request owns its state and DOM adapter; compiled scripts alone are shared.
 const window={...data,CIVIS_SSR:true,CivisAccount:{current:()=>null},addEventListener(){}};
 const context=vm.createContext({window,document,localStorage:storage,sessionStorage:storage,Intl,URL,URLSearchParams,matchMedia:()=>({matches:false})});
 // These are our own compiled storefront scripts. Allow scheduling headroom under
 // concurrent requests rather than failing a healthy render after one wall second.
 for(const script of await scriptsPromise)script.runInContext(context,{timeout:5000});
 return window.CivisSsr.render(options);
}
