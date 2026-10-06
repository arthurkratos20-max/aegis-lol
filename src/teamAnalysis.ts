import type {Dataset} from './contracts.ts';
import {championForCounter} from './counterAdapters.ts';
export function analyzeTeam(ids:string[],data:Dataset){
 const champions=[...new Set(ids.filter(id=>Boolean(data.champions[id])))].slice(0,5).map(id=>championForCounter(id,data));
 const count=(key:'hasHealing'|'hasShields'|'hasHardCC'|'isTank'|'isBurst')=>champions.filter(c=>c[key]).length;
 const physical=champions.filter(c=>c.damageType==='physical').length,magic=champions.filter(c=>c.damageType==='magic').length,mixed=champions.filter(c=>c.damageType==='mixed').length;
 const healing=count('hasHealing'),shields=count('hasShields'),cc=count('hasHardCC'),tanks=count('isTank'),burst=count('isBurst');
 const synergies:string[]=[];
 if(cc&&burst)synergies.push('Controle prepara janelas para campeões de burst.');
 if(tanks&&(healing||shields))synergies.push('Frontline e fontes de cura/escudo podem prolongar as trocas; confirme se a proteção pode atingir aliados.');
 if(physical&&magic||mixed)synergies.push('Perfis físicos e mágicos diversificam a ameaça e dificultam uma defesa única.');
 if(!cc&&champions.length)synergies.push('Poucas ferramentas de CC duro identificadas: depende mais de posicionamento e execução.');
 return {selected:champions.length,healing,shields,cc,tanks,burst,physical,magic,mixed,synergies};
}
