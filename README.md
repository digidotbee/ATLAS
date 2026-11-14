# ATLAS — family travel planner

A personal, reusable vacation planner. Start with **where**, **total budget**, **who's coming** and **flexible dates**;
ATLAS then helps you shape the trip, compare date windows, collect and choose options, build a day-by-day itinerary,
and print a one-page plan — with the budget updating as you go.

Live: https://digidotbee.github.io/atlas/

## How it works
- **Shape it** – follow-up questions (pace, bases, lodging style, must-dos…).
- **Dates** – each date window with an airfare estimate; ATLAS recalculates the whole trip for every window and marks the best value.
- **Explore** – add options by hand or use the **Research helper**: it writes a brief from your trip + family profile to paste into
  Claude (or any assistant), and imports the JSON reply straight into your shortlist. Choose, set aside, mark prices
  *estimated* or *verified*. Only chosen items count.
- **Itinerary** – place experiences on days, set check-in days for multiple bases, add day notes. Gaps/double bookings are flagged.
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
npm run dev      # http://localhost:5173/atlas/
npm test
npm run build
```
Pushing to `main` runs tests and deploys to GitHub Pages (`.github/workflows/deploy.yml`).

Code map: `src/domain` (types, budget math, itinerary, research brief/import, validation — all unit-tested),
`src/storage` (browser + Gist), `src/state/store.tsx`, `src/ui`.

## Roadmap
- Optional AI research through a small secure backend (API key server-side, per-day request caps, cached results reused across trips).
- Destination knowledge base reused across trips; trip history and learned preferences.
