# Fitness Coach App — System Design

**Date:** 2026-04-08  
**Stack cible:** React + TypeScript + Vite · Tailwind CSS · Lucide Icons · IndexedDB · GitHub Pages · GitHub Actions

---

## 1. Vue d'ensemble

Une PWA mobile-first, hébergée sur GitHub Pages, sans backend. Le programme d'entraînement est un artefact JSON généré par Claude. L'app est le terminal d'exécution : elle consomme ce JSON, guide la séance, persiste les performances localement, et exporte les données de contexte pour permettre à Claude de régénérer un nouveau programme.

```
┌─────────────────────────────────────────────────┐
│                  Claude (AI Coach)              │
│  - génère WorkoutProgram JSON                   │
│  - analyse SessionReport[] pour nouveau plan    │
└────────────┬───────────────────────┬────────────┘
             │ JSON program in       │ SessionReport[] out
             ▼                       │
┌─────────────────────────────┐      │
│      Fitness Coach PWA       │──────┘
│  (GitHub Pages / static)    │
│  ├── Import JSON             │
│  ├── Workout execution       │
│  │   ├── Set tracking        │
│  │   └── Rest timers         │
│  ├── Session history         │
│  └── Export context          │
│                              │
│  Storage: IndexedDB          │
│  (100% offline-capable)      │
└─────────────────────────────┘
```

---

## 2. Functional Requirements

| # | Feature | Priorité |
|---|---------|---------|
| F1 | Import d'un programme JSON (fichier, paste, URL hash, Gist) | P0 |
| F2 | Vue de la séance du jour avec exercices et sets | P0 |
| F3 | Tracking set-by-set (reps, poids, RPE réel) | P0 |
| F4 | Timer de repos par exercice + compte à rebours full-screen | P0 |
| F5 | Marquage de complétion (exercise / set level) | P0 |
| F6 | Rapport post-séance (feedback, taux complétion, perfs) | P0 |
| F7 | Historique persistant (IndexedDB) | P0 |
| F8 | Export JSON de contexte pour re-génération par Claude | P0 |
| F9 | PWA installable + offline | P1 |
| F10 | Deep link `#program=<base64>` pour injection directe depuis Claude | P1 |
| F11 | Sync optionnelle via GitHub Gist (token user) | P2 |

---

## 3. Non-Functional Requirements

- **Offline-first** : 100% fonctionnel sans réseau après premier chargement
- **Mobile-first** : conçu pour one-hand usage en salle de sport
- **Zéro backend** : pas de serveur, pas de coût, pas de maintenance infra
- **Déterminisme JSON** : le format est versionné et validé à l'import (Zod)
- **Performance** : TTI < 2s sur 4G, pas de layout shift pendant un timer actif

---

## 4. Architecture

### 4.1 Stack technique

```
Runtime       : React 18 + TypeScript 5
Build         : Vite 5 + vite-plugin-pwa (Workbox)
Styling       : Tailwind CSS v3
Icons         : Lucide React (pas d'emoji)
State         : Zustand (slices: workout, history, settings)
Storage       : IndexedDB via idb (Dexie.js ou idb direct)
Validation    : Zod v3 (schemas partagés program + session)
Routing       : React Router v6 (hash router pour GitHub Pages)
Hosting       : GitHub Pages
CI/CD         : GitHub Actions (build + deploy sur push main)
```

### 4.2 Structure du repo

```
fitness-coach/
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI: build + gh-pages deploy
├── public/
│   ├── manifest.json           # PWA manifest
│   └── icons/                  # App icons (192, 512)
├── src/
│   ├── schemas/
│   │   ├── program.schema.ts   # Zod schema WorkoutProgram
│   │   ├── session.schema.ts   # Zod schema SessionReport
│   │   └── index.ts
│   ├── store/
│   │   ├── workout.store.ts    # Active session state (Zustand)
│   │   ├── history.store.ts    # Session history state
│   │   └── settings.store.ts
│   ├── db/
│   │   └── index.ts            # IndexedDB setup (Dexie)
│   ├── components/
│   │   ├── ui/                 # Design system (Button, Card, Timer, etc.)
│   │   ├── workout/
│   │   │   ├── WorkoutView.tsx
│   │   │   ├── ExerciseCard.tsx
│   │   │   ├── SetRow.tsx
│   │   │   └── RestTimer.tsx   # Full-screen countdown
│   │   ├── program/
│   │   │   ├── ProgramView.tsx
│   │   │   └── SessionCard.tsx
│   │   ├── history/
│   │   │   ├── HistoryView.tsx
│   │   │   └── SessionReport.tsx
│   │   └── import/
│   │       └── ImportView.tsx  # File + paste + URL + Gist
│   ├── hooks/
│   │   ├── useTimer.ts
│   │   ├── useWorkout.ts
│   │   └── useExport.ts
│   ├── utils/
│   │   ├── importProgram.ts    # Parsing + validation Zod
│   │   ├── exportContext.ts    # Génération du rapport de contexte
│   │   └── urlHash.ts          # Encode/decode base64 program
│   ├── pages/
│   │   ├── Today.tsx
│   │   ├── Program.tsx
│   │   ├── History.tsx
│   │   └── Import.tsx
│   └── App.tsx
├── json-schemas/               # JSON Schema spec (pour Claude)
│   ├── workout-program.schema.json
│   └── session-report.schema.json
└── prompts/                    # Prompt templates Claude
    ├── generate-program.md
    └── analyze-sessions.md
```

