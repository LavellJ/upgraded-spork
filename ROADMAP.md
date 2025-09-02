# Quest Island — Roadmap

_Last updated: September 1, 2025_

## Vision
A calm, loop-based learning adventure. Four biomes (Literacy, Math, Science, HASS). Each loop adds slightly harder lessons. Progress and collectibles live in Scout's backpack. Vibe: relaxed, not arcade.

## Current State (MVP complete)
- Full-screen map with 4 biomes; dynamic time-of-day background
- Bottom sheets: Backpack, Lesson Sheet, Lesson Detail, Activity Player
- Backpack (awards, equip limit, persistence)
- Prototype-only mode (Teacher toggle)
- Import/Export progress via `?qi=` token; Resume last lesson
- Loop progression; seeded Loop 1 + Loop 2 prototypes + registry metadata
- Calm visual pass (island backdrop, gentle micro-motion — gated by Calm Mode)
- Accessibility mini-pass (v1): focus/keyboard, dialog roles, polite toasts
- Light analytics: local buffer, CSV export; Vitest unit tests

## Now
- ROADMAP.md (this file)

## Next
- Visual refinement (ongoing, calm-first) — minor spacing, focus polish, tablet tweaks

## Later (Backlog)
- Real activity URLs + regional standards mapping
- Accessibility pass (v2) — focus order, ARIA names, contrast tuning
- Persistence backend + auth (sync across devices)
- Asset pipeline — final art & audio; responsive refinement
- Offline robustness (if still desired)
- Multi-learner profiles & classroom roster
- Standards selector UI (region/grade); surface mapped standards in Lesson Detail
- External activity launcher + fallback (open real URLs; graceful prototype fallback)
- Content authoring toolkit — lesson JSON schema + preview/validate + safe import
- E2E tests (Playwright) — map → sheet → start → complete → resume
- Analytics endpoint (opt-in) — POST to Express; privacy note in Teacher Panel
- Localization / i18n — strings file, RTL support, locale formats

## Technical Notes
- Stack: React + Vite + TypeScript, Tailwind, Vitest
- State: localStorage for MVP; import/export token for snapshots
- Accessibility: keyboardable biomes/pins, `role="dialog" aria-modal`, focus trap, `aria-live="polite"`
- Performance: keep effects cheap; animations reduced/disabled in Calm Mode

## Milestones
- **M0 (MVP):** Core loop + prototype activities ✅
- **M1:** Content authoring toolkit + real links
- **M2:** Classroom features + sync
- **M3:** Final art/audio + polish + E2E

## Contributing
- Use feature branches; small PRs.
- Add/update unit tests where practical (analytics, helpers).
- Keep the calm aesthetic: subtle motion, accessible focus states, readable contrast.