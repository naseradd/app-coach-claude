# Coach Claude — Production smoke checklist

Run on iPhone Safari after first deploy + Claude project setup. Tick each item.

## PWA install
- [ ] Open `https://coach-claude.fly.dev` on iPhone
- [ ] Tap Share → "On the Home Screen"
- [ ] Launch from home screen → opens standalone (no Safari chrome)

## Onboarding
- [ ] Onboarding shows 3 slides
- [ ] Enter server URL + bearer token, tap "Connecter"
- [ ] App loads home screen, connection badge green

## Profile setup via Claude
- [ ] In Claude.ai project, ask: "Configure mon profil ..."
- [ ] PWA Today screen unblocks (no setup-incomplete card)

## Program generation
- [ ] Ask Claude: "Génère une séance push lourde"
- [ ] Within ~1s, Today shows the new program (via SSE)
- [ ] Tap a session → SessionDetail loads with exercises

## Workout flow
- [ ] Tap "Démarrer la séance" → check-in sheet opens
- [ ] Submit check-in → Workout opens with first set
- [ ] Validate first set → rest timer starts
- [ ] At 10s remaining, haptic warning fires (if iPhone — note that Safari Web Vibration is unsupported, so this may be silent)
- [ ] Skip rest → next set
- [ ] Complete all sets → PostSession with derived stats
- [ ] Submit → /history/:id shows the new report
- [ ] Ask Claude: "Résume ma dernière séance" → Claude reads history and answers

## Crash recovery
- [ ] Mid-workout, force-quit the app
- [ ] Relaunch → resumes at saved phase

## Themes
- [ ] Settings → switch to Slate Cool, Forest Calm, Carbon Mono, Auto
- [ ] Toggle iOS dark mode → Auto theme follows
- [ ] All pages render correctly in all 4 themes (no broken contrast)

## Reduced motion
- [ ] iOS Settings → Accessibility → Motion → Reduce Motion ON
- [ ] App animations are now near-instant (no sliding sheets, no spring transitions)

## Touch targets
- [ ] All interactive elements feel comfortable to tap one-handed in the gym
- [ ] No misclicks on Stepper, RPESegmented, ListRow chevrons, Tab bar
