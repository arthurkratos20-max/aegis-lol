export interface SupabaseConfiguration {configured:boolean;problem:string;url:string;key:string}
export function resolveSupabaseConfiguration(urlValue:string|undefined,anonKey:string|undefined,publishableKey?:string):SupabaseConfiguration {
 const url=urlValue?.trim()??'',key=anonKey?.trim()||publishableKey?.trim()||'';
 const missing:string[]=[];if(!url)missing.push('NEXT_PUBLIC_SUPABASE_URL');if(!key)missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY (ou NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)');
 if(missing.length)return {configured:false,url,key,problem:`Ausente na build: ${missing.join(', ')}. Configure as variáveis para Production na Vercel e faça um novo deploy.`};
 try{const parsed=new URL(url);if(parsed.protocol!=='https:'&&!(parsed.protocol==='http:'&&['localhost','127.0.0.1'].includes(parsed.hostname)))throw Error();}
 catch{return {configured:false,url,key,problem:'NEXT_PUBLIC_SUPABASE_URL inválida. Use a URL do projeto Supabase e faça um novo deploy.'};}
 return {configured:true,url,key,problem:''};
}
