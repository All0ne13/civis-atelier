(()=>{
 const manifest=window.CIVIS_IMAGE_MANIFEST||{},escape=value=>String(value).replace(/[&"<>]/g,c=>({'&':'&amp;','"':'&quot;','<':'&lt;','>':'&gt;'}[c]));
 const entry=src=>manifest[src.replace(/^\//,'')];
 const defaultSizes='(max-width:600px) 100vw, 66vw';
 window.CivisImages={
  source(src,width=720){const item=entry(src);return item?(item.variants.find(v=>v.width>=width)||item.variants.at(-1)).url:src;},
  attributes(src,sizes=defaultSizes){const item=entry(src);return `data-original="${escape(src)}" decoding="async" `+(item?`srcset="${item.variants.map(v=>escape(v.url)+' '+v.width+'w').join(', ')}" sizes="${escape(sizes)}" src="${escape(item.src)}"`:`src="${escape(src)}"`);},
  apply(image,src,sizes=defaultSizes){const item=entry(src);image.dataset.original=src;image.decoding='async';if(item){image.srcset=item.variants.map(v=>v.url+' '+v.width+'w').join(', ');image.sizes=sizes;image.src=item.src;}else{image.removeAttribute('srcset');image.removeAttribute('sizes');image.src=src;}}
 };
})();
