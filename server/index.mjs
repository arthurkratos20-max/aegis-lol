import {readJSON,syncPatch} from './patchSync.mjs';
const json=(v,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store'}});
export default {async fetch(request,env){const url=new URL(request.url);try{
 if(url.pathname==='/api/patch/sync'){if(request.method!=='POST')return json({error:'POST required'},405);return json(await syncPatch(env,url.origin));}
 if(url.pathname==='/api/patch/current'){const current=await readJSON(env.BUCKET,'patch/current.json');if(current)return json(current);const r=await env.ASSETS.fetch(new Request(`${url.origin}/data/manifest.json`));if(!r.ok)throw Error('Snapshot ausente');const m=await r.json();return json({version:m.version,checkedAt:null,generatedAt:m.generatedAt,source:'bundled'});}
 const match=url.pathname.match(/^\/api\/patch\/data\/(pt_BR|en_US)\.json$/);if(match){const current=await readJSON(env.BUCKET,'patch/current.json');if(current){if(url.searchParams.get('version')&&url.searchParams.get('version')!==current.version)return json({error:'Patch mudou; tente novamente'},409);const o=await env.BUCKET.get(`patch/${current.version}/${match[1]}.json`);if(o)return new Response(o.body,{headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Aegis-Patch':current.version}});}return env.ASSETS.fetch(new Request(`${url.origin}/data/${match[1]}.json`));}
 return env.ASSETS.fetch(request);
 }catch(e){console.error('patch updater',String(e));return json({error:'Sincronização indisponível. Último catálogo preservado.'},503);}}};
