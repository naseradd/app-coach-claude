# Coach Claude — Design Spec & Product Brief

> Document de direction artistique + brief produit. À utiliser comme prompt pour
> reconstruire l'application complète (mobile + Apple Watch + serveur MCP + Claude API).
> Tous les choix techniques (stack, langages, infrastructure) sont volontairement laissés
> ouverts — à détailler avec l'agent d'implémentation.

---

## 1. Vision produit

**Coach Claude** est un coach sportif IA personnel.

- **Claude** est le coach (génère le programme, analyse les retours, ajuste).
- **L'app mobile** est le terminal d'exécution : guide la séance, capture les performances, remonte les rapports.
- **L'Apple Watch** (si possible) est l'extension poignet : timer de repos, validation set, RPE rapide, sans sortir le téléphone.
- **Le serveur MCP** est la source de vérité : programme actif, historique, profil utilisateur. Connecté à Claude via Model Context Protocol.

### Boucle d'usage
```
1. User demande à Claude (web/mobile/desktop) → "génère-moi une séance push lourde"
2. Claude lit profil + historique via MCP → génère programme JSON → push au serveur
3. App mobile/watch reçoit le programme via SSE/WebSocket → user exécute
4. App remonte SessionReport au serveur → Claude le lit au prochain prompt
5. Claude ajuste le programme suivant en fonction des perfs réelles
```

### Profils utilisateurs ciblés
- Pratiquants intermédiaires/avancés en musculation/force/hypertrophie
- Aiment piloter leur progression eux-mêmes mais veulent un coach disponible 24/7
- Pas de besoin de tracking gratuit/social — outil sérieux, pas Strava-like

### Hors scope (pour cadrer)
- Pas de réseau social, pas de feed, pas de likes
- Pas de marketplace de programmes
- Pas de coaching humain
- Pas d'achats in-app

---

## 2. Architecture cible (haut niveau)

```
┌──────────────────────────────────────────────────────────────┐
│                       Claude (web/mobile/desktop)            │
│  - reçoit les prompts utilisateur                            │
│  - lit profil + history via MCP                              │
│  - génère programme JSON / analyse                           │
│  - utilise instructions de projet "Coach Sportif"            │
└────────────────────┬─────────────────────────────────────────┘
                     │ MCP (Model Context Protocol)
                     ▼
┌──────────────────────────────────────────────────────────────┐
│                    Serveur MCP (Coach API)                   │
│  - Source de vérité: programme, history, profil              │
│  - Auth Bearer token                                         │
│  - SSE/WebSocket pour push temps réel vers clients           │
│  - Persiste en DB locale ou cloud léger                      │
└────────────────────┬──────────────┬──────────────────────────┘
                     │              │
            REST + SSE              │ WatchConnectivity
                     ▼              ▼
        ┌────────────────────┐  ┌──────────────────┐
        │  App mobile (PWA   │  │  Apple Watch     │
        │  ou native iOS)    │◄─┤  companion       │
        │  - exécute séance  │  │  - quick logging │
        │  - guide UI        │  │  - rest timer    │
        │  - rest timer      │  │  - haptics       │
        └────────────────────┘  └──────────────────┘
```

### Notes
- Le choix PWA vs natif iOS reste ouvert. PWA plus simple à déployer, native plus fluide.
  Si Apple Watch est priorité → natif Swift recommandé (sinon companion limité).
- Le MCP server doit exposer aussi des **outils Claude** (tools) pour que Claude puisse
  pousser un programme directement vers le serveur, ou lire l'historique.

---

## 3. Direction artistique — VALIDÉE

Style : **iOS Apple sober, premium, fluide.** Calme, papier chaud, terracotta accent,
animations spring physiques, pas de cliché tech ni sport-magazine.

### 3.1 Typographie

**Stack système, pas de webfont custom.**
```css
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display",
             "Inter Variable", "Inter", system-ui, "Helvetica Neue", Arial, sans-serif;
```

| Niveau | Taille | Line-height | Poids | Letter-spacing | Usage |
|---|---|---|---|---|---|
| `large` | 34 | 41 | 700 | -0.025em | NavBar large title |
| `title-1` | 28 | 34 | 700 | -0.022em | Page titles, hero headlines |
| `title-2` | 22 | 28 | 600 | -0.018em | Section titles |
| `title-3` | 20 | 25 | 600 | -0.014em | Sheet titles |
| `headline` | 17 | 22 | 600 | -0.012em | List row primary, exercise name |
| `body` | 17 | 22 | 400 | -0.008em | Default text |
| `callout` | 16 | 21 | 400 | -0.005em | Description, paragraphs |
| `subhead` | 15 | 20 | 500 | -0.003em | Section headers, list headers |
| `footnote` | 13 | 18 | 400 | — | Secondary metadata |
| `caption` | 12 | 16 | 500 | — | Eyebrows, micro-labels |
| `display` | variable | — | 200 | -0.04em | Timer readout uniquement |

