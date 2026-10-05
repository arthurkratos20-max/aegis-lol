import type {Champion,Dataset,Fighter,Item} from './contracts.ts';
import {getChampionScaling,supportIntent,type ChampionScaling} from './championScaling.ts';
export interface ItemEligibility {allowed:boolean;synergyMultiplier:number;coverage:'estimated';reason:string}
export function isEligibleForChampion(item:Item,champion:Champion,scaling:ChampionScaling,utility=false):ItemEligibility {
 const allow=(reason:string):ItemEligibility=>({allowed:true,synergyMultiplier:1,coverage:'estimated',reason});
 const deny=(reason:string):ItemEligibility=>({allowed:false,synergyMultiplier:0,coverage:'estimated',reason});
 const tags=new Set(item.tags),stats=item.stats;
 const ad=(stats.FlatPhysicalDamageMod??0)>0,ap=(stats.FlatMagicDamageMod??0)>0,crit=(stats.FlatCritChanceMod??0)>0;
 const attackSpeed=(stats.PercentAttackSpeedMod??0)>0,life=(stats.PercentLifeStealMod??0)>0;
 const armorPen=tags.has('ArmorPenetration'),magicPen=tags.has('MagicPenetration');
 const defense=(stats.FlatHPPoolMod??0)>0||(stats.FlatArmorMod??0)>0||(stats.FlatSpellBlockMod??0)>0;
 const classSet=new Set([scaling.primaryClass,scaling.secondaryClass]),adc=classSet.has('Marksman')&&scaling.hasCritScaling;
 if(tags.has('Boots'))return allow('Bota contextual; restrições de recurso e campeão verificadas separadamente.');
 if((tags.has('Mana')||(stats.FlatMPPoolMod??0)>0)&&champion.partype!=='Mana')return deny('Mana incompatível com o recurso do campeão.');
 if(ad&&!scaling.hasADScaling&&!(defense&&scaling.hasHealthScaling))return deny('Sem escala de AD no kit/perfil disponível.');
 if(ap&&!scaling.hasAPScaling)return deny('Sem escala de AP no kit/perfil disponível.');
 if(crit&&!scaling.hasCritScaling)return deny('Crítico fora do pool compatível com o kit.');
 if(attackSpeed&&!scaling.hasAttackSpeedScaling)return deny('Velocidade de ataque sem sinergia de kit confirmada.');
 if(armorPen&&!scaling.hasADScaling)return deny('Penetração física sem sinergia de AD.');
 if(magicPen&&!scaling.hasAPScaling)return deny('Penetração mágica sem sinergia de AP.');
 const utilityTags=['Aura','ManaRegen','GoldPer','Heal','Shield'];
 if(utility&&ap&&!utilityTags.some(tag=>tags.has(tag)))return deny('Perfil de utilidade: AP egoísta sem aura, cura ou proteção para aliados.');
 if(utility&&!utilityTags.some(tag=>tags.has(tag))&&!defense)return deny('Perfil de utilidade: item sem proteção ou utilidade para aliados.');
 if(utility&&(ad||crit||attackSpeed))return deny('Perfil de utilidade não recomenda carry físico/crítico.');
 if(adc){const offense=ad||crit||attackSpeed||life||armorPen||ap&&scaling.hasAPScaling;
  if(!offense)return deny('ADC: tanque puro sem atributo ofensivo ou sobrevivência funcional de atirador.');
 }
 const pureTank=scaling.primaryClass==='Tank';
 if(pureTank&&(life||crit||(ad||ap)&&!defense))return deny('Tanque: dano puro sem vida/resistências fora do pool.');
 if(!adc&&classSet.has('Assassin')&&!defense&&!ad&&!ap&&!armorPen&&!magicPen&&!tags.has('AbilityHaste')&&!tags.has('NonbootsMovement'))return deny('Assassino: item sem dano, penetração ou acesso ao alvo.');
 return allow('Atributos elegíveis por escalas de kit e classes combinadas; sinergia estimada.');
}
export function eligibilityForItem(id:string,f:Fighter,data:Dataset):ItemEligibility {
 const item=data.items[id],champion=data.champions[f.champion];if(!item||!champion)return {allowed:false,synergyMultiplier:0,coverage:'estimated',reason:'Item/campeão ausente no snapshot.'};
 return isEligibleForChampion(item,champion,getChampionScaling(champion,data),supportIntent(f,data)==='utility');
}
