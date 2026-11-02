export const customerFields=['firstName','lastName','email','phone','city','branch'];
const limits={firstName:80,lastName:80,email:200,phone:32,city:100,branch:200};
const namePattern=/^[\p{L}\p{M}]+(?:[ '\u2019\u02bc-][\p{L}\p{M}]+)*$/u;
export function normalizePhone(value){
  const raw=String(value??'').trim();
  if(!/^[+\d\s().-]*$/.test(raw))return raw;
  let digits=raw.replace(/\D/g,'');
  if(digits.startsWith('00380'))digits=digits.slice(2);
  if(digits.length===10&&digits.startsWith('0'))digits='38'+digits;
  if(digits.length===9&&!raw.startsWith('+'))digits='380'+digits;
  return digits?'+'+digits:'';
}
export function formatPhone(value){
  const raw=String(value??'');
  if(/^\s*\+(?!380)(?!3?$)(?!38?$)/.test(raw))return raw.slice(0,32);
  let digits=raw.replace(/\D/g,'');
  if(digits.startsWith('00380'))digits=digits.slice(2);
  if(digits.startsWith('380'))digits=digits.slice(3);
  else if(digits.startsWith('0'))digits=digits.slice(1);
  else if(['3','38'].includes(digits))return '+'+digits;
  if(!digits)return raw?'+380':'';
  return '+380 ('+digits.slice(0,2)+(digits.length>=2?') ':'')+digits.slice(2,5)+(digits.length>5?'-'+digits.slice(5,7):'')+(digits.length>7?'-'+digits.slice(7):'');
}
export function normalizeCustomer(input){
  return Object.fromEntries(customerFields.map(key=>[key,key==='phone'?normalizePhone(input[key]):String(input[key]??'').normalize('NFC').trim().replace(/\s+/g,' ')]));
}
export function validateCustomer(input){
  const data=normalizeCustomer(input),errors={};
  for(const key of customerFields){
    const value=data[key];
    if(!value){errors[key]='required';continue;}
    if(value.length>limits[key]){errors[key]='length';continue;}
    if(['firstName','lastName'].includes(key)&&(!namePattern.test(value)||(value.match(/\p{L}/gu)||[]).length<2))errors[key]='name';
    if(key==='email'&&(!/^[a-z0-9_+%'!-]+(?:\.[a-z0-9_+%'!-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/i.test(value)||value.split('@')[0].length>64))errors[key]='email';
    if(key==='phone'&&(!/^\+380[1-9]\d{8}$/.test(value)||/^(\d)\1{8}$/.test(value.slice(4))))errors[key]='phone';
    if(key==='city'&&(!/^[\p{L}\p{M}\d '\u2019\u02bc().-]+$/u.test(value)||(value.match(/\p{L}/gu)||[]).length<2))errors[key]='city';
    if(key==='branch'&&!(/^[1-9]\d{0,5}$/.test(value)||(/^[\p{L}\p{M}\d '\u2019\u02bc№#.,/()-]+$/u.test(value)&&(value.match(/\p{L}/gu)||[]).length>=2&&/\d/.test(value))))errors[key]='branch';
  }
  return errors;
}
export function customerError(code,locale='uk'){
  const messages={required:['Заповніть це поле.','This field is required.'],length:['Значення надто довге.','This value is too long.'],name:['Вкажіть ім’я або прізвище літерами, без цифр і зайвих символів.','Use letters for your name, without numbers or extra symbols.'],email:['Вкажіть коректний email, наприклад name@example.com.','Enter a valid email, such as name@example.com.'],phone:['Вкажіть повний український номер: +380 (67) 123-45-67.','Enter a complete Ukrainian number: +380 (67) 123-45-67.'],city:['Вкажіть назву міста літерами.','Enter a city name using letters.'],branch:['Вкажіть номер відділення / поштомата або адресу з номером будинку.','Enter a branch / locker number, or a street address with a building number.']};
  return (messages[code]||messages.required)[locale==='en'?1:0];
}
