import {supportIntent} from './championScaling.ts';
import type {Dataset,Fighter,RunePage,Scenario,CombatResult} from './contracts.ts';
import {itemEligible,isBoot,statsFor} from './model.ts';
import {purchasePlan} from './optimizer.ts';
import {simulate} from './engine.ts';
import {runeCompatible,itemCompatible,kitFor} from './compatibility.ts';
export type TacticalMode='balanced'|'behind'|'snowball'|'antiheal'|'antishield';
export type Profile='enchanter'|'supportTank'|'supportDamage'|'fighterAD'|'fighterAP'|'assassinAD'|'assassinAP'|'mageControl'|'mageBurn'|'mageBurst'|'tank'|'marksman';
export const PROFILE_LABELS:Record<Profile,string>={enchanter:'Suporte · encantador',supportTank:'Suporte · proteção e engage',supportDamage:'Suporte · dano',fighterAD:'Lutador AD',fighterAP:'Lutador AP',assassinAD:'Assassino AD',assassinAP:'Assassino AP',mageControl:'Mago de controle',mageBurn:'Mago de dano contínuo',mageBurst:'Mago de burst',tank:'Tanque',marksman:'Atirador'};
const list=(id:string,values:string)=>values.split(' ').includes(id);
export function profileFor(id:string,lane:string,data:Dataset):Profile {
 const tags=data.champions[id]?.tags??[];
 const enchanter=list(id,'Lulu Janna Nami Milio Soraka Sona Yuumi Renata Ivern Karma Seraphine');
 const tank=list(id,'Shen Ornn Sion Malphite Rammus Amumu Zac Sejuani Maokai Nautilus Leona Alistar Braum Rell TahmKench Poppy KSante Skarner ChoGath Galio');
 const apAssassin=list(id,'Akali Ekko Evelynn Fizz Katarina Kassadin Diana');
 const apFighter=list(id,'Gwen Mordekaiser Lillia Rumble Sylas Singed Vladimir Gragas');
 const burn=list(id,'Brand Zyra Malzahar Cassiopeia Anivia Singed AurelionSol Swain');
 if(enchanter&&lane==='Support')return 'enchanter';
 if(enchanter)return 'mageControl';
 if(lane==='Support'){if(tank||list(id,'Thresh Taric Blitzcrank'))return 'supportTank';if(list(id,'Pyke Senna'))return id==='Pyke'?'assassinAD':'marksman';if(tags.includes('Mage'))return 'supportDamage';}
 if(tank)return 'tank';if(apAssassin)return 'assassinAP';if(apFighter)return 'fighterAP';if(burn)return 'mageBurn';
 if(tags.includes('Marksman'))return 'marksman';
 if(list(id,'Yasuo Yone Tryndamere MasterYi Belveth'))return 'fighterAD';
 if(tags.includes('Assassin')&&!tags.includes('Mage'))return 'assassinAD';
 if(tags.includes('Mage'))return list(id,'Lux Annie Veigar Syndra LeBlanc Zoe Vex Neeko')?'mageBurst':'mageControl';
 if(tags.includes('Fighter'))return 'fighterAD';if(tags.includes('Tank'))return 'tank';if(tags.includes('Support'))return 'supportTank';return 'fighterAD';
}
const CORE:Record<Profile,string[]>={
 enchanter:['6617','3107','3222','3504','6620'],supportTank:['3190','3109','3222','3075','3065'],supportDamage:['6653','3116','3165','6655'],
 fighterAD:['3071','3161','3053','3748','3153','3078'],fighterAP:['4633','6653','3116','3115','3157'],assassinAD:['3142','6692','6698','6695'],assassinAP:['3152','3089','3135','3157'],
 mageControl:['6655','3003','3135','3157','3102'],mageBurn:['6653','3116','3135','3157'],mageBurst:['6655','3089','3135','3157'],tank:['3084','6665','3748','2502','3065','3075'],marksman:['3031','3094','3072','3036','3046','3032','6676','3508','3153']
};
const SPECIFIC:Record<string,string[]>={Ezreal:['3078','3004','3161','6692'],Shen:['3748','3084','6665','3065','3071','3181','3153'],Yasuo:['3153','3031','3072'],Yone:['3153','3031','3072'],Riven:['6692','3071','3161','3053'],Darius:['3078','3053','3071','3161'],Kaisa:['3124','3115','3031'],KogMaw:['3153','3124','3072'],Vayne:['3153','3124','3072'],Varus:['3153','3124','3072']};
export function enemyAxis(s:Scenario,data:Dataset):'physical'|'magic'|'mixed' {
 const f=s.enemy;if(f.actions.length){let physical=0,magic=0;for(const a of f.actions){if(a.type==='physical')physical++;if(a.type==='magic')magic++;}if(physical>magic)return 'physical';if(magic>physical)return 'magic';}
 const gear=f.items.map(id=>data.items[id]?.stats??{}),ap=gear.reduce((n,i)=>n+(i.FlatMagicDamageMod??0),0),ad=gear.reduce((n,i)=>n+(i.FlatPhysicalDamageMod??0),0);if(ap>ad&&ap>0)return 'magic';if(ad>ap&&ad>0)return 'physical';
 const p=profileFor(f.champion,f.lane,data);return ['enchanter','supportDamage','fighterAP','assassinAP','mageControl','mageBurn','mageBurst'].includes(p)?'magic':['marksman','assassinAD','fighterAD'].includes(p)?'physical':'mixed';
}
export function runeSuggestion(profile:Profile,s:Scenario,data:Dataset,mode:TacticalMode):RunePage {
 let primary=8000,secondary=8400,selected=[8010,9111,9105,8299,8473,8451];
 if(profile==='marksman'){selected=[8008,8009,9104,8017,8473,8451];}
 if(['tank','supportTank'].includes(profile)){primary=8400;secondary=8300;selected=[profile==='supportTank'?8439:8437,8446,mode==='behind'?8444:8473,8451,8304,8347];}
 if(profile==='enchanter'){primary=8200;secondary=8400;selected=[8214,8226,8210,8237,8463,8453];}
 if(['assassinAD','assassinAP','mageBurst'].includes(profile)){primary=8100;secondary=8200;selected=[8112,8143,8140,8106,8226,8233];}
 if(['mageControl','mageBurn','supportDamage'].includes(profile)){primary=8200;secondary=8300;selected=[8229,8226,8210,8237,8345,8347];}
 if(s.player.champion==='Ezreal'){primary=8000;secondary=8200;selected=[8005,8009,9105,8014,8226,8210];}
 const tree=data.runes.find(t=>t.id===primary),second=data.runes.find(t=>t.id===secondary);
 if(!tree||!second)throw Error('Árvore de runas ausente no snapshot');
 // Resolve every primary slot in the actual snapshot; secondary choices occupy distinct slots.
 const main=tree.slots.map(slot=>slot.runes.find(r=>selected.includes(r.id)&&runeCompatible(r.id,s.player,data).allowed)?.id??slot.runes.find(r=>runeCompatible(r.id,s.player,data).allowed)?.id??0);
 const extra=second.slots.slice(1).map(slot=>slot.runes.find(r=>selected.includes(r.id)&&runeCompatible(r.id,s.player,data).allowed)?.id).filter((x):x is number=>x!==undefined).slice(0,2);
 if(extra.length<2){for(const slot of second.slots.slice(1)){if(extra.some(id=>slot.runes.some(r=>r.id===id)))continue;const valid=slot.runes.find(r=>runeCompatible(r.id,s.player,data).allowed);if(valid)extra.push(valid.id);if(extra.length===2)break;}}
 return {primary,secondary,selected:[...main,...extra],shards:[],locked:false};
}
export interface QuickRecommendation {profile:Profile;cores:string[];boots:string|null;target:string[];runes:RunePage;verdict:string;reasons:Record<string,string>;warnings:string[];total:number}
export function recommend(s:Scenario,data:Dataset,mode:TacticalMode='balanced'):QuickRecommendation {
 const profile=supportIntent(s.player,data)==='utility'?profileFor(s.player.champion,'Support',data):profileFor(s.player.champion,s.player.lane==='Support'&&s.player.supportMode==='damage'?'Mid':s.player.lane,data),axis=enemyAxis(s,data),isAP=['enchanter','supportDamage','fighterAP','assassinAP','mageControl','mageBurn','mageBurst'].includes(profile),isTank=['tank','supportTank'].includes(profile);
 const pool=[...(SPECIFIC[s.player.champion]??CORE[profile])];
 if(isTank&&axis==='magic')pool.unshift('3065','6664');if(isTank&&axis==='physical')pool.unshift(profile==='supportTank'?'3109':'2502');
 const defense=s.weights.defense>s.weights.offense;
 if(defense)pool.unshift(isAP?(profile==='enchanter'?'3107':axis==='physical'?'3157':'3102'):profile==='assassinAD'?'3814':profile==='marksman'?'3072':profile==='fighterAD'?'6333':isTank?(axis==='magic'?'3065':'2502'):'3053');
 if(!defense&&isTank)pool.unshift(profile==='supportTank'?'3190':['Shen','Sion','Poppy','KSante','Ornn','Sett','Skarner'].includes(s.player.champion)?'3748':s.player.champion==='Rammus'?'3075':'6653');
 if(mode==='behind')pool.unshift(isAP?(profile==='enchanter'?'3107':axis==='physical'?'3157':'3102'):isTank?(axis==='magic'?'3065':'3075'):'3053');
 if(mode==='snowball')pool.unshift(isAP?(profile==='enchanter'?'3504':'3089'):profile==='assassinAD'?'3142':profile==='marksman'?'3031':'3071');
 if(mode==='antiheal')pool.unshift(isTank?'3075':isAP?'3165':'3033');
 if(mode==='antishield'&&profile==='assassinAD')pool.unshift('6695');
 // No unrelated AP/utility champion receives Serpent's Fang as a universal answer.
 const valid=(id:string)=>itemEligible(id,data,s.player.champion)&&itemCompatible(id,s.player,data).allowed;
 const lockedCores=s.player.locked.filter(id=>itemEligible(id,data,s.player.champion)&&!isBoot(id,data));
 let boot=!kitFor(s.player,data).boots?null:s.player.boots==='none'?null:s.player.boots==='fixed'?(valid(s.player.fixedBoot)?s.player.fixedBoot:null):s.player.locked.find(id=>isBoot(id,data))??s.player.owned.find(id=>isBoot(id,data))??(profile==='marksman'?'3006':['enchanter','supportTank'].includes(profile)?'3158':axis==='physical'?'3047':axis==='magic'?'3111':isAP?'3020':'3158');
 if(boot&&!valid(boot))boot=null;
 const capacity=Math.max(0,Math.min(3,s.slots-(boot?1:0)));
 const cores=[...new Set([...lockedCores,...pool.filter(valid)])].slice(0,capacity);
 const target=[...cores,...(boot&&s.slots>0?[boot]:[])];
 const reasons:Record<string,string>={};for(const id of cores){const item=data.items[id];reasons[id]=mode==='antiheal'&&['3075','3165','3033'].includes(id)?'Resposta estratégica à cura; efeito ainda não simulado.':id==='6695'?'Resposta a escudos para build AD; redução ainda não simulada.':id==='3157'?'Resposta defensiva à pressão física; estase exige ação configurada.':id==='3065'?'Vida e resistência mágica contra pressão AP.':profile==='enchanter'?'Utilidade de suporte, com custo menor que itens de carry.':profile==='supportTank'?'Proteção da equipe e atributos defensivos.':profile==='tank'?'Vida e resistências; escalas/passivas ainda não simuladas.':profile.startsWith('mage')||profile==='fighterAP'||profile==='assassinAP'?'Atributos AP compatíveis com o perfil; efeitos condicionais pendentes.':'Atributos ofensivos compatíveis; passivas exigem revisão.';}
 const verdict=mode==='behind'?'Preserve vida e recursos; troque risco por consistência até concluir seu próximo item.':mode==='snowball'?'Use sua vantagem para disputar espaço após a compra; guarde uma rota de saída.':mode==='antiheal'?'Aplique a resposta à cura durante as trocas, sem sacrificar seu posicionamento.':mode==='antishield'?(profile==='assassinAD'?'Espere o escudo entrar antes de executar a janela de dano.':'Espere o escudo expirar; não force um item AD incompatível só para quebrá-lo.'):profile==='enchanter'?'Jogue perto de quem você protege; use recursos defensivos antes do dano decisivo.':profile==='supportTank'?'Prepare a entrada com sua equipe por perto; não gaste seu controle sem acompanhamento.':profile==='tank'?'Absorva a primeira pressão e prolongue a troca sem perder a proteção do seu time.':profile.startsWith('assassin')?'Espere o adversário gastar sua defesa; entre com uma saída disponível.':profile==='mageBurn'?'Mantenha dano constante e espaço seguro, em vez de forçar um único all-in.':profile==='marksman'?'Bata enquanto mantém distância; preserve sua vida para continuar causando dano.':'Negocie a troca em torno das suas habilidades e recue durante a recarga.';
 const warnings=['Recomendação estratégica por perfil; não é meta observado nem ótimo matemático global.','Passivas de itens e efeitos das runas não entram nos números do cartão.'];
 if(mode==='antishield'&&profile!=='assassinAD')warnings.push('Sem resposta anti-escudo validada compatível com este perfil.');
 if(lockedCores.length>capacity)warnings.push('Há mais itens travados do que o cartão comporta; eles continuam preservados no editor manual.');
 if(s.player.runes.locked)warnings.push('Página de runas travada: preservada.');
 return {profile,cores,boots:boot,target,runes:s.player.runes.locked?s.player.runes:runeSuggestion(profile,s,data,mode),verdict,reasons,warnings,total:target.reduce((sum,id)=>sum+data.items[id].gold.total,0)};
}
export function quickCombat(s:Scenario,data:Dataset,items:string[]):CombatResult {
 const trial:Scenario={...s,player:{...s.player,items:[...items]},enemy:{...s.enemy}};
 // Preserve user sequences; no synthetic champion combo or passive is invented.
 return simulate(trial,data);
}
export interface GoldPurchase {items:string[];finalItems:string[];purchase:number;sale:number;remaining:number;score:number;warnings:string[]}
/** Small exact enumeration of basic components for a fixed target; never changes existing purchases. */
export function goldCheck(s:Scenario,data:Dataset,target:string[],profile:Profile):GoldPurchase {
 const owned=s.player.owned.filter(id=>itemEligible(id,data,s.player.champion));
 if(owned.length>s.slots)throw Error('Itens possuídos excedem os slots disponíveis.');
 const all=new Set<string>();const visit=(id:string,path=new Set<string>())=>{if(path.has(id))return;const i=data.items[id];if(!i)return;for(const c of i.from??[])visit(c,new Set(path).add(id));if(!(i.from??[]).length&&i.gold.total>0&&itemEligible(id,data,s.player.champion)&&!isBoot(id,data))all.add(id);};
 for(const id of target)visit(id);
 // Exhaustively compare every distinct combination in this bounded recipe pool.
 const candidates=[...all].sort();const maxNew=Math.min(3,Math.max(0,s.slots-owned.length));
 const base=statsFor({...s.player,items:owned},data),ap=['enchanter','supportDamage','fighterAP','assassinAP','mageControl','mageBurn','mageBurst'].includes(profile),tank=['tank','supportTank'].includes(profile);
 const evaluate=(finalItems:string[])=>{const x=statsFor({...s.player,items:finalItems},data);const offense=ap?(x.ap-base.ap)/100:(x.ad-base.ad)/60+(x.as-base.as)/Math.max(.1,base.as);const defense=((x.hp*Math.max(.01,1+x.armor/100))/(base.hp*Math.max(.01,1+base.armor/100))+(x.hp*Math.max(.01,1+x.mr/100))/(base.hp*Math.max(.01,1+base.mr/100)))/2-1;const resources=(x.mana-base.mana)/500;return offense*(tank?.2:profile==='enchanter'?.4:.75)+defense*(tank?.8:.25)+resources*(profile==='mageControl'||profile==='enchanter'?.3:.05);};
 const allowed={...s,allowSell:false,player:{...s.player,owned}};
 let best:GoldPurchase={items:[],finalItems:owned,purchase:0,sale:0,remaining:s.budget,score:0,warnings:['Comparação de atributos estáticos entre componentes das receitas sugeridas; sem passivas, AH textual ou regeneração de mana.','Até três componentes distintos nesta compra; não representa ótimo global de todos os itens.']};
 const consider=(add:string[])=>{const finalItems=[...owned,...add];if(new Set(finalItems).size!==finalItems.length)return;const p=purchasePlan(finalItems,allowed,data);if(p.purchase>s.budget)return;const score=evaluate(finalItems);if(score>best.score+1e-9||(Math.abs(score-best.score)<1e-9&&p.purchase<best.purchase))best={...best,items:[...add],finalItems,purchase:p.purchase,remaining:s.budget-p.purchase,score};};
 function enumerate(add:string[],start:number){consider(add);if(add.length>=maxNew)return;for(let i=start;i<candidates.length;i++)enumerate([...add,candidates[i]],i+1);}
 enumerate([],0);
 // Completed target upgrades are also evaluated using the exact owned-component credit.
 for(const id of target){if(owned.includes(id))continue;const i=data.items[id];if(!i)continue;const unused=[...owned];const consume=(key:string,path=new Set<string>())=>{const n=unused.indexOf(key);if(n>=0){unused.splice(n,1);return;}if(path.has(key))return;for(const c of data.items[key]?.from??[])consume(c,new Set(path).add(key));};consume(id);const finalItems=[...unused,id];if(finalItems.length>s.slots||new Set(finalItems).size!==finalItems.length)continue;const p=purchasePlan(finalItems,allowed,data);if(p.unusedOwned.length||p.purchase>s.budget)continue;if(s.player.locked.some(key=>owned.includes(key)&&!finalItems.includes(key)))continue;const score=evaluate(finalItems);if(score>best.score+1e-9)best={...best,items:[id],finalItems,purchase:p.purchase,remaining:s.budget-p.purchase,score};}
 return best;
}
export function itemSetJSON(championId:string,data:Dataset,cores:string[],boots:string|null,components:string[]):string {
 const ids=[...cores,...(boots?[boots]:[])];if(ids.some(id=>!itemEligible(id,data,championId)))throw Error('Item não elegível para exportação');
 const block=(type:string,items:string[])=>({type,items:items.map(id=>({id,count:1}))});
 return JSON.stringify({title:`Aegis Lab · ${data.champions[championId].name}`,type:'custom',map:'SR',mode:'CLASSIC',associatedMaps:[11],associatedChampions:[Number(data.champions[championId].key)],preferredItemSlots:[],blocks:[block('Core sugerido',cores),block('Botas',boots?[boots]:[]),block('Compras na base',components)],sortrank:0,startedFrom:'blank'},null,2);
}

/** Strategic affinity filter. It does not claim complete champion passive modeling. */
export function affinityCandidates(s:Pick<Scenario,'player'>,data:Dataset):string[]{
 const p=profileFor(s.player.champion,s.player.lane,data),ap=['enchanter','supportDamage','fighterAP','assassinAP','mageControl','mageBurn','mageBurst'].includes(p),tank=['tank','supportTank'].includes(p);
 const defense=ap?['3157','3102',...(p==='enchanter'?['3107','3222','6620']:[])]:p==='assassinAD'?['3814','6333']:p==='marksman'?['3072','3026','3139','3091','3814','3156','6673']:tank?['3084','3748','3065','6664','2502','3075','6665']:['6333','3053','3026'];
 const boot=['3006','3020','3047','3111','3158'];
 return [...new Set([...(SPECIFIC[s.player.champion]??[]),...CORE[p],...defense,...boot])].filter(id=>itemEligible(id,data,s.player.champion)&&itemCompatible(id,s.player,data).allowed&&(!isBoot(id,data)||s.player.boots!=='none'));
}
