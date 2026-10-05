import type {Scenario} from '../contracts.ts';
import type {User} from '../auth/mockAuth.ts';
import {supabase} from './supabase.ts';
export interface BuildPreset {id:string;name:string;champion:string;items:string[];runes:Scenario['player']['runes'];slider:Scenario['weights'];matchup:Scenario['enemy'];scenario:Scenario;created_at:string}
export class PresetLimitError extends Error {constructor(){super('O plano FREE permite até 3 presets.');}}
export const presetStorageKey=(user:User|null)=>`aegis-build-presets-v1:${user?.email?.toLowerCase()??'guest'}`;
export function addLocalPreset(rows:BuildPreset[],preset:BuildPreset):BuildPreset[]{if(rows.length>=3)throw new PresetLimitError();return [preset,...rows];}
export function createPreset(s:Scenario,name:string):BuildPreset{return {id:crypto.randomUUID(),name:name.trim().slice(0,160)||'Minha build',champion:s.player.champion,items:[...s.player.items],runes:structuredClone(s.player.runes),slider:{...s.weights},matchup:structuredClone(s.enemy),scenario:structuredClone(s),created_at:new Date().toISOString()};}
function localRows(user:User|null):BuildPreset[]{const raw=JSON.parse(localStorage.getItem(presetStorageKey(user))??'[]');if(!Array.isArray(raw))throw Error('Histórico local inválido.');return raw;}
async function owner(){if(!supabase)return null;const {data,error}=await supabase.auth.getUser();if(error||!data.user)throw Error('Entre na sua conta para salvar presets na nuvem.');return data.user.id;}
export async function listPresets(user:User|null):Promise<BuildPreset[]>{
 if(!supabase)return localRows(user);const id=await owner(),rows:BuildPreset[]=[];
 for(let offset=0;;offset+=500){const {data,error}=await supabase.from('user_builds').select('id,name,champion,items,runes,slider,matchup,scenario,created_at').eq('owner_id',id!).order('created_at',{ascending:false}).order('id').range(offset,offset+499);if(error)throw Error('Não foi possível carregar os presets. Verifique a migração user_builds.');rows.push(...(data??[]));if((data?.length??0)<500)break;}
 return rows;
}
export async function savePreset(user:User|null,preset:BuildPreset){if(!supabase){const write=()=>{localStorage.setItem(presetStorageKey(user),JSON.stringify(addLocalPreset(localRows(user),preset)));};if(navigator.locks)await navigator.locks.request(presetStorageKey(user),write);else write();return;}
 const id=await owner();const {error}=await supabase.from('user_builds').insert({...preset,owner_id:id});if(error){if(error.message.includes('FREE_PRESET_LIMIT'))throw new PresetLimitError();throw Error('Não foi possível salvar o preset na nuvem.');}}
export async function deletePreset(user:User|null,id:string){if(!supabase){localStorage.setItem(presetStorageKey(user),JSON.stringify(localRows(user).filter(row=>row.id!==id)));return;}const ownerId=await owner();const {error}=await supabase.from('user_builds').delete().eq('id',id).eq('owner_id',ownerId!);if(error)throw Error('Não foi possível excluir o preset.');}
