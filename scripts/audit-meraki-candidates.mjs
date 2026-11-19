import fs from 'node:fs/promises';
const path = new URL('../public/data/meraki-candidates.json', import.meta.url);
const data = JSON.parse(await fs.readFile(path, 'utf8'));
if (data.policy !== 'REVIEW_ONLY_NOT_RUNTIME_MECHANICS') throw new Error('Meraki snapshot must remain review-only');
const champions = Object.entries(data.champions ?? {});
const missingKeys = champions.filter(([,c]) => !c.patchLastChanged || !c.abilities || !['P','Q','W','E','R'].every(k => Array.isArray(c.abilities[k])));
const patchCounts = {};
for (const [, champion] of champions) {
  const patch = String(champion.patchLastChanged ?? 'unknown');
  patchCounts[patch] = (patchCounts[patch] ?? 0) + 1;
}
const latestSourcePatch = Object.keys(patchCounts).filter(p => /^\\d+\\.\\d+$/.test(p)).sort((a,b) => {
  const [am,an]=a.split('.').map(Number),[bm,bn]=b.split('.').map(Number);
  return bm-am || bn-an;
})[0] ?? null;
const currentPatch = String(data.catalogPatch ?? '');
const sourceMatchesCatalog = latestSourcePatch === currentPatch;
const recent = champions.filter(([,c]) => /^26\\.(2[1-3])$/.test(String(c.patchLastChanged ?? ''))).map(([id,c]) => ({id,patchLastChanged:c.patchLastChanged}));
const report = {
  catalogPatch: data.catalogPatch,
  matched: champions.length,
  missingFromSource: data.missingChampions ?? [],
  championsWithoutPatchOrFullAbilitySlots: missingKeys.map(([id]) => id),
  latestSourcePatch,
  patchCounts,
  championsChangedInPatchWindow26_21To26_23: recent,
  freshness: sourceMatchesCatalog ? 'patch-aligned-candidate-only' : 'stale-or-unverified',
  freshnessWarning: sourceMatchesCatalog ? null : `Meraki latest champion change marker (${latestSourcePatch ?? 'unknown'}) does not match catalog patch (${currentPatch || 'unknown'}); candidates must not be activated.`,
  reviewOnly: true,
  runtimeEnabled: false,
};
console.log(JSON.stringify(report, null, 2));
if (champions.length < 160) throw new Error('Meraki candidate coverage below safety threshold');
