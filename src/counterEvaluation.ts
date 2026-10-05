export type DamageType = 'physical' | 'magic' | 'mixed' | 'true';
export interface Champion {
  id: string;
  name: string;
  damageType: DamageType;
  tags: readonly string[];
  isTank?: boolean;
  hasHardCC?: boolean;
  isBurst?: boolean;
  hasHealing?: boolean;
  hasShields?: boolean;
  usesMana?: boolean;
}
export interface Candidate {
  id: string;
  name: string;
  tags: readonly string[];
  isEligible?: (champion: Champion) => boolean;
}
export interface CounterEvaluation {
  enemyCount: number;
  priorities: Record<string, number>;
  reasons: string[];
}
export interface RankedCandidate { candidate: Candidate; score: number }
const WEIGHTS = { resistance: 3, antiTank: 3, antiBurst: 3, antiCC: 2, antiHealing: 2, antiShield: 2 };

function evaluateEnemies(myChamp: Champion, enemies: readonly Champion[]): CounterEvaluation {
  const priorities: Record<string, number> = {};
  const reasons = new Set<string>();
  const add = (tag: string, weight: number) => {
    priorities[tag] = (priorities[tag] ?? 0) + weight;
  };
  for (const enemy of enemies) {
    const tags = new Set(enemy.tags);
    switch (enemy.damageType) {
      case 'physical': add('armor', WEIGHTS.resistance); break;
      case 'magic': add('magic-resist', WEIGHTS.resistance); break;
      case 'mixed':
        add('armor', WEIGHTS.resistance / 2);
        add('magic-resist', WEIGHTS.resistance / 2);
        break;
      case 'true': add('health', WEIGHTS.resistance); break;
    }
    if (enemy.isTank || tags.has('tank')) {
      add('anti-tank', WEIGHTS.antiTank);
      if (myChamp.damageType === 'physical' || myChamp.damageType === 'mixed') add('armor-penetration', WEIGHTS.antiTank);
      if (myChamp.damageType === 'magic' || myChamp.damageType === 'mixed') add('magic-penetration', WEIGHTS.antiTank);
      reasons.add(`${enemy.name}: priorizar respostas contra tanques.`);
    }
    if (enemy.hasHardCC || tags.has('hard-cc')) {
      add('anti-cc', WEIGHTS.antiCC);
      reasons.add(`${enemy.name}: considerar proteção contra controle.`);
    }
    if (enemy.isBurst || tags.has('burst')) {
      add('anti-burst', WEIGHTS.antiBurst);
      reasons.add(`${enemy.name}: considerar proteção contra explosão.`);
    }
    if (enemy.hasHealing || tags.has('healing')) {
      add('anti-healing', WEIGHTS.antiHealing);
      reasons.add(`${enemy.name}: considerar redução de cura.`);
    }
    if (enemy.hasShields || tags.has('shields')) {
      add('anti-shield', WEIGHTS.antiShield);
      reasons.add(`${enemy.name}: considerar respostas contra escudos.`);
    }
  }
  return { enemyCount: enemies.length, priorities, reasons: [...reasons] };
}
export function calculateMatchupCounter(myChamp: Champion, enemyChamp: Champion): CounterEvaluation {
  return evaluateEnemies(myChamp, [enemyChamp]);
}
export function calculateDraftCounter(myChamp: Champion, enemyTeamArray: readonly Champion[]): CounterEvaluation {
  const uniqueEnemies = [...new Map(enemyTeamArray.map(enemy => [enemy.id, enemy])).values()].slice(0, 5);
  return evaluateEnemies(myChamp, uniqueEnemies);
}
export function rankCounterCandidates(myChamp: Champion, candidates: readonly Candidate[], evaluation: CounterEvaluation): RankedCandidate[] {
  return candidates
    .filter(candidate => candidate.isEligible?.(myChamp) ?? true)
    .map(candidate => ({ candidate, score: [...new Set(candidate.tags)].reduce((total, tag) => total + (evaluation.priorities[tag] ?? 0), 0) }))
    .sort((a, b) => b.score - a.score || a.candidate.id.localeCompare(b.candidate.id));
}
