import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import LZString from 'lz-string';
import QRCode from 'qrcode';
import type {Dataset} from '../src/contracts.ts';
import {initialScenario} from '../src/model.ts';
import {fullBuild} from '../src/fullBuild.ts';
import {buildShareLink,readBuildShare} from '../src/buildShare.ts';
const data:Dataset=JSON.parse(readFileSync(new URL('../public/data/pt_BR.json',import.meta.url),'utf8'));
test('share round-trip preserves the live suggested items, runes, enemy and weights; auto optimizer keeps the snapshot',()=>{
 const s=initialScenario(data),rec=fullBuild(s,data);s.player.items=rec.target;s.player.runes=rec.runes;s.enemy.items=['3071','3047'];s.enemy.overrides={hp:3500,armor:150};
 const url=buildShareLink(s,'https://aegis.example.com/path');assert.ok(url.startsWith('https://aegis.example.com/#build='));assert.ok(url.length<2400);
 assert.doesNotThrow(()=>QRCode.create(url,{errorCorrectionLevel:'L'}));
 const loaded=readBuildShare(new URL(url).hash,data)!;
 assert.deepEqual(loaded.player.items,s.player.items);assert.deepEqual(loaded.player.runes.selected,s.player.runes.selected);assert.deepEqual(loaded.enemy.items,s.enemy.items);assert.deepEqual(loaded.enemy.overrides,s.enemy.overrides);assert.deepEqual(loaded.weights,s.weights);
 const reranked=fullBuild(loaded,data);assert.deepEqual(reranked.target,rec.target);assert.deepEqual(reranked.runes.selected,rec.runes.selected);
 assert.ok(!url.includes('email'));assert.ok(!url.includes('token'));assert.equal(readBuildShare('',data),null);
});
test('malformed and incompatible shared links are rejected without mutating the current scenario',()=>{
 const s=initialScenario(data);const link=buildShareLink(s,'https://aegis.example.com');
 const encoded=new URLSearchParams(new URL(link).hash.slice(1)).get('build')!;const raw=JSON.parse(LZString.decompressFromEncodedURIComponent(encoded)!);
 const encode=()=>`#build=${LZString.compressToEncodedURIComponent(JSON.stringify(raw))}`;
 raw.patch='old';assert.throws(()=>readBuildShare(encode(),data),/patch/);raw.patch=data.version;
 raw.p[0]='__proto__';assert.throws(()=>readBuildShare(encode(),data),/Campeão/);raw.p[0]='Jinx';
 raw.p[3]=['3071','3071'];assert.throws(()=>readBuildShare(encode(),data),/duplicados/);raw.p[3]=[];
 raw.p[4]=[8000,8400,[9101,9111],[]];assert.throws(()=>readBuildShare(encode(),data),/runas/);
 assert.throws(()=>readBuildShare('#build='+ 'a'.repeat(2401),data),/extenso/);
});
