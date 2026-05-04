import type { SessionDef, Exercise, WorkSet, Block } from '@coach/shared';

export interface FlatPlanItem {
  exercise: Exercise;
  set: WorkSet;
  setIndex: number;
  block: Block;
  blockType: Block['type'];
  blockId: string;
  /** 0-based round within block. Always 0 for non-interleaved blocks. */
  roundIndex: number;
  globalCursor: number;
}

const INTERLEAVED: ReadonlySet<Block['type']> = new Set(['superset', 'circuit']);

/**
 * Flatten a session into the order in which sets should be executed.
 *
 * - `strength`, `cardio`, `emom`, `amrap` blocks: sequential per exercise.
 * - `superset`, `circuit` blocks: interleaved by round (A1 → B1 → A2 → B2 ...).
 *   When exercises within an interleaved block have mismatched set counts,
 *   missing slots are skipped and `maxRounds = max(sets.length)` controls the loop.
 */
export function buildFlatPlan(session: SessionDef): FlatPlanItem[] {
  const out: FlatPlanItem[] = [];
  let cursor = 0;
  for (const block of session.blocks) {
    if (INTERLEAVED.has(block.type)) {
      const maxRounds = Math.max(...block.exercises.map((e) => e.sets.length));
      for (let r = 0; r < maxRounds; r++) {
        for (const exercise of block.exercises) {
          const set = exercise.sets[r];
          if (!set) continue;
          out.push({
            exercise,
            set,
            setIndex: r,
            block,
            blockType: block.type,
            blockId: block.id,
            roundIndex: r,
            globalCursor: cursor++,
          });
        }
      }
    } else {
      for (const exercise of block.exercises) {
        exercise.sets.forEach((set, setIndex) => {
          out.push({
            exercise,
            set,
            setIndex,
            block,
            blockType: block.type,
            blockId: block.id,
            roundIndex: 0,
            globalCursor: cursor++,
          });
        });
      }
    }
  }
  return out;
}
