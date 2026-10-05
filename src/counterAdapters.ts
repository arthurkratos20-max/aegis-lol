import type { Dataset, Fighter } from './contracts.ts';
import type { Candidate, Champion } from './counterEvaluation.ts';
import { kitFor, itemCompatible, runeCompatible } from './compatibility.ts';
import { fighter, itemEligible, plain } from './model.ts';
import { affinityCandidates, profileFor } from './recommendation.ts';

const has = (id: string, ids: string) => ids.split(' ').includes(id);
const apProfiles = ['enchanter','supportDamage','fighterAP','assassinAP','mageControl','mageBurn','mageBurst'];

// Linear per-entity metadata only. These adapters never enumerate champion pairs.
export function championForCounter(id: string, data: Dataset, current?: Fighter): Champion {
  const c = data.champions[id];
  if (!c) throw Error('Campeão ausente no snapshot');
  const f = current?.champion === id ? current : fighter(data, id);
  const p = profileFor(id, f.lane, data), k = kitFor(f, data);
  const mixed = has(id, 'Shen Ornn Sejuani Leona Alistar Nautilus Rell TahmKench Udyr Volibear Yone Kaisa Corki');
  const magic = has(id, 'Malphite Rammus Amumu Zac Maokai Galio ChoGath') || apProfiles.includes(p);
  const metadata = c.counterTraits;
  return {
    id, name: c.name, tags: c.tags,
    damageType: metadata?.damageType ?? (mixed ? 'mixed' : magic ? 'magic' : 'physical'),
    isTank: metadata?.isTank ?? ['tank','supportTank'].includes(p),
    hasHardCC: metadata?.hasHardCC ?? k.hardCC,
    isBurst: metadata?.isBurst ?? (p.startsWith('assassin') || p === 'mageBurst' || id === 'Malphite'),
    hasHealing: metadata?.hasHealing ?? has(id, 'Darius Aatrox Warwick Soraka Yuumi Vladimir Mundo DrMundo Briar Nami Sona Milio Taric Rakan Zac Maokai Volibear Swain'),
    hasShields: metadata?.hasShields ?? has(id, 'Shen Lulu Janna Karma Ivern Lux Orianna Sona Seraphine Riven Mordekaiser Sett TahmKench Nautilus Udyr Volibear'),
    usesMana: k.mana,
  };
}

export function counterItemCandidates(f: Fighter, data: Dataset): Candidate[] {
  const p = profileFor(f.champion, f.lane, data), ap = apProfiles.includes(p), tank = ['tank','supportTank'].includes(p);
  const responses = ap ? ['3135','3137','3157','3102','3165'] : tank ? ['3071','3065','2502','3075','3084'] : ['3036','3033','3156','3026',...(p === 'assassinAD' ? ['6695'] : [])];
  const semantic: Record<string, string[]> = {
    '3036':['anti-tank','armor-penetration'], '3033':['armor-penetration','anti-healing'],
    '3071':['anti-tank','armor-penetration'], '3135':['anti-tank','magic-penetration'],
    '3137':['anti-tank','magic-penetration'], '3157':['anti-burst'], '3102':['anti-burst'],
    '3156':['anti-burst'], '3026':['anti-burst'], '3053':['anti-burst'], '6673':['anti-burst'],
    '3075':['anti-healing'], '3165':['anti-healing'], '6695':['anti-shield'], '3111':['anti-cc'],
  };
  return [...new Set([...affinityCandidates({player:f}, data), ...responses])]
    .filter(id => data.items[id])
    .map(id => {
      const item = data.items[id], tags = new Set(semantic[id] ?? []);
      if (item.stats.FlatArmorMod > 0) tags.add('armor');
      if (item.stats.FlatSpellBlockMod > 0) tags.add('magic-resist');
      if (item.stats.FlatHPPoolMod > 0) tags.add('health');
      return {id, name:plain(item.name), tags:[...tags], isEligible: () =>
        itemEligible(id, data, f.champion) && itemCompatible(id, f, data).allowed &&
        (id !== '6695' || p === 'assassinAD')};
    });
}

export function counterRuneCandidates(f: Fighter, data: Dataset): Candidate[] {
  const tags: Record<number, string[]> = {8242:['anti-cc'],8473:['anti-burst'],8444:['health'],8451:['health'],8017:['anti-tank']};
  return data.runes.flatMap(tree => tree.slots.flatMap(row => row.runes.map(r => ({
    id:String(r.id), name:r.name, tags:tags[r.id] ?? [],
    isEligible:() => runeCompatible(r.id, f, data).allowed,
  }))));
}
