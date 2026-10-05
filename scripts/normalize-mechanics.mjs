import {readFile,writeFile} from 'node:fs/promises';
const output={};
for(const champion of ['Shen','Ezreal','Yasuo','Yone','Riven','Darius']){
 const raw=JSON.parse(await readFile(`data/sources/${champion.toLowerCase()}.json`,'utf8'));
 const root=raw[`Characters/${champion}/CharacterRecords/Root`];const spells={};
 for(const [path,obj]of Object.entries(raw)){const s=obj.mSpell;if(!s?.mSpellCalculations)continue;spells[obj.mScriptName??obj.ObjectName]={path,values:Object.fromEntries((s.DataValues??[]).filter(v=>v.values).map(v=>[v.name,v.values])),calculations:s.mSpellCalculations,cooldown:s.cooldownTime??[],cost:s.mana??[]};}
 output[champion]={ratio:root.attackSpeedRatioModifiable?.baseValue??root.attackSpeedModifiable.baseValue,critMultiplier:root.critDamageMultiplier??2,spells,source:`https://raw.communitydragon.org/16.19/game/data/characters/${champion.toLowerCase()}/${champion.toLowerCase()}.bin.json`};
}
await writeFile('public/data/mechanics.json',JSON.stringify({version:'16.19.1',coverage:'testing',champions:output}));console.log('6 pilot mechanics normalized');
