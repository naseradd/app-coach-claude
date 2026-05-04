# Workout Flow — Test Plan & Regression Mockups

**Scope:** end-to-end UX scenarios for the workout runner (`/workout`), the rest timer, and the set→rest→next-set transitions.

**Why this doc:** the workout runner is a hand-coded state machine (`useWorkout` store + `Workout.tsx` cursor + `RestTimer.tsx` overlay). It has multiple overlapping flows (strength, superset/circuit, timed sets) and silent state-machine bugs are easy to miss because the UI looks "almost right." This file captures the scenarios that must keep working.

---

## State machine — single source of truth

```
        ┌──────────┐  validateSet (rest_seconds > 0)   ┌──────────┐
        │   set    │ ─────────────────────────────────▶│   rest   │
        │ (cursor  │                                   │ (overlay │
        │  on N)   │ ◀── endRest + advanceToNext ──────│  open)   │
        └──────────┘  (cursor → N+1, phase='set')      └──────────┘
              │                                              │
              │ validateSet (rest_seconds == 0)              │ endRest, !nextItem
              │   advanceToNext, no rest                     │   ↓ phase='done'
              ▼                                              ▼
        ┌──────────┐                                   ┌──────────┐
        │   set    │                                   │   done   │
        │  (N+1)   │                                   │ (post-   │
        └──────────┘                                   │  session)│
                                                       └──────────┘
```

**Invariants** (must hold after every transition):
- `phase === 'rest'` ⇔ `restStartedAt !== null` AND RestTimer overlay visible.
- `phase === 'set'` ⇒ exercise card visible AND RestTimer overlay closed.
- After `endRest()` returns, phase is **never** `'rest'`.
- Cursor (`exerciseIndex`, `setIndex`) advances exactly **once** per set validation.

---

## Mockups (target UI per state)

### State A — Set in progress
```
┌────────────────────────────────────┐
│ × │ Push lourd · 12:34 │ ⋯         │
│ ████████░░░░░░░░░░░  Exo 1/4 · 2/12│
├────────────────────────────────────┤
│ Développé couché barre  [vidéo]    │
│ [pectoraux] [delt. ant.]           │
│ ▸ Cues techniques (3)              │
├────────────────────────────────────┤
│ set en cours        set précédent  │
│   2/4               5 × 80kg       │
│ cible · 5 reps · 80kg · RPE 8      │
│                                    │
│ Reps: [-]  5  [+]                  │
│ Poids:[-] 80  [+] kg               │
│ RPE:  [Borg segmented 7|8|9]       │
├────────────────────────────────────┤
│         [ Valider · 5 reps ]       │
└────────────────────────────────────┘
```

### State B — Rest timer (overlay)
```
┌────────────────────────────────────┐
│         REPOS                      │
│                                    │
│        02:45                       │
│      ◔━━━━━━━━━○                  │
│   objectif · 03:00                 │
│                                    │
│ ┌────────────────────────────────┐ │
│ │ à suivre                       │ │
│ │ Développé couché barre         │ │
│ │ Set 3 · 5 reps · 80kg          │ │
│ └────────────────────────────────┘ │
│                                    │
│ [+30s]  [Skip repos]               │
│ [ Prêt — set suivant         → ]  │
└────────────────────────────────────┘
```

### State C — Next set after rest (THE REGRESSION CASE)
After tapping "Prêt — set suivant" or "Skip repos", the overlay must **close** and State A must reappear with cursor advanced to the next set. The "à suivre" preview from State B must NOT remain on screen masquerading as the active set.

---

## Regression catalog

