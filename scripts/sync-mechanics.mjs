import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import path from 'node:path';

const catalog = JSON.parse(await readFile('public/data/pt_BR.json', 'utf8'));
const manifest = JSON.parse(await readFile('public/data/manifest.json', 'utf8'));
if (!catalog.version || catalog.version !== manifest.version) {
  throw new Error('Catálogo e manifest.json estão em patches diferentes');
}

const ddragonVersion = catalog.version;
if (ddragonVersion !== '16.23.1') {
  throw new Error(`Patch não revisado para este sincronizador: ${ddragonVersion}`);
}
const gamePatch = ddragonVersion.replace(/\.\d+$/, '');
const champions = ['Shen', 'Ezreal', 'Yasuo', 'Yone', 'Riven', 'Darius'];
const output = {};

function numeric(value) {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object' && typeof value.value === 'number') return value.value;
  if (value && typeof value === 'object' && typeof value.baseValue === 'number') return value.baseValue;
  return undefined;
}

function spellPayload(raw, objectPath, champion) {
  const obj = raw[objectPath];
  if (!obj || typeof obj !== 'object') {
    throw new Error(`Objeto de habilidade ausente: ${champion}/${objectPath}`);
  }
  // CommunityDragon exports SpellObject fields on the object itself. Older
  // snapshots wrapped them in mSpell; support both without guessing values.
  const spell = obj.mSpell && typeof obj.mSpell === 'object' ? obj.mSpell : obj;
  // Utility/CC abilities may legitimately expose no damage calculations.
  // Preserve their data; validate calculation coverage at champion level.
  const rawCalculations = spell.mSpellCalculations ?? spell.calculations ?? {};
  if (typeof rawCalculations !== 'object' || Array.isArray(rawCalculations)) {
    throw new Error(`Formato de cálculos inválido: ${champion}/${objectPath}`);
  }
  const calculations = rawCalculations;
  const dataValues = spell.DataValues ?? spell.mDataValues ?? spell.dataValues ?? [];
  const values = {};
  for (const entry of dataValues) {
    const name = entry.name ?? entry.mName;
    const series = entry.values ?? entry.mValues;
    if (typeof name === 'string' && Array.isArray(series) && series.every(Number.isFinite)) {
      values[name] = series;
    }
  }
  const cooldown = spell.cooldownTime ?? spell.cooldown ?? spell.mCooldownTime ?? [];
  const cost = spell.mana ?? spell.cost ?? spell.mMana ?? [];
  if (!Array.isArray(cooldown) || !Array.isArray(cost)) {
    throw new Error(`Cooldown/custo em formato inesperado: ${champion}/${objectPath}`);
  }
  return { path: objectPath, values, calculations, cooldown, cost };
}

for (const champion of champions) {
  const slug = champion.toLowerCase();
  const source = `https://raw.communitydragon.org/${gamePatch}/game/data/characters/${slug}/${slug}.bin.json`;
  const response = await fetch(source, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`CommunityDragon HTTP ${response.status}: ${source}`);

  const raw = await response.json();
  const rootPath = `Characters/${champion}/CharacterRecords/Root`;
  const root = raw[rootPath];
  if (!root) throw new Error(`Root de atributos ausente: ${champion}`);

  const ratio = numeric(root.attackSpeedRatioModifiable) ?? numeric(root.attackSpeedModifiable);
  if (!Number.isFinite(ratio) || ratio <= 0) {
    throw new Error(`Attack speed ratio ausente/inválido: ${champion}`);
  }

  // Use the canonical spell paths declared by CharacterRecord, not a scan
  // for a made-up nested mSpell property. Include the passive path explicitly.
  const paths = [...(root.spells ?? []), root.mCharacterPassiveSpell].filter(Boolean);
  if (paths.length < 5) {
    throw new Error(`CharacterRecord não declarou Q/W/E/R + passiva para ${champion}: ${paths.length} caminhos`);
  }
  const spells = {};
  for (const objectPath of paths) {
    const payload = spellPayload(raw, objectPath, champion);
    const name = objectPath.split('/').at(-1);
    if (!name || spells[name]) throw new Error(`Identificador de habilidade duplicado/inválido: ${champion}/${objectPath}`);
    spells[name] = payload;
  }

  if (Object.keys(spells).length !== 5) {
    throw new Error(`Snapshot de habilidades incompleto: ${champion}; encontrados ${Object.keys(spells).length}`);
  }
  const calculatedSpells = Object.values(spells).filter(s => Object.keys(s.calculations).length > 0).length;
  if (calculatedSpells < 3) {
    throw new Error(`Cobertura de cálculos insuficiente: ${champion}; somente ${calculatedSpells}/5 habilidades com cálculos`);
  }

  output[champion] = {
    ratio,
    critMultiplier: numeric(root.critDamageMultiplier) ?? 2,
    spells,
    source
  };
}

// Atomic write: only replace the previous snapshot after every pilot passes
// the same structural checks. Coverage deliberately remains "testing".
const payload = { version: ddragonVersion, coverage: 'testing', champions: output };
const destination = 'public/data/mechanics.json';
const temporary = destination + '.tmp';
await mkdir(path.dirname(destination), { recursive: true });
await writeFile(temporary, JSON.stringify(payload));
await rename(temporary, destination);

console.log(`Snapshot validado e sincronizado: ${Object.keys(output).length} campeões; Data Dragon ${ddragonVersion}; CommunityDragon ${gamePatch}. Cobertura permanece testing.`);
