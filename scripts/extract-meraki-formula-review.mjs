import fs from 'node:fs/promises';

const INPUT = new URL('../public/data/meraki-candidates.json', import.meta.url);
const OUTPUT = new URL('../public/data/meraki-formula-review.json', import.meta.url);
const data = JSON.parse(await fs.readFile(INPUT, 'utf8'));
if (data.policy !== 'REVIEW_ONLY_NOT_RUNTIME_MECHANICS') throw new Error('Source snapshot is not review-only');

const champions = [];
const patchCounts = {};
const stats = { championRecords: 0, abilities: 0, effects: 0, effectsWithLeveling: 0, formulaCandidates: 0, unsupportedModifiers: 0, malformedModifiers: 0, effectsWithoutLeveling: 0 };
const recognizedUnits = new Set(['', '% AD', '% bonus AD', '% AP', '% maximum health', '% armor', '% magic resistance', '% ability haste']);

for (const [championId, champion] of Object.entries(data.champions ?? {})) {
  stats.championRecords++;
  const patch = String(champion.patchLastChanged ?? 'unknown');
  patchCounts[patch] = (patchCounts[patch] ?? 0) + 1;
  for (const slot of ['P', 'Q', 'W', 'E', 'R']) {
    const variants = Array.isArray(champion.abilities?.[slot]) ? champion.abilities[slot] : [];
    for (const [variantIndex, ability] of variants.entries()) {
      stats.abilities++;
      for (const [effectIndex, effect] of (ability.effects ?? []).entries()) {
        stats.effects++;
        const leveling = Array.isArray(effect.leveling) ? effect.leveling : [];
        if (!leveling.length) { stats.effectsWithoutLeveling++; continue; }
        stats.effectsWithLeveling++;
        for (const [levelingIndex, entry] of leveling.entries()) {
          const modifiers = Array.isArray(entry.modifiers) ? entry.modifiers : [];
          const reviewedModifiers = modifiers.map((modifier, modifierIndex) => {
            const values = Array.isArray(modifier.values) ? modifier.values : [];
            const units = Array.isArray(modifier.units) ? modifier.units : [];
            const malformed = !values.length || values.some(value => !Number.isFinite(value)) || (units.length > 0 && units.length !== values.length);
            if (malformed) stats.malformedModifiers++;
            const unsupportedUnits = units.filter(unit => !recognizedUnits.has(unit));
            if (unsupportedUnits.length || (!units.length && values.length)) stats.unsupportedModifiers++;
            return {
              modifierIndex,
              values,
              units,
              structurallyValid: !malformed,
              recognizedUnits: units.length > 0 && units.every(unit => recognizedUnits.has(unit)),
              unsupportedUnits,
            };
          });
          const attribute = String(entry.attribute ?? 'Unlabeled effect');
          const kind = /damage/i.test(attribute) ? 'damage' : /shield/i.test(attribute) ? 'shield' : /heal/i.test(attribute) ? 'heal' : 'unclassified';
          champions.push({
            championId,
            championName: champion.name,
            sourcePatchLastChanged: patch,
            slot,
            abilityName: ability.name ?? null,
            variantIndex,
            effectIndex,
            levelingIndex,
            attribute,
            kind,
            damageType: ability.damageType ?? null,
            targeting: ability.targeting ?? null,
            spellEffects: ability.spellEffects ?? null,
            description: effect.description ?? null,
            modifiers: reviewedModifiers,
            notes: ability.notes ?? null,
            reviewStatus: 'unreviewed',
            runtimeEnabled: false,
          });
          stats.formulaCandidates++;
        }
      }
    }
  }
}

const snapshot = {
  schemaVersion: 1,
  catalogPatch: data.catalogPatch,
  catalogGamePatch: String(data.catalogPatch ?? '').replace(/^(\d+)\.(\d+).*$/, (_, major, minor) => `${Number(major) + 10}.${minor}`),
  source: data.source,
  sourceProject: data.sourceProject,
  generatedAt: new Date().toISOString(),
  policy: 'REVIEW_ONLY_NOT_RUNTIME_MECHANICS',
  runtimeEnabled: false,
  sourcePatchCounts: patchCounts,
  stats,
  candidates: champions,
};
await fs.writeFile(OUTPUT, JSON.stringify(snapshot));
console.log(JSON.stringify({ catalogPatch: snapshot.catalogPatch, catalogGamePatch: snapshot.catalogGamePatch, sourcePatchCounts: patchCounts, ...stats, bytes: (await fs.stat(OUTPUT)).size, runtimeEnabled: false }, null, 2));
