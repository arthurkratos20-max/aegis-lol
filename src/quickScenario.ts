import type {Dataset,Scenario} from './contracts.ts';
import {fighter,initialScenario} from './model.ts';
import {profileFor,type Profile} from './recommendation.ts';
import {withSkillPlans} from './skillOrders.ts';
const weights:Record<Profile,Scenario['weights']>={
 marksman:{offense:80,defense:15,utility:5},assassinAD:{offense:80,defense:15,utility:5},assassinAP:{offense:80,defense:15,utility:5},
 mageBurst:{offense:75,defense:15,utility:10},mageBurn:{offense:70,defense:20,utility:10},mageControl:{offense:65,defense:20,utility:15},
 fighterAD:{offense:55,defense:35,utility:10},fighterAP:{offense:55,defense:35,utility:10},tank:{offense:20,defense:65,utility:15},
 enchanter:{offense:10,defense:20,utility:70},supportTank:{offense:15,defense:55,utility:30},supportDamage:{offense:65,defense:15,utility:20}
};
/** Independent automatic recommendation: manual sliders, inventories and presets stay in the manual workspace. */
export function quickScenario(s:Scenario,data:Dataset):Scenario {
 const profile=profileFor(s.player.champion,s.player.lane,data),base=initialScenario(data);
 return withSkillPlans({...base,player:{...fighter(data,s.player.champion),lane:s.player.lane},enemy:{...fighter(data,s.enemy.champion),lane:s.player.lane},matchupUnknown:s.matchupUnknown,weights:{...weights[profile]},teamPriority:0},data);
}
