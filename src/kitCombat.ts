import type {Action,Dataset,DamageType,Fighter,Stats} from './contracts.ts';
import {EXACT_PATCH,exactEffect,exactRaw,exactCalculation,exactValue,skillRank} from './exactKits.ts';
import {officialAdapterFor,evaluateOfficialAdapter} from './officialAdapters.ts';
export interface KitState {active:boolean;minigun:boolean;minigunStacks:number;minigunExpires:number;shenCharges:number;shenExpires:number;shenEffect:string;vayneStacks:number;vayneExpires:number;vayneQExpires:number;vayneQCooldown:number;luxMarkExpires:number;asheStacks:number;asheStackExpires:number;asheFrostExpires:number;asheQExpires:number;bleedStacks:number;bleedExpires:number;noxianExpires:number;garenTicks:number;garenWindow:number;armorShredExpires:number;garenDRExpires:number;garenDR:number;wallExpires:number;gragasPassiveReadyAt:number;gragasWReadyAt:number;gragasWExpires:number;gragasDRReadyAt:number;gragasDRExpires:number;gragasDR:number;gravesTrueGritStacks:number;gravesTrueGritExpires:number;gwenEExpires:number;hecarimQStacks:number;hecarimQExpires:number;hecarimWExpires:number}
export const kitState=(f:Fighter):KitState=>({active:['Gragas','Graves','Gwen','Hecarim'].includes(f.champion)||f.actions.some(a=>exactEffect(a.kitEffect)?.champion===f.champion&&!a.custom),minigun:false,minigunStacks:0,minigunExpires:0,shenCharges:0,shenExpires:0,shenEffect:'shen-q',vayneStacks:0,vayneExpires:0,vayneQExpires:0,vayneQCooldown:0,luxMarkExpires:0,asheStacks:0,asheStackExpires:0,asheFrostExpires:0,asheQExpires:0,bleedStacks:0,bleedExpires:0,noxianExpires:0,garenTicks:0,garenWindow:0,armorShredExpires:0,garenDRExpires:0,garenDR:0,wallExpires:0,gragasPassiveReadyAt:0,gragasWReadyAt:0,gragasWExpires:0,gragasDRReadyAt:0,gragasDRExpires:0,gragasDR:0,gravesTrueGritStacks:0,gravesTrueGritExpires:0,gwenEExpires:0,hecarimQStacks:0,hecarimQExpires:0,hecarimWExpires:0});
export interface KitPart {raw:number;type:DamageType;name:string}
export interface KitImpact {raw:number;type:DamageType;extra:KitPart[];damageMultiplier?:number;cooldownReduction?:number;cancel?:string;resetAttack?:boolean;deferCooldown?:boolean;consumedQCooldown?:number;healMissing?:number;passive?:boolean;rescheduleAttack?:boolean}
export function kitActorStats(f:Fighter,actor:Stats,base:Stats,state:KitState,at:number):Stats {
 if(!state.active)return actor;let x=actor;
 if(f.champion==='Graves'&&state.gravesTrueGritExpires>at){const armor=[2,5,8,11,14][Math.max(0,skillRank(f,'E')-1)]*state.gravesTrueGritStacks;x={...x,armor:x.armor+armor,mr:x.mr+armor*.5};}
 if(f.champion==='Hecarim'&&state.hecarimWExpires>at){const rank=skillRank(f,'W');const resist=[5,10,15,20,25][Math.max(0,rank-1)];x={...x,armor:x.armor+resist,mr:x.mr+resist};}
 if(f.champion==='Hecarim'){const bonusMove=Math.max(0,actor.move-base.move),conversion=.12+.12*(f.level-1)/17;x={...x,ad:x.ad+bonusMove*conversion};}
 if(f.champion==='Gwen'&&state.gwenEExpires>at){const rank=skillRank(f,'E'),as=[.3,.425,.55,.675,.8][Math.max(0,rank-1)];x={...x,as:Math.min(2.5,x.as+x.ratio*as)};}
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
 if(f.champion==='Graves'&&a.native?.spell==='GravesE'&&a.native.calculation==='Activate'){
  state.gravesTrueGritStacks=Math.min(8,state.gravesTrueGritStacks+1);state.gravesTrueGritExpires=at+4;impact.passive=true;return impact;
 }
 if(f.champion==='Gwen'&&a.native?.spell==='GwenE'&&a.native.calculation==='Activate'){
  state.gwenEExpires=at+4;impact.passive=true;return impact;
 }
 if(f.champion==='Hecarim'&&a.native?.spell==='HecarimW')state.hecarimWExpires=at+4;
 if(f.champion==='Hecarim'&&a.native?.spell==='HecarimQ'&&a.native.calculation==='Damage'){
  const stacks=state.hecarimQExpires>at?state.hecarimQStacks:0;
  const bonusAD=Math.max(0,actor.ad-base.ad);
  impact.damageMultiplier=1+stacks*(.03+.03*bonusAD/100);
  impact.cooldownReduction=stacks*.75;
  state.hecarimQStacks=Math.min(3,stacks+1);state.hecarimQExpires=at+8;
 }

 if(f.champion==='Gragas'&&a.key==='W'&&a.kind==='spell'&&a.native?.spell==='GragasW'){
  const rank=skillRank(f,'W');if(!rank)return {...impact,cancel:'W requer nível de habilidade'};
  const reduction=[10,14,18,22,26][rank-1]/100+actor.ap*0.0004;
  state.gragasWReadyAt=at+0.75;state.gragasWExpires=at+5.75;state.gragasDRReadyAt=at+0.75;state.gragasDRExpires=at+3.25;state.gragasDR=reduction;
  impact.passive=true;return impact;
 }
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
  if(!e)impact.raw=f.champion==='Graves'?actor.ad*crit*(.7+.3*(f.level-1)/17):actor.ad*crit;
  if(f.champion==='Gragas'&&hit&&state.gragasWReadyAt<=at&&state.gragasWExpires>at){const adapter=officialAdapterFor('Gragas','GragasW','EmpoweredAttack',data.version);if(adapter)extra.push({raw:evaluateOfficialAdapter(adapter,skillRank(f,'W'),{ap:actor.ap,targetMaxHP:target.hp}),type:'magic',name:'W · bônus do ataque fortalecido'});state.gragasWExpires=0;state.gragasWReadyAt=0;}
  if(e?.id==='jinx-rocket'){impact.raw*=crit;state.minigun=false;state.minigunStacks=0;}
  if(f.champion==='Gwen'&&hit){extra.push({raw:target.hp*(.01+.006*actor.ap/100),type:'magic',name:'P · A Thousand Cuts'});if(state.gwenEExpires>at)extra.push({raw:15+.2*actor.ap,type:'magic',name:'E · ataque fortalecido'});}
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
 if(hit&&f.champion==='Gwen'&&a.native?.spell==='GwenR')extra.push({raw:target.hp*(.01+.006*actor.ap/100),type:'magic',name:'P · A Thousand Cuts (agulha)'});
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