| ID | Scenario | Bug observed | Coverage |
|----|----------|--------------|----------|
| **R-1** | After tapping "Prêt — set suivant", show next set's input form | RestTimer stayed open showing the set *after* the next one as "à suivre" → exercise card hidden | `workoutStore.test.ts` "endRest leaves phase=rest → phase=set" |
| R-2 | Skip repos behaves identically to Prêt | (same as R-1, same code path) | "full set→rest→set cycle" |
| R-3 | Final set: validate → done (no rest overlay flash) | n/a — covered by `advanceSet` 'done' branch | "done when last set of last exercise" |
| R-4 | endRest while not resting must be safe (no negative elapsed) | n/a — defensive | "endRest is a no-op when not resting" |
| R-5 | endRest must not override an explicit phase=done | n/a — defensive | "endRest does not clobber phase=done" |
| R-6 | Resume mid-rest: phase='rest' restored, timer resumes from real elapsed | covered by `resume()` in store | (manual; future test) |
| R-7 | Superset interleave: A1 → rest → B1 → rest → A2 …  cursor must use flatPlan order | covered by flatPlan tests + cursor logic | `flatPlan.test.ts` + integration TODO |
| R-8 | Timed set (cardio/iso): no reps stepper, TimedSetRunner countdown, then rest | n/a | (manual; future test) |
| R-9 | rest_seconds == 0 set: no overlay, cursor advances directly | covered by validateSet branch | (manual; future test) |

---

## Vitest coverage (current)

`packages/web/test/workoutStore.test.ts` — 9 tests covering R-1, R-2, R-3, R-4, R-5 plus advanceSet branches. Run via `npm test --workspace @coach/web`.

`packages/web/test/flatPlan.test.ts` — 5 tests covering R-7 cursor build (strength sequential, superset interleave, circuit, mixed blocks, mismatched set counts).

---

## Future E2E (Playwright) — recommended scenarios

Project does not yet have Playwright. When added (recommended infra: `@playwright/test` in `packages/web`, fixture that boots the server with an in-memory DB), the following click-through scenarios cover the runner end-to-end:

### E2E-1 — Strength block, full happy path
1. Seed DB with a 1-session program (1 exercise, 3 working sets, rest 60s each).
2. Start session via Today screen.
3. For each set: assert exercise card visible → tap "Valider" → assert RestTimer visible with correct "à suivre" → wait/skip → assert RestTimer closed AND next set's `set en cours` shows `N/3`.
4. After last set: assert PostSession screen.

**Critical assertions to prevent R-1:**
- After `Skip repos` click, locator for `[data-testid=rest-timer]` becomes hidden.
- Locator for `[data-testid=set-current]` shows the new set number (not the one that was previewed in "à suivre").

### E2E-2 — Superset interleave
1. Seed program with a superset block (Ex A 3×, Ex B 3×).
2. Walk through 6 set validations: A1, B1, A2, B2, A3, B3.
3. After each, assert exercise name on the card matches the expected order.

### E2E-3 — Timed set (cardio)
1. Seed program with a `cardio` block, `timed` set, `duration_seconds: 30`.
2. Start session, assert TimedSetRunner present (no Reps stepper).
3. Wait for countdown OR tap "Terminé" → assert next state.

### E2E-4 — Resume mid-rest
1. Start session, validate set 1.
2. While rest overlay is open, navigate away and reload.
3. Assert rest overlay reappears with the **remaining** time (not the full target), and `à suivre` preview still references the correct next set.

### E2E-5 — Final-set transition
1. Seed 1-exercise, 1-set program.
2. Validate the set.
3. Assert no RestTimer flash; PostSession appears immediately.

### Suggested data-testid hooks (to add when E2E lands)
- `data-testid="rest-timer"` on the RestTimer root
- `data-testid="set-current"` on the "set en cours" block
- `data-testid="next-up"` on the rest overlay's preview card
- `data-testid="validate-set"` on the bottom CTA
- `data-testid="rest-skip"` and `data-testid="rest-done"` on rest actions

---

## Manual smoke (until E2E lands)

Before each release, walk through:
1. Strength session, 2 exercises, 3 sets each: validate → rest → assert exercise card visible after rest, **not** the rest preview.
2. Superset session: confirm A/B alternation and rest between rounds.
3. Mid-rest reload: confirm resume.
4. Final set → PostSession transition.

Update this doc when a new regression is caught — the `Regression catalog` table is the contract.
