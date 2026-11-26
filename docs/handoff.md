# ORIVOIR handoff

**Last updated:** November 26, 2026, with the D5 decision (PRD v0.27). `main` was at `c2c66c1`, after #52, when this was written.

This page lets any agent or developer pick up the build where the last session stopped. It's public, like the rest of the repo, so it holds no secrets, contact details, costs or business matters. For those, ask Dot, the founder. **Update this file in the same PR whenever status changes** (see the last section).

## Start here

Read these in order before changing anything:

1. [`AGENTS.md`](../AGENTS.md): the repo's rules for agents.
2. This file: where things stand and what's next.
3. [`docs/prd.md`](prd.md): the living PRD (v0.27), canonical for product behavior.
4. [`docs/user-stories.md`](user-stories.md): acceptance criteria by stable ID (46 MVP stories, plus PAID-01–03 after MVP).
5. [`docs/implementation-plan.md`](implementation-plan.md): milestones M0–M9, story traceability, decisions D1–D20 with the *Decisions made* log, the Supabase data and access model (section 5), and the definition of done (section 7).
6. The guides: [`venture-launch.md`](venture-launch.md) (wizard and roles), [`crew-invitations.md`](crew-invitations.md) (invitations, joining, Date Lock-In, data contract), [`design-system.md`](design-system.md) (WILDSTROM).

**When sources disagree:**
- The PRD outranks the plan.
- The repo outranks any instructions from outside it.
- Point out the conflict to Dot instead of choosing for her.

## What ORIVOIR is

A calm, collaborative web app where a group plans a shared **Venture** of any size, from a three-hour dinner to a multi-week trip. A Planner launches it, the Crew answers before an **Opt in by** deadline or RSVPs to fixed dates, and the group plans the schedule, budget and map together. Dot decides; agents recommend.

## Where things stand

- **Live today:** https://digidotbee.github.io/ATLAS/ on GitHub Pages, with hash routes. The app is browser-only.
  - Ventures save to `localStorage` (`atlas:data:v1`), with optional private GitHub Gist sync and a JSON backup.
  - The Supabase schema is in the repo, but no hosted Supabase project exists yet.
