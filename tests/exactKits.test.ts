import {describe,test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import type {Action,Dataset} from '../src/contracts.ts';
import {EMPTY_FORMULA} from '../src/contracts.ts';
import {exactEffects,exactAction,exactRaw,exactFormulaStatus,exactCalculation} from '../src/exactKits.ts';
import {fighter,initialScenario,statsFor,attackAction,combatResistance,mitigate} from '../src/model.ts';
import {simulate} from '../src/engine.ts';
import {evaluateBuild} from '../src/buildEvaluation.ts';
import {championKitCoverage} from '../src/championKit.ts';
const data:Dataset=JSON.parse(readFileSync(new URL('../public/data/pt_BR.json',import.meta.url),'utf8'));
const close=(a:number,b:number)=>assert.ok(Math.abs(a-b)<.001,`${a} != ${b}`);
function scene(champion:string){const s=initialScenario(data);s.player=fighter(data,champion);s.enemy=fighter(data,'Lux');s.player.automaticAttacks=false;s.enemy.automaticAttacks=false;s.player.overrides={ad:100,ap:100,hp:2000,armor:0,mr:0,mana:10000,as:1};s.enemy.overrides={hp:10000,armor:0,mr:0};return s;}
function custom(at:number,raw:number,type:'true'|'physical'|'magic'='true'):Action{return {...attackAction(at),kind:'spell',key:`custom-${at}`,formula:{...EMPTY_FORMULA,base:raw},type,custom:true};}
// Independent, hand-calculated rank-1 fixtures: actor 100 AD, 100 AP, 200 armor,
// 2000 HP; base 50 AD/1000 HP/50 armor; target 2000 max/1000 current HP.
const expected:Record<string,number>={
 'shen-p':177,'malphite-p':200,'shen-q':80,'shen-q-drag':150,'shen-e':170,
 'jinx-minigun':.3,'jinx-rocket':110,'jinx-w':150,'jinx-e':190,'jinx-r-min':276,'jinx-r-max':510,
 'ashe-w':110,'ashe-q':110,'ashe-r':320,'vayne-q':125,'vayne-w':80,'vayne-e':75,'vayne-e-wall':112.5,
 'lux-q':155,'lux-e':145,'lux-r':420,'lux-w':80,
 'garen-w':245,'garen-q':180,'garen-e':44,'garen-e-crit':57.2,'garen-r':375,
 'malphite-q':130,'malphite-w':160,'malphite-e':200,'malphite-r':290,
 'darius-q':150,'darius-q-inner':52.5,'darius-w':140,'darius-e':0,'darius-r':162.5,
};
describe('Camada 1 · Fórmulas isoladas',()=>{
 for(const e of exactEffects)test(`${e.champion}: ${e.id}, fixture independente`,()=>{
  const f={...fighter(data,e.champion),level:1,skills:e.key==='P'?['Q' as const]:[e.key as 'Q'|'W'|'E'|'R']};
  const actor={...statsFor(f,data),ad:100,ap:100,hp:2000,armor:200,crit:.5,critMultiplier:2},base={...actor,ad:50,ap:0,hp:1000,armor:50,crit:0,critMultiplier:1.75};
  close(exactRaw(e.id,f,actor,base,{...actor,hp:2000},1000),expected[e.id]);assert.equal(exactFormulaStatus(e.id,data).isExactFormula,true);
 });
 test('R Darius limita stacks; R Garen/Jinx usam vida perdida',()=>{
  const s=scene('Darius'),x=statsFor(s.player,data),base={...x,ad:50},f={...s.player,skills:['R' as const],level:1};
  close(exactRaw('darius-r',f,x,base,x,2000,5),325);close(exactRaw('darius-r',f,x,base,x,2000,99),325);
  for(const [id,c] of [['garen-r','Garen'],['jinx-r-max','Jinx']] as const){const f={...fighter(data,c),skills:['R' as const],level:1};assert.ok(exactRaw(id,f,x,base,x,100)<exactRaw(id,f,x,base,x,0));}
 });
});
describe('Camada 2 · Condições do kit',()=>{
 test('Shen Q: exatamente três bônus e expiração exclusiva em 8s',()=>{const s=scene('Shen');s.duration=10;s.player.actions=[exactAction(s.player,data,'shen-q'),...[.1,1,2,3,8].map(t=>attackAction(t))];const r=simulate(s,data);assert.equal(r.events.filter(e=>e.source==='Q · bônus fortalecido'&&e.damage>0).length,3);const t=scene('Shen');t.player.actions=[exactAction(t.player,data,'shen-q'),attackAction(8)];assert.equal(simulate(t,data).player.composition.magic,0);});
 test('Vayne W: terceiro acúmulo, E participa; parede não duplica stack',()=>{const s=scene('Vayne');s.player.actions=[exactAction(s.player,data,'vayne-w'),attackAction(.1),exactAction(s.player,data,'vayne-e',.2),exactAction(s.player,data,'vayne-e-wall',.3),attackAction(.4)];const r=simulate(s,data);assert.equal(r.events.filter(e=>e.source==='W · terceiro acúmulo').length,1);assert.ok(r.player.composition.true>0);});
 test('Vayne W: stack expira, ataque errado não concede stack',()=>{const s=scene('Vayne');s.player.actions=[exactAction(s.player,data,'vayne-w'),attackAction(.1),attackAction(3.6),{...attackAction(3.7),hit:0},attackAction(3.8)];assert.equal(simulate(s,data).player.composition.true,0);});
 test('Lux Q/AA/R: marca consumida, R reaplica sem duplicação',()=>{const s=scene('Lux');s.player.actions=[exactAction(s.player,data,'lux-q'),attackAction(.1),exactAction(s.player,data,'lux-r',.2),attackAction(.3),attackAction(.4)];const r=simulate(s,data);assert.equal(r.events.filter(e=>e.source==='P · Iluminação'&&e.damage>0).length,2);assert.equal(r.events.filter(e=>e.source==='R · detona Iluminação').length,0);});
 test('Lux R detona marca e AA consome nova marca; expiração em 6s',()=>{const s=scene('Lux');s.player.actions=[exactAction(s.player,data,'lux-e'),exactAction(s.player,data,'lux-r',.1),attackAction(.2)];const r=simulate(s,data);assert.equal(r.events.filter(e=>e.source==='R · detona Iluminação').length,1);assert.equal(r.events.filter(e=>e.source==='P · Iluminação').length,1);const t=scene('Lux');t.player.actions=[exactAction(t.player,data,'lux-q'),attackAction(6)];assert.equal(simulate(t,data).events.filter(e=>e.source==='P · Iluminação').length,0);});
 test('Ashe Q rejeita sem quatro ataques recentes e aceita com Foco',()=>{const s=scene('Ashe');s.player.actions=[exactAction(s.player,data,'ashe-q')];assert.ok(simulate(s,data).events[0].note?.includes('quatro'));const t=scene('Ashe');t.player.actions=[...[0,.5,1,1.5].map(at=>attackAction(at)),exactAction(t.player,data,'ashe-q',2),attackAction(2.1)];assert.ok(simulate(t,data).events.some(e=>e.source.includes('Foco')&&!e.note?.includes('cancelada')));});
 test('Darius Q externo cura; interno não cura nem aplica Hemorragia',()=>{const s=scene('Darius');s.player.initialHP=.5;s.player.actions=[exactAction(s.player,data,'darius-q')];close(simulate(s,data).player.healing,170);const t=scene('Darius');t.player.initialHP=.5;t.player.actions=[exactAction(t.player,data,'darius-q-inner')];assert.equal(simulate(t,data).player.healing,0);});
 test('Snapshot incompatível, campeão errado e fórmula editada não recebem badge',()=>{assert.equal(exactFormulaStatus('lux-q',{...data,version:'16.19.1'}).isExactFormula,false);assert.equal(exactFormulaStatus('lux-q',data,true).isExactFormula,false);assert.equal(exactFormulaStatus('unknown',data).isExactFormula,false);assert.throws(()=>exactAction(fighter(data,'Jinx'),data,'lux-q'));assert.throws(()=>exactAction(fighter(data,'Lux'),{...data,version:'16.19.1'},'lux-q'));const s=scene('Lux');s.player.actions=[{...exactAction(s.player,data,'lux-q'),type:'true'}];assert.equal(simulate(s,data).player.damage,0);});
});
describe('Camada 3 · Recargas e execução',()=>{
 test('AH básica e de ultimate aplicadas separadamente',()=>{const s=scene('Lux');s.duration=100;s.player.overrides.haste=100;s.player.overrides.basicHaste=100;s.player.overrides.ultimateHaste=0;const q=exactAction(s.player,data,'lux-q'),r=exactAction(s.player,data,'lux-r');s.player.actions=[q,{...q,id:'q2',at:q.cooldown/3},{...r,at:.1},{...r,id:'r2',at:.1+r.cooldown/2}];assert.equal(simulate(s,data).events.filter(e=>e.note?.includes('cooldown')).length,0);});
 test('Vayne Q: cooldown começa ao consumir ataque, não ao preparar',()=>{const s=scene('Vayne');s.duration=10;s.player.actions=[exactAction(s.player,data,'vayne-q'),attackAction(2),exactAction(s.player,data,'vayne-q',2.1)];assert.ok(simulate(s,data).events.find(e=>e.at===2.1)?.note?.includes('cooldown'));});
 test('Reset Garen Q substitui ataque pendente e não duplica automáticos',()=>{const s=scene('Garen');s.duration=3;s.player.automaticAttacks=true;s.player.actions=[exactAction(s.player,data,'garen-q',.5)];const r=simulate(s,data);assert.deepEqual(r.events.filter(e=>e.kind==='attack'&&e.damage>0).map(e=>e.at),[0,1.5,2.5]);assert.equal(r.events.filter(e=>e.source===s.player.actions[0].name&&e.damage>0).length,1);});
 test('Jinx: metralhadora aumenta cadência sem duplicar ataques',()=>{const s=scene('Jinx');s.duration=3;s.player.automaticAttacks=true;s.player.actions=[exactAction(s.player,data,'jinx-minigun')];const r=simulate(s,data),times=r.events.filter(e=>e.kind==='attack'&&e.damage>0).map(e=>e.at);assert.equal(times[0],0);assert.ok(times[1]<1);assert.ok(times[2]-times[1]<times[1]);assert.equal(new Set(times).size,times.length);});
 test('CC/recurso bloqueiam efeito sem aplicar marca',()=>{const s=scene('Lux');s.player.overrides.mana=0;s.player.actions=[exactAction(s.player,data,'lux-q'),attackAction(.1)];assert.equal(simulate(s,data).player.composition.magic,0);const t=scene('Lux');t.enemy.actions=[{...custom(0,0),kind:'cc',duration:1}];t.player.actions=[exactAction(t.player,data,'lux-q',.1),attackAction(1.1)];assert.equal(simulate(t,data).player.composition.magic,0);});
});
describe('Camada 4 · Mitigação de resistências',()=>{
 test('ordem: redução plana, percentual, penetração percentual e plana',()=>{close(combatResistance(200,.3,10,.25,20),84.5);close(mitigate(100,combatResistance(200,.3,10,.25,20)),10000/184.5);});
 test('redução permite resistência negativa; penetração não ultrapassa zero',()=>{assert.equal(combatResistance(10,.5,100,0,20),-10);assert.equal(combatResistance(10,.5,100),0);assert.ok(mitigate(100,-10)>100);});
 test('Darius E combina multiplicativamente com penetração do item',()=>{const s=scene('Darius');s.enemy.overrides.armor=200;s.player.overrides.armorPenPercent=.3;s.player.overrides.armorPen=10;s.player.actions=[exactAction(s.player,data,'darius-e'),attackAction(.1)];const rank=s.player.skills.filter(k=>k==='E').length,innate=[0,.2,.25,.3,.35,.4][rank];close(simulate(s,data).player.damage,mitigate(100,200*(1-innate)*.7-10));});
 test('Cutelo Negro: 6% por hit, limite de 5, expiração exclusiva em 6s',()=>{const s=scene('Jinx');s.duration=12;s.player.items=['3071'];s.enemy.overrides.armor=100;s.player.actions=[0,1,2,3,4,5,11].map(t=>attackAction(t));const hits=simulate(s,data).events;for(let i=0;i<6;i++)close(hits[i].damage,100/(1+100*(1-.06*Math.min(5,i))/100));close(hits[6].damage,50);});
 test('Garen E: sexto tick reduz armadura dos seguintes, expira após 6s',()=>{const s=scene('Garen');s.duration=10;s.enemy.overrides.armor=100;s.player.actions=[...[0,.3,.6,.9,1.2,1.5].map(t=>exactAction(s.player,data,'garen-e',t)),attackAction(1.6),attackAction(7.5)];const hits=simulate(s,data).events.filter(e=>e.kind==='attack');close(hits[0].damage,100/1.75);close(hits[1].damage,50);});
});
describe('Camada 5 · Combate integrado',()=>{
 test('executor usa HP após impacto anterior e registra morte/overkill',()=>{const s=scene('Garen');s.enemy.overrides.hp=1000;s.player.actions=[custom(0,800),exactAction(s.player,data,'garen-r',.1)];const r=simulate(s,data);assert.equal(r.enemy.death,.1);assert.equal(r.enemy.hp,0);assert.equal(r.player.damage,1000);assert.ok(r.events.at(-1)!.overkill>0);});
 test('Vayne Q sem crítico no bônus; W ignora resistência mas respeita escudo',()=>{const s=scene('Vayne');s.player.overrides.crit=1;s.player.actions=[exactAction(s.player,data,'vayne-q'),attackAction(.1),attackAction(.2),attackAction(.3)];s.enemy.overrides.armor=10000;s.enemy.overrides.mr=10000;s.enemy.actions=[{...custom(0,500),kind:'shield',duration:10}];const r=simulate(s,data);assert.ok(r.player.composition.true>0);assert.ok(r.enemy.shielding>0);const x=statsFor(s.player,data),base=statsFor({...s.player,items:[],overrides:{},runes:{...s.player.runes,shards:[]}},data);close(r.events.find(e=>e.source==='Q · dano bônus sem crítico')!.raw,exactRaw('vayne-q',s.player,x,base,statsFor(s.enemy,data),10000));});
 test('comparador usa mesmo duelo; badge global continua estimado',()=>{const s=scene('Lux');s.player.actions=[exactAction(s.player,data,'lux-q'),exactAction(s.player,data,'lux-r',.2),attackAction(.3)];const duel=simulate(s,data),m=evaluateBuild([],s,data);close(m.dps,duel.player.dps);assert.equal(m.isExactFormula,false);assert.equal(m.exactDPS,null);});
 test('Darius quinto acúmulo ativa Força Noxiana antes de calcular R',()=>{const s=scene('Darius');s.player.actions=[exactAction(s.player,data,'darius-e'),...[0,.1,.2,.3,.4].map(t=>attackAction(t)),exactAction(s.player,data,'darius-r',.5)];const r=simulate(s,data),x=statsFor(s.player,data),base=statsFor({...s.player,items:[],overrides:{}},data),might=exactCalculation('Darius','DariusHemoMarker','NoxianMightBonusAD',1,18,x,base),boosted={...x,ad:x.ad+might};close(r.events.find(e=>e.source===s.player.actions.at(-1)!.name)!.raw,exactRaw('darius-r',s.player,boosted,base,statsFor(s.enemy,data),10000,5));});
 test('Garen W reduz físico/mágico e não reduz verdadeiro',()=>{const s=scene('Garen');s.duration=5;s.player.actions=[exactAction(s.player,data,'garen-w')];s.enemy.actions=[custom(1,100,'physical'),custom(1.1,100,'magic'),custom(1.2,100,'true'),custom(4,100,'physical')];const r=simulate(s,data),rank=s.player.skills.filter(k=>k==='W').length,dr=[0,.25,.29,.33,.37,.41][rank],hits=r.events.filter(e=>e.actor==='enemy');close(hits[0].damage,100*(1-dr));close(hits[1].damage,100*(1-dr));close(hits[2].damage,100);close(hits[3].damage,100);});
 test('Jinx foguete aplica crítico uma vez e não recebe parcela de R',()=>{const s=scene('Jinx');s.player.overrides.crit=1;s.player.actions=[exactAction(s.player,data,'jinx-rocket')];const x=statsFor(s.player,data);close(simulate(s,data).player.damage,110*x.critMultiplier);});
 test('Estase impede marcas/stacks e parede exige E anterior',()=>{const s=scene('Lux');s.enemy.actions=[{...custom(0,0),kind:'stasis',duration:1}];s.player.actions=[exactAction(s.player,data,'lux-q',.1),attackAction(.2),attackAction(1.1)];assert.equal(simulate(s,data).player.composition.magic,0);const t=scene('Vayne');t.player.actions=[exactAction(t.player,data,'vayne-e-wall',0)];assert.equal(simulate(t,data).player.damage,0);});
 test('TTK usa morte observada; bônus agrega à mesma ação',()=>{const s=scene('Garen');s.enemy.overrides.hp=1000;s.player.actions=[custom(0,800),exactAction(s.player,data,'garen-r',.1)];close(evaluateBuild([],s,data).ttk,.1);const t=scene('Malphite');t.objective='single';t.player.actions=[exactAction(t.player,data,'malphite-w')];const r=simulate(t,data);close(evaluateBuild([],t,data).offenseValue!,r.player.damage);});
 test('EHP estimado inclui escudo/janela de Coragem sem promover badge',()=>{const s=scene('Garen'),baseline=evaluateBuild([],s,data);s.player.actions=[exactAction(s.player,data,'garen-w')];const w=evaluateBuild([],s,data);assert.ok(w.ehp>baseline.ehp);assert.equal(w.isExactFormula,false);});
 test('simulações repetidas não vazam marcas/stacks',()=>{const s=scene('Darius');s.player.actions=[exactAction(s.player,data,'darius-q'),...[.1,.2,.3,.4].map(t=>attackAction(t)),exactAction(s.player,data,'darius-r',.5)];assert.deepEqual(simulate(s,data),simulate(s,data));});
});
describe('Camada 6 · Regressão e cobertura',()=>{
 test('8 campeões × 5 rotas × 18 níveis: 720 casos sem badge global exato',()=>{let count=0;for(const champion of [...new Set(exactEffects.map(e=>e.champion))])for(const lane of ['Top','Jungle','Mid','Bot','Support'])for(let level=1;level<=18;level++){
  const s=scene(champion);s.player.lane=lane;s.player.level=level;assert.equal(championKitCoverage(champion,data).isExactFormula,false);
  for(const e of exactEffects.filter(e=>e.champion===champion)){if(e.key!=='P'&&!s.player.skills.slice(0,level).includes(e.key as 'Q'))continue;const a=exactAction(s.player,data,e.id);for(const n of [a.cooldown,a.cost,a.cast])assert.ok(Number.isFinite(n));const x=statsFor(s.player,data),base=statsFor({...s.player,items:[],overrides:{}},data);assert.ok(Number.isFinite(exactRaw(e.id,s.player,x,base,statsFor(s.enemy,data),10000)));}
  count++;
 }assert.equal(count,720);});
});

test("Foguete explícito substitui o ataque automático do mesmo instante",()=>{const s=scene("Jinx");s.duration=1;s.player.automaticAttacks=true;s.player.actions=[exactAction(s.player,data,"jinx-rocket",0)];const r=simulate(s,data);assert.equal(r.events.filter(e=>e.actor==="player"&&e.raw>0).length,1);close(r.player.raw,110);});
