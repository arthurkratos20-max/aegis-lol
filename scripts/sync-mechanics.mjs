import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import path from 'node:path';

const catalog = JSON.parse(await readFile('public/data/pt_BR.json', 'utf8'));
const manifest = JSON.parse(await readFile('public/data/manifest.json', 'utf8'));
if (!catalog.version || catalog.version !== manifest.version) {
  throw new Error('Catálogo e manifest.json estão em patches diferentes');
}

const ddragonVersion = catalog.version;
if (!/^16\.23\.1$/.test(ddragonVersion)) {
  throw new Error(`Patch não revisado para este sincronizador: ${ddragonVersion}`);
}
const gamePatch = ddragonVersion.replace(/\.\d+$/, '');
const champions = ['Shen', 'Ezreal', 'Yasuo', 'Yone', 'Riven', 'Darius'];
const output = {};

for (const champion of champions) {
  const slug = champion.toLowerCase();
  const source = `https://raw.communitydragon.org/${gamePatch}/game/data/characters/${slug}/${slug}.bin.json`;
  const response = await fetch(source, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`CommunityDragon HTTP ${response.status}: ${source}`);

  const raw = await response.json();
  const root = raw[`Characters/${champion}/CharacterRecords/Root`];
  if (!root) throw new Error(`Root de atributos ausente: ${champion}`);

  const spells = {};
  for (const [objectPath, obj] of Object.entries(raw)) {
    const spell = obj?.mSpell;
    if (!spell?.mSpellCalculations) continue;
    const name = obj.mScriptName ?? obj.ObjectName;
    if (!name) continue;

    spells[name] = {
      path: objectPath,
      values: Object.fromEntries(
        (spell.DataValues ?? [])
          .filter(value => value.values)
          .map(value => [value.name, value.values])
      ),
      calculations: spell.mSpellCalculations,
      cooldown: spell.cooldownTime ?? [],
      cost: spell.mana ?? []
    };
  }

  if (Object.keys(spells).length < 3) {
    throw new Error(`Snapshot incompleto para ${champion}: somente ${Object.keys(spells).length} habilidades interpretáveis`);
  }

  const ratio = (root.attackSpeedRatioModifiable ?? root.attackSpeedModifiable)?.baseValue;
  if (!Number.isFinite(ratio)) throw new Error(`Attack speed ratio ausente: ${champion}`);

  output[champion] = {
    ratio,
    critMultiplier: root.critDamageMultiplier ?? 2,
    spells,
    source
  };
}

const payload = { version: ddragonVersion, coverage: 'testing', champions: output };
const destination = 'public/data/mechanics.json';
const temporary = destination + '.tmp';
await mkdir(path.dirname(destination), { recursive: true });
await writeFile(temporary, JSON.stringify(payload));
await rename(temporary, destination);

console.log(
  `Snapshot de mecânicas sincronizado: ${Object.keys(output).length} campeões; Data Dragon ${ddragonVersion}; CommunityDragon ${gamePatch}. Cobertura permanece testing.`
);
