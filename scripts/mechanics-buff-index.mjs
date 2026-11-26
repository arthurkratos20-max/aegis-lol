/**
 * Index explicit HasBuffCastRequirement references from CommunityDragon BIN JSON.
 * A hash is never treated as a resolved buff declaration unless the source
 * contains an independent buff-like declaration for the same identifier.
 */
export function indexBuffRequirements(root) {
  const requirements = new Map();
  const occurrences = new Map();
  const declarations = new Map();
  const seen = new WeakSet();

  function walk(value, path = '$') {
    if (!value || typeof value !== 'object' || seen.has(value)) return;
    seen.add(value);
    if (Array.isArray(value)) {
      value.forEach((entry, index) => walk(entry, `${path}[${index}]`));
      return;
    }
    if (value.__type === 'HasBuffCastRequirement' && typeof value.mBuffName === 'string') {
      const id = value.mBuffName;
      if (!requirements.has(id)) requirements.set(id, []);
      requirements.get(id).push(path);
    }
    for (const [key, child] of Object.entries(value)) {
      if (key !== 'mBuffName' && typeof child === 'string' && /^\{[0-9a-f]{8}\}$/i.test(child)) {
        if (!occurrences.has(child)) occurrences.set(child, []);
        occurrences.get(child).push(`${path}.${key}`);
      }
      const candidate = child && typeof child === 'object' ? child : null;
      if (candidate) {
        const id = candidate.mName ?? candidate.name ?? candidate.mBuffName ?? candidate.mScriptName;
        const type = String(candidate.__type ?? candidate.mType ?? key).toLowerCase();
        if (typeof id === 'string' && /^\{[0-9a-f]{8}\}$/i.test(id) && type.includes('buff')) {
          if (!declarations.has(id)) declarations.set(id, []);
          declarations.get(id).push(`${path}.${key}`);
        }
      }
      walk(child, `${path}.${key}`);
    }
  }
  walk(root);
  return [...requirements.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([id, paths]) => ({
    id,
    requirementPaths: paths,
    referencePaths: occurrences.get(id) ?? [],
    declarationPaths: declarations.get(id) ?? [],
    status: declarations.has(id) ? 'declaration-found-needs-semantic-audit' : 'unresolved'
  }));
}
