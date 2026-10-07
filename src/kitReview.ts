import type {Dataset,Scenario,Stats} from './contracts.ts';
import {championKitCoverage} from './championKit.ts';
import {nativeAction,nativeDamage,nativeOptions} from './native.ts';
import {statsFor,effectiveResistance,mitigate} from './model.ts';
export function kitReview(s:Scenario,data:Dataset){
 const coverage=championKitCoverage(s.player.champion,data),actor=statsFor(s.player,data),target=s.matchupUnknown?{...statsFor(s.enemy,data),hp:2500,armor:100,mr:100}:statsFor(s.enemy,data);
 const impacts=(nativeOptions[s.player.champion]??[]).map((opt,index)=>{try{const action=nativeAction(s.player,data,index),raw=nativeDamage(action,s.player,data,actor,target),resistance=action.type==='physical'?effectiveResistance(target.armor,actor.armorPenPercent,actor.armorPen):effectiveResistance(target.mr,actor.magicPenPercent,actor.magicPen),delivered=action.kind==='shield'||action.type==='true'?raw:mitigate(raw,resistance);
 const gain=(key:'ad'|'ap'|'hp')=>nativeDamage(action,s.player,data,{...actor,[key]:actor[key]+100} as Stats,target)-raw;
 return {index,key:opt.key,label:opt.label,note:opt.note,raw,delivered,cost:action.cost,cooldown:action.cooldown,kind:action.kind,conditional:opt.automatic===false,gains:{ad:gain('ad'),ap:gain('ap'),hp:gain('hp')},error:''};
 }catch(e){return {index,key:opt.key,label:opt.label,note:opt.note,raw:0,delivered:0,cost:0,cooldown:0,kind:opt.kind??'spell',conditional:opt.automatic===false,gains:{ad:0,ap:0,hp:0},error:e instanceof Error?e.message:String(e)};}});
 return {coverage,impacts};
}
