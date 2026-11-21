# ORIVOIR

Start a Venture with a destination, spot, or vibe. Compare options, plan the itinerary, track costs, and print a one-page plan.

For the agreed creation wizard and the four MVP roles, see [Venture launch](docs/venture-launch.md). Personal invitations, joining and Date Lock-In are specified in [Crew invitations](docs/crew-invitations.md) and are not built yet. UI tokens and components are in [the WILDSTROM design system](docs/design-system.md).

Live: https://digidotbee.github.io/ATLAS/

## How it works
- **Shape it** – follow-up questions (pace, bases, lodging style, must-dos…).
- **When & how long** – for a Venture with flexible dates, ORIVOIR costs every possible window inside your availability and marks the best value.
- **Explore** – add options by hand or use the **Research helper**: it writes a brief from your Venture + family profile to paste into
  Claude (or any assistant), and imports the JSON reply straight into your shortlist. Choose, set aside, mark prices
  *estimated* or *verified*. Only chosen items count.
- **Itinerary** – place experiences on days, set check-in days for multiple bases, add day notes. Gaps, double bookings and base mismatches are flagged.
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

Pull requests to `main` run the unit tests, production build, and browser test. A push to `main` deploys the tested build to GitHub Pages after all checks pass.

Code map: `src/domain` (types, budget math, itinerary, research brief/import, validation — all unit-tested),
`src/storage` (browser + Gist), `src/state/store.tsx`, `src/ui`.

## Roadmap
- Optional AI research through a small secure backend (API key server-side, per-day request caps, cached results reused across Ventures).
- Destination knowledge base reused across Ventures; Venture history and learned preferences.
