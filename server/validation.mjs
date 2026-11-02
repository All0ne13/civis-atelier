import { z } from 'zod';
const text = z.string().trim().min(1).max(160);
export const bilingualText=z.object({en:z.string().trim().max(10000),uk:z.string().trim().max(10000)}).strict();
export const productSizeSchema=z.string().trim().min(1).max(12).regex(/^[\p{L}\p{N}][\p{L}\p{N} ./×-]*$/u,'Use a size label such as M, 32 or W32/L34');
const size=productSizeSchema;
const measurement=z.number().positive().max(300).nullable().optional();
export const sizeGuideSchema=z.object({kind:z.enum(['tops','bottoms']),note:bilingualText,rows:z.array(z.object({size,chest:measurement,shoulder:measurement,length:measurement,sleeve:measurement,waist:measurement,hips:measurement,inseam:measurement}).strict()).max(12).refine(rows=>new Set(rows.map(row=>row.size.toLowerCase())).size===rows.length,'Each size needs a unique row')}).strict();
export function safeImage(value) {
  if (/^assets\/[a-zA-Z0-9_./-]+\.(png|jpe?g|webp|avif)$/.test(value) && !value.includes('..')) return true;
  try { const url = new URL(value); return url.protocol === 'https:' && /^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/.test(url.hostname) && !url.username && !url.password; } catch { return false; }
}
export const productSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100),
  name: text, nameUk: text, category: text,
  collection: z.enum(['Men', 'Women', 'Kids']),
  price: z.number().int().min(0).max(100000000),
  stock: z.number().int().min(0).max(1000000),
  colors: z.array(z.string().trim().min(1).max(40)).min(1).max(12).refine(a => new Set(a).size === a.length),
  colorValues: z.record(z.string().regex(/^[\p{L}\p{N} -]{1,40}$/u), z.string().regex(/^#[0-9a-f]{6}$/i)),
  sizes: z.array(size).min(1).max(12).refine(a => new Set(a.map(s=>s.toLowerCase())).size === a.length,'Size labels must be unique'),
  unavailableSizes:z.array(size).max(12).refine(a=>new Set(a.map(s=>s.toLowerCase())).size===a.length).default([]),
  description: z.string().trim().min(1).max(5000), descriptionUk: z.string().trim().min(1).max(5000),
  details:z.object({info:bilingualText.optional(),story:bilingualText.optional(),manufacturing:bilingualText.optional(),packaging:bilingualText.optional(),composition:bilingualText.optional(),care:bilingualText.optional(),shipping:bilingualText.optional()}).strict().default({}),
  sizeGuide:sizeGuideSchema.optional(),
  media: z.array(z.object({ file: z.string().refine(safeImage), color: text, view: z.enum(['front','back','detail']), width: z.number().int().min(1).max(16000), height: z.number().int().min(1).max(16000) }).strict()).min(1).max(36),
  image: z.string().regex(/^[a-z0-9-]+$/).default('cotton-white'),
  isNew: z.boolean(), published: z.boolean(), version: z.number().int().positive().optional()
}).strict().superRefine((p, ctx) => {
  if(p.unavailableSizes.some(size=>!p.sizes.includes(size)))ctx.addIssue({code:'custom',message:'Unavailable sizes must belong to the product',path:['unavailableSizes']});
  if(p.sizeGuide?.rows.some(row=>!p.sizes.includes(row.size)))ctx.addIssue({code:'custom',message:'Size guide rows must match the product sizes',path:['sizeGuide','rows']});
  for (const c of p.colors) if (!p.colorValues[c] || !p.media.some(m => m.color === c && m.view === 'front')) ctx.addIssue({ code:'custom', message:`Missing color or front photograph: ${c}`, path:['media'] });
  if (p.media.some(m => !p.colors.includes(m.color))) ctx.addIssue({ code:'custom', message:'Photograph color must belong to product', path:['media'] });
});