**Tabular nums** (`font-variant-numeric: tabular-nums`) **uniquement** dans les readouts
métriques (timer, poids, reps, RPE). Jamais sur du texte normal.

**Pas de mono police pour libellés.** Pas de capitales tracked. Sentence case partout.

### 3.2 Palette — 4 variants au choix

Chaque thème a une version Light + Dark. L'utilisateur peut basculer dans Settings,
ou choisir "Auto" qui suit l'OS.

#### A) Warm Cream (défaut) — terracotta
> Référence visuelle. Papier chaud, ambiance studio yoga + bibliothèque.

**Light:**
```
--bg-canvas:     #F4F1EC   (warm off-white papier)
--bg-surface:    #FAF7F2   (paper card)
--bg-elev:       #FFFFFF   (sheets)
--bg-tinted:     #ECE6DC
--separator:     rgba(60,60,67,0.14)
--ink:           #1C1B1F
--ink-2:         #43403A
--ink-3:         #6F6B62
--ink-4:         #A39E92
--accent:        #C8553D   (terracotta)
--accent-soft:   rgba(200,85,61,0.10)
--success:       #2D7D46
--warn:          #B45309
--danger:        #C73E1D
```

**Dark:**
```
--bg-canvas:     #0E0E10
--bg-surface:    #18181B
--bg-elev:       #1F1F23
--bg-tinted:     #2A2A2F
--ink:           #F4F1EB
--accent:        #E07458   (terracotta chaud)
```

#### B) Slate Cool — indigo
> Tech sobre, ardoise + bleu profond. Pour ceux qui préfèrent du froid.

**Light:**
```
--bg-canvas:     #F1F2F5
--bg-surface:    #FBFBFC
--bg-tinted:     #E4E7EC
--ink:           #14171F
--accent:        #4F46E5   (indigo)
--accent-soft:   rgba(79,70,229,0.10)
```

**Dark:**
```
--bg-canvas:     #0B0E14
--bg-surface:    #15191F
--ink:           #E8EBF0
--accent:        #818CF8   (indigo doux)
```

#### C) Forest Calm — sage
> Vert sage discret, ambiance bois clair + zen. Wellness sans cliché.

**Light:**
```
--bg-canvas:     #F0F2EE
--bg-surface:    #FAFBF7
--bg-tinted:     #E0E5DA
--ink:           #1A1F1A
--accent:        #4A6741   (sage profond)
--accent-soft:   rgba(74,103,65,0.10)
```

**Dark:**
```
--bg-canvas:     #0E110E
--bg-surface:    #181C18
--ink:           #EDF1EA
--accent:        #8FB07F   (sage clair)
```

#### D) Carbon Mono — neutral
> Monochrome charbon, contrast pur, pour minimalistes radicaux. Pas d'accent coloré
> sauf rouge sang sur PR/danger.

**Light:**
```
--bg-canvas:     #F6F6F4
--bg-surface:    #FFFFFF
--bg-tinted:     #ECECE9
--ink:           #0A0A0A
--accent:        #0A0A0A   (noir = accent)
--accent-soft:   rgba(10,10,10,0.06)
--pr:            #C73E1D   (rouge uniquement pour PR/danger)
```

**Dark:**
```
--bg-canvas:     #08080A
--bg-surface:    #141417
--ink:           #F5F5F0
--accent:        #F5F5F0   (blanc = accent)
```

### 3.3 Surfaces & élévation

**Rayons :**
- `r-sm` 10px (badges, mini-tiles)
- `r-md` 14px (boutons, inputs)
- `r-lg` 18px (cards principales)
- `r-xl` 26px (sheets, hero)
- `r-pill` 999px (toggles, segmented, badges capsule)

**Shadows soft à 3 niveaux. Jamais d'ombres dures.**
```
--shadow-sm:    0 1px 2px rgba(28,27,31,0.04), 0 1px 1px rgba(28,27,31,0.02)
--shadow-md:    0 4px 14px rgba(28,27,31,0.06), 0 1px 2px rgba(28,27,31,0.04)
--shadow-sheet: 0 -8px 32px rgba(28,27,31,0.12)
```

