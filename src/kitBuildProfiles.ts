import type {Dataset,Fighter} from './contracts.ts';
import type {RuneAffinity} from './runeAffinity.ts';

/**
 * Curated build-facing kit contracts for champions whose numeric damage kits
 * are not yet certified. These tags describe mechanics and strategic fit;
 * they are NOT damage formulas, win-rate claims, or patch-independent meta builds.
 */
export interface KitBuildProfile {
 champion:string;
 status:'strategic-curation';
 patchScope:'16.23.1';
 pattern:'diver'|'burst-mage'|'hybrid-assassin'|'engage-tank'|'ap-tank'|'pet-mage';
 runeAffinity:RuneAffinity;
 damageScaling:readonly string[];
 durabilityScaling:readonly string[];
 resource:'mana'|'energy'|'none';
 coreItems:readonly string[];
 runeNotes:readonly string[];
 caveats:readonly string[];
 source:string;
}
const profiles:KitBuildProfile[]=[
 {champion:'Aatrox',status:'strategic-curation',patchScope:'16.23.1',pattern:'diver',runeAffinity:'battle',damageScaling:['bonusAD','abilityHaste','armorPenetration','physicalDamage','sustain'],durabilityScaling:['health','resistances'],resource:'none',coreItems:['6692','6610','3071','3161','6333'],runeNotes:['Conqueror: extended trades and repeated champion combat','Precision sustain and Resolve durability are matchup-dependent'],caveats:['Passive damage uses target maximum health; do not mislabel it as own-health scaling.','Q sweet spots, W pullback, E repositioning and R healing amplification are not yet simulated.'],source:'https://wiki.leagueoflegends.com/en-us/Aatrox'},
 {champion:'Ahri',status:'strategic-curation',patchScope:'16.23.1',pattern:'burst-mage',runeAffinity:'burst',damageScaling:['AP','abilityHaste','magicPenetration','mana','magicDamage'],durabilityScaling:['movement','situational health','stasis'],resource:'mana',coreItems:['6655','4645','3089','3135','3157'],runeNotes:['Electrocute for short burst windows','Sorcery mana/haste options support repeated spell rotations'],caveats:['Charm amplification and Spirit Rush recasts are conditional; no full rotation certification yet.'],source:'https://wiki.leagueoflegends.com/en-us/Ahri'},
 {champion:'Akali',status:'strategic-curation',patchScope:'16.23.1',pattern:'hybrid-assassin',runeAffinity:'burst',damageScaling:['AP','bonusAD','abilityHaste','magicPenetration','energy'],durabilityScaling:['situational health','resistances'],resource:'energy',coreItems:['3152','3100','4645','3089','3157'],runeNotes:['Electrocute for short assassination windows','Conqueror is a situational extended-fight alternative'],caveats:['Passive empowered attacks, E mark recast and R execution scaling require stateful simulation.','Do not treat energy as mana or recommend mana-only effects.'],source:'https://wiki.leagueoflegends.com/en-us/Akali'},
 {champion:'Alistar',status:'strategic-curation',patchScope:'16.23.1',pattern:'engage-tank',runeAffinity:'engage',damageScaling:['AP','abilityHaste','magicDamage'],durabilityScaling:['health','armor','magicResistance','tenacity'],resource:'mana',coreItems:['3190','3109','2065','3050','3083'],runeNotes:['Aftershock is enabled by confirmed hard crowd control','Resolve durability and team utility are prioritized over AP damage'],caveats:['Q/W engage sequencing, passive ally healing and R damage reduction are not modeled as a complete kit.','AP is a damage ratio, not a reason to prioritize carry AP items over support durability by default.'],source:'https://wiki.leagueoflegends.com/en-us/Alistar'},
 {champion:'Amumu',status:'strategic-curation',patchScope:'16.23.1',pattern:'ap-tank',runeAffinity:'tank',damageScaling:['AP','targetMaxHealth','abilityHaste','magicDamage'],durabilityScaling:['health','armor','magicResistance'],resource:'mana',coreItems:['6665','6653','3116','3065','3083'],runeNotes:['Aftershock for reliable engage/control setups','Conqueror or other damage options require a deliberate damage-oriented role choice'],caveats:['Despair applies repeated target-health-based damage; tick timing and magic mitigation must be modeled.','Bandage Toss, Tantrum passive reduction and Curse of the Sad Mummy control are not fully simulated.'],source:'https://wiki.leagueoflegends.com/en-us/Amumu'},
 {champion:'Annie',status:'strategic-curation',patchScope:'16.23.1',pattern:'pet-mage',runeAffinity:'burst',damageScaling:['AP','abilityHaste','magicPenetration','mana'],durabilityScaling:['situational health','petBonusHealth'],resource:'mana',coreItems:['6655','3089','3135','3157','6653'],runeNotes:['Electrocute for burst; Sorcery options for mana and sustained spell access','Tibbers bonus health is a pet-survivability synergy, not champion damage scaling'],caveats:['Riot 26.23 documents +150% bonus health on Tibbers, but the catalog is now 16.23.1, but the combat engine still has no pet-health state; keep Tibbers durability outside numerical evaluation until pet modeling exists.','Pyromania stun state, Tibbers attacks/aura and pet uptime are not yet simulated.'],source:'https://www.leagueoflegends.com/pt-br/news/game-updates/league-of-legends-patch-26-23-notes/'}
];
export const KIT_BUILD_PROFILES:Record<string,KitBuildProfile>=Object.fromEntries(profiles.map(p=>[p.champion,p]));
export function kitBuildProfile(champion:string):KitBuildProfile|undefined{return KIT_BUILD_PROFILES[champion];}
export function kitBuildProfileFor(f:Fighter,_data:Dataset):KitBuildProfile|undefined{return kitBuildProfile(f.champion);}
