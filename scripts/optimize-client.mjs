import{readFile,writeFile,readdir,mkdir,copyFile}from'node:fs/promises';
import{posix}from'node:path';
import{createHash}from'node:crypto';
import{transform}from'esbuild';
const hash=value=>createHash('sha256').update(value).digest('hex').slice(0,12);
async function stylesheet(file){
 let css=await readFile('public/'+file,'utf8'),match;
 const imports=[];const pattern=/@import\s*(?:url\(\s*)?['"]([^'"]+)['"]\s*\)?\s*;/g;
 while((match=pattern.exec(css))){const path=match[1].startsWith('/')?match[1].slice(1):posix.join(posix.dirname(file),match[1]);imports.push(await stylesheet(path));}
 css=css.replace(pattern,'').replace(/url\((['"]?)([^)'"\s]+)\1\)/g,(all,quote,url)=>/^(?:data:|https?:|\/|#)/.test(url)?all:`url("/${posix.join(posix.dirname(file),url)}")`);
 return imports.join('\n')+'\n'+css;
}
export async function optimizeClient(){
 const files=(await readdir('public')).filter(file=>/\.(?:js|css|mjs)$/.test(file)&&!/-[a-f0-9]{12}\.(?:js|css)$/.test(file)),urls={};
 for(const file of files){let source=await readFile('public/'+file,'utf8');if(file.endsWith('.css'))source=source.replaceAll('img[src$="techwear-hoodie.png"]','img[data-original$="techwear-hoodie.png"]');const optimized=await transform(source,{loader:file.endsWith('.css')?'css':'js',minify:true,target:'es2020',legalComments:'eof'});await writeFile('public/'+file,optimized.code);if(!file.endsWith('.mjs')){const name=file.replace(/\.(js|css)$/,`-${hash(optimized.code)}.$1`);await writeFile('public/'+name,optimized.code);urls['/'+file]='/'+name;}}
 for(const page of ['store','checkout','admin','legal']){
  let html=await readFile(`public/${page}.html`,'utf8');
  html=html.replace('</head>','<link rel="stylesheet" href="/design-system.css"><link rel="stylesheet" href="/motion-system.css"></head>');
  const links=[...html.matchAll(/<link\s[^>]*rel="stylesheet"[^>]*>/g)],css=[];
  for(const link of links){const href=link[0].match(/href="([^"]+)"/)?.[1];if(href)css.push(await stylesheet(href.replace(/^\//,'').split('?')[0]));html=html.replace(link[0],'');}
  const bundled=await transform(css.join('\n'),{loader:'css',minify:true,target:'es2020'}),name=`${page}-ui-${hash(bundled.code)}.css`;await writeFile('public/'+name,bundled.code);
  html=html.replace('</head>',`<link rel="stylesheet" href="/${name}">${page==='store'?`<link rel="preload" href="${urls['/app.js']}" as="script" crossorigin="anonymous">`:''}</head>`);
  if(!html.includes('src="/images.js"'))html=html.replace('<script defer src="/auth-live.js"','<script src="/images.js" defer></script><script defer src="/auth-live.js"');
  html=html.replace(/(src|href)="([^"]+)"/g,(all,attribute,url)=>{const mapped=urls['/'+url.replace(/^\//,'').split('?')[0]];return mapped?`${attribute}="${mapped}"`:all;});
  const fonts=['caveat-latin','caveat-cyrillic'].map(name=>`<link rel="preload" href="/assets/fonts/${name}-wght-normal.woff2" as="font" type="font/woff2" crossorigin>`).join('');
  html=html.replace('<head>',`<head>${fonts}<script>window.CIVIS_ASSET_URLS=${JSON.stringify(urls)};</script>`);
  await writeFile(`public/${page}.html`,html);
 }
 await mkdir('public/licenses',{recursive:true});await copyFile('node_modules/morphdom/LICENSE','public/licenses/morphdom.txt');
 console.log('Minified client scripts, bundled styles and fingerprinted browser assets.');
}
