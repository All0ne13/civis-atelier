import{z}from'zod';
export const emptyLegalProfile={name:'',registrationCode:'',legalAddress:'',vatStatus:'pending',email:'',phone:'',returnRecipient:'',returnAddress:''};
const text=max=>z.string().trim().max(max);
export const legalProfileSchema=z.object({name:text(240),registrationCode:z.string().regex(/^(?:\d{8}|\d{10})?$/),legalAddress:text(600),vatStatus:z.enum(['pending','not-vat','vat']),email:z.union([z.email().max(200),z.literal('')]),phone:z.string().regex(/^(?:\+[1-9]\d{7,14})?$/),returnRecipient:text(240),returnAddress:text(600)}).strict();
export function publicLegalProfile(value){const parsed=legalProfileSchema.safeParse({...emptyLegalProfile,...Object.fromEntries(Object.keys(emptyLegalProfile).map(key=>[key,value?.[key]??emptyLegalProfile[key]]))});return parsed.success?parsed.data:{...emptyLegalProfile};}
export const hasSellerDetails=p=>['name','registrationCode','legalAddress','email','returnRecipient','returnAddress'].every(key=>!!p[key])&&p.vatStatus!=='pending';