**Cards : aucune bordure 1px solide par défaut.** Séparation par shadow + couleur surface.
Bordure visible uniquement sur variante `outlined` quand explicitement utile.

**Material translucide** (backdrop-filter blur 24px saturate 180%) appliqué
**uniquement** sur :
- NavBar quand le contenu scroll dessous (sinon transparent)
- TabBar bottom
- Sticky CTA bottom (Workout, SessionDetail)
- Sheets

### 3.4 Animations — système spring partout

**Bibliothèque suggérée** : Framer Motion (web) / SwiftUI native springs (iOS/Watch).

**Defaults :**
- Spring standard : `stiffness: 380, damping: 32`
- Sheets / overlays : `stiffness: 260, damping: 28`
- Buttons tap : `stiffness: 600, damping: 30`

**Patterns required :**
- **Page transitions** : cross-fade + 8px y-shift, 220ms ease-out, `AnimatePresence mode="wait"`
- **List items entrée** : stagger 30-40ms, fade + 6px y-shift
- **Tap feedback global** : `whileTap={{ scale: 0.97 }}`, 80ms back
- **Number readout change** : spring `key={value}` AnimatePresence (Stepper, timer)
- **Sheet** : slide up depuis bas avec spring 260/28, drag-to-dismiss avec rubber-band, backdrop fade
- **TabBar active** : icon scale 1.05 + y -1, color crossfade vers accent
- **Segmented pill** : `layoutId` glissant fluide entre cellules (RPE 1-10)
- **Toggle** : knob spring 500/32 sur translate
- **Active set / current step** : pulse subtil 1.0 → 1.015 → 1.0, 1.6s loop infinite

**Toujours respecter** `@media (prefers-reduced-motion: reduce)` → durées 0.01ms,
animations désactivées.

### 3.5 Iconographie