---

## 5. JSON Schema — WorkoutProgram

Format versionné, validé par Zod à l'import. C'est le contrat entre Claude et l'app.

```json
{
  "$schema": "https://fitness-coach.app/schemas/v1/workout-program.json",
  "schema_version": "1.0.0",
  "program": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Force & Hypertrophie — Bloc 1",
    "generated_at": "2026-04-08T10:00:00Z",
    "generated_by": "claude-sonnet-4-6",
    "goal": "strength",
    "notes": "Programme 4 jours sur 8 semaines. Progression linéaire sur les mouvements principaux.",
    "duration_weeks": 8,
    "sessions_per_week": 4
  },
  "sessions": [
    {
      "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "session_number": 1,
      "name": "Jour A — Push",
      "scheduled_weekday": "monday",
      "estimated_duration_minutes": 65,
      "tags": ["push", "chest", "shoulders", "triceps"],
      "warmup": {
        "duration_minutes": 10,
        "instructions": "5 min cardio léger + mobilité épaules + 2 sets légers bench"
      },
      "blocks": [
        {
          "id": "block-001",
          "name": "Force principale",
          "type": "strength",
          "notes": "Focus sur la technique, ne pas sacrifier la forme.",
          "exercises": [
            {
              "id": "ex-001",
              "order": 1,
              "name": "Développé couché barre",
              "category": "compound",
              "muscle_groups_primary": ["pectoraux", "deltoïdes antérieurs"],
              "muscle_groups_secondary": ["triceps"],
              "equipment": ["barbell", "bench", "rack"],
              "sets": [
                {
                  "set_number": 1,
                  "type": "warmup",
                  "reps": 10,
                  "reps_min": null,
                  "reps_max": null,
                  "weight_kg": 40,
                  "weight_unit": "kg",
                  "rpe_target": null,
                  "duration_seconds": null,
                  "rest_seconds": 90,
                  "notes": "Léger, activation"
                },
                {
                  "set_number": 2,
                  "type": "working",
                  "reps": 5,
                  "reps_min": null,
                  "reps_max": null,
                  "weight_kg": 80,
                  "weight_unit": "kg",
                  "rpe_target": 8,
                  "duration_seconds": null,
                  "rest_seconds": 210,
                  "notes": ""
                },
                {
                  "set_number": 3,
                  "type": "working",
                  "reps": 5,
                  "reps_min": null,
                  "reps_max": null,
                  "weight_kg": 80,
                  "weight_unit": "kg",
                  "rpe_target": 8,
                  "duration_seconds": null,
                  "rest_seconds": 210,
                  "notes": ""
                },
                {
                  "set_number": 4,
                  "type": "amrap",
                  "reps": null,
                  "reps_min": 3,
                  "reps_max": null,
                  "weight_kg": 80,
                  "weight_unit": "kg",
                  "rpe_target": 9,
                  "duration_seconds": null,
                  "rest_seconds": 240,
                  "notes": "Stop à 1 rep en réserve"
                }
              ],
              "coaching_cues": [
                "Omoplate rétractées et déprimées avant de saisir la barre",
                "Arc lombaire contrôlé, pieds à plat",
                "Descente contrôlée 2-3 secondes"
              ],
              "progression_note": "+2.5kg si tous les sets complétés en RIR 1+"
            }
          ]
        },
        {
          "id": "block-002",
          "name": "Accessoire hypertrophie",
          "type": "superset",
          "notes": "Repos entre supersets seulement.",
          "exercises": [
            {
              "id": "ex-002",
              "order": 1,
              "name": "Élévations latérales haltères",
              "category": "isolation",
              "muscle_groups_primary": ["deltoïdes latéraux"],
              "muscle_groups_secondary": [],
              "equipment": ["dumbbells"],
              "sets": [
                {
                  "set_number": 1,
                  "type": "working",
                  "reps": 15,
                  "reps_min": 12,
                  "reps_max": 20,
                  "weight_kg": 10,
                  "weight_unit": "kg",
                  "rpe_target": 8,
                  "duration_seconds": null,
                  "rest_seconds": 60,
                  "notes": "Superset avec Triceps Rope"
                }
              ],
              "coaching_cues": ["Légère rotation interne au sommet", "Contrôle de la descente"],
              "progression_note": null
            }
          ]
        }
      ],
      "cooldown": {
        "duration_minutes": 5,
        "instructions": "Étirements statiques pectoraux, épaules et triceps"
      }
    }
  ]
}
```

