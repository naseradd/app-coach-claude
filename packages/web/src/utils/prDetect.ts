import type { SessionReport } from '@coach/shared';

interface BestSet {
  weight_kg: number;
  reps: number;
  product: number;
}

export interface PrCheck {
  isPr: boolean;
  bestPrevious: BestSet | null;
}

/**
 * Naive but useful PR detection: a set is a PR when its volume product
 * (weight × reps) exceeds the all-time best volume product for the same
 * exercise across the user's full history.
 *
 * Rationale: this catches both "more weight, same reps" AND "same weight, more
 * reps" without needing a 1RM model. Phase 9 may move it server-side and add
 * a per-rep-range PR (e.g. "best 5RM") once the spec settles.
 */
export function detectPr(
  history: SessionReport[],
  exerciseId: string,
  actualWeightKg: number | null,
  actualReps: number | null,
): PrCheck {
  if (actualWeightKg == null || actualReps == null || actualReps === 0 || actualWeightKg === 0) {
    return { isPr: false, bestPrevious: null };
  }
  let best: BestSet | null = null;
  for (const r of history) {
    for (const exLog of r.exercises_log) {
      if (exLog.exercise_id !== exerciseId) continue;
      for (const setLog of exLog.sets_log) {
        if (
          !setLog.completed ||
          setLog.actual_weight_kg == null ||
          setLog.actual_reps == null ||
          setLog.type === 'warmup'
        )
          continue;
        const product = setLog.actual_weight_kg * setLog.actual_reps;
        if (!best || product > best.product) {
          best = {
            weight_kg: setLog.actual_weight_kg,
            reps: setLog.actual_reps,
            product,
          };
        }
      }
    }
  }
  if (!best) return { isPr: false, bestPrevious: null };
  const currentProduct = actualWeightKg * actualReps;
  return { isPr: currentProduct > best.product, bestPrevious: best };
}
