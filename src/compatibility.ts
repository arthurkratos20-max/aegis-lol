import {eligibilityForItem} from './itemEligibility.ts';
import {getChampionScaling} from './championScaling.ts';
import type {Dataset,Fighter} from './contracts.ts';
export interface KitCapabilities {mana:boolean;energy:boolean;hardCC:boolean;movementCC:boolean;autoAttack:boolean;healShield:boolean;healthScaling:boolean;boots:boolean;range:number;review:'curated-descriptive';sources:string[]}
const has=(id:string,ids:string)=>ids.split(' ').includes(id);
export function kitFor(f:Fighter,data:Dataset):KitCapabilities {
 const c=data.champions[f.champion],id=f.champion;
 const hardCC=has(id,'Aatrox Ahri Alistar Amumu Anivia Annie Aphelios Ashe AurelionSol Azir Bard Belveth Blitzcrank Brand Braum Briar Caitlyn Camille Cassiopeia ChoGath Darius Diana Draven Ekko Elise Evelynn Fiddlesticks Fiora Fizz Galio Gnar Gragas Hecarim Heimerdinger Hwei Irelia Ivern Janna JarvanIV Jax Jayce Jhin Jinx Kalista Karma Kennen KSante Leblanc LeBlanc LeeSin Leona Lillia Lissandra Lux Malphite Malzahar Maokai Milio Mordekaiser Morgana Nami Nautilus Neeko Nilah Nocturne Nunu Ornn Pantheon Poppy Pyke Qiyana Quinn Rakan Rammus RekSai Rell Renata Renekton Rengar Riven Ryze Sejuani Seraphine Sett Shaco Shen Shyvana Singed Sion Skarner Sona Swain Sylas Syndra TahmKench Taliyah Taric Thresh Tristana Trundle TwistedFate Udyr Urgot Varus Vayne Veigar Velkoz Vex Vi Viego Viktor Volibear Warwick Wukong Xayah Xerath XinZhao Yasuo Yone Yorick Zac Zeri Ziggs Zilean Zyra');
 const pureCaster=has(id,'Velkoz Xerath Lux Brand Zyra Malzahar Anivia Syndra Orianna Veigar Hwei Seraphine Annie Ziggs Zoe Vex');
 return {mana:c.partype==='Mana',energy:/energia/i.test(c.partype),hardCC,movementCC:hardCC||has(id,'KogMaw Teemo DrMundo Vladimir Kayle Rumble Soraka Twitch Zed Karthus MissFortune Illaoi Gangplank'),autoAttack:getChampionScaling(c,data).hasAttackSpeedScaling,healShield:has(id,'Lulu Janna Nami Milio Soraka Sona Yuumi Renata Ivern Karma Seraphine Taric Rakan Shen Braum Orianna Lux'),healthScaling:has(id,'Shen ChoGath Sion Zac DrMundo Vladimir TahmKench Sejuani Ornn Skarner Sett Volibear'),boots:id!=='Cassiopeia',range:c.stats.attackrange,review:'curated-descriptive',sources:[c.passive.description,...c.spells.map(s=>s.tooltip??s.description)]};
}
export function runeCompatible(id:number,f:Fighter,data:Dataset):{allowed:boolean;reason:string} {
 const k=kitFor(f,data);
 if(id===8226&&!k.mana)return {allowed:false,reason:'Faixa de Fluxo de Mana exige mana.'};
 if(id===8009&&!k.mana&&!k.energy)return {allowed:false,reason:'Presença de Espírito restaura mana/energia; recurso incompatível.'};
 if(id===8439&&!k.hardCC)return {allowed:false,reason:'Pós-choque exige imobilização confirmada no kit.'};
 if([8410,8463].includes(id)&&!k.movementCC)return {allowed:false,reason:'Sinergia com movimento debilitado não confirmada no kit; efeitos de aliados não presumidos.'};
 if([8008,9104,9103].includes(id)&&!k.autoAttack)return {allowed:false,reason:'Perfil de ataque contínuo não confirmado; não sugerir runa de AS/roubo de vida.'};
 if(id===8304&&!k.boots)return {allowed:false,reason:'Este campeão não pode usar botas.'};
 if(id===8453&&!k.healShield)return {allowed:false,reason:'Cura/escudo próprios não confirmados para esta recomendação.'};
 // Nimbus is triggered by summoner spells, not a mana requirement.
 return {allowed:true,reason:id===8275?'Ativa com feitiços de invocador; não exige mana.':'Requisito compatível ou sem restrição de kit conhecida.'};
}
export function itemCompatible(id:string,f:Fighter,data:Dataset):{allowed:boolean;reason:string} {
 const i=data.items[id],kit=kitFor(f,data);if(!i)return {allowed:false,reason:'Item ausente.'};
 if(i.tags.includes('Boots')&&!kit.boots)return {allowed:false,reason:'Campeão sem acesso a botas.'};
 if((i.tags.includes('Mana')||i.stats.FlatMPPoolMod>0)&&!kit.mana)return {allowed:false,reason:'Item de mana sem sinergia com o recurso do campeão.'};
 return eligibilityForItem(id,f,data);
}
