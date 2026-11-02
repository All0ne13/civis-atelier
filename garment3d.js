/* Local parametric garment studies: real meshes, depth, lighting and 360° rotation.
   These are illustrative shapes, not scans or manufacturing-accurate product models. */
(() => {
  const palette={Black:[.115,.125,.12],Cream:[.88,.85,.75],White:[.93,.94,.92],Olive:[.35,.39,.22],Mint:[.65,.76,.66],Petrol:[.12,.30,.29]};
  const reduced=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const sub=(a,b)=>a.map((x,i)=>x-b[i]);
  const unit=a=>{const n=Math.hypot(...a)||1;return a.map(x=>x/n)};
  const mix=(a,b,t)=>a+(b-a)*t;
  const cache=new Map();let activeMain=null,activeHover=null;
  function geometry(product){
    const key=product.id; if(cache.has(key))return cache.get(key);
    const positions=[],normals=[],materials=[];let lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
    function vertex(p,n,m){positions.push(...p);normals.push(...n);materials.push(m);p.forEach((x,i)=>{lo[i]=Math.min(lo[i],x);hi[i]=Math.max(hi[i],x)})}
    function grid(fn,nu=48,nv=24,mat=0,reverse=false){
      const samples=[];for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){const u=i/nu,v=j/nv,p=fn(u,v),a=fn(Math.min(1,u+.0003),v),b=fn(Math.max(0,u-.0003),v),c=fn(u,Math.min(1,v+.0003)),d=fn(u,Math.max(0,v-.0003));let n=unit(cross(sub(c,d),sub(a,b)));if(reverse)n=n.map(x=>-x);samples.push([p,n])}
      for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=j*(nu+1)+i,b=a+1,c=a+nu+1,d=c+1;for(const index of [a,c,b,b,c,d])vertex(...samples[index],mat)}
    }
    function tube(points,radii,mat=0,rz=1,cloth=false){
      const levels=points.map((p,i)=>[...p,radii[i]]);
      grid((u,v)=>{const c=profile(levels,v),a=profile(levels,Math.max(0,v-.001)),b=profile(levels,Math.min(1,v+.001)),dir=unit(sub(b.slice(0,3),a.slice(0,3))),right=unit([dir[1],-dir[0],0]),angle=u*Math.PI*2;
        const wrinkle=cloth?(.009*Math.sin(angle*7+v*13)+.006*Math.sin(angle*11-v*22))*Math.sin(v*Math.PI):0,r=c[3]+wrinkle;
        return [c[0]+right[0]*Math.cos(angle)*r,c[1]+right[1]*Math.cos(angle)*r,c[2]+Math.sin(angle)*r*rz]},48,Math.max(12,points.length*12),mat);
    }
    function line(points,r=.009,mat=1){tube(points,points.map(()=>r),mat)}
    function sphere(cx,cy,cz,rx,ry,rz,mat=0){grid((u,v)=>{const a=u*Math.PI*2,b=(v-.5)*Math.PI;return [cx+rx*Math.cos(a)*Math.cos(b),cy+ry*Math.sin(b),cz+rz*Math.sin(a)*Math.cos(b)]},32,16,mat)}
    function profile(levels,v){const a=v*(levels.length-1),i=Math.min(levels.length-2,Math.floor(a)),t=a-i,p0=levels[Math.max(0,i-1)],p1=levels[i],p2=levels[i+1],p3=levels[Math.min(levels.length-1,i+2)];return p1.map((x,j)=>.5*(2*x+(-p0[j]+p2[j])*t+(2*p0[j]-5*x+4*p2[j]-p3[j])*t*t+(-p0[j]+3*x-3*p2[j]+p3[j])*t*t*t))}
    if(product.category==='Jeans'){
      tube([[0,.96,0],[0,.64,0],[0,.38,0]],[.48,.48,.45],0,.46);
      for(const sign of [-1,1]){
        tube([[sign*.24,.48,0],[sign*.25,-.15,0],[sign*.27,-.82,0],[sign*.29,-1.35,0]],[.25,.235,.21,.205],0,.7);
        line([[sign*.48,.45,.02],[sign*.48,-.15,.01],[sign*.49,-.8,.01],[sign*.49,-1.34,.01]],.008);
        line([[sign*.1,.70,.23],[sign*.18,.50,.23],[sign*.35,.51,.20]],.008);
        tube([[sign*.29,-1.32,0],[sign*.29,-1.35,0]],[.207,.207],1,.7);
      }
      line([[-.45,.86,.20],[0,.86,.23],[.45,.86,.20]],.012);sphere(0,.83,.237,.025,.025,.012,2);
    }else{
      const hoodie=product.category==='Hoodies',shirt=product.category==='Shirts';
      const heavy=key==='heavy-black',width=hoodie?1.08:heavy?1.06:key==='essential-cream'?.94:1;
      const levels=[[-.93,.52,.18],[-.85,.55,.205],[-.55,.56,.23],[-.15,.58,.245],[.2,.62,.255],[.45,.63,.25],[.59,.50,.21],[.69,.20,.145]];
      const body=(u,v)=>{const [y,rx,rz]=profile(levels,v),a=u*Math.PI*2,side=Math.cos(a),front=Math.sin(a),fold=(.012*Math.sin(a*9+y*2)+.007*Math.sin(a*17-y*5))*(1-v*.65),tension=.010*Math.sin(y*21+Math.abs(side)*9)*Math.pow(Math.abs(side),5)*Math.sin(v*Math.PI);
        return [(rx+fold)*side*width,y-(front>0?.045:0)*Math.pow(v,9),(rz+fold+tension)*Math.sign(front)*Math.pow(Math.abs(front),.68)]};
      grid(body,88,72);
      for(const sign of [-1,1]){
        const points=hoodie?[[sign*.44,.38,-.01],[sign*.69,.26,0],[sign*.85,-.06,.02],[sign*.99,-.51,.06],[sign*.99,-.87,.10]]:[[sign*.43,.36,0],[sign*.70,.25,0],[sign*.96,.09,.02]];
        const rs=hoodie?[.27,.275,.23,.185,.14]:[.255,.252,.22];tube(points,rs,0,.82,true);
        const end=points[points.length-1],prev=points[points.length-2];tube([end.map((x,i)=>mix(prev[i],x,hoodie?.72:.94)),end],[rs.at(-1)+.002,rs.at(-1)],1,.82);
        if(hoodie){
          line([[sign*.73,.14,.21],[sign*.83,-.09,.21],[sign*.92,-.34,.21]],.004,1);
          tube([[sign*.85,-.20,.185],[sign*.90,-.33,.195]],[.027,.027],2,.26);
        }
      }
      tube([[0,-.94,0],[0,hoodie?-.84:-.91,0]],[.525*width,.535*width],1,.36);
      if(!shirt)tube([[0,.67,0],[0,.72,0]],[.203,.205],1,.78);
      if(shirt){
        line([[0,-.86,.255],[0,-.4,.29],[0,.15,.30],[0,.52,.25]],.015,1);
        for(let y=-.65;y<.45;y+=.23)sphere(.015,y,.315,.018,.018,.009,2);
        for(const sign of [-1,1]){
          const a=[sign*.04,.66,.14],b=[sign*.28,.56,.23],c=[sign*.15,.34,.30],n=unit(cross(sub(b,a),sub(c,a)));if(n[2]<0)n.forEach((x,i)=>n[i]=-x);
          for(const point of [a,b,c])vertex(point,n,1);
          line([a,b,c,a],.003,1);
        }
        line([[-.48,.41,-.27],[0,.39,-.29],[.48,.41,-.27]],.009);
      }
      if(hoodie){
        const hood=(u,v,inset=0)=>{const a=Math.PI+u*Math.PI,b=v*Math.PI*.5;return [(.36-inset)*Math.cos(a)*Math.cos(b),.59+(.61-inset)*Math.sin(b),-.04+(.39-inset)*Math.sin(a)*Math.cos(b)]};
        grid((u,v)=>hood(u,v),56,36);grid((u,v)=>hood(u,v,.014),56,36,3,true);
        const hoodRim=[];for(let i=0;i<=48;i++){const a=i/48*Math.PI;hoodRim.push([.36*Math.cos(a),.59+.61*Math.sin(a),-.03])}line(hoodRim,.015,1);
        tube([[0,.60,.025],[0,.76,.045],[0,.84,.05]],[.23,.26,.255],0,.76,true);
        line([[-.22,.79,.14],[-.09,.81,.23],[.09,.79,.24],[.23,.75,.15]],.009,1);
        for(const sign of [-1,1]){line([[sign*.18,.75,.24],[sign*.185,.48,.28],[sign*.205,.28,.29]],.005,2);tube([[sign*.205,.30,.29],[sign*.205,.25,.29]],[.009,.009],2);}
        const pocket=(u,v)=>{const w=mix(.25,.38,Math.sin(v*Math.PI*.5)),x=(u-.5)*2*w;return [x,-.29-v*.37-.015*Math.sin(u*Math.PI),.242+.024*Math.sin(u*Math.PI)+.008*Math.sin(v*Math.PI)]};
        grid(pocket,40,24,0,true);
        for(const edge of [0,1]){const seam=[];for(let i=0;i<=20;i++){const p=pocket(edge,i/20);p[2]+=.005;seam.push(p)}line(seam,.004,1);}
        const seam=[];for(let i=0;i<=30;i++){const p=pocket(i/30,1);p[2]+=.004;seam.push(p)}line(seam,.0035,1);
      }
    }
    const mesh={positions:new Float32Array(positions),normals:new Float32Array(normals),materials:new Float32Array(materials),count:materials.length,lo,hi};cache.set(key,mesh);return mesh;
  }
  function pattern(product){return product.id==='botanical-shirt'?2:product.id==='seersucker-shirt'?3:product.id==='abstract-print-shirt'?1:product.id==='blurred-print'?4:product.id==='zipper-shirt'?5:0}
  function renderer(canvas,product,color,{interactive=false,auto=false}={}){
    const gl=canvas.getContext('webgl2',{alpha:false,antialias:true,preserveDrawingBuffer:true})||canvas.getContext('webgl',{alpha:false,antialias:true,preserveDrawingBuffer:true});
    if(!gl){canvas.dataset.unsupported='true';return null}
    const v2=typeof WebGL2RenderingContext!=='undefined'&&gl instanceof WebGL2RenderingContext;
    const vs=`${v2?'#version 300 es\n':''}precision highp float;${v2?'in':'attribute'} vec3 aPosition;${v2?'in':'attribute'} vec3 aNormal;${v2?'in':'attribute'} float aMaterial;uniform mat3 uRotation;uniform mat4 uProjection;uniform float uDistance;uniform float uCenter;${v2?'out':'varying'} vec3 vNormal;${v2?'out':'varying'} vec3 vPoint;${v2?'out':'varying'} float vMaterial;void main(){vec3 p=aPosition-vec3(0.,uCenter,0.);vNormal=uRotation*aNormal;vPoint=aPosition;vMaterial=aMaterial;p=uRotation*p;gl_Position=uProjection*vec4(p-vec3(0.,0.,uDistance),1.);}`;
    const fs=`${v2?'#version 300 es\n':''}precision highp float;${v2?'in':'varying'} vec3 vNormal;${v2?'in':'varying'} vec3 vPoint;${v2?'in':'varying'} float vMaterial;uniform vec3 uColor;uniform float uPattern;${v2?'out vec4 outColor;':''}void main(){vec3 n=normalize(vNormal);vec3 c=uColor;vec3 p=vPoint;float mark=0.;if(uPattern==1.){float a=sin(p.x*13.+sin(p.y*8.)*2.);mark=(1.-smoothstep(.05,.12,abs(a)))*step(.12,p.z);}if(uPattern==2.){vec2 q=vec2(p.x*4.+p.y*1.3,p.y*3.2);vec2 cell=fract(q)-.5;float leaf=pow(abs(cell.x+cell.y*.42)*3.4,2.)+pow(abs(cell.y)*2.05,2.);float vein=1.-smoothstep(.012,.026,abs(cell.x+cell.y*.42));mark=(1.-smoothstep(.70,.93,leaf))*(1.-vein*.3);}if(uPattern==3.){mark=1.-smoothstep(.06,.13,abs(sin(p.x*10.+sin(p.y*9.)*2.)));}if(uPattern==4.){mark=smoothstep(.1,.5,sin(p.x*8.+p.y*5.)*cos(p.y*12.))*step(.0,p.x)*step(.1,p.z);}if(uPattern==5.){mark=1.-step(.035,min(abs(fract(p.x*3.)-.5),abs(fract(p.y*3.)-.5)));}if(uPattern>0.&&vMaterial<.5){vec3 ink=uPattern==1.||uPattern==2.?vec3(.78,.78,.66):vec3(.12,.26,.19);c=mix(c,ink,mark*.85);}if(vMaterial>.5&&vMaterial<1.5)c*=.94;if(vMaterial>1.5&&vMaterial<2.5)c=vec3(.12,.14,.13);if(vMaterial>2.5)c*=.48;float weave=(sin(p.x*310.)*sin(p.y*390.)+sin(p.y*520.))*.007;float rib=sin(p.x*380.)*.012;weave+=rib;float key=max(dot(n,normalize(vec3(-.7,.9,1.2))),0.);float fill=max(dot(n,normalize(vec3(.8,.1,-.7))),0.);float rim=pow(1.-max(dot(n,vec3(0.,0.,1.)),0.),3.);float spec=pow(max(dot(reflect(-normalize(vec3(-.6,.8,1.)),n),vec3(0.,0.,1.)),0.),32.);vec3 result=c*(.57+.48*key+.16*fill+weave)+vec3(.018)*rim+vec3(.012)*spec;result=pow(max(result,vec3(.0)),vec3(.9));${v2?'outColor':'gl_FragColor'}=vec4(result,1.);}`;
    function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const message=gl.getShaderInfoLog(s);console.error('Garment shader:',message);gl.deleteShader(s);throw Error(message)}return s}
    let program,vertexShader,fragmentShader;try{vertexShader=shader(gl.VERTEX_SHADER,vs);fragmentShader=shader(gl.FRAGMENT_SHADER,fs);program=gl.createProgram();gl.attachShader(program,vertexShader);gl.attachShader(program,fragmentShader);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));}catch(error){canvas.dataset.unsupported='true';return null}
    gl.useProgram(program);const mesh=geometry(product),buffers=[];
    for(const [name,data,size] of [['aPosition',mesh.positions,3],['aNormal',mesh.normals,3],['aMaterial',mesh.materials,1]]){const buffer=gl.createBuffer();buffers.push(buffer);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);const attr=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(attr);gl.vertexAttribPointer(attr,size,gl.FLOAT,false,0,0)}
    const uniforms={};for(const key of ['uRotation','uProjection','uDistance','uCenter','uColor','uPattern'])uniforms[key]=gl.getUniformLocation(program,key);
    let yaw=.2,pitch=-.08,zoom=1,frame=0,last=0,drag=null,disposed=false,visible=true;
    const controller=new AbortController(),signal=controller.signal;canvas.dataset.engine='webgl';canvas.dataset.vertices=String(mesh.count);
    function draw(){if(disposed||gl.isContextLost())return;const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2),w=Math.max(1,Math.round(r.width*dpr)),h=Math.max(1,Math.round(r.height*dpr));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}gl.viewport(0,0,w,h);gl.clearColor(.945,.949,.937,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.useProgram(program);
      const cy=Math.cos(yaw),sy=Math.sin(yaw),cx=Math.cos(pitch),sx=Math.sin(pitch);const rotation=new Float32Array([cy,sx*sy,-cx*sy,0,cx,sx,sy,-sx*cy,cx*cy]);
      const f=1/Math.tan(Math.PI/10),aspect=w/h,near=.1,far=100;const projection=new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]);
      const height=mesh.hi[1]-mesh.lo[1],width=mesh.hi[0]-mesh.lo[0],distance=Math.max(height*f/(2*.81),width*f/(2*aspect*.81))*zoom;
      gl.uniformMatrix3fv(uniforms.uRotation,false,rotation);gl.uniformMatrix4fv(uniforms.uProjection,false,projection);gl.uniform1f(uniforms.uDistance,distance);gl.uniform1f(uniforms.uCenter,(mesh.hi[1]+mesh.lo[1])/2);gl.uniform3fv(uniforms.uColor,palette[color]||palette.Black);gl.uniform1f(uniforms.uPattern,pattern(product));gl.drawArrays(gl.TRIANGLES,0,mesh.count);canvas.dataset.rotation=yaw.toFixed(3);
    }
    function loop(now){if(disposed)return;const dt=Math.min((now-last)||16,40);last=now;if(!document.hidden&&visible){if(auto&&!reduced()&&!drag)yaw+=dt*.00042;draw()}if(auto)frame=requestAnimationFrame(loop)}
    function start(){cancelAnimationFrame(frame);if(auto)frame=requestAnimationFrame(loop);else draw()}
    const resize=new ResizeObserver(draw);resize.observe(canvas);const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)draw()});observer.observe(canvas);
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frame);canvas.dataset.unsupported='true';const fallback=canvas.parentElement?.querySelector('.model-fallback');if(fallback){canvas.hidden=true;fallback.hidden=false}else if(canvas.parentElement?.matches('[data-garment-hover]'))canvas.parentElement.hidden=true;},{signal});canvas.addEventListener('webglcontextrestored',()=>{if(interactive&&canvas.isConnected){const fresh=canvas.cloneNode(false);fresh.hidden=false;delete fresh.dataset.unsupported;canvas.replaceWith(fresh);window.CivisGarments.mount()}},{signal});
    if(interactive){canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;drag={x:e.clientX,y:e.clientY,yaw,pitch};canvas.setPointerCapture(e.pointerId);canvas.focus({preventScroll:true})},{signal});canvas.addEventListener('pointermove',e=>{if(!drag)return;yaw=drag.yaw+(e.clientX-drag.x)*.012;pitch=Math.max(-.65,Math.min(.65,drag.pitch+(e.clientY-drag.y)*.006));draw()},{signal});for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>{drag=null},{signal});canvas.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','+','-'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')yaw-=.22;if(e.key==='ArrowRight')yaw+=.22;if(e.key==='ArrowUp')pitch=Math.max(-.65,pitch-.12);if(e.key==='ArrowDown')pitch=Math.min(.65,pitch+.12);if(e.key==='+')zoom=Math.max(.85,zoom-.08);if(e.key==='-')zoom=Math.min(1.6,zoom+.08);if(e.key==='Home'){yaw=.2;pitch=-.08;zoom=1}draw()}},{signal});}
    document.addEventListener('visibilitychange',()=>{last=performance.now();if(!document.hidden)draw()},{signal});start();
    return {setColor(value){color=value;draw()},rotate(delta){yaw+=delta;draw()},reset(){yaw=.2;pitch=-.08;zoom=1;draw()},dispose(){disposed=true;cancelAnimationFrame(frame);controller.abort();resize.disconnect();observer.disconnect();for(const buffer of buffers)gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.deleteShader(vertexShader);gl.deleteShader(fragmentShader);gl.getExtension('WEBGL_lose_context')?.loseContext()}};
  }
  function stopHover(){activeHover?.renderer?.dispose();activeHover?.host?.replaceChildren();if(activeHover?.host)activeHover.host.hidden=true;activeHover=null}
  window.CivisGarments={
    mount(){activeMain?.dispose();activeMain=null;stopHover();const canvas=document.querySelector('[data-garment-main]');if(canvas&&!canvas.closest('[hidden]')){const product=window.CATALOGUE.find(p=>p.id===canvas.dataset.product);activeMain=renderer(canvas,product,canvas.dataset.color,{interactive:true});const fallback=canvas.parentElement.querySelector('.model-fallback');if(activeMain){canvas.hidden=false;if(fallback)fallback.hidden=true}else{canvas.hidden=true;if(fallback)fallback.hidden=false;}}},
    destroy(){activeMain?.dispose();activeMain=null;stopHover()},
    rotate(delta){activeMain?.rotate(delta)},reset(){activeMain?.reset()},
    hover(card){if(activeHover?.card===card)return;stopHover();const host=card.querySelector('[data-garment-hover]'),product=window.CATALOGUE.find(p=>p.id===card.dataset.productId);if(!host||!product)return;const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');host.hidden=false;host.append(canvas);const current=renderer(canvas,product,card.dataset.previewColor||product.colors[0],{auto:true});if(!current){host.hidden=true;host.replaceChildren()}activeHover={card,host,renderer:current};},stopHover
  };
})();
