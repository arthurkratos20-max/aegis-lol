import fs from 'node:fs/promises';
import {parseKitSource} from '../src/kitImport.ts';
const catalog=JSON.parse(await fs.readFile('public/data/pt_BR.json','utf8'));
const arg=process.argv[2];
const source=arg??'https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/champions.json';
try{
 const raw=source.startsWith('https://')?await (async()=>{const r=await fetch(source,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error(`HTTP ${r.status}`);return r.json();})():JSON.parse(await fs.readFile(source,'utf8'));
 const staged=parseKitSource(raw,catalog,source);
 const temporary='public/data/kit-import.json.tmp';await fs.writeFile(temporary,JSON.stringify(staged));await fs.rename(temporary,'public/data/kit-import.json');
 console.log(`Importação preparada: ${Object.keys(staged.champions).length} campeões, patch ${staged.version}; nenhum kit promovido automaticamente.`);
}catch(e){console.error(`Sincronização rejeitada; catálogo preservado: ${e.message}`);process.exitCode=1;}
