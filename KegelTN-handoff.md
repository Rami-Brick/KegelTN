# KegelTN Project Handoff

Last refreshed from the codebase on 2026-03-31.

## What KegelTN Is

KegelTN is a mobile-first React + TypeScript app for guided male pelvic-floor training. The current product framing is performance-focused rather than clinical: confidence, erection quality, stamina, and endurance.

The app is paid-access only. Users do not self-register. Access is currently created manually in Supabase Auth and users log in with an access key.

## Verified Tech Stack

- Vite + React 19 + TypeScript
- Tailwind CSS v4 via `@tailwindcss/vite`
- Framer Motion for screen and element animation
- Lucide React icons
- i18next + react-i18next for English and Arabic
- Supabase for Auth and database access
- `vite-plugin-pwa` with a checked-in `public/manifest.json`
- `@fontsource-variable/geist` for the app font
- Path alias `@/*` -> `src/*`

Notes:
- The app still uses a local screen-state flow in [`App.tsx`](/c:/Users/Rami/Desktop/Business/Xpand/Kegel/Projects/KegelTN/src/App.tsx), not React Router.
- `react-router-dom` is installed but not used in the current app flow.
- A shadcn/ui scaffold exists (`components.json`, [`button.tsx`](/c:/Users/Rami/Desktop/Business/Xpand/Kegel/Projects/KegelTN/src/components/ui/button.tsx)), but most shipped UI is custom Tailwind markup.

## Current App Flow

Actual flow in code:

```txt
Login -> Quiz (if no quiz_results row) -> Home -> Exercise Library -> Exercise Intro -> Timer -> Home
                                               |
                                               -> Journey
```

There is no router. `App.tsx` uses:

```ts
type AppState =
  | 'loading'
  | 'login'
  | 'quiz'
  | 'home'
  | 'library'
  | 'exercise-intro'
  | 'timer'
  | 'journey';
```

There is no separate completion route. The completion view is internal to [`TimerScreen.tsx`](/c:/Users/Rami/Desktop/Business/Xpand/Kegel/Projects/KegelTN/src/screens/TimerScreen.tsx).

## Authentication

Auth is still the "fake email" access-key pattern:

- Access key `foo-bar` becomes `foo-bar@kegeltn.app`
- The access key is also used as the password
- Login/logout/session helpers live in [`auth.ts`](/c:/Users/Rami/Desktop/Business/Xpand/Kegel/Projects/KegelTN/src/services/auth.ts)
- App boot checks `supabase.auth.getSession()` and then loads quiz state

## Supabase Data Used by the App

The current code reads or writes these tables:

### `quiz_results`

Used in [`App.tsx`](/c:/Users/Rami/Desktop/Business/Xpand/Kegel/Projects/KegelTN/src/App.tsx) to decide whether the user sees the quiz or goes straight to Home.

Fields the app expects:
- `id`
- `user_id`
- `answers`
- `recommended_program`

Behavior:
- On quiz completion, the app deletes the existing row for the user, then inserts a new one.
- The app stores `recommended_program`, but the rest of the UI mainly derives the live profile from raw `answers`.

### `exercises`

Used in [`services/exercises.ts`](/c:/Users/Rami/Desktop/Business/Xpand/Kegel/Projects/KegelTN/src/services/exercises.ts).

Fields the app expects:
- `id`
- `name`
- `category`
- `difficulty`
- `phase1_label`
- `phase2_label`
- `phase1_seconds`
- `phase2_seconds`
- `reps`
- `sets`
- `rest_seconds`
- `description`
- `featured`
- `sort_order`

The app fetches only the exercise names listed in [`config/exercises.ts`](/c:/Users/Rami/Desktop/Business/Xpand/Kegel/Projects/KegelTN/src/config/exercises.ts).

### `exercise_completions`

Used to drive progression in the library and journey views.

Behavior:
- Read completions by `user_id`
- Mark completion with an upsert on `user_id,exercise_id`
- Reset progression from Journey deletes all rows for the user

### `workouts`

Used by Home, Journey, and workout completion.

Behavior:
- App inserts one row when a timer completes
- `program` is currently set to the selected exercise ID
- `duration_seconds` is stored
- Home and Journey use `completed_at` to calculate streaks and activity

## Exercise System

### Active categories

- `rigidity`
- `stamina`
- `endurance`

Display labels and colors are still mapped in [`services/exercises.ts`](/c:/Users/Rami/Desktop/Business/Xpand/Kegel/Projects/KegelTN/src/services/exercises.ts).

### Active exercises

The app still shows 9 active exercises, one per difficulty per category:

- Rigidity: Pelvic Tilt, Heel Glute Bridge, Rear Decline Bridge
- Stamina: Child Pose, Lying Butterfly, 90 to 90 Advanced
- Endurance: Kneeling Ab Draw In, Glute March, Squat Side Bends

This is configured in [`config/exercises.ts`](/c:/Users/Rami/Desktop/Business/Xpand/Kegel/Projects/KegelTN/src/config/exercises.ts).

