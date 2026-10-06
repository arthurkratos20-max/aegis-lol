import type {Dataset,Fighter} from './contracts.ts';
import {supportIntent} from './championScaling.ts';
export type RuneAffinity='burst'|'poke'|'battle'|'enchanter'|'attack'|'tank'|'engage'|'warden'|'supportAttack'|'other';
const contains=(id:string,list:string)=>list.split(' ').includes(id);
/** Curated kit affinities, not measured rune DPS or observed meta. */
export function runeAffinity(f:Fighter,data:Dataset):RuneAffinity {
 const c=data.champions[f.champion],id=f.champion;
 if(supportIntent(f,data)==='utility'&&contains(id,'Lulu Janna Nami Milio Soraka Sona Yuumi Renata Ivern Karma Seraphine'))return 'enchanter';
 if(f.lane==='Support'&&contains(id,'Senna Pyke'))return 'supportAttack';
 if(f.lane==='Support'&&contains(id,'Braum Taric TahmKench Shen'))return 'warden';
 if(f.lane==='Support'&&contains(id,'Leona Nautilus Rell Alistar Blitzcrank Thresh Amumu Maokai Rakan Poppy Galio'))return 'engage';
 if(c.tags[0]==='Tank'&&!contains(id,'Singed')||contains(id,'Shen Ornn Sion Malphite Rammus Amumu Zac Sejuani Maokai Nautilus Leona Alistar Braum Rell TahmKench Poppy KSante Skarner Chogath ChoGath Galio'))return 'tank';
 if(contains(id,'Azir Kayle Teemo'))return 'attack';
 // These hybrids can explicitly pivot to attack builds; AP/empty inventory keeps spell affinity.
 if(contains(id,'TwistedFate Neeko')){
  const stats=f.items.map(item=>data.items[item]?.stats??{});
  const attack=stats.reduce((n,s)=>n+(s.FlatPhysicalDamageMod??0)+(s.PercentAttackSpeedMod??0)*100,0);
  const ap=stats.reduce((n,s)=>n+(s.FlatMagicDamageMod??0),0);
  if(attack>ap&&attack>0)return 'attack';
 }
 if(contains(id,'Cassiopeia Ryze Swain Vladimir AurelionSol Karthus Singed Rumble Lillia Mordekaiser Gwen'))return 'battle';
 if(contains(id,'Ahri Annie Syndra Veigar Leblanc LeBlanc Zoe Vex Aurora Ekko Fizz Evelynn Kassadin Katarina Akali Elise Nidalee Gragas Sylas Locke'))return 'burst';
 if(c.tags.includes('Mage')&&!c.tags.includes('Marksman')&&!c.tags.includes('Tank'))return 'poke';
 if(contains(id,'TwistedFate Neeko'))return 'burst';
 return 'other';
}
export function kitRuneEstimate(id:number,f:Fighter,data:Dataset):[number,number]|undefined {
 const affinity=runeAffinity(f,data);if(affinity==='other'||affinity==='attack')return undefined;
 if(affinity==='tank'||affinity==='engage'||affinity==='warden'||affinity==='supportAttack'){
  const tankRunes:Record<number,[number,number]>={
   8437:[.9,.95],8439:[.7,.9],8465:[.25,.55],8351:[.4,.7],8230:[.3,.65],8010:[.65,.45],8005:[.6,.15],8008:[.25,.08],9923:[.2,.05],8021:[.2,.5],8112:[.4,.08],8128:[.35,.05],8214:[.15,.15],8229:[.4,.08],8992:[.35,.05],8360:[.2,.6],8369:[.3,.05],
  };
  const engage:Record<number,[number,number]>={8439:[.95,1],8351:[.8,.85],8465:[.5,.7],8437:[.4,.5]};
  const warden:Record<number,[number,number]>={8465:[.95,1],8439:[.6,.85],8351:[.5,.65],8437:[.65,.75]};
  if(affinity==='supportAttack'){
   const attack:Record<number,[number,number]>=f.champion==='Pyke'?{9923:[1,.3],8112:[.8,.15],8439:[.55,.9],8005:[.5,.1],8008:[.2,.05],8021:[.25,.55],8437:[.1,.2],8465:[.1,.2],8992:[.15,.02]}:{8021:[.95,.95],8005:[.8,.15],8008:[.6,.1],9923:[.5,.05],8437:[.5,.65],8465:[.35,.5],8439:[.2,.3],8112:[.25,.05],8992:[.15,.02]};
   if(attack[id])return attack[id];
  }
  const score=affinity==='engage'?engage[id]??tankRunes[id]:affinity==='warden'?warden[id]??tankRunes[id]:tankRunes[id];
  if(score)return score;
  if(id===8453)return affinity==='warden'?[.3,.95]:[.1,.5];
  if(id===8463)return [.45,.9];
  if(id===8401)return [.7,.8];
  if(id===8446)return affinity==='tank'?[.65,.5]:[.15,.25];
  if(id===8429)return [.2,1];
  if(id===8451)return [.35,1];
  if(id===9111)return [.3,.85];
  if(id===9104||id===9103)return affinity==='supportAttack'?[.75,.5]:[.1,.15];
  if(id===8210||id===9105)return [.6,.65];
  return undefined;
 }
 const keystones:Record<number,Record<Exclude<RuneAffinity,'other'|'attack'|'tank'|'engage'|'warden'|'supportAttack'>,[number,number]>>={
  8992:{burst:[.7,.05],poke:[.85,.05],battle:[.9,.08],enchanter:[.1,.02]},
  8112:{burst:[1,.2],poke:[.6,.12],battle:[.5,.15],enchanter:[.15,.05]},
  8128:{burst:[.85,.08],poke:[.7,.05],battle:[.7,.08],enchanter:[.1,.02]},
  8214:{burst:[.65,.4],poke:[.9,.45],battle:[.55,.35],enchanter:[.8,1]},
  8229:{burst:[.8,.25],poke:[1,.25],battle:[.6,.2],enchanter:[.5,.3]},
  8230:{burst:[.55,.85],poke:[.5,.85],battle:[.8,1],enchanter:[.2,.6]},
  8010:{burst:[.5,.3],poke:[.25,.15],battle:[1,.65],enchanter:[.05,.1]},
  8005:{burst:[.2,.05],poke:[.1,.03],battle:[.15,.05],enchanter:[.03,.02]},
  8008:{burst:[.05,.02],poke:[.05,.02],battle:[.05,.02],enchanter:[.02,.02]},
  9923:{burst:[.1,.02],poke:[.05,.02],battle:[.05,.02],enchanter:[.02,.02]},
  8021:{burst:[.15,.45],poke:[.1,.4],battle:[.2,.45],enchanter:[.05,.3]},
  8437:{burst:[.05,.15],poke:[.03,.12],battle:[.15,.3],enchanter:[.02,.1]},
  8439:{burst:[.05,.35],poke:[.03,.3],battle:[.1,.4],enchanter:[.02,.25]},
  8465:{burst:[.03,.2],poke:[.02,.25],battle:[.03,.2],enchanter:[.4,.95]},
  8351:{burst:[.15,.5],poke:[.1,.4],battle:[.25,.5],enchanter:[.2,.65]},
  8360:{burst:[.35,.5],poke:[.3,.5],battle:[.35,.55],enchanter:[.2,.6]},
  8369:{burst:[.9,.05],poke:[.85,.05],battle:[.55,.05],enchanter:[.1,.02]},
 };
 if(keystones[id])return keystones[id][affinity];
 if(affinity==='enchanter'){
  if(id===8453)return [.3,1];
  if(id===8463)return [.25,.9];
  if(id===8401)return [.05,.15];
  if(id===8429)return [.05,.5];
  if(id===8473)return [.08,.65];
 }
 if(id===8009||id===8226)return affinity==='enchanter'?[.65,.3]:[.9,.1];
 if(id===8210||id===9105)return affinity==='enchanter'?[.65,.55]:[.9,.3];
 if(id===9104||id===9103)return [.05,.05];
 return undefined;
}