- **Lucide** outline en défaut, stroke 1.8-2.4 selon contexte.
- **Active state = filled equivalent** (House → House filled, Layers → Layers filled).
- Match SF Symbols feel : pas de pictogrammes ad-hoc, pas de doodles, pas de generics
  cliché (pas d'emojis sauf feeling picker post-session).
- Tab bar : 3 tabs max (Coach, Archives, Profil). Pas plus, pas moins.

### 3.6 Layout

- **Page padding horizontal** : 20px défaut.
- **Vertical rhythm** : 8 / 12 / 16 / 20 / 28 / 36.
- **Touch targets** : ≥ 44px partout.
- **Safe areas** : `env(safe-area-inset-top)` / `env(safe-area-inset-bottom)`.
- **Frame mobile** : max-width 430px (iPhone Pro Max), centré sur desktop.

---

## 4. Composants requis

### Primitives
- **`NavBar`** — large title qui collapse en compact au scroll. Material translucide
  apparaît quand contenu passe dessous (sinon transparent). Gauche : "Retour" avec
  chevron, accent color. Droite : trailing slot pour boutons icône.
- **`TabBar`** — 3 tabs, bottom translucide blur, icône outline → filled selon active,
  label sous (12px, accent quand active). Pas de pill flottante. Standard iOS.
- **`ListGroup`** + **`ListRow`** — liste iOS grouped. Surface bg-surface, radius 18,
  separators inset 16. Header subhead lowercase optionnel.
- **`ListRow`** — leading optional (icon, media thumb, date capsule), label headline,
  subtitle footnote, trailing value, chevron optional. Press feedback overlay 6% ink.
- **`Card`** — variantes `surface` (défaut), `elev` (shadow plus fort), `tinted`
  (bg-tinted), `outlined` (bordure visible), `mesh` (gradient radial accent subtil).
- **`Button`** — 4 variantes : `primary` (filled accent), `tinted` (accent sur soft),
  `bordered` (1px separator, plain text), `plain` (texte accent only). Sizes
  `sm/md/lg/xl`. xl = 56h pour CTAs principaux.
- **`IconButton`** — 36×36 cercle, `tinted` ou `acid`. Spring tap.
- **`Stepper`** — boutons +/− 48×48 ronds (left tinted minus, right accent plus),
  readout central 44px tabular spring sur valeur. Label header + hint + unit.
- **`Segmented`** — radiogroup avec pill `layoutId` glissante. Variante générique
  + variante `RPESegmented` 1-10.
- **`Sheet`** — bottom sheet iOS. Drag handle visible top. Detents `medium` (0.5)
  / `large` (0.86). Drag-to-dismiss. Backdrop scrim 32% noir avec fade. Spring 260/28.
- **`Toggle`** — switch iOS-style 51×31, knob blanc shadow, accent fill quand on.
- **`ProgressBar`** — 4px height, radius 999, accent fill spring, bg-tinted track.
- **`Badge`** — pill capsule, sentence case (`accent`, `neutral`, `success`, `warn`,
  `danger`, `pr`). Padding 4×9, weight 500, font 12px, **jamais uppercase tracked**.
- **`MediaThumb`** — vignette image/vidéo. Voir section 5.

### App shell
- **`AppShell`** — wrapper TabBar + AnimatePresence pour transitions de pages.
- **`PageHeader`** — alias de NavBar pour pages secondaires.

---

## 5. Médias vidéo — RÉVISION IMPORTANTE

**Le PoC affichait la vidéo en gros (16:9 thumbnail) sur SessionDetail et Workout.
À ne plus faire.**

### Nouvelle règle : vidéo **à la demande** uniquement

Sur les écrans qui mentionnent un exercice (SessionDetail row, Workout active, RestTimer
next), on affiche par défaut **uniquement le nom et les métadonnées texte**.

Si une vidéo de démo est disponible (`video_url`), un **bouton icône `Video`**
(lucide `Video` ou `PlayCircle`) apparaît :
- Position : trailing dans la row d'exercice, ou top-right de l'exercise card en Workout
- Taille : IconButton 36×36 tinted
- Comportement au tap : ouvre une **Sheet medium detent** avec le player vidéo embed
  (YouTube iframe ou autre) + nom de l'exercice + cues techniques en dessous

### Pas de thumbnails vidéo grosses partout
- Pas de hero 16:9 sur Workout
- Pas de strip de thumbnails sur Today (les sessions cards montrent juste nom + stats)
- Pas de vignettes 56×56 leading sur SessionDetail (juste icône Dumbbell + nom)

### Exception
Sur la Sheet exercice (qui s'ouvre via le bouton vidéo), le player est en plein écran
horizontal car c'est l'objet principal de la sheet.

### MediaThumb component supprimé du flux principal
Il existe toujours pour la Sheet, mais n'est plus consommé dans Today / SessionDetail
list / Workout / RestTimer en mode défaut.

---

## 6. Pages & flows

### 6.1 Today (`/`)
Écran d'entrée. Tab "Coach".

**Structure :**
- NavBar large title "Aujourd'hui" + subtitle date FR (`mer. 30 avril`)
- Programme actif : Card variant `mesh` (gradient radial accent), badge "Programme actif"
  + relative time, title 1, notes callout, badges (goal, séances, sets), ProgressBar
  d'avancement bloc avec label
- Stats trio : streak / volume 7j / sessions totales (cards plates, num 22px tabular)
- Section "Séances" subhead lowercase + hint "choisis librement" footnote
- Liste des séances : Card par session, contenu **purement texte** (nom title-2,
  durée · exos · sets en footnote tabular, badge "✓ il y a Xj" si déjà fait), chevron
  trailing. Stagger anim entrée
- Last session peek bottom : Card tinted compact

**États :**
- Pas de programme → empty state centré (icône dumbbell soft, title 2, body)
- Backend offline → Card avec badge danger
- Setup incomplet → Card warn avec champs manquants en badges

### 6.2 Session Detail (`/session/:id`)

**Structure :**
- Hero mesh (gradient radial accent) sous NavBar (back uniquement, pas de large title)
- Badge "Programme name", title 1 nom session, callout durée · exos · sets, badges tags
- Coach note : Card tinted avec icône Quote accent
- Section "Exercices" : ListGroup
  - Chaque ListRow : pas de media thumb. Title = nom exercice headline, subtitle =
    `4 sets · pectoraux, deltoïdes ant. · top 80kg`, trailing = bouton icône `Video`
    si video_url disponible (sinon rien), chevron pour ouvrir détail
- Sticky bottom CTA : Button primary xl "Démarrer la séance" avec icône Play

**Sheet exercice détail** (s'ouvre au tap d'une row OU au tap du bouton vidéo) :
- Player vidéo full-width 16:9 si video_url
- Badges muscle groups
- Plan de sets : table tabulée Sets / Reps / Poids / RPE / Repos. Stagger entrée.
- Cues techniques : Card tinted, liste à puces accent
- Alternatives : ListGroup avec rows alternative
- Note progression : Card tinted accent

### 6.3 Workout (`/workout` phase=set)

**Top bar (sticky, material thick) :**
- IconButton X (close → confirm abandon)
- Centre : nom session caption + timer global tabular 15px accent
- IconButton MoreHorizontal (kebab) → ouvre Sheet d'options

**ProgressBar fine sous top bar** + labels "Exo X/Y" + "Z/total sets" tabular caption

**Body :**
- Card exercise (sans media par défaut). Header : Title 2 nom exo. Sous-header : badges
  muscles. **À droite du title : IconButton `Video`** si video_url → ouvre Sheet player.
- Bouton expand "Cues techniques (3)" tinted radius 14, chevron rotation, ouvre liste
  cues à puces.

- Card Set Focus :
  - Header : caption "Set en cours" + display 56px tabular `1/4`
  - Référence inline body3 : `cible · 8 reps · 60 kg · RPE 7`
  - Stat right : caption "Dernière fois" + body2 tabular
  - Stepper "Reps réalisées" + hint cible
  - Stepper "Poids" unit kg/lbs + hint cible
  - RPESegmented value 1-10 avec label "RPE" + valeur courante grand + label texte
  - Si PR projeté détecté : Card tinted accent avec Trophy + texte "PR projeté · valide pour confirmer"

**Sticky bottom (material thick) :**
- Button primary xl full-width "Valider · X reps" avec icône CheckCircle2

**Sheet kebab (More) :**
- ListGroup "Set en cours" : Skip ce set / Skip cet exercice (destructive)
- ListGroup "Alternatives" : rows substitution

### 6.4 Rest Timer (`/workout` phase=rest)

**Présentation : Sheet plein écran qui slide up depuis le bas.**

**Structure :**
- Drag handle top
- Caption "REPOS" centrée
- Anneau circulaire 290×290 :
  - Stroke 3px track bg-tinted
  - Stroke 3.4px progress accent (rouge si <10s warn)
  - 60 ticks (12 majeurs) en separator faint
- Centre du ring :
  - Caption "Restant" / "Sur-temps" si overdue
  - **Display 92px font-weight 200** tabular (style horloge minimal)
  - Footnote "objectif · 02:00"
- Card "À suivre" (sans media) : nom prochain exo headline + footnote tabular
  `Set 2 · 6 reps · 75kg`. **Bouton icône Video à droite** si vidéo dispo.
- Actions bottom :
  - Grid 2 cols : Button tinted lg `+30s` / `Skip repos`
  - Button primary xl full-width `Prêt — set suivant` avec arrow trailing

**Haptics :**
- 10s restant : warning haptic
- 0s : success haptic + voice "Repos terminé" si voice cues activé

### 6.5 Post-Session (`/workout` phase=done)

**Si non submit encore :**
- NavBar absente, large title `Bravo.` (point inclus, accent dot suit)
- Callout nom session
- Stats grid 2×2 : Durée / Volume kg / Sets / Reps (cards num 26px tabular)
- Card "Complétion" avec ProgressBar + percentage tabular
- Si PR détecté : Card tinted accent avec icône Trophy en cercle accent + texte
  "X record(s) battu(s)". Animation scale-in spring delay 100ms.
- Card "Comment tu te sens ?" : 5 boutons emoji (😩😕😐🙂🤩) grid 5 cols, tap spring,
  active = bg-accent-soft + bordure accent
- Card "Notes" : textarea radius 18, paper feel
- ListGroup "Exercices" : rows nom + sets done/total + percent tabular (success si 100%)
- Sticky bottom : Button primary xl `Envoyer le rapport` avec icône Send

**Si submit OK :**
- Centré écran : cercle accent 96×96 avec Check 48 scale-in spring
- Large title `Bravo.` avec point accent
- Body callout "Le rapport a été envoyé. Claude pourra le lire à ton prochain prompt."
- Button primary lg full "Retour"

### 6.6 History (`/history`)

Tab "Archives".

- NavBar large title "Archives" + subtitle "X séances · accessible à Claude via MCP"
- Stats trio : volume total kg / reps / PRs (cards num 20px)
- Liste **groupée par mois** (subhead lowercase "avril 2026"), chaque mois en ListGroup
- Rows :
  - Leading : capsule date 48×48 bg-tinted (jour 18px tabular + mois 12px caption lowercase)
  - Title : nom session
  - Subtitle : `il y a Xj · 67min · 4280 kg` tabular
  - Value : badge PR si >0 (icône Trophy + count) + percent tabular (success si 100%)
  - Chevron

**Empty state** : icône Inbox dans cercle accent-soft + texte calme.

### 6.7 History Detail (`/history/:id`)

- NavBar back + title compact = nom session + subtitle datetime
- Stats grid 2×2 (idem PostSession)
- Notes post-session : Card tinted accent
- Liste exercises_log : Card par exo
  - Header : nom + badge OK / Skip / Partiel
  - Table sets : Set / Reps actual /planned / Poids actual / RPE / Trophy si PR

### 6.8 Settings (`/settings`)

Tab "Profil".

- NavBar large title "Profil"
- ListGroup "apparence" :
  - Block "Thème" avec **4 swatches grid** (Warm Cream / Slate Cool / Forest Calm /
    Carbon Mono / Auto en supplément). Active = bordure accent 2px + bg-accent-soft.
- ListGroup "préférences" :
  - Row "Unité de poids" avec segmented kg/lbs en value
  - Row "Haptiques" + Toggle iOS
  - Row "Voix coach" + Toggle iOS (annonce sets, repos terminé)
- ListGroup "serveur mcp" :
  - Inputs URL backend + Bearer token (rounded radius 14, bg canvas, focus ring accent)
  - Button tinted "Sauver et reconnecter"
  - Row URL MCP (`{url}/mcp`) avec bouton copy IconButton
  - Footer footnote rouge si reachable false
- ListGroup "zone danger" :
  - Button destructive bordered "Effacer toutes les données serveur"
- Card À propos tinted en bas : version + tagline

### 6.9 Onboarding (`/onboarding`)

Affiché si pas de token serveur configuré.

- 3 slides swipe-driven :
  - **S1** : icône Sparkles 56 dans cercle accent-soft 128, large title "Coach Claude
    te suit en temps réel." body callout
  - **S2** : icône Bot, "Tu exécutes. Claude apprend." body callout
  - **S3** : form connexion — Card surface inputs URL + token, bouton "Connecter"
- Page indicator : dots qui s'étirent en pill quand actif (spring layoutId)
- Bouton "Passer" top right qui jump direct au S3
- Bottom : Button primary xl "Continuer" avec arrow trailing (S1, S2) / "Connecter"
  (S3)

---

## 7. Apple Watch (companion)

> **Si la stack le permet (natif Swift/SwiftUI conseillé), prévoir un companion watchOS
> pour l'expérience optimale en salle.** Sinon, livrer la mobile en premier et
> garder cet axe pour V2.

### Écrans Watch

- **Set Focus** (écran principal pendant Workout) :
  - Top : nom exo court + Set X/Y tabular
  - Centre : grand pickers Digital Crown :
    - Reps (tab pour switcher entre Reps / Poids / RPE)
    - Crown rotate change valeur
  - Footer : Bouton circle filled accent "Valider"
  - Long press : abort

- **Rest Timer** :
  - Ring identique mobile mais simplifié 60ticks
  - Time tabular grand
  - Haptic à 10s + 0s
  - Crown rotate +/- 30s
  - Tap force touch : skip
  - Complication possible : ring de progression visible sur watch face

- **Aujourd'hui (compact)** :
  - Liste sessions du programme
  - Tap → démarre direct la session sur watch
  - Sync via WatchConnectivity quand mobile à proximité

### Sync stratégie
- **Source de vérité = serveur MCP**
- Mobile et Watch fetch le programme indépendamment via Bearer token
- Watch peut fonctionner seule en LTE/WiFi si Apple Watch cellular
- Reports remontent au serveur MCP, pas via mobile (évite SPOF mobile)

---

## 8. Serveur MCP — endpoints attendus

> Détails techniques (langage, DB, hosting) à décider avec l'agent.
> Voici juste le contrat fonctionnel.

### REST
- `GET /api/program` → `WorkoutProgram | null`
- `GET /api/sessions` → `SessionReport[]` (history)
- `GET /api/sessions/:id` → `SessionReport`
- `POST /api/sessions` → push un `SessionReport`
- `GET /api/profile` → `UserProfile | null`
- `PUT /api/profile` → update profile
- `GET /api/setup-status` → `{ complete: bool, missing: string[] }`
- `DELETE /api/data` → wipe (admin)
- `GET /health` → `{ ok: true, ts }`

### Auth
Bearer token dans header `Authorization: Bearer <token>`. Token configuré côté serveur
(env var). User le saisit dans Settings.

### Live updates (SSE ou WebSocket)
- `GET /api/events` (SSE) ou `WS /api/events`
- Events :
  - `program_received` (Claude vient de pousser un nouveau programme)
  - `profile_updated`
  - Payload event peut inclure le nouveau programme directement (économie de fetch)

### MCP (Model Context Protocol)
Le serveur expose **aussi** un endpoint MCP `/mcp` qui :
- Permet à Claude (via claude.ai project ou API) de lire programme/history/profil
- Expose des **tools** Claude :
  - `push_program(program: WorkoutProgram)` — Claude pousse un programme généré
  - `update_profile(profile: UserProfile)` — Claude met à jour le profil après setup conversationnel
  - `read_history(limit?: number)` — Claude lit l'historique

### Stockage
- DB simple suffisante (SQLite, Postgres léger, ou JSON files persistants)
- Pas besoin de scaler — single-user app

### Schémas JSON
Reprendre les schémas Zod du PoC précédent : `WorkoutProgram`, `SessionReport`,
`UserProfile`, `Exercise`, `WorkSet`, `SessionDef`. Versionner avec `schema_version: '1.0.0'`
pour migrations futures.

---

## 9. Claude API integration

### Pattern d'usage
1. **Projet Claude "Coach Sportif"** dans claude.ai web :
   - Instructions de projet contiennent : philosophie coaching, principes progressifs
     overload, gestion fatigue, échelle RPE Borg, format JSON attendu
   - Connecté au serveur MCP via le connecteur custom (l'URL `/mcp` du serveur)
2. **User chat normal avec Claude** → "génère séance push lourde" → Claude :
   - Lit profil + history via MCP tools
   - Génère programme JSON
   - Appelle `push_program` tool → arrive sur le serveur → SSE event vers app

### Coach instructions (à mettre dans le projet Claude)
Doit cadrer :
- Format de sortie strict (`schema_version: '1.0.0'`)
- Pas d'hallucinations équipement (toujours vérifier `profile.equipment`)
- Respect des blessures (`profile.injuries`)
- Charges progressives basées sur `oneRepMax`
- Inclure cues techniques en français
- Inclure alternatives (au moins 1) par exercice
- Inclure progression notes
- RPE target réaliste (5-9 selon set, jamais 10 sauf demande explicite)
- Repos adaptés au type (force 180-240s, hypertrophie 60-120s, isolation 45-75s)

### Alternative : API Anthropic directe
Si on veut bypass claude.ai (pour iOS native par ex), on peut :
- Embed une UI chat custom dans l'app
- Appeler `messages.create` avec system prompt = instructions coach
- Donner accès aux `tools` MCP directement via tool_use
- Plus complexe mais plus contrôlé

### Prompt caching
**Activer Anthropic prompt caching** sur les instructions coach (qui sont longues et
stables). Le profil utilisateur peut aussi être cachable. Économie tokens importante.

---

## 10. Anti-patterns — à NE PLUS faire

Liste des erreurs commises dans les itérations précédentes :

### Typographie
- ❌ Bricolage Grotesque, JetBrains Mono, polices "sport magazine"
- ❌ Mono partout (pas que dans les readouts)
- ❌ Eyebrows ALL-CAPS letter-spacing 0.18-0.22em à toutes les sauces

### Couleurs
- ❌ Pure white #FFFFFF / #F4F7FB partout (trop clinique)
- ❌ Bleu cliché tech #0066FF
- ❌ Vert athletic néon
- ❌ Glassmorphism abusé sur top bar
- ❌ Gradients fintech

### Composants
- ❌ "Bib" tags racing, chips pills partout
- ❌ Stripes-tape diagonale comme déco
- ❌ "Num-hero" mono counters partout
- ❌ Bordures 1px solides sur toutes les cards
- ❌ Bottom nav floating capsule layoutId pill (trop "designy", pas iOS)
- ❌ Card-in-card-in-card stacking
- ❌ Boutons rectangulaires froids

### Médias
- ❌ Vidéo 16:9 affichée par défaut sur Workout active
- ❌ Strip de thumbnails vidéo sur Today
- ❌ Thumbnails 56×56 leading systématique sur SessionDetail
- → **Toujours derrière un IconButton Video**

### Animations
- ❌ Transitions instantanées sans spring
- ❌ Pas de respect prefers-reduced-motion
- ❌ Animations gadget (parallax, scaling sans raison)

---

## 11. Acceptance / Definition of Done

### Mobile MVP
- [ ] 4 thèmes selectable (Warm Cream, Slate Cool, Forest Calm, Carbon Mono) + Auto
- [ ] Light + Dark variants pour chaque thème
- [ ] Type scale iOS HIG complète appliquée
- [ ] Composants primitifs implémentés (NavBar, TabBar, ListGroup/Row, Card variants,
      Button 4 variantes, IconButton, Stepper, Segmented, RPESegmented, Sheet, Toggle,
      ProgressBar, Badge)
- [ ] AppShell avec page transitions AnimatePresence
- [ ] 9 pages implémentées (Today, SessionDetail, Workout, RestTimer sheet, PostSession,
      History, HistoryDetail, Settings, Onboarding)
- [ ] **Vidéo derrière IconButton uniquement, jamais en gros par défaut**
- [ ] Sheet exercice détail = seul endroit où vidéo s'affiche en plein
- [ ] Spring physics sur tous les feedbacks
- [ ] prefers-reduced-motion respecté
- [ ] Safe areas respectées
- [ ] Touch targets ≥ 44px partout
- [ ] Compatibilité dark mode auto via OS
- [ ] PWA installable + offline first run

### Backend MCP MVP
- [ ] Endpoints REST listés section 8
- [ ] SSE/WebSocket events
- [ ] Endpoint `/mcp` exposant tools pour Claude
- [ ] Auth Bearer token
- [ ] Persistance simple
- [ ] Schémas JSON versionnés

### Claude integration MVP
- [ ] Projet Claude "Coach Sportif" avec instructions
- [ ] Connecteur MCP fonctionnel
- [ ] Prompt caching activé
- [ ] Tools `push_program`, `update_profile`, `read_history` opérationnels

### Apple Watch (V2 / si stack permet)
- [ ] Set focus avec Digital Crown
- [ ] Rest timer avec haptic + complication
- [ ] Sync via serveur MCP direct (pas dépendance mobile)

---

## 12. Notes pour l'agent d'implémentation

### Ordre suggéré
1. **Mobile design system** (tokens + primitives) — foundation
2. **Pages mobile statiques** avec mock data
3. **Backend MCP** (endpoints + persistance)
4. **Wiring mobile ↔ backend** (fetch + SSE)
5. **Claude project + connecteur MCP**
6. **Apple Watch** si stack le permet (sinon V2)

### Décisions à prendre avec l'utilisateur (PAS dans cette spec)
- Stack mobile : PWA React/Vite vs natif Swift iOS (impact direct sur Watch)
- Stack backend : Node/Bun, Go, Python ?
- Hébergement : local-only (Mac mini home) vs cloud léger (Fly, Railway, ngrok tunnel) ?
- DB : SQLite, Postgres, fichiers JSON ?
- Auth multi-user ou single-user ?
- MCP transport : stdio (local) vs HTTP (distant) ?
- Comment Claude est invoqué : claude.ai project (le plus simple) vs API directe (custom UI) ?

---

## 13. Tone & copy

- **Français par défaut**, tutoiement chaleureux mais sobre
- **Pas de motivational filler** ("Allez champion !", "Tu vas tout déchirer")
- **Verbe à l'impératif** sur CTAs : "Démarrer la séance", "Valider", "Envoyer le rapport"
- **Sentence case**, jamais ALL CAPS sauf badges techniques très courts (PR)
- **Honnête sur les états** : "Backend hors ligne", "Aucun programme actif", pas de
  faux optimisme
- **Concis** : un écran = une intention claire

---

## 14. Inspirations validées

- Apple Fitness+ pour la calme et le contrast typographique
- Linear pour la finesse des shadows et espacements
- Things 3 pour la palette warm-cream papier
- Strong (l'app musculation iOS) pour les patterns de logging set-by-set
- Apple Mail pour le NavBar large title qui collapse
- Apple Health pour les ListGroup grouped iOS

## 15. Inspirations à éviter

- Strava (trop social, trop tracking)
- MyFitnessPal (trop dense, trop saturé)
- Hevy (trop "designy" bottom nav floating)
- Fitbod (trop coloré, trop AI-generated feel)
- Le PoC précédent qu'on vient de supprimer (sport-magazine + bibs + stripes)

---

**Fin de spec. À utiliser comme prompt d'entrée pour reconstruire l'application.**
