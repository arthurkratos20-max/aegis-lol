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
 bonusADRatioByRank?:number[];
 adRatioByRank?:number[];
 note:string;
}
export const officialDamageAdapters:OfficialDamageAdapter[]=[
 {
  champion:'Bard',patch:'16.23.1',spell:'BardQ',calculation:'Damage',source:'https://www.leagueoflegends.com/pt-br/news/game-updates/league-of-legends-patch-26-23-notes/',
  damageType:'magic',baseByRank:[80,125,170,215,260],apRatioByRank:[1,1,1,1,1],
  note:'Q · um impacto confirmado. Fórmula oficial do patch 26.23; colisão, atordoamento, acerto em segundo alvo e passiva não simulados.'
 },
 {
  champion:'MasterYi',patch:'16.23.1',spell:'MasterYiQ',calculation:'Damage',source:'https://www.leagueoflegends.com/pt-br/news/game-updates/league-of-legends-patch-26-23-notes/',
  damageType:'physical',baseByRank:[20,40,60,80,100],apRatioByRank:[0,0,0,0,0],adRatioByRank:[0.6,0.6,0.6,0.6,0.6],
  note:'Q · dano padrão isolado em um alvo. Fórmula do patch 26.23; crítico, acertos adicionais, seleção/teleporte entre alvos e efeitos ao contato não simulados.'
 },
 {
  champion:'MasterYi',patch:'16.23.1',spell:'MasterYiQ',calculation:'MaxSingleTargetDamage',source:'https://www.leagueoflegends.com/pt-br/news/game-updates/league-of-legends-patch-26-23-notes/',
  damageType:'physical',baseByRank:[35,70,105,140,175],apRatioByRank:[0,0,0,0,0],adRatioByRank:[1.05,1.05,1.05,1.05,1.05],
  note:'Q · máximo contra um único alvo, exigindo a distribuição de acertos descrita pela Riot. Crítico adicional, efeitos ao contato e distribuição geométrica dos alvos não simulados; opção manual separada.'
 },
 {
  champion:'Ezreal',patch:'16.23.1',spell:'EzrealW',calculation:'Damage',source:'https://www.leagueoflegends.com/pt-br/news/game-updates/league-of-legends-patch-26-23-notes/',
  damageType:'magic',baseByRank:[80,135,190,245,300],apRatioByRank:[1,1,1,1,1],bonusADRatioByRank:[1.15,1.15,1.15,1.15,1.15],
  note:'W · somente detonação da marca em campeão; requer marca previamente aplicada e detonada. Não simula aplicação, reembolso de mana ou procs.'
 },
 {
  champion:'Ezreal',patch:'16.23.1',spell:'EzrealR',calculation:'Damage',source:'https://www.leagueoflegends.com/pt-br/news/game-updates/league-of-legends-patch-26-23-notes/',
  damageType:'magic',baseByRank:[350,600,850],apRatioByRank:[1.2,1.2,1.2],bonusADRatioByRank:[1.1,1.1,1.1],
  note:'R · dano contra campeão após a redução por alvos não campeões; colisões, redução por unidades atravessadas e trajetória não simuladas.'
 }
];
export function officialAdapterFor(champion:string,spell:string,calculation:string,patch:string):OfficialDamageAdapter|undefined{
 const validation=validateOfficialDamageAdapters();if(validation.length)throw Error(`Official adapter registry invalid: ${validation.join('; ')}`);
 return officialDamageAdapters.find(a=>a.champion===champion&&a.spell===spell&&a.calculation===calculation&&a.patch===patch);
}
export function evaluateOfficialAdapter(adapter:OfficialDamageAdapter,rank:number,stats:Pick<Stats,'ap'> & {bonusAD?:number;ad?:number}):number{
 if(!Number.isInteger(rank)||rank<1||rank>adapter.baseByRank.length)throw Error('Rank fora da tabela oficial');
 const base=adapter.baseByRank[rank-1],ratio=adapter.apRatioByRank[rank-1],bonusRatio=adapter.bonusADRatioByRank?.[rank-1]??0,adRatio=adapter.adRatioByRank?.[rank-1]??0,bonusAD=stats.bonusAD??0,ad=stats.ad??0;
 if(!Number.isFinite(base)||!Number.isFinite(ratio)||!Number.isFinite(bonusRatio)||!Number.isFinite(adRatio)||!Number.isFinite(stats.ap)||!Number.isFinite(bonusAD)||!Number.isFinite(ad))throw Error('Dados da fórmula oficial inválidos');
 return base+ratio*stats.ap+bonusRatio*bonusAD+adRatio*ad;
}

/** Registry gate: invalid or ambiguous official rows must never enter runtime. */
export function validateOfficialDamageAdapters(adapters:OfficialDamageAdapter[]=officialDamageAdapters):string[]{
 const errors:string[]=[];
 const seen=new Set<string>();
 for(const [index,row] of adapters.entries()){
  const prefix=`adapter[${index}]`;
  if(!row.champion?.trim()||!row.spell?.trim()||!row.calculation?.trim())errors.push(`${prefix}: champion/spell/calculation required`);
  if(!/^\d+\.\d+\.\d+$/.test(row.patch))errors.push(`${prefix}: invalid patch version`);
  if(!/^https:\/\/(www\.)?leagueoflegends\.com\//.test(row.source))errors.push(`${prefix}: source must be an official Riot League URL`);
  if(!['physical','magic','true'].includes(row.damageType))errors.push(`${prefix}: invalid damage type`);
  if(!Array.isArray(row.baseByRank)||![3,5].includes(row.baseByRank.length)||row.baseByRank.some(v=>!Number.isFinite(v)||v<0))errors.push(`${prefix}: baseByRank must contain three or five finite nonnegative ranks`);
  if(!Array.isArray(row.apRatioByRank)||row.apRatioByRank.length!==row.baseByRank?.length||row.apRatioByRank.some(v=>!Number.isFinite(v)||v<0))errors.push(`${prefix}: apRatioByRank must match baseByRank`);
  if(row.bonusADRatioByRank&&(!Array.isArray(row.bonusADRatioByRank)||row.bonusADRatioByRank.length!==row.baseByRank?.length||row.bonusADRatioByRank.some(v=>!Number.isFinite(v)||v<0)))errors.push(`${prefix}: bonusADRatioByRank must match the rank table`);
  if(row.adRatioByRank&&(!Array.isArray(row.adRatioByRank)||row.adRatioByRank.length!==row.baseByRank?.length||row.adRatioByRank.some(v=>!Number.isFinite(v)||v<0)))errors.push(`${prefix}: adRatioByRank must match the rank table`);
  if(!row.note?.trim())errors.push(`${prefix}: scope note required`);
  const key=`${row.patch}|${row.champion}|${row.spell}|${row.calculation}`;
  if(seen.has(key))errors.push(`${prefix}: duplicate patch/champion/spell/calculation`);
  seen.add(key);
 }
 return errors;
}
