import express from 'express';
import helmet from 'helmet';
import { clerkMiddleware, getAuth, clerkClient } from '@clerk/express';
import { put } from '@vercel/blob';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { database, catalogue } from '../server/db.mjs';
import { productSchema, bilingualText } from '../server/validation.mjs';
import { z } from 'zod';
import { quoteCart, createCheckout, processWebhook } from '../server/payments.mjs';
import {adminOrders,updateFulfillment} from '../server/orders.mjs';
import {storefrontHtml,storefrontData,publicGlobals,notFoundHtml} from '../server/storefront.mjs';
import{isIndexingEnabled,isPublicPath,siteOrigin,sitemapXml,catalogueSitemapEntries}from'../shared/seo.mjs';
import{publicLinks,validPublicLink,emptyPublicLinks}from'../shared/public-links.mjs';
import{welcomeEligibility}from'../server/welcome.mjs';
import{legalHtml,defaultStoreContent}from'../server/legal.mjs';
import{companyHtml}from'../server/company.mjs';
import{publicFooterData}from'../server/footer.mjs';
import{renderSiteFooter}from'../shared/footer.mjs';
import{legalDocuments}from'../server/legal-documents.mjs';
import{legalProfileSchema,publicLegalProfile}from'../server/legal-profile.mjs';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use((req,res,next) => { if(!isIndexingEnabled(process.env)||/^\/(?:api|admin|account|login|register|forgot|checkout)(?:\/|$)|\.html$/.test(req.path))res.set('X-Robots-Tag','noindex, nofollow'); next(); });
app.use((req,res,next)=>{if(req.path!=='/'&&req.path.endsWith('/'))return res.redirect(308,req.path.replace(/\/+$/,'')+(req.url.includes('?')?req.url.slice(req.url.indexOf('?')):''));next();});
const authenticate=clerkMiddleware({ publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, secretKey: process.env.CLERK_SECRET_KEY, ...(process.env.VERCEL ? {} : { clockSkewInMs:30000 }) });
const publicApis=new Set(['/api/health','/api/catalogue','/api/checkout/quote','/api/payments/wayforpay/webhook']);
app.use((req,res,next)=>req.path.startsWith('/api/')&&(!publicApis.has(req.path)||(req.path==='/api/checkout/quote'&&req.get('authorization')))?authenticate(req,res,next):next());
app.use('/api', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
app.post('/api/payments/wayforpay/webhook',express.text({type:'*/*',limit:'32kb'}),async(req,res)=>{
  let body;try{body=JSON.parse(req.body);}catch{return res.status(400).json({error:'Invalid notification'});}
  res.json(await processWebhook(body));
});
app.use('/api', (req, res, next) => {
  if (['GET','HEAD','OPTIONS'].includes(req.method)) return next();
  const origin = req.get('origin');
  const expected = process.env.APP_ORIGIN || `${req.protocol}://${req.get('host')}`;
  if (!origin || origin !== expected) return res.status(403).json({ error:'Invalid request origin' });
  next();
});
app.use(express.json({ limit:'256kb' }));

async function admin(req, res, next) {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error:'Sign in required' });
  const sql = database();
  const [existing] = await sql`SELECT clerk_id FROM admin_users WHERE clerk_id = ${userId}`;
  if (!existing) {
    const owner = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
    if (!owner) return res.status(403).json({ error:'Administrator has not been configured' });
    const user = await clerkClient.users.getUser(userId);
    const email = user.emailAddresses.find(e => e.emailAddress.toLowerCase() === owner && e.verification?.status === 'verified');
    if (!email) return res.status(403).json({ error:'Administrator access required' });
    await sql`INSERT INTO admin_users (clerk_id, email) VALUES (${userId}, ${owner}) ON CONFLICT DO NOTHING`;
  }
  req.adminId = userId;
  next();
}
const audit = (sql, req, action, target) => sql`INSERT INTO audit_log (clerk_id, action, target) VALUES (${req.adminId}, ${action}, ${target})`;
app.get('/api/health', async (_req, res) => { await database()`SELECT 1`; res.json({ ok:true, mode:process.env.STORE_MODE || 'staging' }); });
app.get('/api/catalogue', async (_req, res) => res.json(await catalogue()));
app.post('/api/checkout/quote',async(req,res)=>res.json(await quoteCart(req.body,req.get('authorization')?getAuth(req).userId:null)));
app.post('/api/welcome',async(req,res)=>{
 const{userId}=getAuth(req);if(!userId)return res.status(401).json({error:'Sign in required'});
 const{email}=z.object({email:z.email().max(200)}).strict().parse(req.body),normalized=email.trim().toLowerCase(),user=await clerkClient.users.getUser(userId);
 if(!user.emailAddresses.some(address=>address.emailAddress.toLowerCase()===normalized&&address.verification?.status==='verified'))return res.status(403).json({error:'Verify this email address in your account first.'});
 await database()`INSERT INTO welcome_offers(email,clerk_id) VALUES(${normalized},${userId}) ON CONFLICT DO NOTHING`;
 res.json({eligible:!!await welcomeEligibility(userId,process.env.PAYMENTS_MODE!=='live')});
});
app.post('/api/checkout/session',async(req,res)=>{
  const {userId}=getAuth(req);if(!userId)return res.status(401).json({error:'Sign in to place your order'});
  const origin=process.env.APP_ORIGIN||`${req.protocol}://${req.get('host')}`;
  res.status(201).json(await createCheckout(req.body,userId,origin));
});
app.get('/api/orders',async(req,res)=>{
  const {userId}=getAuth(req);if(!userId)return res.status(401).json({error:'Sign in required'});
  res.json(await database()`SELECT id,status,is_test,total_minor,currency,created_at,expires_at,fulfillment_status,tracking_number,confirmed_at,shipped_at,delivered_at FROM orders WHERE clerk_id=${userId} ORDER BY created_at DESC LIMIT 50`);
});
app.get('/api/orders/:id',async(req,res)=>{
  const {userId}=getAuth(req);if(!userId)return res.status(401).json({error:'Sign in required'});
  const id=z.uuid().parse(req.params.id);
  const [order]=await database()`SELECT id,status,is_test,items,total_minor,currency,created_at,expires_at,fulfillment_status,tracking_number,confirmed_at,shipped_at,delivered_at FROM orders WHERE id=${id}::uuid AND clerk_id=${userId}`;
  if(!order)return res.status(404).json({error:'Order not found'});res.json(order);
});
app.get('/api/session', async (req, res) => {
  const {userId}=getAuth(req);
  const rows=userId?await database()`SELECT clerk_id FROM admin_users WHERE clerk_id=${userId}`:[];
  res.json({ signedIn:!!userId, isAdmin:rows.length>0 });
});
app.use('/api/admin', admin);
app.get('/api/admin/products', async (_req, res) => res.json(await catalogue(true)));
app.get('/api/admin/categories', async (_req, res) => res.json(await database()`SELECT c.*,count(p.id)::integer AS product_count FROM categories c LEFT JOIN products p ON p.category=c.name GROUP BY c.name ORDER BY c.position,c.name`));
app.get('/api/admin/orders',async(req,res)=>res.json(await adminOrders(req.query)));
app.get('/api/admin/orders/:id',async(req,res)=>{
 const id=z.uuid().parse(req.params.id),sql=database();
 const [order]=await sql`SELECT id,status,is_test,customer,items,total_minor,currency,created_at,expires_at,provider_status,fulfillment_status,fulfillment_version,tracking_number,confirmed_at,shipped_at,delivered_at FROM orders WHERE id=${id}::uuid`;
 if(!order)return res.status(404).json({error:'Order not found'});
 const history=await sql`SELECT previous_status,status,tracking_number,created_at FROM order_fulfillment_events WHERE order_id=${id}::uuid ORDER BY created_at,id`;
 res.json({...order,history});
});
app.patch('/api/admin/orders/:id',async(req,res)=>res.json(await updateFulfillment(z.uuid().parse(req.params.id),req.body,req.adminId)));
app.post('/api/admin/categories', async (req, res) => {
  const body = z.object({ name:z.string().trim().regex(/^[\p{L}\p{N} -]{1,80}$/u), name_uk:z.string().trim().min(1).max(80) }).strict().parse(req.body);
  const sql = database();
  await sql.transaction([sql`INSERT INTO categories (name, name_uk) VALUES (${body.name}, ${body.name_uk})`, audit(sql, req, 'category.create', body.name)]);
  res.status(201).json(body);
});
app.patch('/api/admin/categories/:name',async(req,res)=>{
  const body=z.object({name:z.string().trim().regex(/^[\p{L}\p{N} -]{1,80}$/u),name_uk:z.string().trim().min(1).max(80)}).strict().parse(req.body),old=req.params.name,sql=database();
  const [category]=await sql`SELECT name FROM categories WHERE name=${old}`;if(!category)return res.status(404).json({error:'Category not found'});
  if(body.name===old)await sql.transaction([sql`UPDATE categories SET name_uk=${body.name_uk} WHERE name=${old}`,audit(sql,req,'category.update',old)]);
  else await sql.transaction([sql`INSERT INTO categories(name,name_uk,position) SELECT ${body.name},${body.name_uk},position FROM categories WHERE name=${old}`,sql`UPDATE products SET category=${body.name},data=jsonb_set(data,'{category}',to_jsonb(${body.name}::text)),version=version+1,updated_at=now() WHERE category=${old}`,sql`DELETE FROM categories WHERE name=${old}`,audit(sql,req,'category.rename',old)]);
  res.json(body);
});
app.delete('/api/admin/categories/:name',async(req,res)=>{
  const body=z.object({moveTo:z.string().min(1).max(80).optional()}).strict().parse(req.body||{}),name=req.params.name,sql=database();
  const [count]=await sql`SELECT count(*)::integer AS total FROM products WHERE category=${name}`;
  if(count.total&&!body.moveTo)return res.status(409).json({error:'Category contains products. Choose where to move them first.'});
  if(body.moveTo===name)return res.status(400).json({error:'Choose a different category'});
  const statements=[];
  if(body.moveTo)statements.push(sql`UPDATE products SET category=${body.moveTo},data=jsonb_set(data,'{category}',to_jsonb(${body.moveTo}::text)),version=version+1,updated_at=now() WHERE category=${name}`);
  statements.push(sql`DELETE FROM categories WHERE name=${name}`,audit(sql,req,'category.delete',name));await sql.transaction(statements);res.json({ok:true});
});
const contentSchema=z.object({contact:bilingualText,shipping:bilingualText,privacy:bilingualText,terms:bilingualText}).strict();
app.get('/api/admin/content',async(_req,res)=>{const [row]=await database()`SELECT value FROM store_settings WHERE key='content'`,defaults=defaultStoreContent();res.json(Object.fromEntries(Object.entries(defaults).map(([key,value])=>[key,{uk:row?.value?.[key]?.uk||value.uk,en:row?.value?.[key]?.en||value.en}])));});
app.put('/api/admin/content',async(req,res)=>{const content=contentSchema.parse(req.body),sql=database();await sql.transaction([sql`INSERT INTO store_settings(key,value) VALUES('content',${JSON.stringify(content)}::jsonb) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value`,audit(sql,req,'content.update','store')]);res.json({ok:true});});
app.get('/api/admin/legal-profile',async(_req,res)=>{const [row]=await database()`SELECT value FROM store_settings WHERE key='legal_profile'`;res.json(publicLegalProfile(row?.value));});
const publicLinksSchema=z.object(Object.fromEntries(Object.keys(emptyPublicLinks).map(key=>[key,z.string().trim().max(500).refine(value=>validPublicLink(key,value),'Enter the correct HTTPS profile URL or work email')]))).strict();
app.get('/api/admin/public-links',async(_req,res)=>{const[row]=await database()`SELECT value FROM store_settings WHERE key='public_links'`;res.json(publicLinks(row?.value));});
app.put('/api/admin/public-links',async(req,res)=>{const value=publicLinksSchema.parse(req.body),sql=database();await sql.transaction([sql`INSERT INTO store_settings(key,value) VALUES('public_links',${JSON.stringify(value)}::jsonb) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value`,audit(sql,req,'public-links.update','store')]);res.json({ok:true});});
app.put('/api/admin/legal-profile',async(req,res)=>{const value=legalProfileSchema.parse(req.body),sql=database();await sql.transaction([sql`INSERT INTO store_settings(key,value) VALUES('legal_profile',${JSON.stringify(value)}::jsonb) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value`,audit(sql,req,'legal-profile.update','store')]);res.json({ok:true});});
app.post('/api/admin/products', async (req, res) => {
  const p = productSchema.parse(req.body);
  const sql = database();
  await sql.transaction([sql`INSERT INTO products (id, category, data, published) VALUES (${p.id}, ${p.category}, ${JSON.stringify(p)}::jsonb, ${p.published})`, audit(sql, req, 'product.create', p.id)]);
  res.status(201).json({ id:p.id, version:1 });
});
app.put('/api/admin/products/:id', async (req, res) => {
  const p = productSchema.parse(req.body);
  if (p.id !== req.params.id || !p.version) return res.status(400).json({ error:'Product ID and version required' });
  const sql = database();
  const rows = await sql`WITH updated AS (
    UPDATE products SET category=${p.category}, data=${JSON.stringify(p)}::jsonb, published=${p.published}, version=version+1, updated_at=now() WHERE id=${p.id} AND version=${p.version} AND deleted_at IS NULL RETURNING version
  ), logged AS (
    INSERT INTO audit_log (clerk_id, action, target) SELECT ${req.adminId}, 'product.update', ${p.id} FROM updated
  ) SELECT version FROM updated`;
  if (!rows.length) return res.status(409).json({ error:'Product changed. Refresh before saving.' });
  res.json({ id:p.id, version:rows[0].version });
});
app.delete('/api/admin/products/:id',async(req,res)=>{
  const {version}=z.object({version:z.number().int().positive()}).strict().parse(req.body),sql=database();
  const rows=await sql`WITH removed AS(UPDATE products SET deleted_at=now(),published=false,version=version+1,updated_at=now() WHERE id=${req.params.id} AND version=${version} AND deleted_at IS NULL RETURNING id),logged AS(INSERT INTO audit_log(clerk_id,action,target) SELECT ${req.adminId},'product.delete',id FROM removed) SELECT id FROM removed`;
  if(!rows.length)return res.status(409).json({error:'Product changed. Refresh before deleting.'});res.json({ok:true});
});
app.post('/api/admin/uploads', express.raw({ type:['image/png','image/jpeg','image/webp'], limit:'4mb' }), async (req, res) => {
  const body = req.body;
  if (!Buffer.isBuffer(body)) return res.status(415).json({ error:'PNG, JPEG or WebP required' });
  const png = body.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const jpg = body[0]===255 && body[1]===216 && body[2]===255;
  const webp = body.toString('ascii',0,4)==='RIFF' && body.toString('ascii',8,12)==='WEBP';
  const type = png?'image/png':jpg?'image/jpeg':webp?'image/webp':null;
  if (!type || type !== req.get('content-type')) return res.status(415).json({ error:'Image content does not match its type' });
  const blob = await put(`products/${randomUUID()}.${png?'png':jpg?'jpg':'webp'}`, body, { access:'public', contentType:type, addRandomSuffix:true });
  await audit(database(), req, 'image.upload', blob.pathname);
  res.status(201).json({ url:blob.url });
});
app.get('/runtime.js', (_req, res) => {
  res.type('js').set('Cache-Control','no-store').send(`window.CIVIS_RUNTIME=${JSON.stringify({ publishableKey:process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY })};`);
});
app.get('/store-data.js',async(_req,res)=>res.type('js').set('Cache-Control','no-store').send(publicGlobals(await storefrontData())));

