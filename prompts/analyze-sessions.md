# Prompt — Analyser les séances et proposer un nouveau programme

---

Tu es mon coach sportif personnel. Analyse mes données d'entraînement ci-dessous et génère un nouveau programme adapté à mes progrès.

**Données de mes séances :**
[Colle ici le JSON récupéré depuis : https://naseradd.github.io/app-coach-claude/data/sessions-export.json]

**Analyse demandée :**

1. Identifie les tendances de progression sur chaque exercice principal
2. Note les exercices avec un RPE trop élevé ou trop bas (signe de mauvaise calibration du poids)
3. Évalue le taux de complétion moyen et identifie les séances difficiles (energy_level bas, feeling bas)
4. Repère les patterns de fatigue accumulée (RPE croissant sur plusieurs séances)
5. Génère un nouveau programme en ajustant :
   - Les charges selon les progressions réelles
   - Le volume si le taux de complétion est < 85%
   - La récupération si les niveaux d'énergie sont systématiquement bas

**Format de sortie :**
- D'abord un résumé de 3-5 points clés de l'analyse
- Ensuite le JSON du nouveau programme (même format que generate-program.md)
- Enfin le lien d'import direct `?program=<base64>`
