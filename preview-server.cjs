/* Local-only preview. Source updates never interrupt shopping interactions. */
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=__dirname,clients=new Set();
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.json':'application/json; charset=utf-8','.woff2':'font/woff2'};
const live=`<script>(()=>{if(window.parent!==window)return;const live=new EventSource('/__preview_events');live.addEventListener('change',()=>window.dispatchEvent(new CustomEvent('civis:source-updated')));})();</script>`;
const server=http.createServer((req,res)=>{
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname)}catch{res.writeHead(400);res.end();return}
  if(pathname==='/__preview_events'){res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive'});res.write(': connected\n\n');clients.add(res);req.on('close',()=>clients.delete(res));return}
  const relative=pathname==='/'?'index.html':pathname.slice(1),file=path.resolve(root,relative),ext=path.extname(file).toLowerCase();
  const safe=path.relative(root,file);
  if(safe.startsWith('..')||path.isAbsolute(safe)||safe.split(/[\\/]/).some(part=>part.startsWith('.')&&part!=='.od-frames')||!types[ext]){res.writeHead(403);res.end('Not served by this preview');return}
  fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);res.end('File not found');return}res.writeHead(200,{'Content-Type':types[ext],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(ext==='.html'?data.toString('utf8').replace('</body>',live+'</body>'):data)});
});
let timer;
fs.watch(root,{recursive:true},(event,filename)=>{if(!filename)return;const relative=String(filename).replaceAll('\\','/');if(relative.startsWith('.')&&!relative.startsWith('.od-frames/'))return;if(!/\.(html|css|js|json|svg|png|jpg|webp)$/.test(relative))return;clearTimeout(timer);timer=setTimeout(()=>{for(const client of clients)client.write('event: change\ndata: reload\n\n')},250)});
server.listen(5180,'127.0.0.1',()=>console.log('Civis Atelier live preview: http://127.0.0.1:5180/'));
server.on('error',error=>{console.error(error.message);process.exitCode=1});
