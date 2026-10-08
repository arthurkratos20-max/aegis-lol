import type {Action,Dataset,DamageType,Fighter,Stats} from './contracts.ts';
import {EXACT_PATCH,exactEffect,exactRaw,exactCalculation,exactValue,skillRank} from './exactKits.ts';
export interface KitState {active:boolean;minigun:boolean;minigunStacks:number;minigunExpires:number;shenCharges:number;shenExpires:number;shenEffect:string;vayneStacks:number;vayneExpires:number;vayneQExpires:number;vayneQCooldown:number;luxMarkExpires:number;asheStacks:number;asheStackExpires:number;asheFrostExpires:number;asheQExpires:number;bleedStacks:number;bleedExpires:number;noxianExpires:number;garenTicks:number;garenWindow:number;armorShredExpires:number;garenDRExpires:number;garenDR:number;wallExpires:number}
export const kitState=(f:Fighter):KitState=>({active:f.actions.some(a=>exactEffect(a.kitEffect)?.champion===f.champion&&!a.custom),minigun:false,minigunStacks:0,minigunExpires:0,shenCharges:0,shenExpires:0,shenEffect:'shen-q',vayneStacks:0,vayneExpires:0,vayneQExpires:0,vayneQCooldown:0,luxMarkExpires:0,asheStacks:0,asheStackExpires:0,asheFrostExpires:0,asheQExpires:0,bleedStacks:0,bleedExpires:0,noxianExpires:0,garenTicks:0,garenWindow:0,armorShredExpires:0,garenDRExpires:0,garenDR:0,wallExpires:0});
export interface KitPart {raw:number;type:DamageType;name:string}
export interface KitImpact {raw:number;type:DamageType;extra:KitPart[];cancel?:string;resetAttack?:boolean;deferCooldown?:boolean;consumedQCooldown?:number;healMissing?:number;passive?:boolean;rescheduleAttack?:boolean}
export function kitActorStats(f:Fighter,actor:Stats,base:Stats,state:KitState,at:number):Stats {
 if(!state.active)return actor;let x=actor;
 if(f.champion==='Jinx'&&state.minigun&&state.minigunExpires>at){const rank=skillRank(f,'Q');if(rank)x={...x,as:Math.min(2.5,x.as+x.ratio*exactValue('Jinx','JinxQ','MinigunAttackSpeedMax',rank)/100*state.minigunStacks/3)};}
 if(f.champion==='Darius'){
  const e=skillRank(f,'E'),pen=e?exactValue('Darius','DariusAxeGrabCone','PassivePercentArmorPen',e)/100:0;
  const bonus=state.noxianExpires>at?exactCalculation('Darius','DariusHemoMarker','NoxianMightBonusAD',1,f.level,actor,base):0;
  x={...x,ad:x.ad+bonus,armorPenPercent:1-(1-x.armorPenPercent)*(1-pen)};
 }
 return x;
}
/** Called after gates. Fractional hits never create deterministic stacks. */
export function kitImpact(a:Action,f:Fighter,data:Dataset,actor:Stats,base:Stats,target:Stats,currentHP:number,state:KitState):KitImpact|null {
 if(!state.active||a.custom&&!a.kitEffect)return null;
 const e=exactEffect(a.kitEffect);if(a.kitEffect&&(!e||e.champion!==f.champion||a.key!==e.key||a.kind!==(e.id==='lux-w'||e.mode==='shield'?'shield':'spell')||a.type!==e.type||data.version!==EXACT_PATCH||a.custom))return {raw:0,type:a.type,extra:[],cancel:'Efeito incompatível, customizado ou snapshot não validado'};
 const at=a.at,hit=a.hit===1,extra:KitPart[]=[],impact:KitImpact={raw:0,type:a.type,extra};
 if(e?.mode==='passive'){if(e.id==='jinx-minigun')state.minigun=true;impact.passive=true;return impact;}
 if(e?.mode==='secondary'&&state.wallExpires<=at)return {...impact,cancel:'Parede requer impacto inicial de E recente'};
 if(e?.mode==='buff'){
  if(e.id.startsWith('shen-q')){state.shenCharges=3;state.shenExpires=at+8;state.shenEffect=e.id;}
  if(e.id==='vayne-q'){state.vayneQExpires=at+3;state.vayneQCooldown=a.cooldown;impact.deferCooldown=true;}
  if(e.id==='ashe-q'){
   if(state.asheStacks<4||state.asheStackExpires<=at)return {...impact,cancel:'Q exige quatro acúmulos de Foco ativos'};
   state.asheStacks=0;state.asheQExpires=at+6;
  }
  impact.passive=true;return impact;
 }
 const attack=a.kind==='attack'||e?.mode==='attack',crit=1+Math.max(0,Math.min(1,actor.crit))*(actor.critMultiplier-1);
 if(e?.id==='garen-w'){state.garenDRExpires=at+exactValue('Garen','GarenW','DRDuration',skillRank(f,'W'));state.garenDR=exactValue('Garen','GarenW','DRPercent',skillRank(f,'W'));}
 if(e)impact.raw=exactRaw(e.id,f,actor,base,target,currentHP,state.bleedExpires>at?state.bleedStacks:0);else if(!attack)return null;
 if(attack){
  if(!e)impact.raw=actor.ad*crit;
  if(e?.id==='jinx-rocket'){impact.raw*=crit;state.minigun=false;state.minigunStacks=0;}
  if(f.champion==='Jinx'&&state.minigun&&hit){state.minigunStacks=state.minigunExpires>at?Math.min(3,state.minigunStacks+1):1;state.minigunExpires=at+2.5;impact.rescheduleAttack=true;}
  if(e?.id==='malphite-w'){extra.push({raw:impact.raw,type:'magic',name:'W · bônus mágico'});impact.raw=actor.ad*crit;impact.type='physical';}
  if(e?.mode==='attack'&&e.id!=='jinx-rocket')impact.resetAttack=true;
  if(f.champion==='Shen'&&state.shenCharges>0&&state.shenExpires>at){extra.push({raw:exactRaw(state.shenEffect,f,actor,base,target,currentHP),type:'magic',name:'Q · bônus fortalecido'});if(hit)state.shenCharges--;}
  if(f.champion==='Vayne'&&state.vayneQExpires>at){extra.push({raw:exactRaw('vayne-q',f,actor,base,target,currentHP),type:'physical',name:'Q · dano bônus sem crítico'});if(hit){state.vayneQExpires=0;impact.consumedQCooldown=state.vayneQCooldown;}}
  if(f.champion==='Lux'&&state.luxMarkExpires>at){extra.push({raw:exactCalculation('Lux','LuxIlluminationPassive','TotalDamage',1,f.level,actor,base),type:'magic',name:'P · Iluminação'});if(hit)state.luxMarkExpires=0;}
  if(f.champion==='Ashe'){
   const frost=state.asheFrostExpires>at?exactCalculation('Ashe','AshePassive','DamageBonus',1,f.level,actor,base):1;
   impact.raw=(state.asheQExpires>at?exactRaw('ashe-q',f,actor,base,target,currentHP):actor.ad)*frost;
   if(hit){state.asheStacks=state.asheStackExpires>at?Math.min(4,state.asheStacks+1):1;state.asheStackExpires=at+4;state.asheFrostExpires=at+2;}
  }
 }
 if(hit&&f.champion==='Vayne'&&(attack||e?.id==='vayne-e')&&skillRank(f,'W')){
  state.vayneStacks=state.vayneExpires>at?state.vayneStacks+1:1;state.vayneExpires=at+3.5;
  if(state.vayneStacks>=3){extra.push({raw:exactRaw('vayne-w',f,actor,base,target,currentHP),type:'true',name:'W · terceiro acúmulo'});state.vayneStacks=0;}
 }
 if(hit&&e?.id==='vayne-e')state.wallExpires=at+1;
 if(hit&&f.champion==='Lux'&&e&&['lux-q','lux-e','lux-r'].includes(e.id)){
  if(e.id==='lux-r'&&state.luxMarkExpires>at)extra.push({raw:exactCalculation('Lux','LuxIlluminationPassive','TotalDamage',1,f.level,actor,base),type:'magic',name:'R · detona Iluminação'});
  state.luxMarkExpires=at+6;
 }
 if(hit&&e?.id==='ashe-w')state.asheFrostExpires=at+2;
 if(hit&&f.champion==='Darius'&&(attack||e?.id==='darius-q')){
  state.bleedStacks=state.bleedExpires>at?Math.min(5,state.bleedStacks+1):1;state.bleedExpires=at+5;
  if(state.bleedStacks===5)state.noxianExpires=at+5;
  if(e?.id==='darius-q')impact.healMissing=exactValue('Darius','DariusCleave','MissingHealthHeal',skillRank(f,'Q'))/100;
 }
 if(hit&&e?.mode==='tick'){
  if(state.garenWindow<=at){state.garenTicks=0;state.garenWindow=at+3;}
  state.garenTicks++;if(state.garenTicks>=6)state.armorShredExpires=at+exactValue('Garen','GarenE','ShredDuration',skillRank(f,'E'));
 }
 return impact;
}
