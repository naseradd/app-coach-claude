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

`packages/web/test/workoutStore.test.ts` — 9 tests covering R-1, R-2, R-3, R-4, R-5 plus advanceSet branches. Run via `pnpm test --filter @coach/web`.

`packages/web/test/flatPlan.test.ts` — 5 tests covering R-7 cursor build (strength sequential, superset interleave, circuit, mixed blocks, mismatched set counts).

---

## Playwright E2E coverage (current)

`packages/web/e2e/workout-flow.spec.ts` — 6 specs running against `vite preview` with all `/api/*`, `/health`, and `/api/events` calls mocked via `page.route()` (no real backend). Bypasses onboarding by seeding `localStorage` (`coach.settings`) in `addInitScript`.

Run via `pnpm test:e2e --filter @coach/web` (or interactive UI: `pnpm test:e2e:ui`).

| Spec | Covers | Asserts |
|------|--------|---------|
| R-1 regression | Skip repos must close overlay AND show next exercise card | `rest-timer` hidden, `set-current-number` advanced |
| R-2 | "Prêt — set suivant" same as Skip | overlay closes, cursor advances |
| Happy path | 3 sets × 1 exercise → PostSession | full sequence, no `rest-timer` flash on final set |
| R-3 final-set | 1-set program → direct PostSession | `post-session` visible, no rest |
| R-7 superset | A1→B1→A2→B2 interleave | `exercise-name` alternates between Bench/Row each set |
| Next-up correctness | Rest preview shows the *next* set, not the current one | `rest-next-up-set` text matches expected set_number |

### data-testid hooks landed
- `rest-timer` (overlay root)
- `rest-next-up`, `rest-next-up-name`, `rest-next-up-set` (preview card)
- `rest-add-30`, `rest-skip`, `rest-done` (overlay actions)
- `set-current`, `set-current-number` (active-set card)
- `exercise-name` (exercise heading)
- `validate-set` (bottom CTA)
- `post-session` (done screen root)

---

## Future E2E — recommended additions

### E2E-Future-1 — Timed set (cardio/iso)
Seed a `cardio` block with a `timed` set (`duration_seconds: 30`). Assert `TimedSetRunner` renders (no reps stepper), countdown completes or tap "Terminé" → rest → next.

### E2E-Future-2 — Resume mid-rest
Mock `GET /api/active-session` to return `{ phase: 'rest', restStartedAt, setsLog: [...], exerciseIndex, setIndex, ... }`. Navigate to `/`, expect AppShell auto-redirect into `/#/workout?...&resume=1`. Assert overlay reappears with **remaining** time (not full target) and `rest-next-up-set` still correct.

### E2E-Future-3 — +30s extends rest target
Tap `rest-add-30`, assert displayed target updates (extract a testid for the displayed `objectif · MM:SS` text first).

### E2E-Future-4 — Skip exercise (more sheet)
Open the "more" sheet, tap Skip exercise, assert cursor jumps to the next exercise (not next set).

### E2E-Future-5 — Final report submission
After PostSession, fill overall feeling + notes, tap submit, assert `POST /api/sessions` was called with valid payload (use the route handler's captured `postedSessions` array in fixtures).

---

## Manual smoke

Before each release, walk through:
1. Strength session, 2 exercises, 3 sets each: validate → rest → assert exercise card visible after rest, **not** the rest preview.
2. Superset session: confirm A/B alternation and rest between rounds.
3. Mid-rest reload: confirm resume.
4. Final set → PostSession transition.

Update this doc when a new regression is caught — the `Regression catalog` table is the contract.
