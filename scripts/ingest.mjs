import {mkdir,writeFile,rename,readFile} from 'node:fs/promises';
import {latestRiotPatch,fetchPatchCatalog,comparePatch} from '../src/patchCatalog.ts';
const version=await latestRiotPatch();
let old;try{old=JSON.parse(await readFile('public/data/manifest.json','utf8'));}catch{}
if(old?.version&&comparePatch(version,old.version)<0)throw Error('Versão Riot anterior ao snapshot: atualização recusada');
if(old?.version===version){console.log(`Catálogo já está em ${version}; sem alterações.`);process.exit(0);}
// Fetch and validate BOTH languages before modifying any published file.
const catalogs=await Promise.all(['pt_BR','en_US'].map(locale=>fetchPatchCatalog(version,locale)));
await mkdir('public/data',{recursive:true});
for(const d of catalogs)await writeFile(`public/data/${d.locale}.tmp`,JSON.stringify(d));
for(const d of catalogs)await rename(`public/data/${d.locale}.tmp`,`public/data/${d.locale}.json`);
await writeFile('public/data/manifest.json',JSON.stringify({version,generatedAt:catalogs[0].generatedAt,champions:Object.keys(catalogs[0].champions).length,engineVersion:'0.1.0',validatedPatch:null},null,2));
console.log(`Catálogos completos publicados: ${version}; ${Object.keys(catalogs[0].champions).length} campeões. Fórmulas externas não certificadas automaticamente.`);
