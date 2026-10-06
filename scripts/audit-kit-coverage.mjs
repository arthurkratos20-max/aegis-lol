import fs from 'node:fs';
import {championKitCoverage} from '../src/championKit.ts';
const data=JSON.parse(fs.readFileSync(new URL('../public/data/pt_BR.json',import.meta.url)));
const snapshot=JSON.parse(fs.readFileSync(new URL('../public/data/mechanics.json',import.meta.url)));
if(snapshot.version===data.version)data.mechanics=snapshot.champions;
const kits=Object.keys(data.champions).map(id=>championKitCoverage(id,data));
console.log(JSON.stringify({patch:data.version,total:kits.length,partial:kits.filter(k=>k.status==='partial').length,missing:kits.filter(k=>k.status==='missing').length,fullyValidated:0,kits},null,2));