const publicDir = fileURLToPath(new URL('../public/', import.meta.url));
app.get('/robots.txt',(_req,res)=>res.type('text/plain').set('Cache-Control','public, max-age=300').send(isIndexingEnabled(process.env)?`User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${siteOrigin(process.env.SITE_URL)}/sitemap.xml\n`:'User-agent: *\nDisallow: /\n'));
app.get('/sitemap.xml',async(_req,res)=>{
 const [data,images]=await Promise.all([storefrontData(),readFile(new URL('../public/image-manifest.json',import.meta.url),'utf8').then(JSON.parse)]);
 const entries=catalogueSitemapEntries(data,file=>images[file]?.variants?.at(-1)?.url||file);
 res.type('application/xml').set('Cache-Control','public, max-age=300').send(sitemapXml(isIndexingEnabled(process.env)?entries:[],siteOrigin(process.env.SITE_URL)));
});
app.get(Object.values(legalDocuments).map(doc=>doc.path),async(req,res)=>{const key=Object.keys(legalDocuments).find(key=>legalDocuments[key].path===req.path.replace(/\/+$/,'')),locale=req.query.lang==='en'?'en':'uk';res.type('html').set('Cache-Control','no-store').set('Content-Language',locale).send(await legalHtml(key,locale));});
app.get(['/about','/contacts'],async(req,res)=>{const locale=req.query.lang==='en'?'en':'uk';res.type('html').set('Cache-Control','no-store').set('Content-Language',locale).send(await companyHtml(req.path.slice(1),locale));});
app.use(express.static(publicDir, { index:false, dotfiles:'deny',setHeaders(res,path){if(/-[a-f0-9]{12}\.(?:js|css)$/.test(path)||/[\\/]assets[\\/]optimized[\\/]/.test(path))res.setHeader('Cache-Control','public, max-age=31536000, immutable');else if(/\.woff2$/.test(path))res.setHeader('Cache-Control','public, max-age=86400');} }));
app.get('/admin', (_req, res) => res.sendFile(`${publicDir}/admin.html`));
app.get(['/checkout','/checkout/return'],async(req,res)=>{const[data,template]=await Promise.all([publicFooterData(),readFile(new URL('../public/checkout.html',import.meta.url),'utf8')]),locale=req.query.lang==='en'?'en':'uk';const html=template.replace(/<footer class="checkout-footer">[\s\S]*?<\/footer>/,()=>renderSiteFooter({...data,locale,path:req.path})).replace('</head>',`<script>window.CIVIS_FOOTER_DATA=${JSON.stringify(data).replace(/</g,'\\u003c')};</script></head>`);res.type('html').set('Cache-Control','no-store').send(html);});
app.post('/checkout/return',(req,res)=>{
  const id=z.uuid().safeParse(req.query.order);
  // A browser return only restores navigation; signed webhooks determine payment status.
  res.redirect(303,id.success?`/checkout/return?order=${id.data}`:'/checkout');
});
app.get(['/', '/login', '/register', '/forgot', '/account', '/catalogue', '/product/:id'], async(req,res)=>{const page=await storefrontHtml(req.path,req.query);if(page.status===404)res.set('X-Robots-Tag','noindex, follow');res.status(page.status).type('html').set('Cache-Control','no-store').set('Content-Language',req.query.lang==='en'?'en':'uk').send(page.html);});
app.use((req,res)=>res.status(404).set('X-Robots-Tag','noindex, follow').type(req.path.startsWith('/api/')?'json':'html').send(req.path.startsWith('/api/')?{error:'Not found'}:notFoundHtml(req.query.lang==='en'?'en':'uk')));
app.use((error, _req, res, _next) => {
  if (error instanceof z.ZodError) return res.status(400).json({ error:_req.path.startsWith('/api/checkout')?'Check checkout fields':_req.path==='/api/admin/legal-profile'?'Check seller details':_req.path==='/api/admin/content'?'Check page content':'Check product fields', fields:error.issues.map(i=>({ path:i.path, message:i.message })) });
  if (error.code === '23505') return res.status(409).json({ error:'This ID already exists' });
  if (error.code === '23503') return res.status(400).json({ error:'Choose an existing category' });
  if (error.type === 'entity.too.large') return res.status(413).json({ error:'File or request is too large' });
  if(error.status&&[400,403,404,409,503].includes(error.status))return res.status(error.status).json({error:error.message});
  const checkoutErrors={INSUFFICIENT_STOCK:'Some pieces are no longer available. Please review your cart.',PRODUCT_CHANGED:'Product details changed. Refresh the total before paying.',IDEMPOTENCY_CONFLICT:'Order details changed. Please start checkout again.',ORDER_EXPIRED:'This payment session expired. Please start a new checkout.',TOO_MANY_PENDING:'You already have three pending payment sessions. Please wait for one to expire.'};
  if(checkoutErrors[error.message])return res.status(409).json({error:checkoutErrors[error.message]});
  console.error('Store request failed:', error.name, error.code || 'internal');
  res.status(500).json({ error:'The store service is temporarily unavailable' });
});
export default app;
