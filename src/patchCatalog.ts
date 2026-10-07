import type {Dataset} from './contracts.ts';
export const RIOT_CDN='https://ddragon.leagueoflegends.com';
export const PATCH_CHECK_INTERVAL=5*60*1000;
export function comparePatch(a:string,b:string):number{
 const x=a.split('.').map(Number),y=b.split('.').map(Number);
 for(let i=0;i<3;i++)if(x[i]!==y[i])return x[i]-y[i];return 0;
}
export function patchLabel(version:string):string{
 const [season,patch]=version.split('.').map(Number);
 return season>=15?`${season+10}.${patch}`:version;
}
export function validatePatchCatalog(d:Dataset,version=d.version,locale=d.locale):Dataset{
 if(!/^\d+\.\d+\.\d+$/.test(version)||d.version!==version||d.locale!==locale||!Object.keys(d.champions??{}).length||!Object.keys(d.items??{}).length||!Array.isArray(d.runes)||d.runes.length!==5)throw Error('Catálogo incompleto ou patch divergente');
 for(const [id,c] of Object.entries(d.champions)){
  if(c.id!==id||!c.stats||!['hp','attackdamage','armor','spellblock','attackspeed','attackrange'].every(k=>Number.isFinite(c.stats[k]))||c.spells?.length!==4||!c.skins?.length||!c.passive)throw Error(`Campeão incompleto: ${id}`);
  for(const spell of c.spells)if(!Number.isFinite(spell.maxrank)||spell.maxrank<1||!spell.cooldown?.length||spell.cooldown.some(n=>!Number.isFinite(n)||n<0))throw Error(`Habilidade inválida: ${id}`);
 }
 return d;
}
export function newestCatalog(a:Dataset|null,b:Dataset|null):Dataset|null{
 return b&&(!a||comparePatch(b.version,a.version)>0)?b:a;
}
/** Patch-scoped corrections explicitly stated in official Riot notes, never inferred coefficients. */
export function applyOfficialPatchCorrections(data:Dataset):Dataset{
 const corrections=data.version==='16.20.1'?[
  {champion:'Ashe',stat:'attackdamageperlevel',value:3,source:'https://www.leagueoflegends.com/pt-br/news/game-updates/league-of-legends-patch-26-20-notes/'},
  {champion:'Lucian',stat:'attackdamageperlevel',value:2.9,source:'https://www.leagueoflegends.com/pt-br/news/game-updates/league-of-legends-patch-26-20-notes/'}
 ]:[];
 const champions={...data.champions};
 for(const fix of corrections)if(champions[fix.champion])champions[fix.champion]={...champions[fix.champion],stats:{...champions[fix.champion].stats,[fix.stat]:fix.value}};
 const missingGrowth=Object.values(champions).filter(c=>c.stats.attackdamageperlevel===0).length;
 return {...data,champions,statCorrections:corrections,catalogWarnings:missingGrowth>100?[`Data Dragon retorna crescimento de AD zero em ${missingGrowth} campeões. Apenas correções confirmadas nas notas deste patch são aplicadas; os demais escalamentos permanecem incompletos.`]:[]};
}
export async function latestRiotPatch(fetcher:typeof fetch=fetch):Promise<string>{
 const r=await fetcher(`${RIOT_CDN}/api/versions.json`,{cache:'no-store',signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error(`Riot HTTP ${r.status}`);
 const versions=await r.json(),version=versions?.[0];if(typeof version!=='string'||!/^\d+\.\d+\.\d+$/.test(version))throw Error('Versão Riot inválida');return version;
}
/** All resources use one immutable patch URL; no unversioned latest coefficients are merged. */
export async function fetchPatchCatalog(version:string,locale:string,fetcher:typeof fetch=fetch):Promise<Dataset>{
 if(!/^\d+\.\d+\.\d+$/.test(version)||!['pt_BR','en_US'].includes(locale))throw Error('Versão/idioma inválido');
 const source=`${RIOT_CDN}/cdn/${version}/data/${locale}/`;
 const [champions,items,runes]=await Promise.all(['championFull','item','runesReforged'].map(async key=>{
  const r=await fetcher(`${source}${key}.json`,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(`Riot HTTP ${r.status}`);return r.json();
 }));
 if(champions.version!==version||items.version!==version)throw Error('Recursos de patches diferentes');
 return applyOfficialPatchCorrections(validatePatchCatalog({version,locale,source,generatedAt:new Date().toISOString(),champions:champions.data,items:items.data,runes},version,locale));
}
