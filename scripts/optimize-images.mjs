import sharp from 'sharp';
import{readdir,readFile,mkdir,writeFile,access}from'node:fs/promises';
import{createHash}from'node:crypto';
sharp.concurrency(2);
export async function optimizeImages(){
 const encoding={quality:82,effort:4,alphaQuality:100};
 const manifest={};await mkdir('public/assets/optimized',{recursive:true});
 async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const path=dir+'/'+entry.name;if(entry.isDirectory()){if(entry.name!=='fonts'&&entry.name!=='brand')await walk(path);}else if(/\.(png|jpe?g|webp)$/i.test(path)){
  const input=await readFile(path);if(input.length<12000)continue;
  const hash=createHash('sha256').update(input).update(JSON.stringify(encoding)).digest('hex').slice(0,12),metadata=await sharp(input).metadata(),widths=[...new Set([96,360,720,960,1440].map(width=>Math.min(width,metadata.width)))].sort((a,b)=>a-b),variants=[];
  for(const width of widths){const url=`assets/optimized/${hash}-${width}.webp`,output='public/'+url;try{await access(output);}catch{await sharp(input).rotate().resize({width,withoutEnlargement:true}).webp(encoding).toFile(output);}variants.push({width,url});}
  const social=`assets/optimized/${hash}-social.jpg`;try{await access('public/'+social);}catch{await sharp(input).rotate().resize(1200,630,{fit:'contain',background:'#e6eadf'}).flatten({background:'#e6eadf'}).jpeg({quality:85,mozjpeg:true}).toFile('public/'+social);}
  manifest[path]={variants,src:(variants.find(v=>v.width>=720)||variants.at(-1)).url,social};
 }}}
 await walk('assets');await writeFile('public/image-manifest.json',JSON.stringify(manifest));
 const helpers=await readFile('web/images.js','utf8');await writeFile('public/images.js',`window.CIVIS_IMAGE_MANIFEST=${JSON.stringify(manifest)};\n`+helpers);
 console.log(`Optimized ${Object.keys(manifest).length} photographs with responsive WebP sizes.`);return manifest;
}
