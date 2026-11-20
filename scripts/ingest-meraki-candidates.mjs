import fs from 'node:fs/promises';

const CATALOG = new URL('../public/data/pt_BR.json', import.meta.url);
const OUTPUT = new URL('../public/data/meraki-candidates.json', import.meta.url);
const SOURCE = 'https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/champions.json';

const timeout = AbortSignal.timeout(90_000);
const response = await fetch(SOURCE, { signal: timeout, headers: { 'user-agent': 'AegisLoL-static-data-ingestor/1.0' } });
if (!response.ok) throw new Error(`Meraki CDN returned HTTP ${response.status}`);
const upstream = await response.json();
const catalog = JSON.parse(await fs.readFile(CATALOG, 'utf8'));
const rows = Array.isArray(upstream) ? upstream : Object.values(upstream?.data ?? upstream ?? {});
if (rows.length < 150) throw new Error(`Meraki champion dataset unexpectedly small: ${rows.length}`);

const byKey = new Map(rows.filter(x => x && typeof x.key === 'string').map(x => [x.key.toLowerCase(), x]));
const byName = new Map(rows.filter(x => x && typeof x.name === 'string').map(x => [x.name.toLowerCase(), x]));
const candidates = {};
const missing = [];
for (const [catalogKey, champion] of Object.entries(catalog.champions)) {
  const source = byKey.get(catalogKey.toLowerCase()) ?? byName.get(champion.name.toLowerCase());
  if (!source) { missing.push(catalogKey); continue; }
  candidates[catalogKey] = {
    id: source.id ?? null,
    key: source.key ?? null,
    name: source.name ?? champion.name,
    patchLastChanged: source.patchLastChanged ?? null,
    abilities: source.abilities ?? {},
  };
}
if (Object.keys(candidates).length < 160) {
  throw new Error(`Only ${Object.keys(candidates).length}/${Object.keys(catalog.champions).length} champions matched Meraki; refusing partial candidate snapshot.`);
}
const snapshot = {
  schemaVersion: 1,
  catalogPatch: catalog.version,
  source: SOURCE,
  sourceProject: 'Meraki Analytics / League of Legends Wiki',
  fetchedAt: new Date().toISOString(),
  policy: 'REVIEW_ONLY_NOT_RUNTIME_MECHANICS',
  totalCatalogChampions: Object.keys(catalog.champions).length,
  matchedChampions: Object.keys(candidates).length,
  missingChampions: missing,
  champions: candidates,
};
await fs.writeFile(OUTPUT, JSON.stringify(snapshot));
console.log(JSON.stringify({ catalogPatch: snapshot.catalogPatch, matched: snapshot.matchedChampions, total: snapshot.totalCatalogChampions, missing, bytes: (await fs.stat(OUTPUT)).size, runtimeEnabled: false }, null, 2));
