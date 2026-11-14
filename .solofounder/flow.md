# Flow: ATLAS v1 — family travel planner on GitHub Pages

## Context
- Domain: software (greenfield, personal tool)
- Decisions (user, 2026-11-14): new repo digidotbee/atlas on GitHub Pages; React + Vite with GitHub Actions deploy;
  persistence = browser cache + private GitHub Gist sync (user-supplied token); start completely blank; no paid AI.
- Verified stack (npm registry, 2026-11-14): vite 8.3.8, react 19.3.1, @vitejs/plugin-react 6.3.0, vitest 5.1.0, typescript 7.0.2, Node 22.

## Stages

### Stage 1: Product model & UX skeleton
- Goal: Define data model (Trip, Travelers, Budget, Date options, Candidates by category, Selections, Day plan) and screen flow.
- Artifacts: `src/domain/*.ts` types + budget engine; `.solofounder/stages/model.md`
- Checklist: budget math covers per-person/total, estimated vs verified, remaining & contingency; user-preference profile persisted.

### Stage 2: Implement (TDD on domain logic)
- Goal: Trips list → trip setup (destination, budget, travelers, flexible dates) → follow-up questions → Explore & compare candidates (accept/reject/select) → Itinerary builder → Budget panel → Print one-sheet.
- Capabilities: tdd-methodology, verification
- Checklist: unit tests for budget + storage + gist sync; build passes; Playwright end-to-end run creates a trip, selects, prints.

### Stage 3: Gist sync
- Goal: Private Gist load/save with explicit errors (bad token, network, conflict) — no silent failures.
- Checklist: sync status always visible; conflict detection by updated_at; tests with mocked fetch.

### Stage 4: Deploy
- Goal: Create digidotbee/atlas, GitHub Actions Pages workflow, live URL verified.
- Checklist: workflow green; live page loads.

### Stage 5: Learn
- Retrospective → `.solofounder/retrospective.md`