- **M0, done:** LAUNCH-01 and BUDGET-01.
- **Built in the browser so far:**
  - the four-step wizard
  - the Venture time zone (D10, #43, #47, #48)
  - single evenings that run past midnight (#49)
- **D5 decided (PRD v0.27):** the Crew answers on calendars of the Planner's proposed dates, with a red X on days that aren't proposed. They can tap single days, a range, or **Available every day** and then the days they can't make. The calendar answer (CREW-06) moved from M4 to M2; M4 ranks stretches of the Planner's length. Plan D5, M2 and M4 have the details.
- **M1, Foundation, in progress.** Goal: a signed-in Planner can launch and reopen Ventures from the cloud on any device, on the new domain. It's split into four pull requests:
  1. **Merged (#51):** `supabase/` with the `ventures` and `candidate_windows` migration, row-level security, 36 database checks, and a CI `database` job.
  2. **Next:** email-code sign-in and Ventures saved to and loaded from Supabase.
  3. The browser import offer (D9), and Gist sync made export-only.
  4. The Cloudflare host (D1), with path routes and redirects from the old hash links.
- **Open pull requests:** none when this was written. Check before branching: `git fetch origin && git ls-remote origin 'refs/pull/*/head'`.
- **Test baseline on `main`:** 118 unit tests in 15 files, 8 Playwright flows, 36 database checks.

## Next task: M1 part 2, sign-in and Ventures in the cloud

From the plan's M1 section. Read it and plan sections 5.3–5.5 first.

- **Client:**
  - Add `@supabase/supabase-js`.
  - The browser gets only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, the public anon key. Nothing else reaches the client.
- **Sign-in:**
  - An email one-time code at launch. There are no recipients yet; that's M2–M3.
  - The draft Venture must survive sign-in: save it before asking for the code, and restore it after.
  - Supabase sends a magic link unless the email template uses the code. Configure the template to send `{{ .Token }}`, and check Supabase's docs for the current method.
  - Codes are 6 digits (`supabase/config.toml`).
- **Saving and loading:**
  - Map each browser Venture to a `public.ventures` row: title, destination, region, `time_zone`, schedule, budget entry, basis, currency and cushion, and the planning headcount.
  - The rest of the planning tabs' data goes into `planning_data`, a Planner-only JSON object that M5 replaces with plans, decisions and options.
  - Read the group target through the `group_budget` computed column. It matches BUDGET-01's `withBudgetTotal`.
  - A new Venture is a draft until launch, when `launched_at` is set once (#50).
- **What keeps working:**
  - The existing planning tabs run on cloud data.
  - Ventures that haven't been imported stay local until part 3.
- **Where it plugs in:** `src/state/store.tsx` (`StoreProvider`, `useStore`), `src/storage/local.ts`, `src/storage/gist.ts`.
- **Verify** (plan M1):
  - New browser flows for sign-in with the draft restored, and for launching then reopening a Venture in another browser session.
  - Every existing test still passes.
  - In CI, sign-in flows need a local Supabase with auth. `supabase start` runs Mailpit at port 54324, which captures the code emails.
- **Hosted projects:** deploying migrations to hosted projects needs Dot's Supabase projects (below). Building and testing doesn't.

## Waiting on Dot

These happen outside the repo. Agents never ask for keys in chat: Dot enters secrets in GitHub, Supabase or Cloudflare herself.

1. **Move `orivoir.com`'s nameservers to Cloudflare**, after checking that DNSSEC is off at the current registrar. Resend's DNS records and M1 part 4 depend on this.
2. **Create two free Supabase projects**, `orivoir-dev` and `orivoir-staging`. When part 2 needs them, the agent names the GitHub Actions secrets and variables to add.
3. **Set up Resend after the DNS move (D3):**
   - a sending domain (suggested: `mail.orivoir.com`)
   - its DNS records in Cloudflare
   - its SMTP details entered in Supabase's auth settings
4. **The registered business for D4 and D14**, which is in progress. Texting registration and the privacy policy and terms wait on it.

## Open decisions

Plan section 4 has each recommendation. Record Dot's choice in the *Decisions made* log, and update the PRD, stories and guides in the same PR.

| Decision | Blocks |
| --- | --- |
| D6 · attendance after lock and guest visibility | M4 |
| D7 · changing a locked date | M4 |
| D13 · Gemini pilot scope and key storage | M9 |
| D14 · privacy policy and terms (waits on the registered business) | M3 and the R1 pilot |
| D15 · pilot measurement | the R1 pilot |
| D16 · order after R1 | M5 onward |
| D17–D20 · paid links | after MVP |

**Open product question:** should ORIVOIR collect children's ages for planning and headcount? No story asks for them, and the app deletes saved ages on load (#37). Collecting them would need a PRD decision, a story and a code change.

## Rules that never bend

`AGENTS.md`, the PRD and the plan are the sources; this is a summary.

- **Approval:**
  - Show Dot the exact change and get explicit approval before any push, merge, branch deletion, message, purchase or other change outside your workspace.
  - "Push" or "open the PR" approves pushing that branch and opening the PR. Only "merge" approves a merge.
  - Praise isn't approval, and agreeing with a recommendation is a decision, not permission to push.
- **Docs move with decisions:**
  - A changed decision updates the PRD (with a dated revision-history row), the affected stories, the guides, the plan's traceability and the *Decisions made* log, all in the same PR.
  - A UI change updates `src/theme.css` and `docs/design-system.md` together and adds a design-system change-log line.
- **Small PRs:** each one cites its story IDs, leaves `main` deployable, and passes CI before it merges.
- **Vocabulary:**
  - Say **Venture**, never "trip" or "event", in UI copy and new code.
  - Legacy names stay: `TripView.tsx`, `NewTrip.tsx`, the `atlas:` storage keys and the package name. Renaming the storage keys would strand saved Ventures.
  - There are four MVP roles: **Planner**, **Collaborator**, **Attendee** and **Viewer**.
  - Use the PRD's bold UI strings word for word.
- **Style:** hand-written WILDSTROM CSS (`src/theme.css`, `src/styles.css`), with Storm (dark, the default) and Daylight themes and a gold accent in Storm. No Tailwind or other CSS framework, and no accent changes without Dot.
- **Maps (M5):** MapLibre GL JS with OpenFreeMap tiles, loaded only on **Show map** or **Drop a pin**. No Mapbox.
- **AI:** none in scheduling, budgeting or state. The only AI feature in MVP is the optional Gemini dinner-ideas pilot (M9).
- **No invented live data:** an estimate is always labeled as one.
- **Secrets:** never in the repo, the client bundle or chat. The client gets only the Supabase URL and the anon key.
- **Privacy:**
  - No children's details are collected (see the open question above).
  - Minors' details, home addresses and their coordinates are redacted for Viewers and kept out of AI context.
  - Planner address-book data never reaches the shared roster, Viewers, analytics or AI.
  - Tokens are stored as digests.
  - Pilot events carry IDs and timestamps only.
- **Access:**
  - Row-level security on every table.
  - Attendees act only through token-checked database functions.
  - Viewers read only a redacted projection, tested at the database.
- **Accessibility:** text contrast of at least 4.5:1, a label on every input, and every animation inside `prefers-reduced-motion: no-preference`.

## Verify before you claim

The definition of done is plan section 7. Every bullet of a closed story needs a test whose name starts with the story ID. Report what you ran and what it showed.

```sh
npm ci
npm test                     # unit tests (Vitest)
npm run typecheck
npm run build
npm run test:e2e             # Playwright; serves dist/, so build first
npm run test:db              # database checks against a local Supabase (npx supabase db start)
npm run test:db:local        # the same checks on a throwaway Postgres, no Docker
TZ=America/Los_Angeles npm test && TZ=Asia/Tokyo npm test   # for anything time-related
```

- **UI changes:** screenshot both themes at desktop and phone widths.
- **CI:** runs unit tests, the build and e2e in the `build` job, and the database checks in the `database` job. A push to `main` deploys only after both pass.

## Environment notes

- **Check `origin/main` before branching and before pushing.** Other sessions merge too. After merging PRs that touch the same lines, diff what each one added against `main` to catch dropped text.
- **If `gh pr create` fails** because GraphQL is blocked, use the REST API: `gh api repos/digidotbee/atlas/pulls --method POST --input body.json`, and PATCH to edit.
- **Some sandboxes can't delete remote branches.** Leave merged branches for Dot.
- **The Supabase CLI is pinned at 2.122.1**, in CI and locally (`npx supabase@2.122.1`).
- **No Docker?** `npm run test:db:local` starts a throwaway Postgres. It runs as the `postgres` user if you're root, and finds the binaries through `pg_config` or `/usr/lib/postgresql/*/bin`.
- **If your sandbox can't reach the Supabase, Resend or Cloudflare APIs,** make hosted changes through a GitHub Actions workflow using secrets Dot enters, or ask her to make them in the dashboard.
- **Playwright pins a Chromium build.** If yours differs, keep an untracked `playwright.local.config.ts` that spreads `./playwright.config` and sets `use.launchOptions.executablePath`, and list it in `.git/info/exclude`.
- **Some sandboxes block Google Fonts,** so screenshots there use fallback fonts.

## Known issues and trade-offs

- **#49 trade-off:** 9 PM to 6 PM on a single evening saves as a 21-hour Venture ending the next day. The "Ends … the next day." line under the times is the only safeguard. A cutoff would need a PRD decision.
- **Reduced motion:** `.budget-pill` and the sync pulse respect it. Bring the remaining transitions in line in M2.
- **Unbuilt pieces:** `.icon-tile` is specified but not built, and the `Icon` component isn't used yet.
- **Wording:** "Family profile" and the side panel's "travelers" conflict with the scale-agnostic principle. They go away with Shape it in M5 (D8).
- **Geoapify:** its formal terms weren't read. Confirm them before M5 builds the geocoding fallback.
- **Paid links on activities:** these would need an activity decision kind; the data model has only `general` and `stay`.
- **Claude-drafted copy:** the early-lock departure message (**This Venture has departed.**) and **Don't invite me from this person again** are Claude's wording, merged without changes. Dot may revise them.

## Keeping this file current

- **Update it in the same PR whenever status changes:** what merged, what's next, what's waiting on Dot, which decisions are open, and the test baseline. Change the *Last updated* line.
- **Keep it public-safe:** no secrets, tokens, contact details, costs, revenue figures, or business and naming discussions.
- **Keep it short:** link to the plan and the PRD instead of copying them.
- **Before your context runs out:** when it's about 80% full, or as soon as you've had to summarize earlier work, update this file, and the PRD for any decision made, with what the next agent needs: changes, decisions and where you stopped. Pushing still needs Dot's approval.
