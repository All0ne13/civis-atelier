(async () => {
  const $ = s => document.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let products=[], categories=[], editing=null, colors=[];
  async function request(url, options={}) {
    const token = await window.Clerk.session?.getToken();
    const response = await fetch(url, { ...options, headers:{ ...(options.body && typeof options.body==='string'?{'Content-Type':'application/json'}:{}), ...(token?{Authorization:`Bearer ${token}`} : {}), ...options.headers } });
    const body = await response.json();
    if (!response.ok) throw new Error(body.fields ? body.fields.map(f=>`${f.path.join('.')}: ${f.message}`).join('\n') : body.error || 'Request failed');
    return body;
  }
  function table() {
    const query=$('#search').value.trim().toLowerCase();
    $('#products').innerHTML=products.filter(p=>`${p.name} ${p.nameUk} ${p.id}`.toLowerCase().includes(query)).map(p=>`<tr><td><img src="${esc(p.media[0].file)}" alt=""><div>${esc(p.nameUk)}<br><small>${esc(p.id)}</small></div></td><td>${esc(p.category)}</td><td>${(p.price/100).toFixed(2)}</td><td>${p.stock}</td><td>${p.published?(p.stock?'Опубліковано':'Немає в наявності'):'Чернетка'}</td><td><button data-edit="${esc(p.id)}">Редагувати</button></td></tr>`).join('');
  }
  function colorRows() {
    $('#color-rows').innerHTML=colors.map((color,index)=>`<div class="color-row" data-index="${index}"><label>Колір (EN)<input data-color-name value="${esc(color.name)}" maxlength="40" required pattern="[A-Za-z0-9 -]+"></label><label>Зразок<input data-color-hex type="color" value="${esc(color.hex)}"></label><button type="button" data-remove-color="${index}">Прибрати колір</button><div class="photos">${color.media.map((m,i)=>`<div class="photo"><img src="${esc(m.file)}" alt="${esc(color.name)}"><select data-view="${i}" aria-label="Ракурс"><option value="front" ${m.view==='front'?'selected':''}>Спереду</option><option value="back" ${m.view==='back'?'selected':''}>Ззаду</option><option value="detail" ${m.view==='detail'?'selected':''}>Деталь</option></select><button type="button" data-remove-photo="${i}">Прибрати фото</button></div>`).join('')}</div><label class="upload">Завантажити фото<input type="file" data-upload accept="image/png,image/jpeg,image/webp" multiple></label></div>`).join('');
  }
  function open(product) {
    editing = product ? structuredClone(product) : null;
    const form=$('#product-form'); form.reset(); $('#form-error').textContent='';
    const p=product || {id:'',name:'',nameUk:'',category:categories[0]?.name,collection:'Men',price:0,stock:0,sizes:[],description:'',descriptionUk:'',isNew:false,published:false};
    form.elements.category.innerHTML=categories.map(c=>`<option value="${esc(c.name)}">${esc(c.name_uk)}</option>`).join('');
    for(const key of ['id','name','nameUk','category','collection','stock','description','descriptionUk']) form.elements[key].value=p[key];
    form.elements.id.readOnly=!!product; form.elements.price.value=(p.price/100).toFixed(2); form.elements.sizes.value=p.sizes.join(', ');
    form.elements.isNew.checked=p.isNew; form.elements.published.checked=p.published;
    colors=product?product.colors.map(name=>({name,hex:product.colorValues[name],media:product.media.filter(m=>m.color===name).map(m=>({...m}))})):[{name:'Black',hex:'#222825',media:[]}];
    colorRows(); window.CivisAdmin?.onProductOpen?.(product); $('#editor-title').textContent=product?'Редагувати товар':'Додати товар'; $('#editor').showModal();
  }
  async function load() { [products,categories]=await Promise.all([request('/api/admin/products'),request('/api/admin/categories')]); table(); }
  if (!window.Clerk.user) {
    $('#status').textContent='Увійдіть в акаунт власника магазину.';
    window.Clerk.mountSignIn($('#sign-in'),{routing:'hash',forceRedirectUrl:location.origin+'/admin',signUpUrl:'/register',appearance:{variables:{fontFamily:'Manrope Variable, Arial, sans-serif',fontSize:'15px'}}});
    return;
  }
  $('#logout').hidden=false;
  $('#logout').onclick=()=>window.Clerk.signOut({redirectUrl:'/'});
  try { await load(); } catch(error) { $('#status').textContent=error.message; return; }
  $('#status').textContent='Ціни зберігаються в USD. Приховуйте товар перемикачем «Показувати в магазині», щоб зберегти його дані.';
  $('#workspace').hidden=false;
  window.CivisAdmin={request,reload:load,getProducts:()=>products};
  import('/admin-orders.js');
  import('/admin-cms.js');
  $('#search').addEventListener('input',table);
  $('#products').addEventListener('click',event=>{const b=event.target.closest('[data-edit]');if(b)open(products.find(p=>p.id===b.dataset.edit));});
  $('#create').onclick=()=>open(null);
  $('#close').onclick=()=>$('#editor').close();
  $('#add-color').onclick=()=>{colors.push({name:'',hex:'#ffffff',media:[]});colorRows();};
  $('#color-rows').addEventListener('input',event=>{const row=event.target.closest('[data-index]');if(!row)return;const c=colors[Number(row.dataset.index)];if(event.target.matches('[data-color-name]'))c.name=event.target.value;if(event.target.matches('[data-color-hex]'))c.hex=event.target.value;});
  $('#color-rows').addEventListener('click',event=>{const row=event.target.closest('[data-index]');if(!row)return;const i=Number(row.dataset.index),b=event.target;if(b.dataset.removeColor!==undefined){colors.splice(i,1);colorRows();}if(b.dataset.removePhoto!==undefined){colors[i].media.splice(Number(b.dataset.removePhoto),1);colorRows();}});
  $('#color-rows').addEventListener('change',async event=>{
    const row=event.target.closest('[data-index]');if(!row)return;const color=colors[Number(row.dataset.index)];
    if(event.target.matches('[data-view]'))color.media[Number(event.target.dataset.view)].view=event.target.value;
    if(!event.target.matches('[data-upload]'))return;
    $('#save').disabled=true; event.target.disabled=true; $('#form-error').textContent='';
    try {
      for(const file of event.target.files){
        if(file.size>4*1024*1024)throw new Error('Фото перевищує 4 МБ');
        const bitmap=await createImageBitmap(file); const dimensions={width:bitmap.width,height:bitmap.height};bitmap.close();
        if(dimensions.width>16000||dimensions.height>16000)throw new Error('Фото завелике за розміром');
        const result=await request('/api/admin/uploads',{method:'POST',headers:{'Content-Type':file.type},body:file});
        color.media.push({file:result.url,color:color.name,view:color.media.length?'detail':'front',...dimensions});
      }
      colorRows();
    }catch(error){$('#form-error').textContent=error.message;event.target.disabled=false;}finally{$('#save').disabled=false;}
  });
  $('#product-form').addEventListener('submit',async event=>{
    event.preventDefault(); $('#save').disabled=true; $('#form-error').textContent='';
    try {
      const f=event.target.elements;
      const product={id:f.id.value.trim(),name:f.name.value.trim(),nameUk:f.nameUk.value.trim(),category:f.category.value,collection:f.collection.value,price:Math.round(Number(f.price.value)*100),stock:Number(f.stock.value),sizes:f.sizes.value.split(',').map(s=>s.trim()).filter(Boolean),description:f.description.value.trim(),descriptionUk:f.descriptionUk.value.trim(),isNew:f.isNew.checked,published:f.published.checked,colors:colors.map(c=>c.name.trim()),colorValues:Object.fromEntries(colors.map(c=>[c.name.trim(),c.hex])),media:colors.flatMap(c=>c.media.map(m=>({...m,color:c.name.trim()}))),image:editing?.image||'cotton-white'};
      if(editing)product.version=editing.version;
      product.unavailableSizes=window.CivisAdmin.collectUnavailableSizes?.()||editing?.unavailableSizes||[];
      product.details=window.CivisAdmin.collectDetails?.()||editing?.details||{};
      const sizeGuide=window.CivisAdmin.collectSizeGuide?.()||editing?.sizeGuide;if(sizeGuide)product.sizeGuide=sizeGuide;
      await request('/api/admin/products'+(editing?'/'+editing.id:''),{method:editing?'PUT':'POST',body:JSON.stringify(product)});
      await load(); $('#editor').close(); $('#status').textContent='Товар збережено. Нова версія вже доступна в магазині.';
    }catch(error){$('#form-error').textContent=error.message;}finally{$('#save').disabled=false;}
  });
  $('#categories').onclick=async()=>{
    const name=prompt('Назва категорії англійською');if(!name)return;
    const name_uk=prompt('Назва категорії українською');if(!name_uk)return;
    try{await request('/api/admin/categories',{method:'POST',body:JSON.stringify({name,name_uk})});await load();$('#status').textContent='Категорію додано.';}catch(error){$('#status').textContent=error.message;}
  };
})();
