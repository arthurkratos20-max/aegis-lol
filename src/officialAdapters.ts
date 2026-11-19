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
