import test from 'node:test';
import assert from 'node:assert/strict';
import { productSchema, safeImage } from '../server/validation.mjs';
const product={id:'cotton-shirt',name:'Cotton Shirt',nameUk:'Cotton Shirt',category:'Shirts',collection:'Men',price:9900,stock:2,colors:['Black'],colorValues:{Black:'#222825'},sizes:['S'],description:'Cotton shirt.',descriptionUk:'Cotton shirt.',media:[{file:'assets/products/cotton-white.jpg',color:'Black',view:'front',width:800,height:1000}],isNew:true,published:true};
test('rejects negative stock, fractional prices and arbitrary administrative fields',()=>{
  for(const override of [{stock:-1},{price:9.99},{role:'admin'},{id:'../secret'},{colors:['Black','Black']}]) assert.equal(productSchema.safeParse({...product,...override}).success,false);
  assert.equal(productSchema.safeParse(product).success,true);
});
test('every available color needs its actual front photograph',()=>{
  assert.equal(productSchema.safeParse({...product,colors:['Black','White'],colorValues:{Black:'#222825',White:'#ffffff'}}).success,false);
});

test('unavailable sizes are explicit, unique and part of the product assortment',()=>{
 assert.deepEqual(productSchema.parse(product).unavailableSizes,[]);
 assert.equal(productSchema.safeParse({...product,unavailableSizes:['S']}).success,true);
 for(const unavailableSizes of [['M'],['S','S'],['invalid']])assert.equal(productSchema.safeParse({...product,unavailableSizes}).success,false);
});
test('size guide accepts measured centimetres and rejects invalid measurements or sizes',()=>{
 const guide={kind:'tops',note:{en:'Measured flat.',uk:'Заміри у розкладеному вигляді.'},rows:[{size:'S',chest:52.5,length:70,shoulder:null,sleeve:22}]};
 assert.equal(productSchema.safeParse({...product,sizeGuide:guide}).success,true);
 for(const rows of [[{size:'S',chest:-1}],[{size:'S',chest:301}],[{size:'M',chest:52}],[{size:'S'},{size:'S'}]])assert.equal(productSchema.safeParse({...product,sizeGuide:{...guide,rows}}).success,false);
});
test('custom numeric and waist/length labels retain order and share availability and size-guide validation',()=>{
 const sizes=['28','30','W32/L34','EU 42','ONE SIZE'];
 const parsed=productSchema.parse({...product,sizes,unavailableSizes:['30'],sizeGuide:{kind:'bottoms',note:{en:'',uk:''},rows:[{size:'W32/L34',waist:42,inseam:80}]}});
 assert.deepEqual(parsed.sizes,sizes);
 assert.deepEqual(parsed.unavailableSizes,['30']);
 assert.equal(parsed.sizeGuide.rows[0].size,'W32/L34');
 for(const sizes of [[''],['32','32'],['s','S'],['32<script>'],['a'.repeat(13)],Array.from({length:13},(_,i)=>String(i+20))])assert.equal(productSchema.safeParse({...product,sizes}).success,false);
 assert.equal(productSchema.safeParse({...product,sizes:['28','30'],unavailableSizes:['32']}).success,false);
});
test('image paths cannot escape assets or execute code',()=>{
  for(const path of ['javascript:alert(1)','data:image/svg+xml,abc','assets/../../.env','https://evil.example/image.jpg','https://foo.public.blob.vercel-storage.com.evil.example/a.png']) assert.equal(safeImage(path),false);
  assert.equal(safeImage('assets/catalogue-v2/shirt-front.png'),true);
  assert.equal(safeImage('https://foo.public.blob.vercel-storage.com/products/test.png'),true);
});
