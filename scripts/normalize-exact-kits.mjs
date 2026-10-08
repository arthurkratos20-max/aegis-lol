// Usage: node scripts/normalize-exact-kits.mjs /path/to/pinned-16.20-bin-json
// Offline normalization only: importing is not validation of a complete kit.
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
const directory=process.argv[2];if(!directory)throw Error('Informe a pasta com os oito arquivos BIN JSON do patch 16.20.');
const champions=['Garen','Vayne','Lux','Shen','Darius','Malphite','Ashe','Jinx'],output={};
for(const champion of champions){
 const raw=JSON.parse(await readFile(path.join(directory,`${champion}.json`),'utf8')),spells={};
 for(const [p,o] of Object.entries(raw)){
  const s=o?.mSpell,name=o?.mScriptName??o?.ObjectName??p;if(!s||(!s.mSpellCalculations&&!['GarenR','DariusAxeGrabCone'].includes(name)))continue;
  spells[name]={path:p,values:Object.fromEntries((s.DataValues??[]).filter(v=>v.values).map(v=>[v.name,v.values])),calculations:s.mSpellCalculations??{},cooldown:s.cooldownTime??[],cost:s.mana??[],cast:s.spellCastTime??0};
 }
 const root=raw[`Characters/${champion}/CharacterRecords/Root`];if(!root||!Object.keys(spells).length)throw Error(`Snapshot inválido: ${champion}`);
 output[champion]={ratio:(root.attackSpeedRatioModifiable??root.attackSpeedModifiable)?.baseValue??.625,critMultiplier:root.critDamageMultiplier??2,spells,source:`https://raw.communitydragon.org/16.20/game/data/characters/${champion.toLowerCase()}/${champion.toLowerCase()}.bin.json`};
}
await writeFile('src/exactSnapshot.ts','// CommunityDragon client BIN snapshot 16.20. Source URLs retained per champion.\n// Imported data is not a declaration of complete kit validation.\nexport const exactSnapshot='+JSON.stringify(output)+' as const;\n');
console.log('Oito snapshots normalizados. Validar efeitos nas seis camadas de testes.');