### Types de sets supportés

| Type | Valeur | Comportement app |
|------|--------|-----------------|
| Warmup | `"warmup"` | Affiché différemment, pas comptabilisé dans le volume |
| Working | `"working"` | Set standard |
| AMRAP | `"amrap"` | Input reps libre, pas de cible fixe |
| Dropset | `"dropset"` | Enchaîné immédiatement, pas de timer |
| Back-off | `"backoff"` | Poids réduit, même mouvement |
| Isométrie / durée | `"timed"` | `duration_seconds` utilisé à la place de `reps` |

### Types de blocs supportés

| Type | Comportement app |
|------|----------------|
| `strength` | Sets séquentiels, timer de repos long |
| `superset` | Alternance A/B, repos seulement entre rounds |
| `circuit` | N exercices en séquence, repos à la fin du circuit |
| `emom` | Every Minute On the Minute, timer intégré |
| `amrap` | As Many Rounds As Possible, timer global de bloc |
| `cardio` | Durée / distance, pas de sets |

---

## 6. JSON Schema — SessionReport

Format du rapport généré après chaque séance, stocké en IndexedDB et exporté pour Claude.

```json
{
  "schema_version": "1.0.0",
  "session_report": {
    "id": "report-uuid",
    "program_id": "550e8400-...",
    "session_id": "7c9e6679-...",
    "session_name": "Jour A — Push",
    "started_at": "2026-04-08T09:15:00Z",
    "completed_at": "2026-04-08T10:22:00Z",
    "duration_actual_minutes": 67,
    "completion_rate": 0.92,
    "pre_session": {
      "energy_level": 7,
      "sleep_quality": 6,
      "soreness_level": 3,
      "notes": "Légèrement courbaturé des épaules de lundi"
    },
    "post_session": {
      "overall_feeling": 8,
      "difficulty_perceived": 7,
      "notes": "Bon entraînement, le bench monte bien"
    },
    "exercises_log": [
      {
        "exercise_id": "ex-001",
        "exercise_name": "Développé couché barre",
        "completed": true,
        "skipped": false,
        "sets_log": [
          {
            "set_number": 1,
            "type": "warmup",
            "planned_reps": 10,
            "actual_reps": 10,
            "planned_weight_kg": 40,
            "actual_weight_kg": 40,
            "rpe_planned": null,
            "rpe_actual": 5,
            "rest_planned_seconds": 90,
            "rest_taken_seconds": 95,
            "duration_seconds": null,
            "completed": true,
            "notes": ""
          },
          {
            "set_number": 4,
            "type": "amrap",
            "planned_reps": null,
            "actual_reps": 7,
            "planned_weight_kg": 80,
            "actual_weight_kg": 80,
            "rpe_planned": 9,
            "rpe_actual": 9,
            "rest_planned_seconds": 240,
            "rest_taken_seconds": 250,
            "duration_seconds": null,
            "completed": true,
            "notes": "Technique ok jusqu'au bout"
          }
        ],
        "notes": ""
      }
    ],
    "volume_summary": {
      "total_sets_planned": 18,
      "total_sets_done": 17,
      "total_reps_done": 94,
      "total_volume_kg": 4230
    }
  }
}
```

---

## 7. Stratégie de validation JSON

### 7.1 À l'import (Zod runtime)

