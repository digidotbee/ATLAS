# ORIVOIR

Start a Venture with a destination, spot, or vibe. Compare options, plan the itinerary, track costs, and print a one-page plan.

The [living PRD](docs/prd.md) records the product decisions. The [user stories](docs/user-stories.md) define the acceptance criteria. The [implementation plan](docs/implementation-plan.md) sets the build order.

For the agreed creation wizard and the four MVP roles, see [Venture launch](docs/venture-launch.md). Personal invitations, joining and Date Lock-In are specified in [Crew invitations](docs/crew-invitations.md) and are not built yet. UI tokens and components are in [the WILDSTROM design system](docs/design-system.md).

Live: https://digidotbee.github.io/ATLAS/

The approved [planning flow](docs/prd.md#planning-together) covers drafting before date lock, comparing complete plans, child Ventures and inviting Past Crew. The features below describe the current app.

## How it works
- **Shape it** – follow-up questions (pace, bases, lodging style, must-dos…).
- **When & how long** – for a Venture with flexible dates, ORIVOIR costs every possible window inside your availability and marks the best value.
- **Explore** – add options by hand or use the **Research helper**: it writes a brief from your Venture + family profile to paste into
  Claude (or any assistant), and imports the JSON reply straight into your shortlist. Choose, set aside, mark prices
  *estimated* or *verified*. Only chosen items count.
- **Itinerary** – place experiences on days, set check-in days for multiple bases, add day notes. Gaps, double bookings and base mismatches are flagged.
- **Budget** – the pill under the Venture title shows the target as you entered it (*$150 per person* or *$600 total*), or **+Set budget**. It opens the Budget view, where you set the target, currency and cushion. A per-person target stays put while the group target follows the headcount.
- **One-sheet** – printable single page (Print → Save as PDF).
- **Family profile** – your interests feed every research brief and highlight options that fit.

## Saving
- Always saved in the browser.
- **Sync** (Settings): a private GitHub Gist holds all data as `atlas-data.json`. Create a fine-grained token with only
  *Gists: Read and write*. The token stays on the device. Edits on two devices at once ask you which version to keep.
- **Backup file**: download/restore everything as JSON.

## Development
```
npm install
npm run dev      # http://localhost:5173/
npm test
npm run build
```
The Planner browser test runs against the production build. Install Chromium once before the first run.

```sh
npx playwright install --with-deps --only-shell chromium
npm run build
npm run test:e2e
```

The database (M1) lives in `supabase/`: migrations in `supabase/migrations/`, tests in `supabase/tests/sql/`. Each test file runs in one transaction, rolls back, and prints `ok - <name>` per check.

```sh
npx supabase db start   # local Supabase, needs Docker
npm run test:db
npm run test:db:local   # or: a throwaway plain Postgres, no Docker
```

Pull requests to `main` run the unit tests, production build, browser test and database tests. A push to `main` deploys the tested build to GitHub Pages after all checks pass.

Code map: `src/domain` (types, budget math, itinerary, research brief/import, validation — all unit-tested),
`src/storage` (browser + Gist), `src/state/store.tsx`, `src/ui`.

## Roadmap
- Optional AI research through a small secure backend (API key server-side, per-day request caps, cached results reused across Ventures).
- Destination knowledge base reused across Ventures; Venture history and learned preferences.
