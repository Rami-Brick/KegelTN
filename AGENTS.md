# AGENTS.md — KegelTN Arabic Typography Fix

## Context
KegelTN is a React + TypeScript PWA (Vite, Tailwind CSS v4, Framer Motion, i18next). It supports English and Arabic. The English font is `Geist Variable` via `@fontsource-variable/geist`. Arabic currently has no dedicated font and falls back to a generic system sans-serif, which looks bad.

## Task Scope
Add `Cairo Variable` as the Arabic-only font. Do not change layout, RTL mirroring, or any screen logic.

## Constraints
- **Additive only** — you are adding a font and CSS rules, not refactoring
- **Do not touch** screen components, config files, services, locale JSON files, or Tailwind/Vite config unless absolutely necessary
- **Do not break** the English rendering — Geist must remain untouched for LTR
- **Do not convert** any `ml-*/mr-*/pl-*/pr-*` to logical properties — layout is already handled
- The app uses a string state machine in `App.tsx` for navigation, not React Router
- The `dir` attribute is set per-screen or at a wrapper level when Arabic is active — find where it's set and make sure the CSS selector `[dir='rtl']` will match it
- If `dir` is only set on inner wrappers (not `<html>` or `<body>`), adjust the CSS selector accordingly so it targets the right elements

## Font Details
- Package: `@fontsource-variable/cairo`
- CSS font-family name: `'Cairo Variable'`
- Supports: weights 200-900, arabic + latin subsets
- License: SIL Open Font License (free, commercial OK)

## Arabic Typography Rules
1. Arabic letters must stay connected — always set `letter-spacing: 0` in RTL
2. Arabic glyphs render smaller than Latin at the same font-size — apply a subtle size bump (~105%) in RTL
3. Avoid `rgba()` or `opacity`-based text colors in RTL contexts — they cause visible artifacts between connected Arabic glyphs (known browser bug). Don't do a mass rewrite, just be aware.

## Success Criteria
- `npm run dev` works without errors
- English mode: Geist font, looks identical to before
- Arabic mode: Cairo font, text is clear, readable, properly connected, and visually proportional to the English version
