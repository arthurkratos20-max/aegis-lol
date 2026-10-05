import type {Dataset,Fighter,Stats} from './contracts.ts';
export interface StackDefinition {key:string;label:string;unit:string;max:number;step:number;source:string}
export const STACK_PATCH='16.19.1';
export function stackDefinitions(f:Fighter,data:Dataset):StackDefinition[] {
 if(data.version!==STACK_PATCH)return [];
 const defs:StackDefinition[]=[];
 const add=(key:string,label:string,unit:string,max:number,source:string,step=1)=>defs.push({key,label,unit,max,step,source});
 if(f.items.includes('3084'))add('heartsteelHP','Coração de Aço','HP acumulado',100000,'item:3084 · HP permanente informado; limite do simulador, não limite do jogo');
 if(f.items.some(id=>['3070','3003','3004','3119'].includes(id)))add('tearMana','Fluxo de Mana / Lágrima','mana acumulada',360,'item:3070/3003/3004/3119');
 if(f.items.includes('6657'))add('rodOfAges','Bastão das Eras','minutos / acúmulos',10,'item:6657 · +10 HP, +30 mana e +3 AP por acúmulo; nível não automático');
 if(f.items.includes('3041'))add('mejai','Mejai','acúmulos',25,'item:3041 · 5 AP por acúmulo');
 if(f.items.includes('1082'))add('darkSeal','Lacre Sombrio','acúmulos',10,'item:1082 · 4 AP por acúmulo');
 if(f.runes.selected.includes(9104))add('legendAlacrity','Lenda: Espontaneidade','acúmulos',10,'runa:9104 · 3% + 1,5% por acúmulo');
 if(f.runes.selected.includes(9105))add('legendHaste','Lenda: Aceleração','acúmulos',10,'runa:9105 · 1,5 AH básica por acúmulo');
 if(f.runes.selected.includes(9103))add('legendBloodline','Lenda: Linhagem','acúmulos',15,'runa:9103 · 0,45% roubo de vida; +85 HP no máximo');
 if(f.runes.selected.includes(8106))add('ultimateHunter','Caça Suprema','campeões únicos',5,'runa:8106 · 6 + 5 AH de ultimate por acúmulo');
 return defs;
}
export function applyStacks(x:Stats,f:Fighter,data:Dataset):Stats {
 if(data.version!==STACK_PATCH)return x;
 const n=(key:string)=>Math.max(0,Math.min(stackDefinitions(f,data).find(d=>d.key===key)?.max??0,f.stacks[key]??0));
 if(f.items.includes('3084'))x.hp+=n('heartsteelHP');
 if(f.items.some(id=>['3070','3003','3004','3119'].includes(id)))x.mana+=n('tearMana');
 if(f.items.includes('6657')){x.hp+=10*n('rodOfAges');x.mana+=30*n('rodOfAges');x.ap+=3*n('rodOfAges');}
 if(f.items.includes('3041')){x.ap+=5*n('mejai');if(n('mejai')>=10)x.move*=1.1;}
 if(f.items.includes('1082'))x.ap+=4*n('darkSeal');
 if(f.runes.selected.includes(9104))x.bonusAS+=.03+.015*n('legendAlacrity');
 if(f.runes.selected.includes(9105))x.basicHaste=(x.basicHaste??0)+1.5*n('legendHaste');
 if(f.runes.selected.includes(9103)){x.lifesteal+=.0045*n('legendBloodline');if(n('legendBloodline')===15)x.hp+=85;}
 if(f.runes.selected.includes(8106))x.ultimateHaste=(x.ultimateHaste??0)+6+5*n('ultimateHunter');
 return x;
}
export function itemCategories(id:string,data:Dataset):string[] {
 const i=data.items[id];if(!i)return [];const tags=i.tags,result:string[]=[];
 if(tags.includes('Mana')||i.stats.FlatMPPoolMod>0)result.push('mana');
 if(tags.some(t=>['Damage','CriticalStrike','ArmorPenetration','AttackSpeed','LifeSteal'].includes(t))||i.stats.FlatPhysicalDamageMod>0)result.push('physical');
 if(tags.includes('SpellDamage')||i.stats.FlatMagicDamageMod>0)result.push('ap');
 if(tags.some(t=>['Health','Armor','SpellBlock'].includes(t))||i.stats.FlatHPPoolMod>0)result.push('defense');
 if(tags.some(t=>['Active','Aura','Vision','GoldPer','ManaRegen','HealthRegen'].includes(t))||['3107','3222','3109','6617','3504','6620','3190','3050'].includes(id))result.push('support');
 return result;
}
