import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import type {Dataset} from '../src/contracts.ts';
import {splashURL} from '../src/skins.ts';
const root=new URL('../public/assets/riot/',import.meta.url);
for(const locale of ['pt_BR','en_US'])test(`${locale}: every champion, ability, item and rune icon is bundled on the same origin`,()=>{
 const d:Dataset=JSON.parse(readFileSync(new URL(`../public/data/${locale}.json`,import.meta.url),'utf8'));
 const paths=new Set<string>();
 for(const c of Object.values(d.champions)){
  paths.add(`icons/champion/${c.image.full}`);paths.add(`icons/passive/${c.passive.image.full}`);
  c.spells.forEach(sp=>paths.add(`icons/spell/${sp.image.full}`));paths.add(`splash/${c.id}_0.webp`);
  assert.equal(splashURL(c.id,{num:0}),`/assets/riot/splash/${c.id}_0.webp`);
 }
 Object.entries(d.items).forEach(([id,item])=>{paths.add(`icons/item/${item.image.full}`);paths.add(`icons/item/${id}.png`);});
 d.runes.forEach(t=>{paths.add(`icons/${t.icon}`);t.slots.forEach(row=>row.runes.forEach(r=>paths.add(`icons/${r.icon}`)));});
 for(const path of paths)assert.ok(existsSync(new URL(path,root)),`Missing local image: ${path}`);
});
