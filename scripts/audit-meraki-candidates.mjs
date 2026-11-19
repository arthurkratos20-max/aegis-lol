import fs from 'node:fs/promises';
const path = new URL('../public/data/meraki-candidates.json', import.meta.url);
const data = JSON.parse(await fs.readFile(path, 'utf8'));
if (data.policy !== 'REVIEW_ONLY_NOT_RUNTIME_MECHANICS') throw new Error('Meraki snapshot must remain review-only');
const champions = Object.entries(data.champions ?? {});
const missingKeys = champions.filter(([,c]) => !c.patchLastChanged || !c.abilities || !['P','Q','W','E','R'].every(k => Array.isArray(c.abilities[k])));
const recent = champions.filter(([,c]) => /^26\.(2[1-3])$/.test(String(c.patchLastChanged ?? ''))).map(([id,c]) => ({id,patchLastChanged:c.patchLastChanged}));
const report = {
  catalogPatch: data.catalogPatch,
  matched: champions.length,
  missingFromSource: data.missingChampions ?? [],
  championsWithoutPatchOrFullAbilitySlots: missingKeys.map(([id]) => id),
  championsChangedInPatchWindow26_21To26_23: recent,
  reviewOnly: true,
  runtimeEnabled: false,
};
console.log(JSON.stringify(report, null, 2));
if (champions.length < 160) throw new Error('Meraki candidate coverage below safety threshold');