```typescript
// src/schemas/program.schema.ts
import { z } from 'zod';

const SetSchema = z.object({
  set_number: z.number().int().positive(),
  type: z.enum(['warmup', 'working', 'amrap', 'dropset', 'backoff', 'timed']),
  reps: z.number().int().positive().nullable(),
  reps_min: z.number().int().positive().nullable(),
  reps_max: z.number().int().positive().nullable(),
  weight_kg: z.number().nonnegative().nullable(),
  weight_unit: z.enum(['kg', 'lbs']).default('kg'),
  rpe_target: z.number().min(1).max(10).nullable(),
  duration_seconds: z.number().positive().nullable(),
  rest_seconds: z.number().nonnegative(),
  notes: z.string().default(''),
});

const ExerciseSchema = z.object({
  id: z.string().uuid(),
  order: z.number().int().positive(),
  name: z.string().min(1),
  category: z.enum(['compound', 'isolation', 'cardio', 'mobility']),
  muscle_groups_primary: z.array(z.string()),
  muscle_groups_secondary: z.array(z.string()),
  equipment: z.array(z.string()),
  sets: z.array(SetSchema).min(1),
  coaching_cues: z.array(z.string()),
  progression_note: z.string().nullable(),
});

// ... (blocks, sessions, program)

export const WorkoutProgramSchema = z.object({
  schema_version: z.literal('1.0.0'),
  program: ProgramMetaSchema,
  sessions: z.array(SessionSchema).min(1),
});

export type WorkoutProgram = z.infer<typeof WorkoutProgramSchema>;
```

### 7.2 Erreurs utilisateur

À l'import, si la validation échoue, l'app affiche les erreurs field-level de Zod reformattées en messages clairs :
- "Exercice 'Squat' — Set 2 : le champ `weight_kg` est requis"
- "Le `schema_version` doit être '1.0.0'"

### 7.3 Migration de version

Le champ `schema_version` permet de gérer les migrations futures :
```typescript
function migrateProgram(raw: unknown): WorkoutProgram {
  const version = (raw as any)?.schema_version;
  if (version === '1.0.0') return WorkoutProgramSchema.parse(raw);
  // if (version === '0.9.0') return migrate_0_9_to_1_0(raw);
  throw new Error(`Schema version '${version}' non supportée`);
}
```

---

## 8. Méthodes d'injection du programme

### Option A — Import fichier JSON (P0)
- Drag & drop ou sélecteur de fichier
- Validation Zod à la lecture
- Stocké en IndexedDB

### Option B — Paste clipboard JSON (P0)
- Textarea dans Import view
- Parse + validate on submit

### Option C — URL Hash base64 (P1)
URL : `https://ton-username.github.io/fitness-coach/#program=eyJzY2hlbWEuLi4`

```typescript
// Claude génère le lien directement dans la conversation
const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(program))));
const link = `https://ton-username.github.io/fitness-coach/#program=${encoded}`;
```
L'app détecte le hash au load, parse et propose d'importer. **C'est le canal le plus fluide pour le loop Claude → App.**

### Option D — GitHub Gist (P2, optionnel)
- User fournit un Personal Access Token (stocké en localStorage chiffré)
- Claude crée/met à jour un Gist public avec le programme
- App fetch le Gist à l'ouverture
- Permet aussi d'uploader les SessionReports → Claude peut les lire directement

---

## 9. Export de contexte pour Claude

Bouton "Export pour coaching" dans History view. Génère un JSON de contexte complet :

```json
{
  "export_date": "2026-04-08T10:30:00Z",
  "current_program": { "...": "WorkoutProgram complet" },
  "session_reports": ["...tableau de SessionReport"],
  "aggregate_stats": {
    "weeks_active": 4,
    "total_sessions": 14,
    "average_completion_rate": 0.91,
    "strength_trends": {
      "bench_press_kg": [75, 75, 77.5, 80],
      "squat_kg": [90, 92.5, 95, 95]
    },
    "fatigue_trend": [6, 7, 5, 8, 6]
  }
}
```

**Prompt template fourni dans `prompts/analyze-sessions.md`** que l'utilisateur colle avec ce JSON pour demander un nouveau programme.

---

## 10. Persistance — IndexedDB (Dexie.js)

```typescript
// src/db/index.ts
import Dexie, { type Table } from 'dexie';

interface StoredProgram { id: string; program: WorkoutProgram; imported_at: string; }
interface StoredReport { id: string; report: SessionReport; }
interface ActiveSession { id: 'current'; state: WorkoutSessionState; }

class FitnessDB extends Dexie {
  programs!: Table<StoredProgram>;
  reports!: Table<StoredReport>;
  active_session!: Table<ActiveSession>;

  constructor() {
    super('FitnessCoachDB');
    this.version(1).stores({
      programs: 'id, imported_at',
      reports: 'id, report.started_at, report.program_id',
      active_session: 'id',
    });
  }
}

