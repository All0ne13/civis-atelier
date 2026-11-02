import{database}from'./db.mjs';
import{publicLinks}from'../shared/public-links.mjs';
export async function publicFooterData(){
 const sql=database(),[categories,settings]=await Promise.all([sql`SELECT name,name_uk FROM categories ORDER BY position,name`,sql`SELECT value FROM store_settings WHERE key='public_links'`]);
 return{categories:categories.map(row=>row.name),translations:Object.fromEntries(categories.map(row=>[row.name,row.name_uk])),links:publicLinks(settings[0]?.value)};
}
