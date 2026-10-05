import {mkdir,writeFile,rename,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const base='https://ddragon.leagueoflegends.com';
async function get(url){for(let n=0;n<3;n++){try{const r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(`${r.status}: ${url}`);return await r.json();}catch(e){if(n===2)throw e;}}}
const version=(await get(`${base}/api/versions.json`))[0];
await mkdir('public/data',{recursive:true});
for(const locale of ['pt_BR','en_US']){
 const [catalog,items,runes]=await Promise.all(['champion','item','runesReforged'].map(key=>get(`${base}/cdn/${version}/data/${locale}/${key}.json`)));
 const champions={};const entries=Object.values(catalog.data);let cursor=0;
 await Promise.all(Array.from({length:8},async()=>{while(cursor<entries.length){const c=entries[cursor++];const detail=await get(`${base}/cdn/${version}/data/${locale}/champion/${c.id}.json`);champions[c.id]=detail.data[c.id];}}));
 const data={version,locale,generatedAt:new Date().toISOString(),source:`${base}/cdn/${version}/data/${locale}/`,champions,items:items.data,runes};
 const text=JSON.stringify(data);await writeFile(`public/data/${locale}.tmp`,text);await rename(`public/data/${locale}.tmp`,`public/data/${locale}.json`);
 console.log(`${locale}: ${Object.keys(champions).length} champions; checksum ${createHash('sha256').update(text).digest('hex')}`);
}
const data=JSON.parse(await readFile('public/data/pt_BR.json','utf8'));
await writeFile('public/data/manifest.json',JSON.stringify({version,generatedAt:data.generatedAt,champions:Object.keys(data.champions).length,engineVersion:'0.1.0',validatedPatch:null},null,2));
