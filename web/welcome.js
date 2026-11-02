(()=>{
 const key='civis-welcome-email',uk=()=>document.documentElement.lang!=='en',L=(u,e)=>uk()?u:e;
 let claiming;
 async function claimPending(){
  const email=localStorage.getItem(key);if(!email||!window.Clerk?.user)return null;
  if(claiming)return claiming;
  claiming=(async()=>{const token=await Clerk.session.getToken(),response=await fetch('/api/welcome',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({email})});
   if(!response.ok){const error=new Error(response.status===403?L('Підтвердіть цю пошту у своєму акаунті.','Verify this email address in your account.'):L('Не вдалося активувати пропозицію. Спробуйте ще раз.','Unable to activate the offer. Please try again.'));throw error;}
   const result=await response.json();localStorage.removeItem(key);sessionStorage.setItem('civis-welcome-state',result.eligible?'active':'used');return result;
  })().finally(()=>{claiming=null;});return claiming;
 }
 window.CivisWelcome={claimPending,footer({L,icon}){const active=sessionStorage.getItem('civis-welcome-state')==='active';return `<section class="welcome-signup" aria-labelledby="welcome-title"><div><p class="section-index">THE FIRST HELLO / CIVIS ATELIER</p><h2 id="welcome-title">${L('Перший крок.<br>Мінус 5%.','Your first hello.<br>5% off.')}</h2><p>${L('Зареєструйтеся та отримайте 5% на перше замовлення. Знайомство, з якого починається ваш власний ритм.','Create an account and enjoy 5% off your first order. The beginning of your own rhythm.')}</p></div><form id="welcome-form" method="post"><label for="welcome-email">${L('Ваша електронна пошта','Your email address')}</label><div class="welcome-input-row"><input id="welcome-email" name="email" type="email" autocomplete="email" maxlength="200" placeholder="you@example.com" required><button type="submit" aria-label="${L('Зареєструватися та отримати 5%','Create an account and get 5%')}">${L('Отримати 5%','Get 5%')}</button></div><p class="welcome-terms">${L('Після підтвердження email. Один раз на перше оформлене замовлення; доставка оплачується окремо.','After email verification. Once on your first placed order; delivery is charged separately.')}</p><p class="welcome-status" role="status" aria-live="polite">${active?L('Ваші 5% активовано. Знижка з’явиться при оформленні.','Your 5% is active. The discount will appear at checkout.'):''}</p></form></section>`;}};
 document.addEventListener('submit',async event=>{if(event.target.id!=='welcome-form')return;event.preventDefault();const form=event.target,button=form.querySelector('button'),status=form.querySelector('.welcome-status'),input=form.elements.email;
  input.value=input.value.trim();if(!form.reportValidity())return;localStorage.setItem(key,input.value.toLowerCase());button.disabled=true;status.textContent=L('Зачекайте…','One moment…');
  try{await CivisAuth.ensure();if(Clerk.user){const offer=await claimPending();status.textContent=offer?.eligible?L('Ваші 5% активовано. Знижка з’явиться при оформленні.','Your 5% is active. The discount will appear at checkout.'):L('Пропозиція діє лише на перше замовлення.','This offer applies to your first order only.');}else{status.textContent=L('Завершіть реєстрацію та підтвердіть email, щоб активувати 5%.','Finish creating your account and verify your email to activate 5%.');await CivisAccount.open('register',{locale:uk()?'uk':'en'});}}
  catch(error){status.textContent=error.message;}finally{button.disabled=false;}
 });
})();
