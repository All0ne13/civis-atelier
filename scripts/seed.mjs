import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { database } from '../server/db.mjs';
const context = { window: {} };
for (const file of ['data.js', 'product-media.js', 'pricing.js']) vm.runInNewContext(await readFile(file, 'utf8'), context);
const { CATALOGUE, UK, CIVIS_MEDIA, CIVIS_PRICING } = context.window;
const sql = database();
for (const [position, name] of ['Shirts', 'T-shirts', 'Jeans', 'Hoodies'].entries()) {
  await sql`INSERT INTO categories (name, name_uk, position) VALUES (${name}, ${UK[name] || name}, ${position}) ON CONFLICT DO NOTHING`;
}
const hex = { Black:'#222825', Cream:'#e7e1ce', White:'#ffffff', Olive:'#686b50', Mint:'#b8c9b6', Petrol:'#315851' };
for (const product of CATALOGUE) {
  const data = { ...product, nameUk: UK[product.name] || product.name, descriptionUk: UK[product.description] || product.description, media: CIVIS_MEDIA[product.id] || [], colorValues: Object.fromEntries(product.colors.map(c => [c, hex[c]])) };
  await sql`INSERT INTO products (id, category, data, published) VALUES (${product.id}, ${product.category}, ${JSON.stringify(data)}::jsonb, true) ON CONFLICT DO NOTHING`;
}
await sql`INSERT INTO store_settings (key, value) VALUES ('pricing', ${JSON.stringify(CIVIS_PRICING)}::jsonb) ON CONFLICT DO NOTHING`;
console.log(`Seed checked: ${CATALOGUE.length} original products. Existing edits preserved.`);