### Progression behavior

The current progression system is soft:

- Exercises are sorted inside each category as beginner -> intermediate -> advanced
- The first uncompleted exercise is marked `isCurrentLevel`
- Completed exercises are dimmed and show a checkmark
- All exercise cards remain tappable

### Exercise content and translations

The translation-key pattern is still in use:

- Exercise text is looked up via `exerciseToKey()`
- Example: `"Pelvic Tilt"` -> `exercises.pelvic_tilt.*`
- If a translation key is missing, the app falls back to the DB value

This logic is used across Library, Intro, Timer, and Journey.

### Media status

The old handoff is outdated here.

Current reality:
- [`config/media.ts`](/c:/Users/Rami/Desktop/Business/Xpand/Kegel/Projects/KegelTN/src/config/media.ts) maps all 9 active exercises to GIFs
- GIF files live in `src/assets/gifs/`
- The Intro screen will usually show real media, not placeholders
- The Timer screen also shows the exercise media as an expandable mini-player

The "video coming soon" placeholder still exists in the UI, but only appears if a selected exercise has no media mapping.

## Quiz System

The app still has 6 questions in [`QuizScreen.tsx`](/c:/Users/Rami/Desktop/Business/Xpand/Kegel/Projects/KegelTN/src/screens/QuizScreen.tsx):

1. Age
2. Main goal
3. Current level
4. Previous pelvic-floor exercise experience
5. Training commitment
6. Motivation

The quiz uses:
- animated slide transitions
- a progress bar
- per-question Lucide icons
- a language toggle in the header

## Important Drift: Quiz Logic Is Not Fully Aligned

This is the biggest code-vs-handoff mismatch right now.

### What the quiz result screen uses

`QuizScreen.deriveProgram()` currently calculates the shown/stored program like this:

- difficulty from Q3 + Q4
- age cap: `46+` cannot start at advanced
- goal is not part of the returned program string

### What the rest of the app uses

`deriveUserProfile()` in [`services/exercises.ts`](/c:/Users/Rami/Desktop/Business/Xpand/Kegel/Projects/KegelTN/src/services/exercises.ts) currently does this:

- goal categories from Q2
- difficulty from `answers[3] + answers[4] + answers[5] + answers[6]`

That means the live profile currently:

- ignores Q3 (`current level`)
- includes Q4, Q5, and Q6
- also references `answers[6]`, which does not exist in a 6-question quiz indexed `0..5`

Practical effect:
- the recommendation shown after the quiz and the profile used by Home/Library/Journey can diverge
- the old handoff's recommendation description is no longer accurate

This should be treated as a known logic drift until the quiz/profile calculation is unified.

## Screen-by-Screen Snapshot

### Login

[`LoginScreen.tsx`](/c:/Users/Rami/Desktop/Business/Xpand/Kegel/Projects/KegelTN/src/screens/LoginScreen.tsx)

- logo + app name + tagline
- access key field
- EN/AR toggle
- invalid-key error handling
- login button spinner

### Quiz

[`QuizScreen.tsx`](/c:/Users/Rami/Desktop/Business/Xpand/Kegel/Projects/KegelTN/src/screens/QuizScreen.tsx)

- 6-step onboarding flow
- animated icons
- result card with recommended program
- "Start My Program" CTA

### Home

[`HomeScreen.tsx`](/c:/Users/Rami/Desktop/Business/Xpand/Kegel/Projects/KegelTN/src/screens/HomeScreen.tsx)

- time-based greeting
- streak counter
- large circular CTA button
- today's completion state
- "My Journey" card
- logout button
- language toggle

Still not wired:
- the "How to do Kegel exercises" button is present but has no navigation handler

### Exercise Library

[`ExerciseLibraryScreen.tsx`](/c:/Users/Rami/Desktop/Business/Xpand/Kegel/Projects/KegelTN/src/screens/ExerciseLibraryScreen.tsx)

- 3 collapsible category sections
- recommended badge on goal-matching categories
- completion counter per category
- translated exercise name/description/phase labels
- soft progression with "Up next"

### Exercise Intro

[`ExerciseIntroScreen.tsx`](/c:/Users/Rami/Desktop/Business/Xpand/Kegel/Projects/KegelTN/src/screens/ExerciseIntroScreen.tsx)

- media panel
- translated exercise name and description
- difficulty badge
- phase-label preview
- sets x reps summary
- "I'm Ready" button

### Timer

[`TimerScreen.tsx`](/c:/Users/Rami/Desktop/Business/Xpand/Kegel/Projects/KegelTN/src/screens/TimerScreen.tsx)

- idle -> running -> paused -> completed states
- circular countdown ring
- custom phase labels
- set and rep counters
- quit confirmation modal
- completion screen with duration / reps / sets
- workout save on completion
- exercise completion marking on completion

Current behavior detail:
- If media exists, the bottom area shows the real exercise media with tap-to-expand
- If media does not exist, the bottom area shows a "How to do it?" link back to the intro screen

### Journey

