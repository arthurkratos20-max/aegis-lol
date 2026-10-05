import type {Entitlement} from '../services/supabase';
export interface CachedEntitlement {userId:string;email:string;entitlement:Entitlement;syncedAt:number}
// Offline UX cache only. Backend authorization always checks its own database.
const MAX_AGE=24*60*60*1000;
export function validCachedEntitlement(cache:CachedEntitlement|null,id:string,email:string,now=Date.now()):cache is CachedEntitlement {
 return !!cache && cache.userId===id && cache.email===email && cache.syncedAt<=now && now-cache.syncedAt<MAX_AGE;
}
function database():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const req=indexedDB.open('aegis-entitlements-v1',1);req.onupgradeneeded=()=>req.result.createObjectStore('entitlements',{keyPath:'userId'});req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
async function operate<T>(mode:IDBTransactionMode,action:(store:IDBObjectStore)=>IDBRequest<T>):Promise<T|null>{
 try {const db=await database();return await new Promise<T>((resolve,reject)=>{const tx=db.transaction('entitlements',mode);const request=action(tx.objectStore('entitlements'));tx.oncomplete=()=>{db.close();resolve(request.result);};tx.onerror=()=>{db.close();reject(tx.error);};tx.onabort=()=>{db.close();reject(tx.error);};});}catch{return null;}
}
export const readEntitlement=async(id:string):Promise<CachedEntitlement|null>=>await operate('readonly',store=>store.get(id))??null;
export const cacheEntitlement=async(value:CachedEntitlement)=>{await operate('readwrite',store=>store.put(value));};
export const clearEntitlement=async(id:string)=>{await operate('readwrite',store=>store.delete(id));};
