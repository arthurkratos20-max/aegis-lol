import type {ChampionScaling} from './championScaling.ts';
export type DamageType='physical'|'magic'|'true';
export type SkillKey='Q'|'W'|'E'|'R';
export type Coverage='static'|'testing'|'verified'|'missing';
export interface SpellVariable {key:string;link:string;coeff:number[]}
export interface Spell {tooltip?:string;vars?:SpellVariable[];datavalues?:Record<string,number|number[]>;resource?:string;costType?:string;id:string;name:string;description:string;image:{full:string};cooldown:number[];cost:number[];effect:Array<number[]|null>;effectBurn:Array<string|null>;leveltip:{label:string[];effect:string[]};maxrank:number}
export interface Champion {scaling?:ChampionScaling;counterTraits?:{damageType?:'physical'|'magic'|'mixed'|'true';isTank?:boolean;hasHardCC?:boolean;isBurst?:boolean;hasHealing?:boolean;hasShields?:boolean};id:string;key:string;name:string;title:string;tags:string[];partype:string;image:{full:string};stats:Record<string,number>;skins:{num:number;name:string;parentSkin?:number}[];spells:Spell[];passive:{name:string;description:string;image:{full:string}}}
export interface Item {exclusiveGroup?:string;name:string;description:string;plaintext?:string;gold:{base?:number;total:number;sell:number;purchasable:boolean};stats:Record<string,number>;maps:Record<string,boolean>;tags:string[];from?:string[];into?:string[];inStore?:boolean;requiredAlly?:string;requiredChampion?:string;image:{full:string}}
export interface Rune {id:number;key:string;name:string;icon:string;shortDesc:string;longDesc:string}
export interface RuneTree {id:number;name:string;icon:string;slots:{runes:Rune[]}[]}
export interface NativeSpell {values:Record<string,number[]>;calculations:Record<string,CalcNode>;cooldown:number[];cost:number[];path:string}
export interface CalcNode {__type:string;[key:string]:unknown}
export interface ChampionMechanics {ratio:number;critMultiplier:number;spells:Record<string,NativeSpell>;source:string}
export interface Dataset {version:string;locale:string;generatedAt:string;source:string;champions:Record<string,Champion>;items:Record<string,Item>;runes:RuneTree[];mechanics?:Record<string,ChampionMechanics>}
export interface RuneLocks {primaryTree?:boolean;secondaryTree?:boolean;runes?:number[];shards?:number[]}
export interface RunePage {locks?:RuneLocks;primary:number;secondary:number;selected:number[];shards:string[];locked:boolean}
export interface Stats {basicHaste?:number;ultimateHaste?:number;hp:number;ad:number;ap:number;armor:number;mr:number;mana:number;as:number;baseAS:number;ratio:number;bonusAS:number;crit:number;critMultiplier:number;haste:number;move:number;range:number;hpRegen:number;manaRegen:number;lifesteal:number;armorPen:number;magicPen:number;armorPenPercent:number;magicPenPercent:number}
export interface Formula {base:number;ad:number;bonusAD:number;ap:number;ownMaxHP:number;targetMaxHP:number;targetCurrentHP:number;targetMissingHP:number}
export interface Action {id:string;at:number;kind:'attack'|'spell'|'heal'|'shield'|'cc'|'stasis';key:SkillKey|'AA'|string;name:string;type:DamageType;formula:Formula;cooldown:number;cost:number;cast:number;duration:number;hit:number;onHit:boolean;custom:boolean;coverage:Coverage;cooldownReduction?:number;native?:{spell:string;calculation:string;targetHP?:boolean;flatCalculation?:string;multiplier?:number}}
export interface Fighter {skillMode?:'auto'|'manual';skillOpening?:'lane'|'invade';supportMode?:'auto'|'utility'|'damage';champion:string;lane:string;level:number;items:string[];owned:string[];locked:string[];skills:SkillKey[];runes:RunePage;initialHP:number;initialResource:number;actions:Action[];automaticAttacks:boolean;uptime:number;stacks:Record<string,number>;overrides:Partial<Stats>;boots:'auto'|'fixed'|'none';fixedBoot:string;dragons:Record<string,number>;soul:string}
export interface CounterPreset {mode?:'matchup'|'draft';lane?:string;champion:string;items:string[];boot:string|null;runes:RunePage;source:string}
export interface DraftState {own:string[];enemy:string[];active:number}
export interface Scenario {teamPriority?:number;matchupUnknown?:boolean;enemyTeam?:string[];draft?:DraftState;counterPreset?:CounterPreset;schema:1;patch:string;mode:'strict'|'exploratory';duration:number;distance:number;execution:'basic'|'consistent'|'ideal';player:Fighter;enemy:Fighter;allies:string[];budget:number;slots:number;allowSell:boolean;weights:{offense:number;defense:number;utility:number};subweights:Record<string,number>;customPreference:boolean;objective:'burst'|'dps'|'single';defensiveObjective:'combo'|'survive'|'sustain';seed:number;conditions:{grievous:number;shieldReduction:number};enabledConditions:Record<string,boolean>;utilization:Record<string,number>}
export interface CombatEvent {at:number;actor:'player'|'enemy';source:string;kind:string;type?:DamageType;raw:number;damage:number;absorbed:number;overkill:number;playerHP:number;enemyHP:number;playerResource:number;enemyResource:number;note?:string}
export interface CombatResult {events:CombatEvent[];player:CombatSummary;enemy:CombatSummary;warnings:string[];coverage:Coverage;custom:boolean}
export interface CombatSummary {damage:number;raw:number;dps:number;hp:number;death:number|null;healing:number;shielding:number;ccSeconds:number;composition:Record<DamageType,number>}
export const EMPTY_FORMULA:Formula={base:0,ad:0,bonusAD:0,ap:0,ownMaxHP:0,targetMaxHP:0,targetCurrentHP:0,targetMissingHP:0};
export const PILOTS=['Shen','Ezreal','Yasuo','Yone','Riven','Darius'];
