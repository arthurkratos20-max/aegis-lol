import fs from 'node:fs';
import {initialScenario,fighter,skillValid} from '../src/model.ts';
import {skillPlan} from '../src/skillOrders.ts';
const data=JSON.parse(fs.readFileSync('public/data/pt_BR.json'));
const ids=Object.keys(data.champions),lanes=['Top','Jungle','Mid','Bot','Support'];
const enemies=new Map(ids.map(id=>[id,fighter(data,id)])),errors=[];
let checked=0,special=0;
for(const id of ids)for(const lane of lanes){
 const s=initialScenario(data);s.player={...fighter(data,id),lane};
 for(const enemy of [null,...ids]){
  s.matchupUnknown=enemy===null;s.enemy=enemies.get(enemy??'Darius');
  const p=skillPlan(s,data,'player',false);
  if(id==='Aphelios'){if(p.sequence.length||p.coverage!=='special')errors.push({id,lane,enemy,error:'attribute allocation conflated with spells'});special++;}
  else if(p.sequence.length!==18||!skillValid(p.sequence,data,id))errors.push({id,lane,enemy,error:'invalid point path'});
  checked++;
 }
}
const report={champions:ids.length,lanes:lanes.length,contexts:checked,specialAttributeContexts:special,errors};
fs.writeFileSync('/tmp/aegis-skill-path-audit.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(errors.length||checked!==150510)process.exitCode=1;
