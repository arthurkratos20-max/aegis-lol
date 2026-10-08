import type {Dataset,Fighter,Scenario,SkillKey,Stats,Action} from './contracts.ts';
import {applyStacks,stackDefinitions} from './stacks.ts';
import {baseSkillPlan} from './skillOrders.ts';
import {conservative} from './skillRules.ts';
export {conservative,skillValid} from './skillRules.ts';
import {EMPTY_FORMULA} from './contracts.ts';
export const growth=(level:number)=>.7025*(level-1)+.0175*(level-1)**2;
export const hasteCooldown=(cooldown:number,haste:number)=>cooldown*100/(100+Math.max(0,haste));
export const mitigate=(damage:number,resistance:number)=>damage*(resistance>=0?100/(100+resistance):2-100/(100-resistance));
export const effectiveResistance=(resistance:number,percentPen:number,flatPen:number)=>resistance<=0?resistance:Math.max(0,resistance*(1-percentPen)-flatPen);
/** Flat reduction → percent reduction → percent penetration → flat penetration. */
export function combatResistance(resistance:number,percentPen=0,flatPen=0,percentReduction=0,flatReduction=0):number {
 const reduced=resistance-Math.max(0,flatReduction);
 const final=reduced>0?reduced*(1-Math.max(0,Math.min(1,percentReduction))):reduced;
 return effectiveResistance(final,Math.max(0,Math.min(1,percentPen)),Math.max(0,flatPen));
}
export const plain=(text:string)=>text.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
export const itemEligible=(id:string,data:Dataset,champion:string)=>{const i=data.items[id];return !!i&&i.maps['11']&&i.gold.purchasable&&i.inStore!==false&&!i.requiredAlly&&(!i.requiredChampion||i.requiredChampion===champion);};
export const isBoot=(id:string,data:Dataset)=>data.items[id]?.tags.includes('Boots')??false;
export function statsFor(f:Fighter,data:Dataset):Stats{
 const c=data.champions[f.champion];if(!c)throw Error('Campeão ausente no snapshot');const s=c.stats,g=growth(f.level);const val=(k:string)=>s[k]+(s[`${k}perlevel`]??0)*g;
 const x:Stats={hp:val('hp'),ad:val('attackdamage'),ap:0,armor:val('armor'),mr:val('spellblock'),mana:val('mp'),as:s.attackspeed,baseAS:s.attackspeed,ratio:s.attackspeed,bonusAS:(s.attackspeedperlevel??0)*g/100,crit:0,critMultiplier:1.75,haste:0,move:s.movespeed,range:s.attackrange,hpRegen:val('hpregen'),manaRegen:val('mpregen'),lifesteal:0,armorPen:0,magicPen:0,armorPenPercent:0,magicPenPercent:0};
 const map:Record<string,keyof Stats>={FlatHPPoolMod:'hp',FlatMPPoolMod:'mana',FlatPhysicalDamageMod:'ad',FlatMagicDamageMod:'ap',FlatArmorMod:'armor',FlatSpellBlockMod:'mr',FlatMovementSpeedMod:'move',PercentAttackSpeedMod:'bonusAS',FlatCritChanceMod:'crit',PercentLifeStealMod:'lifesteal'};
 let percentHPRegen=0,percentManaRegen=0,percentMove=0,critDamage=0;
 for(const id of f.items){const item=data.items[id];for(const [k,v]of Object.entries(item?.stats??{})){if(map[k])x[map[k]]+=v;}
  const header=plain(item?.description.match(/<stats>([\s\S]*?)<\/stats>/i)?.[1]??'');
  const amount=(pt:string,en:string,percent=false)=>{const m=header.match(new RegExp('([0-9]+(?:[.,][0-9]+)?)'+(percent?'%':'')+'\\s*(?:de )?(?:'+pt+'|'+en+')','i'));return m?Number(m[1].replace(',','.')):0;};
  critDamage+=amount('Dano de Acerto Crítico','Critical Strike Damage',true)/100;
  x.haste+=amount('Aceleração de Habilidade','Ability Haste');x.armorPen+=amount('Letalidade','Lethality');x.magicPen+=amount('Penetração Mágica','Magic Penetration');
  x.armorPenPercent+=amount('Penetração de Armadura','Armor Penetration',true)/100;x.magicPenPercent+=amount('Penetração Mágica','Magic Penetration',true)/100;
  percentHPRegen+=amount('Regeneração de Vida base','Base Health Regen',true)/100;percentManaRegen+=amount('Regeneração de Mana base','Base Mana Regen',true)/100;percentMove+=item?.stats.PercentMovementSpeedMod??0;
 }
 x.hpRegen*=1+percentHPRegen;x.manaRegen*=1+percentManaRegen;x.move*=1+percentMove;
 x.armorPenPercent=Math.min(1,x.armorPenPercent);x.magicPenPercent=Math.min(1,x.magicPenPercent);
 for(const shard of f.runes.shards){if(shard==='ad')x.ad+=5.4;if(shard==='ap')x.ap+=9;if(shard==='as')x.bonusAS+=.1;if(shard==='hp')x.hp+=65;if(shard==='haste')x.haste+=8;if(shard==='scalingHP')x.hp+=10*f.level;if(shard==='move')x.move*=1.02;if(shard==='adaptive'){const bonusAD=x.ad-val('attackdamage');if(x.ap>bonusAD/.6||x.ap===0&&bonusAD===0&&c.tags.includes('Mage'))x.ap+=9;else x.ad+=5.4;}}
 applyStacks(x,f,data);
 // Attack speed ratio is not supplied by Data Dragon; approximation is declared by coverage.
 if(data.mechanics?.[f.champion]){x.ratio=data.mechanics[f.champion].ratio;x.critMultiplier=data.mechanics[f.champion].critMultiplier;}
 x.critMultiplier+=critDamage;
 if(f.items.includes('3089')){const desc=plain(data.items['3089']?.description??'');const m=desc.match(/(?:aumenta|increases)[^%]{0,100}?(\d+)%/i);if(m)x.ap*=1+Number(m[1])/100;}
 x.as=Math.min(2.5,x.baseAS+x.ratio*x.bonusAS);x.crit=Math.min(1,x.crit);
 return {...x,...f.overrides};
}
export function fighter(data:Dataset,id:string):Fighter{return {champion:id,lane:'Top',level:18,items:[],owned:[],locked:[],skills:baseSkillPlan(data,id,'Top').sequence,skillMode:'auto',runes:{primary:8000,secondary:8400,selected:[],shards:[],locked:false},initialHP:1,initialResource:1,actions:[],automaticAttacks:true,uptime:1,stacks:{},overrides:{},boots:'auto',fixedBoot:'',dragons:{},soul:''};}
export function initialScenario(data:Dataset):Scenario{return {schema:1,patch:data.version,mode:'exploratory',duration:10,distance:125,execution:'consistent',player:fighter(data,'Jinx'),enemy:fighter(data,'Darius'),allies:['','','',''],budget:6000,slots:6,allowSell:false,weights:{offense:60,defense:30,utility:10},subweights:{},customPreference:false,objective:'dps',defensiveObjective:'survive',seed:42,conditions:{grievous:0,shieldReduction:0},enabledConditions:{},utilization:{}};}
export function attackAction(at:number):Action{return {id:`aa-${at}`,at,kind:'attack',key:'AA',name:'Ataque básico',type:'physical',formula:{...EMPTY_FORMULA,ad:1},cooldown:0,cost:0,cast:0,duration:0,hit:1,onHit:true,custom:false,coverage:'testing'};}
export function normalizeWeights(current:Scenario['weights'],key:keyof Scenario['weights'],value:number):Scenario['weights']{const others=(Object.keys(current) as (keyof typeof current)[]).filter(k=>k!==key);const v=Math.max(0,Math.min(100,value)),sum=others.reduce((a,k)=>a+current[k],0);return {...current,[key]:v,[others[0]]:(100-v)*(sum?current[others[0]]/sum:.5),[others[1]]:(100-v)*(sum?current[others[1]]/sum:.5)};}
export function validateScenario(s:Scenario,data:Dataset):string[]{
 const errors:string[]=[];if(s.schema!==1||s.patch!==data.version)errors.push('Snapshot incompatível');if(!Number.isFinite(s.duration)||s.duration<=0||s.duration>120)errors.push('Janela deve ser de 0.1 a 120 segundos');if(!Number.isFinite(s.budget)||s.budget<0)errors.push('Orçamento inválido');if(!Number.isInteger(s.slots)||s.slots<0||s.slots>6)errors.push('Slots inválidos');
 if(!Number.isFinite(s.distance)||s.distance<0)errors.push('Distância inválida');
 for(const value of Object.values(s.conditions))if(!Number.isFinite(value)||value<0||value>1)errors.push('Condição inválida');
 if(s.enemyTeam!==undefined&&(!Array.isArray(s.enemyTeam)||s.enemyTeam.length>5||s.enemyTeam.some(id=>typeof id!=='string'||id!==''&&!Object.hasOwn(data.champions,id))))errors.push('Time inimigo inválido');
 if(s.teamPriority!==undefined&&(!Number.isFinite(s.teamPriority)||s.teamPriority<0||s.teamPriority>100))errors.push('Prioridade de time deve estar entre 0 e 100%');
 const weights=Object.values(s.weights);if(weights.some(v=>!Number.isFinite(v)||v<0)||Math.abs(weights.reduce((a,b)=>a+b,0)-100)>1e-6)errors.push('Pesos devem somar 100%');
 for(const f of [s.player,s.enemy]){
  if(!Number.isFinite(f.initialHP)||f.initialHP<0||f.initialHP>1||!Number.isFinite(f.initialResource)||f.initialResource<0||f.initialResource>1)errors.push('HP/recurso inicial inválido');
  if(!Number.isFinite(f.uptime)||f.uptime<0||f.uptime>1)errors.push('Tempo em alcance inválido');
  for(const [key,value]of Object.entries(f.stacks)){const d=stackDefinitions(f,data).find(d=>d.key===key);if(!Number.isFinite(value)||value<0||(d&&(value>d.max||value%d.step!==0)))errors.push('Acúmulo inválido');}
  for(const a of f.actions){
   if([a.at,a.hit,a.cooldown,a.cost,a.cast,a.duration].some(v=>!Number.isFinite(v)||v<0)||a.hit>1)errors.push('Ação inválida');
   if(a.cooldownReduction!==undefined&&(!Number.isFinite(a.cooldownReduction)||a.cooldownReduction<0))errors.push('Redução de cooldown inválida');
  }
  for(const key of ['as','hp'] as const)if(f.overrides[key]!==undefined&&f.overrides[key]!<=0)errors.push('HP/velocidade de ataque deve ser positiva');
  for(const key of ['crit','lifesteal','armorPenPercent','magicPenPercent'] as const)if(f.overrides[key]!==undefined&&f.overrides[key]!>1)errors.push('Atributo percentual inválido');
if(!data.champions[f.champion])errors.push('Campeão inválido');if(!Number.isInteger(f.level)||f.level<1||f.level>18)errors.push('Nível inválido');if(f.items.length>6||new Set(f.items).size!==f.items.length)errors.push('Itens duplicados ou slots excedidos');if(f.items.some(id=>!itemEligible(id,data,f.champion)))errors.push('Item não elegível');if(f.items.filter(id=>isBoot(id,data)).length>1)errors.push('Somente um par de botas');for(const v of Object.values(f.overrides))if(!Number.isFinite(v)||v<0)errors.push('Override inválido');if(f.actions.some(a=>!Number.isFinite(a.at)||a.at<0||a.at>s.duration||a.hit<0||a.hit>1||Object.values(a.formula).some(v=>!Number.isFinite(v)||v<0)))errors.push('Ação inválida');}
 return errors;
}
