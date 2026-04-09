# Prompt — Générer un programme d'entraînement

Copie ce prompt dans Claude en remplaçant les sections entre `[ ]`.

---

Tu es un coach sportif expert en programmation de la force et de l'hypertrophie.

Génère un programme d'entraînement au format JSON strict suivant exactement ce schema :

```json
{
  "program": {
    "id": "<UUID v4>",
    "name": "<Nom du programme>",
    "goal": "<strength|hypertrophy|endurance|mobility|general>",
    "notes": "<Description courte>"
  },
  "sessions": [
    {
      "id": "<UUID v4>",
      "name": "<Nom de la séance>",
      "scheduled_weekday": "<monday|tuesday|wednesday|thursday|friday|saturday|sunday|null>",
      "estimated_duration_minutes": <nombre>,
      "warmup": { "duration_minutes": <nombre>, "instructions": "<texte>" },
      "blocks": [
        {
          "id": "<UUID v4>",
          "name": "<Nom du bloc>",
          "type": "<strength|superset>",
          "notes": "<texte optionnel>",
          "exercises": [
            {
              "id": "<UUID v4>",
              "order": <1, 2, 3...>,
              "name": "<Nom de l'exercice>",
              "category": "<compound|isolation|cardio|mobility>",
              "muscle_groups_primary": ["<muscle>"],
              "equipment": ["<équipement>"],
              "sets": [
                {
                  "set_number": <1, 2, 3...>,
                  "type": "<warmup|working|amrap|timed|dropset|backoff>",
                  "reps": <nombre ou null>,
                  "reps_min": <nombre ou null>,
                  "reps_max": <nombre ou null>,
                  "weight_kg": <nombre ou null>,
                  "rest_seconds": <nombre>,
                  "rpe_target": <1-10 ou null>,
                  "duration_seconds": <nombre ou null>,
                  "notes": "<texte>"
                }
              ],
              "coaching_cues": ["<conseil technique>"],
              "progression_note": "<règle de progression ou null>"
            }
          ]
        }
      ],
      "cooldown": { "duration_minutes": <nombre>, "instructions": "<texte>" }
    }
  ]
}
```

**Règles importantes :**
- Tous les `id` doivent être des UUID v4 valides et uniques
- `rest_seconds` : force 180-240s, hypertrophie 60-120s, superset 45-90s entre rounds
- Inclure toujours au moins 1 set `warmup` par exercice principal (`compound`)
- `coaching_cues` en français
- Pour les supersets, les exercices sont alternés (A puis B, repos, A puis B...)
- Si `weight_kg` est `null`, l'app affichera `—` (poids au choix de l'utilisateur)

**Contexte de l'utilisateur :**
[Colle ici le JSON exporté depuis l'app via le bouton Share dans Historique]

**Objectif :**
[Ex: Progression force sur les mouvements principaux, 4 jours/semaine, 8 semaines]

**Après avoir généré le JSON, génère également ce lien d'import direct :**

```
https://naseradd.github.io/app-coach-claude/?program=<base64 du JSON>
```

Pour encoder : `btoa(encodeURIComponent(JSON.stringify(programme)))`
