import type {Stats} from './contracts.ts';

/**
 * Small, patch-scoped adapters transcribed from Riot patch notes.
 * They represent one isolated impact, not the full champion kit/rotation.
 */
export interface OfficialDamageAdapter {
 champion:string;
 patch:string;
 spell:string;
 calculation:string;
 source:string;
 damageType:'physical'|'magic'|'true';
 baseByRank:number[];
 apRatioByRank:number[];
 note:string;
}
export const officialDamageAdapters:OfficialDamageAdapter[]=[
 {
  champion:'Bard',patch:'16.23.1',spell:'BardQ',calculation:'Damage',source:'https://www.leagueoflegends.com/pt-br/news/game-updates/league-of-legends-patch-26-23-notes/',
  damageType:'magic',baseByRank:[80,125,170,215,260],apRatioByRank:[1,1,1,1,1],
  note:'Q · um impacto confirmado. Fórmula oficial do patch 26.23; colisão, atordoamento, acerto em segundo alvo e passiva não simulados.'
 }
];
export function officialAdapterFor(champion:string,spell:string,calculation:string,patch:string):OfficialDamageAdapter|undefined{
 return officialDamageAdapters.find(a=>a.champion===champion&&a.spell===spell&&a.calculation===calculation&&a.patch===patch);
}
export function evaluateOfficialAdapter(adapter:OfficialDamageAdapter,rank:number,stats:Pick<Stats,'ap'>):number{
 if(!Number.isInteger(rank)||rank<1||rank>5)throw Error('Rank fora da tabela oficial');
 const base=adapter.baseByRank[rank-1],ratio=adapter.apRatioByRank[rank-1];
 if(!Number.isFinite(base)||!Number.isFinite(ratio)||!Number.isFinite(stats.ap))throw Error('Dados da fórmula oficial inválidos');
 return base+ratio*stats.ap;
}

/** Registry gate: invalid or ambiguous official rows must never enter runtime. */
export function validateOfficialDamageAdapters(adapters:OfficialDamageAdapter[]=officialDamageAdapters):string[]{
 const errors:string[]=[];
 const seen=new Set<string>();
 for(const [index,row] of adapters.entries()){
  const prefix=`adapter[${index}]`;
  if(!row.champion.trim()||!row.spell.trim()||!row.calculation.trim())errors.push(`${prefix}: champion/spell/calculation required`);
  if(!/^\\d+\\.\\d+\\.\\d+$/.test(row.patch))errors.push(`${prefix}: invalid patch version`);
  if(!/^https:\\/\\/(www\\.)?leagueoflegends\\.com\\//.test(row.source))errors.push(`${prefix}: source must be an official Riot League URL`);
  if(!['physical','magic','true'].includes(row.damageType))errors.push(`${prefix}: invalid damage type`);
  if(!Array.isArray(row.baseByRank)||row.baseByRank.length!==5||row.baseByRank.some(v=>!Number.isFinite(v)||v<0))errors.push(`${prefix}: baseByRank must contain five finite nonnegative ranks`);
  if(!Array.isArray(row.apRatioByRank)||row.apRatioByRank.length!==5||row.apRatioByRank.some(v=>!Number.isFinite(v)||v<0))errors.push(`${prefix}: apRatioByRank must contain five finite nonnegative ranks`);
  if(!row.note.trim())errors.push(`${prefix}: scope note required`);
  const key=`${row.patch}|${row.champion}|${row.spell}|${row.calculation}`;
  if(seen.has(key))errors.push(`${prefix}: duplicate patch/champion/spell/calculation`);
  seen.add(key);
 }
 return errors;
}
