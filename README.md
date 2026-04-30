# Coach Claude — POC

PWA mobile + backend MCP, single-tenant, où **Claude est le coach** et **l'app est le terminal d'exécution gym**.

PRD complet : `~/.claude/plans/fluttering-strolling-robin.md`

```
┌──────────────────┐    ┌──────────────────────┐    ┌───────────────────┐
│  Claude.ai       │ ←→ │  Backend MCP :8787   │ ←→ │  PWA iPhone :5173 │
│  Project         │    │  (Hono + JSON store) │    │  (React + Tailwind)│
└──────────────────┘    └──────────────────────┘    └───────────────────┘
```

---

## Direction artistique

**"Stopwatch Brutalism"** — charcoal + grain noise, accent lime électrique `#C5FF00`, **Bricolage Grotesque** display + **JetBrains Mono** pour tous les chiffres. Bordures hairline, layouts magazine sport, gros readouts tabulaires comme un chrono coach.

---

## Stack

| Couche | Tech |
|---|---|
| Frontend PWA | React 19 + Vite + Tailwind v4 + zustand + motion |
| Backend MCP | Hono + @modelcontextprotocol/sdk + Zod + web-push |
| Store | JSON file (`server/data/store.json`) — POC scope |
| Real-time | SSE (frontend) + Web Push optionnel |
| Distribution | dev local + ngrok pour brancher Claude.ai |

---

## Lancement rapide

### Backend
```bash
cd server
npm install
npm run dev   # :8787
```

### Frontend
```bash
npm install --legacy-peer-deps   # peer conflict vite-plugin-pwa avec vite 8
npm run dev   # :5173
```

### Test sur iPhone
Voir [`SETUP_PHONE.md`](./SETUP_PHONE.md).

### Brancher Claude.ai
Voir [`SETUP_CLAUDE_PROJECT.md`](./SETUP_CLAUDE_PROJECT.md).

---

## Fonctionnalités du POC (couverture PRD)

| PRD § | Feature | Statut |
|---|---|---|
| 1 | Réception programme via push (SSE + Web Push) | ✅ |
| 2 | Consultation programme actif + sessions | ✅ |
| 3.1-3.2 | Démarrage + tracking set par set | ✅ |
| 3.3 | Skip set | ✅ |
| 3.4 | Substitution exo (alts fournies par Claude) | ✅ |
| 3.5 | Skip exercice | ✅ |
| 3.6 | Modes séquentiel + superset | ✅ (UI superset détaille bloc) |
| 3.7 | Timer repos auto-start, fin manuelle, vibration, wake lock | ✅ |
| 3.8 | Aperçu prochain set pendant repos | ✅ |
| 3.9 | Voice cues TTS | ✅ (Web Speech API) |
| 3.10 | Crash recovery (state persisté localStorage) | ✅ |
| 3.11 | Abandon volontaire = discard | ✅ |
| 3.12 | Édition set validé interdite | ✅ |
| 4 | Apple Watch | ❌ (hors POC, requiert iOS native) |
| 5 | Rapport post-séance + métriques | ✅ |
| 5.4 | PR auto-detect + celebration | ✅ |
| 5.5 | Push Apple Health / Strava | ❌ stub (PWA ne peut pas écrire HealthKit) |
| 6 | Historique liste + détail | ✅ |
| 7 | MCP Server avec 9 outils | ✅ |
| 8 | Strava / Apple Health intégrations | ⚠ stubs MCP |
| 9 | Réglages (kg/lbs, vibration, TTS, MCP setup) | ✅ |
| 10 | Setup Claude Project + anti-hallucination | ✅ (via prompt système + outils setup) |
| 11.1 | Mode large boutons +/- | ✅ |
| 11.2 | Réception temps réel | ✅ SSE (Web Push optionnel) |
| 11.3 | Haptics différenciés | ✅ patterns navigator.vibrate |

---

## Limitations POC connues

- Apple Watch / WorkoutKit / HealthKit : nécessitent iOS native (Swift) — futur upgrade
- Strava OAuth : scaffold seulement, retours stubs
- Web Push : marche mais sans VAPID keys configurées dans `.env`, le push système ne part pas (l'SSE compense pour foreground)
- Mode offline : online-first (SSE polling backend), pas de cache full offline
- Single user, single tenant, JSON file store — pas adapté production multi-user
- Permission HealthKit côté PWA : impossible (limitation web). Stub MCP simulé.

---

## Architecture des fichiers

```
.
├── src/                       Frontend PWA
│   ├── App.tsx                Router + bootstrap (SSE + initial load)
│   ├── main.tsx               React entrypoint + fonts
│   ├── index.css              Design tokens (CSS vars), grain, utilities
│   ├── components/            UI building blocks (Bib, Button, Stepper, etc.)
│   ├── pages/                 7 pages: Onboarding, Today, SessionDetail, Workout,
│   │                          RestTimer (used by Workout), PostSession, History,
│   │                          HistoryDetail, Settings
│   ├── store/                 zustand stores (app + workout)
│   ├── lib/                   api/types/format/haptic/tts/wakelock/nano
│   └── types/                 ambient .d.ts shims
├── server/                    Backend MCP
│   ├── src/
│   │   ├── index.ts           Hono app entry
│   │   ├── mcp.ts             9 MCP tools
│   │   ├── routes/            REST + SSE + push + strava
│   │   ├── store.ts           JSON file persistence
│   │   ├── schemas.ts         Zod schemas
│   │   ├── seed.ts            Demo program + profile seed
│   │   └── ...
│   ├── data/store.json
│   └── README.md
├── public/                    PWA manifest + icons
├── SETUP_PHONE.md             Test sur iPhone
├── SETUP_CLAUDE_PROJECT.md    Brancher Claude.ai
├── README.md                  (ce fichier)
└── package.json
```

---

## Prochaines étapes (post-POC)

1. **iOS native** (SwiftUI + watchOS companion) pour Apple Health/Watch/HealthKit/WorkoutKit — débloquer la vraie expérience PRD §4
2. **Strava OAuth réel** — remplacer le stub
3. **Apple Health pipeline** — ingestion via app iOS native
4. **VAPID + Web Push prod** — notifs système même app fermée
5. **Déploiement backend** — Fly.io ou Cloudflare Workers (single-tenant cheap)
6. **Tests** — au minimum les flows critiques (validation, abandon, crash recovery)

---

## Crédits

POC built by night.
Bricolage Grotesque + JetBrains Mono — Google Fonts.
Stopwatch Brutalism direction artistique — single commitment.
