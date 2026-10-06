import {readFile,writeFile} from 'node:fs/promises';
// Pin to the project's patch. Never mix new-patch abilities with old items/stats.
const locale=process.argv[2]??'pt_BR';
if(!['pt_BR','en_US'].includes(locale))throw Error('Unsupported locale');
const path=`public/data/${locale}.json`,catalog=JSON.parse(await readFile(path,'utf8'));
const url=`https://ddragon.leagueoflegends.com/cdn/${catalog.version}/data/${locale}/championFull.json`;
const response=await fetch(url,{signal:AbortSignal.timeout(30000)});
if(!response.ok)throw Error(`Official DDragon unavailable: ${response.status}; bundled catalog preserved`);
const full=await response.json();if(full.version!==catalog.version)throw Error('Patch mismatch');
for(const id of Object.keys(catalog.champions)){
 const c=full.data?.[id];if(c?.spells?.length!==4||!c.passive)throw Error(`Incomplete official kit: ${id}`);
 for(const s of c.spells)if(!Array.isArray(s.cooldown)||!Array.isArray(s.cost)||!Array.isArray(s.effect))throw Error(`Invalid spell: ${id}`);
}
for(const id of Object.keys(catalog.champions)){catalog.champions[id].spells=full.data[id].spells;catalog.champions[id].passive=full.data[id].passive;}
await writeFile(path,JSON.stringify(catalog));console.log(`${locale}: ${Object.keys(catalog.champions).length} official kits refreshed, patch ${catalog.version}`);
