(()=>{
 const api=window.CivisAdmin,form=document.querySelector('#product-form');if(!api||!form)return;
 const sizes=form.elements.sizes,section=document.createElement('fieldset');section.className='admin-size-availability';
 section.innerHTML='<legend>Наявність розмірів</legend><p>Позначте доступні розміри. Вимкнений розмір залишиться на сайті неактивним. Щоб прибрати розмір повністю, видаліть його зі списку вище.</p><div class="size-availability-options"></div>';
 sizes.placeholder='28, 30, 32 або W32/L34';sizes.setAttribute('aria-describedby','product-sizes-help');
 const help=document.createElement('small');help.id='product-sizes-help';help.textContent='Введіть свої розміри через кому: 28, 30, 32 або XS, S, M. До 12 розмірів, до 12 символів у кожному. Цей порядок збережеться в колі вибору, на сторінці товару та в розмірній сітці.';sizes.closest('label').append(help);
 sizes.closest('label').after(section);let unavailable=new Set();
 function render(){
  const values=sizes.value.split(',').map(value=>value.trim()).filter(Boolean),current=[...new Set(values)];
  sizes.setCustomValidity(values.length>12?'Додайте не більше 12 розмірів.':values.some(value=>value.length>12||!/^[\p{L}\p{N}][\p{L}\p{N} ./×-]*$/u.test(value))?'Розмір: до 12 символів, літери, цифри, пробіл, крапка, /, × або дефіс.':new Set(values.map(value=>value.toLowerCase())).size!==values.length?'Приберіть повтори розмірів.':'');
  unavailable=new Set([...unavailable].filter(size=>current.includes(size)));
  const holder=section.querySelector('div');holder.replaceChildren();
  for(const size of current){const label=document.createElement('label');label.className='check';const input=document.createElement('input');input.type='checkbox';input.dataset.sizeAvailable=size;input.checked=!unavailable.has(size);input.onchange=()=>{if(input.checked)unavailable.delete(size);else unavailable.add(size);};label.append(input,document.createTextNode(size));holder.append(label);}
 }
 const previousOpen=api.onProductOpen;
 api.onProductOpen=product=>{previousOpen?.(product);unavailable=new Set(product?.unavailableSizes||[]);render();};
 api.collectUnavailableSizes=()=>[...unavailable];sizes.addEventListener('input',render);
 if(document.querySelector('#editor').open)api.onProductOpen(api.getProducts().find(product=>product.id===form.elements.id.value));
})();
