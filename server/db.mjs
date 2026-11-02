import { neon } from '@neondatabase/serverless';
export function database() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  return neon(process.env.DATABASE_URL);
}
export async function catalogue(includeDrafts = false) {
  const sql = database();
  const rows = includeDrafts
    ? await sql`SELECT id, data, version, published FROM products WHERE deleted_at IS NULL ORDER BY created_at, id`
    : await sql`SELECT id, data, version, published FROM products WHERE published = true AND deleted_at IS NULL ORDER BY created_at, id`;
  return rows.map(r => ({ ...r.data, id: r.id, version: r.version, published: r.published }));
}
