import { readFile, readdir } from 'node:fs/promises';
import { database } from '../server/db.mjs';
const sql = database();
const directory=new URL('../db/migrations/',import.meta.url);
for(const file of (await readdir(directory)).filter(f=>f.endsWith('.sql')).sort()) {
  const source=await readFile(new URL(file,directory),'utf8');
  const statements=source.includes('-- statement-breakpoint')?source.split('-- statement-breakpoint'):source.split(';');
  await sql.transaction(statements.map(s=>s.trim()).filter(Boolean).map(s=>sql.query(s)));
  console.log(`Applied ${file}`);
}
console.log('Store schema ready.');
