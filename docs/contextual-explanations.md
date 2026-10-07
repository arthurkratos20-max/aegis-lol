# Contextual explanations: six sequential deliveries

Each delivery was tested and published before implementation of the next.

1. Consecutive recommendation comparison: actual item additions/removals/order, rune and shard changes, skill levels. Current decision score contributions only; scores from different pools are never compared. Unchanged recalculations are reported honestly.
2. Lane plan for all 173 champions and five routes: opening from the skill plan, estimated range/kit positioning advice, enemy catalog descriptions. No matchup win rate or exact trade cooldown window is fabricated.
3. First-item/two-item/full inventory milestones. Metrics and recipe credits are recalculated without future items. These are milestones of the current greedy order, not independent phase optimizations; real waveclear is not scored.
4. Actual simulator event sequence: free twelve-event preview, mitigation/amplification, shield absorption, overkill and cancellation notes. Full timeline/resource state remains behind the existing PRO gate. No absent champion combo is generated.
5. Optional teamPriority percentage: zero preserves existing scoring. DPS is an arithmetic target mixture and EHP a harmonic mixture; team targets have equal weight within their share. Other enemies use base attributes at the lane enemy's level without invented item builds. Counter traits and rune heuristics use the same focus; inventory/locks and share links remain preserved. Duel simulation is separate.
6. Progressive kit review: available native impacts, missing coverage and isolated +100 AD/AP/HP sensitivity. Source-based Darius internal Q branch added (35% of external-blade formula), conditional and excluded from automatic selection. All kits retain isExactFormula=false. Six champions have partial native coverage; this delivery does not claim that all 173 complete kits have exact formulas.

## Validation

Final suite: 229 tests passed, TypeScript and production build succeeded. New checks cover all champion/route lane plans, milestone inventory isolation, combat event reconciliation, all champion team metrics, independent arithmetic/harmonic interpolation, locks, sharing and native impact coverage/sensitivity.

The earlier 452,395 build and 150,510 skill context audit remains documented separately. It predates the team-focus feature and must not be presented as an exhaustive audit of that new axis.

Supabase auth and entitlements were not replaced or mocked. Existing PRO gating remains visual; backend entitlement enforcement is a separate existing concern.