[`JourneyScreen.tsx`](/c:/Users/Rami/Desktop/Business/Xpand/Kegel/Projects/KegelTN/src/screens/JourneyScreen.tsx)

- placeholder profile card
- focus summary
- difficulty summary
- motivational copy
- stats cards
- month activity calendar
- per-category progression bars and checklist
- logout button

Newer behavior not captured in the old handoff:
- "Retake Quiz" action is available
- "Reset Progression" action is available and clears `exercise_completions`

Important detail:
- The motivational message is currently based on derived difficulty, not directly on quiz answer 6

## Internationalization / RTL

The app is bilingual and still ships with English and Arabic locale files:

- [`en.json`](/c:/Users/Rami/Desktop/Business/Xpand/Kegel/Projects/KegelTN/src/locales/en.json)
- [`ar.json`](/c:/Users/Rami/Desktop/Business/Xpand/Kegel/Projects/KegelTN/src/locales/ar.json)

Current state:
- text content is localized across the shipped screens
- several screens set `dir={isArabic ? 'rtl' : 'ltr'}`
- full mirrored RTL layout is still not consistently implemented

## PWA Status

The old handoff said PWA support was not configured. That is now outdated.

Current PWA setup:
- [`public/manifest.json`](/c:/Users/Rami/Desktop/Business/Xpand/Kegel/Projects/KegelTN/public/manifest.json) exists
- [`vite.config.ts`](/c:/Users/Rami/Desktop/Business/Xpand/Kegel/Projects/KegelTN/vite.config.ts) uses `vite-plugin-pwa`
- `registerType: 'autoUpdate'`
- app icons `icon-192.png` and `icon-512.png` exist
- Workbox runtime caching is configured for Supabase URLs

This repo should be treated as PWA-enabled, not "not yet configured."

## File Structure Snapshot

```txt
public/
  manifest.json
  icon-192.png
  icon-512.png

src/
  assets/
    gifs/
    images/
  components/
    ui/
      button.tsx
  config/
    exercises.ts
    media.ts
  lib/
    supabase.ts
    utils.ts
  locales/
    en.json
    ar.json
  screens/
    LoginScreen.tsx
    QuizScreen.tsx
    HomeScreen.tsx
    ExerciseLibraryScreen.tsx
    ExerciseIntroScreen.tsx
    TimerScreen.tsx
    JourneyScreen.tsx
    WorkoutScreen.tsx
  services/
    auth.ts
    exercises.ts
    i18n.ts
  App.tsx
  App.css
  index.css
  main.tsx
  vite-env.d.ts
```

## Dormant / Unused Pieces

These exist in the repo but are not part of the active shipped flow:

- [`WorkoutScreen.tsx`](/c:/Users/Rami/Desktop/Business/Xpand/Kegel/Projects/KegelTN/src/screens/WorkoutScreen.tsx) is currently unused
- `workout` translation keys remain even though the screen is unused
- `react-router-dom` is installed but unused
- [`App.css`](/c:/Users/Rami/Desktop/Business/Xpand/Kegel/Projects/KegelTN/src/App.css) looks like leftover Vite starter CSS
- `deleteQuizResults()` exists in [`services/exercises.ts`](/c:/Users/Rami/Desktop/Business/Xpand/Kegel/Projects/KegelTN/src/services/exercises.ts) but is not currently used
- the shadcn `Button` component exists but is not used by the current screens

## Repo Health Check

TypeScript-only check:
- `npx tsc --noEmit` passes

Build status:
- `npm run build` currently fails

Current build errors are unused symbols under strict TS settings:
- [`ExerciseIntroScreen.tsx`](/c:/Users/Rami/Desktop/Business/Xpand/Kegel/Projects/KegelTN/src/screens/ExerciseIntroScreen.tsx)
- [`ExerciseLibraryScreen.tsx`](/c:/Users/Rami/Desktop/Business/Xpand/Kegel/Projects/KegelTN/src/screens/ExerciseLibraryScreen.tsx)
- [`JourneyScreen.tsx`](/c:/Users/Rami/Desktop/Business/Xpand/Kegel/Projects/KegelTN/src/screens/JourneyScreen.tsx)
- [`TimerScreen.tsx`](/c:/Users/Rami/Desktop/Business/Xpand/Kegel/Projects/KegelTN/src/screens/TimerScreen.tsx)

This is not a product-behavior issue, but it is part of the current repo state.

## Open Gaps / Still Not Built

Still absent or incomplete in the current code:

- editable profile fields in Journey
- a wired "How to do Kegel exercises" screen from Home
- full RTL layout parity
- custom workout builder
- richer analytics / charts
- settings screen
- admin UI for account creation

## Recommended Next Cleanup Priorities

If a future session picks this up, the highest-value cleanup items are:

1. Unify quiz recommendation logic and `deriveUserProfile()`
2. Decide whether `WorkoutScreen.tsx` is dead code or part of a future plan
3. Fix the small unused-symbol build errors so `npm run build` is green again
4. Either wire the Home how-to CTA or remove it

