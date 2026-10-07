import {readFile,writeFile,rename,mkdir} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {validatePatchCatalog,comparePatch} from '../src/patchCatalog.ts';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const parts=await Promise.all([1,2,3,4].map(async n=>Buffer.from(await readFile(path.join(root,`assets/catalog-16.20.1.part-${String(n).padStart(3,'0')}.b64`),'utf8'),'base64')));
const archive=Buffer.concat(parts);
if(createHash('sha256').update(archive).digest('hex')!=='408565ca03bd18696e4ee140aabbbc101ab755ddd2d5aa7de1981d47471d016b')throw Error('Snapshot compactado corrompido');
const bundle=JSON.parse(gunzipSync(archive).toString('utf8')),version=bundle.manifest.version;
const catalogs=['pt_BR','en_US'].map(locale=>validatePatchCatalog(bundle.catalogs[locale],version,locale));
const existing=await Promise.all(catalogs.map(async d=>{try{return validatePatchCatalog(JSON.parse(await readFile(path.join(root,`public/data/${d.locale}.json`),'utf8')));}catch{return null;}}));
if(existing.every(d=>d&&comparePatch(d.version,version)>=0)){
 if(existing[0].version!==existing[1].version)throw Error('Catálogos locais de patches diferentes');
 console.log(`Snapshot local preservado: ${existing[0].version}`);
}else{
 if(existing.some(d=>d&&comparePatch(d.version,version)>0))throw Error('Restauração recusada para evitar downgrade de catálogo parcial');
 await mkdir(path.join(root,'public/data'),{recursive:true});
 for(const d of catalogs)await writeFile(path.join(root,`public/data/${d.locale}.tmp`),JSON.stringify(d));
 for(const d of catalogs)await rename(path.join(root,`public/data/${d.locale}.tmp`),path.join(root,`public/data/${d.locale}.json`));
 await writeFile(path.join(root,'public/data/manifest.json'),JSON.stringify(bundle.manifest,null,2));
 console.log(`Snapshot validado restaurado: ${version}`);
}
