import type {Dataset,Scenario,SkillKey} from './contracts.ts';
import {skillOrderSnapshot} from './skillOrderSnapshot.ts';
import {buildSkillPath,skillValid,conservative} from './skillRules.ts';
interface LaneRecord {sequence:string[];priority:string[];games:number;alternatives?:{priority:string[];games:number}[]}
interface SnapshotChampion {url:string;lanes:Record<string,LaneRecord>}
const records:Record<string,SnapshotChampion>=skillOrderSnapshot.champions;
const keys=(xs:string[]):SkillKey[]=>xs.filter((k):k is SkillKey=>['Q','W','E','R'].includes(k));
export interface SkillPlan {sequence:SkillKey[];priority:SkillKey[];opening:SkillKey[];reason:string;source:string;sourceLane:string;games:number;coverage:'observed'|'estimated'|'manual'|'special';alternatives:{label:string;reason:string;sequence:SkillKey[]}[]}
const OPENINGS:Record<string,SkillKey[]>={Darius:['W','Q','E'],Sett:['E','Q','W'],Urgot:['E','W','Q'],Ekko:['Q','E','W'],Ashe:['W','Q','E'],Garen:['E','Q','W'],Tryndamere:['E','Q','W'],Akali:['Q','E','W'],Olaf:['Q','W','E'],Orianna:['Q','W','E'],Shen:['Q','E','W']};
export function pathPriority(sequence:SkillKey[],data:Dataset,id:string):SkillKey[]{
 const options:SkillKey[]=id==='Udyr'?['Q','W','E','R']:['Q','W','E'];
 const completion=(key:SkillKey)=>{const max=data.champions[id].spells[['Q','W','E','R'].indexOf(key)].maxrank;return sequence.map((v,i)=>v===key?i:-1).filter(i=>i>=0)[max-1]??99;};
 return options.sort((a,b)=>completion(a)-completion(b)||sequence.filter(v=>v===b).length-sequence.filter(v=>v===a).length);
}
export function baseSkillPlan(data:Dataset,id:string,lane:string):SkillPlan{
 const record=records[id],local=record?.lanes[lane],dominant=Object.entries(record?.lanes??{}).sort((a,b)=>b[1].games-a[1].games)[0];
 const enough=local&&local.games>=100,entry=enough?[lane,local] as const:dominant;
 const row=entry?.[1],sourceLane=entry?.[0]??lane,samePatch=skillOrderSnapshot.patch===data.version;
 const priority=id==='Udyr'?['R','W','E','Q'] as SkillKey[]:row?keys(row.priority):['Q','E','W'] as SkillKey[];
 const observed=row?keys(row.sequence):[];
 const full=observed.length===18&&skillValid(observed,data,id);
 let sequence=full?observed:buildSkillPath(data,id,priority,id==='Udyr'?['Q','R','W','E']:OPENINGS[id]??priority.slice(0,3));
 if(!sequence.length&&id!=='Aphelios')sequence=conservative(data,id);
 const coverage=id==='Aphelios'?'special':full&&samePatch&&sourceLane===lane&&enough?'observed':'estimated';
 if(id==='Udyr')return {sequence,priority:pathPriority(sequence,data,id),opening:sequence.slice(0,3),source:record?.url??'',sourceLane,games:row?.games??0,coverage:'estimated',alternatives:[],reason:'Template estimado de Udyr com R → W → E → Q e abertura Q → R → W → E. A fonte separa prioridades sem R e não fornece um caminho completo confiável para esta variante; não tratamos o template como meta observado. O sexto rank só entra a partir do nível 16.'};
 return {sequence,priority:sequence.length?pathPriority(sequence,data,id):priority,opening:sequence.slice(0,3),source:record?.url??'',sourceLane,games:row?.games??0,coverage,alternatives:[],reason:id==='Aphelios'?'Aphelios evolui atributos, não Q/W/E/R. Consulte a prioridade de atributos AD/AS/Letalidade indicada pela fonte; a matriz de habilidades não representa esses pontos.':coverage==='observed'?'Caminho mais frequente entre jogadores da prioridade principal nesta rota. Popularidade não comprova a melhor escolha para cada matchup.':`${row?`Referência de ${sourceLane}${full?'':' com abertura/caminho gerado legalmente'}`:'Sem amostra de rota: sequência conservadora estimada'}. ${samePatch?'':'Fonte de outro patch; revisão pendente. '}Não é uma sequência estatisticamente comprovada para esta rota ou adversário.`};
}
export function skillPlan(s:Scenario,data:Dataset,side:'player'|'enemy'='player',includeAlternatives=true):SkillPlan{
 const f=s[side],plan=baseSkillPlan(data,f.champion,f.lane);
 if(f.skillMode==='manual')return {...plan,sequence:[...f.skills],opening:f.skills.slice(0,3),priority:pathPriority(f.skills,data,f.champion),coverage:'manual',reason:'Sequência escolhida no editor. Trocar rota ou matchup preserva seus pontos manuais.'};
 if(f.champion==='Aphelios')return plan;
 const enemy=side==='player'?s.enemy:s.player,c=data.champions[enemy.champion],known=!s.matchupUnknown,range=c?.stats.attackrange??0;
 const alternatives:SkillPlan['alternatives']=[];
 const variant=(label:string,priority:SkillKey[],opening:SkillKey[],reason:string,points:Record<number,SkillKey>={})=>{const sequence=buildSkillPath(data,f.champion,priority,opening,points);if(sequence.length)alternatives.push({label,reason,sequence});return sequence;};
 let sequence=plan.sequence,reason=plan.reason,changed=false;
 if(f.champion==='Urgot'&&f.lane==='Top'){
  const ranged=variant('Pressão com segundo Q',['W','Q','E'],['E','Q','W'],'Guia editorial de GoliathGames: segundo ponto em Q no nível 4 para pressão/slow, mantendo W no nível 9. Escolha estimada; acertar Q e gerenciar mana continuam necessários.',{4:'Q'});
  if(known&&range>300){sequence=ranged;reason=`Contra ${c.name}, há alcance à distância: testar pressão de Q antes de prolongar ataques. ${alternatives[0].reason}`;changed=true;}
 }
 if(f.champion==='Darius'&&f.lane==='Top'){
  const opening:SkillKey[]=known&&range>300?['Q','E','W']:['W','Q','E'];
  sequence=buildSkillPath(data,f.champion,['Q','E','W'],opening);changed=true;
  reason=known&&range>300?`Abertura Q → E → W estimada contra o alcance de ${c.name}: Q para alcance/farm, E disponível no nível 2 se houver janela. Maximização Q → E → W preservada.`:'Abertura W → Q → E para trocas próximas; maximização Q → E → W. E no nível 1 exige uma situação de emboscada escolhida à parte.';
  variant('Emboscada no nível 1',['Q','E','W'],['E','W','Q'],'E oferece o puxão inicial, mas abre mão do dano de Q/W na primeira troca. Use apenas com acompanhamento.');
 }
 if(f.champion==='Sett'&&f.lane==='Top'){
  const defensive=variant('W para trocas de resposta',['W','Q','E'],['W','E','Q'],'Alternativa editorial: priorizar W quando ataques curtos e alcance dificultam aplicar Q. Depende de acumular Ousadia e acertar o centro; não é vantagem medida contra este adversário.');
  if(known&&range>300){sequence=defensive;reason=`Contra ${c.name}, a diferença de alcance sugere testar resposta com W. ${alternatives.at(-1)!.reason}`;changed=true;}
 }
 if(f.skillOpening==='invade'&&alternatives.some(a=>a.label==='Emboscada no nível 1')){const a=alternatives.find(a=>a.label==='Emboscada no nível 1')!;sequence=a.sequence;reason=a.reason;changed=true;}
 if(includeAlternatives){const row=records[f.champion]?.lanes[plan.sourceLane];for(const a of row?.alternatives??[]){const priority=keys(a.priority),path=buildSkillPath(data,f.champion,priority,plan.opening);if(path.length&&path.join()!==sequence.join()&&!alternatives.some(x=>x.sequence.join()===path.join()))alternatives.push({label:priority.join(' → '),sequence:path,reason:`Prioridade alternativa registrada em ${a.games} partidas de ${plan.sourceLane}. Caminho 1–18 gerado legalmente com a abertura atual; sem prova de vantagem para este matchup.`});}}
 return {...plan,sequence,opening:sequence.slice(0,3),priority:pathPriority(sequence,data,f.champion),reason:reason+(known&&!changed?` Contra ${c.name}: sem variante de sequência validada, preservamos a referência da rota.`:''),alternatives,coverage:changed?'estimated':plan.coverage};
}
/** Resolve recommendations before both display and computation. Manual edits are never replaced. */
export function withSkillPlans(s:Scenario,data:Dataset):Scenario{
 let result=s;
 for(const side of ['player','enemy'] as const){let f=result[side];
  if(f.skillMode===undefined){const old=conservative(data,f.champion),base=baseSkillPlan(data,f.champion,f.lane);const custom=f.skills.length>0&&f.skills.join()!==old.join()&&f.skills.join()!==base.sequence.join();f={...f,skillMode:custom?'manual':'auto'};result={...result,[side]:f};}
  if(f.skillMode==='manual')continue;const sequence=skillPlan(result,data,side,false).sequence;
  if(sequence.join()!==f.skills.join())result={...result,[side]:{...f,skills:sequence}};
 }
 return result;
}