export const db = new FitnessDB();
```

La session active est persistée en temps réel : si l'app se ferme en pleine séance, elle reprend exactement là où elle en était.

---

## 11. UI / UX — Flux de l'app

### Navigation (Bottom Tab Bar)
```
[ Aujourd'hui ]  [ Programme ]  [ Historique ]  [ Importer ]
```

### Écran "Aujourd'hui" — Workout Execution

```
┌─────────────────────────────┐
│  Jour A — Push              │
│  Set 3/4 · Ex 2/6  ████░░  │
├─────────────────────────────┤
│  Développé couché barre     │
│                             │
│  Set 2 — Working            │
│  Prévu : 5 reps × 80kg      │
│                             │
│  Reps : [−] [ 5 ] [+]       │
│  Poids : [−] [80kg] [+]     │
│  RPE :  [−] [ 8 ] [+]       │
│                             │
│  [ Valider le set ]         │
├─────────────────────────────┤
│  Cues : ▼ Voir les cues     │
└─────────────────────────────┘
```

### Timer de repos — Full screen
```
┌─────────────────────────────┐
│                             │
│       REPOS                 │
│                             │
│        02:45                │
│    ████████████░░░░░        │
│                             │
│   [ +30s ]    [ Passer ]    │
│                             │
│  Prochain : Set 3 × 80kg    │
└─────────────────────────────┘
```
- Vibration haptic à 10s et à 0s (Web Vibration API)
- Son d'alerte optionnel
- Wake Lock API pour garder l'écran allumé

### Rapport post-séance
Généré automatiquement à la fin. Affiche :
- Taux de complétion
- Volume total (kg soulevés)
- PRs du jour (si applicable)
- Slider "ressenti général" 1-10
- Champ notes libre
- Bouton "Exporter pour Claude"

---

## 12. CI/CD — GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

**URL finale :** `https://[username].github.io/fitness-coach/`

---

## 13. Trade-offs et décisions architecturales

| Décision | Alternative considérée | Raison du choix |
|----------|------------------------|-----------------|
| Zéro backend | Supabase / Firebase | Pas de coût, pas de maintenance, 100% offline |
| IndexedDB (Dexie) | localStorage | Capacité (GBs vs 5MB), requêtes indexées |
| Zustand | Redux / React Context | Moins de boilerplate, adapté à un dev solo |
| Hash Router | History Router | Requis pour GitHub Pages (pas de server-side routing) |
| Base64 URL | QR code | Plus simple à générer par Claude, copiable en texte |
| Zod runtime | JSON Schema seul | Inférence TypeScript incluse, single source of truth |
| Dexie | idb direct | API plus simple, plugins (sync, live queries) |

---

## 14. Phases d'implémentation

### Phase 1 — Core (semaine 1-2)
- Setup repo + Vite + Tailwind + Lucide + Dexie + Zustand
- JSON schemas Zod complets (WorkoutProgram + SessionReport)
- Import view (fichier + paste + URL hash)
- Workout execution view (sets, reps, poids)
- Timer de repos + Wake Lock

### Phase 2 — Persistence & Rapport (semaine 2-3)
- Sauvegarde temps réel session active (crash recovery)
- Génération rapport post-séance
- History view avec liste des séances
- Export JSON de contexte

### Phase 3 — PWA & Deploy (semaine 3)
- Service Worker (Workbox via vite-plugin-pwa)
- GitHub Actions CI/CD
- Manifest + icons

### Phase 4 — Claude Loop (semaine 4)
- Prompt templates dans `/prompts/`
- Deep link generator (optionnel : page dans Claude artifact)
- Gist sync optionnel

---

## 15. Prompt template — Génération de programme

Fichier : `prompts/generate-program.md`

```
Tu es un coach sportif expert. Génère un programme d'entraînement au format JSON strict
défini par le schema suivant : [coller workout-program.schema.json]

Contraintes :
- schema_version: "1.0.0"
- Tous les UUIDs doivent être valides (format v4)
- rest_seconds adapté au type de set (force: 180-240s, hypertrophie: 60-120s)
- Inclure au minimum un set warmup par exercice principal
- coaching_cues en français

Contexte utilisateur : [coller le export de contexte]

Objectif : [ex: progression force sur bench/squat/deadlift, 4 jours/semaine]
```

---

## 16. Points de validation avant implémentation

- [ ] Valider le JSON Schema WorkoutProgram (ajouts/suppressions de champs ?)
- [ ] Confirmer les méthodes d'import à implémenter en P0 (fichier + paste suffisent pour commencer ?)
- [ ] Confirmer l'URL GitHub Pages cible (username/repo)
- [ ] Confirmer si la sync GitHub Gist est dans le scope initial ou future feature
- [ ] Valider le flow de rating RPE (échelle 1-10 ou 6-10 comme Borg ?)
- [ ] Types de blocs à supporter en P0 (strength + superset au minimum ?)
