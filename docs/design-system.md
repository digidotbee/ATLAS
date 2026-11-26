# WILDSTROM Design System
### Source of Truth — ORIVOIR Adventure Planner

> **How this document and the code relate.** `src/theme.css` holds the exact token values and component rules. This document describes them and explains how to use them. Every UI change updates both in the same pull request and adds a line to the change log (§13). Sizes, colors and contrast below were measured from the running app on November 21, 2026.

---

## Plan Board hierarchy

Lead with Venture title and time commitment. Place the date or proposed dates beneath the duration. Use a single primary action for the current person and decision. Present comparable proposals together and place plan-specific durations on their cards. Reserve travel details for plans that use them. [Planning together](user-stories.md#planning-together).

## 1. Brand Identity

**Product name:** ORIVOIR
**Brand mark:** "ORI**V**OIR", with the V in the accent color
**Tagline:** ADVENTURE PLANNER
**Design system name:** WILDSTROM

ORIVOIR is a collaborative planning app for shared Ventures of any scale, from an evening out to a trip abroad. The visual language is editorial, nature-informed and calm. It avoids corporate dashboard aesthetics in favor of a magazine-meets-field-journal quality.

---

## 2. Themes

WILDSTROM ships two switchable themes that share token names. Storm (dark) is the default. Daylight (light) applies when the person picks it in Settings, or when Settings is on Auto and the device prefers light.

| Token            | Storm                     | Daylight                  | Use |
|------------------|---------------------------|---------------------------|-----|
| `--surface-100`  | `#1d222f`                 | `#f5f4ec`                 | Page background |
| `--surface-200`  | `#252c3d`                 | `#e9e8db`                 | Cards and raised surfaces (lighter than the page in Storm) |
| `--ink`          | `#f7faee`                 | `#262b33`                 | Primary text |
| `--ink-soft`     | `rgba(247,250,238,.75)`   | `#474d57`                 | Secondary text: card dates, hero subtitle |
| `--ink-muted`    | `--ink-soft` at 68%       | `--ink-soft` at 80%       | Labels, hints, eyebrows |
| `--accent`       | `#dfb84b` (gold)          | `#6b6418` (olive)         | Text-safe accent: links, nav, the V in the wordmark |
| `--accent-vivid` | `#dfb84b`                 | `#bad32f`                 | **Graphic accent only:** borders, fills, checkboxes, indicators |
| `--sunlit`       | `#dfb84b`                 | inherits Storm            | Highlights, Booked chip |
| `--flare`        | `#f0d882`                 | inherits Storm            | Etched-text highlight |
| `--thicket`      | `#387476`                 | inherits Storm            | Verified prices in budget bars |
| `--thistle`      | `#bcb4d1`                 | inherits Storm            | Good-fit tags, cushion in budget bars |
| `--estimate`     | `#e8b84a`                 | `#8a5f10`                 | Estimated prices |
| `--danger`       | `#ff6b5e`                 | `#b33a2e`                 | Errors, over budget |
| `--line`         | `rgba(247,250,238,.1)`    | `#d8d6c7`                 | Borders |
| `--hairline`     | `--ink-soft` at 14%       | same as `--line`          | Dividers |
| `--focus-ring`   | `#dfb84b`                 | `#bad32f`                 | Focus outline |
| `--on-accent`    | `#272c35`                 | `#f0f9c6`                 | Text on accent fills |
| `--ink-light`    | `#f7faee`                 | inherits Storm            | Fixed light text over photos and the thicket band |

Button shadow tokens and Daylight's hero oranges (`--hero-sun-orange` `#c97700`, `--hero-button-orange` `#f5a623`, which is also Daylight's button hover color) are defined in `theme.css`.

> **`--accent` vs `--accent-vivid`:** In Storm both are gold. In Daylight the vivid lime `#bad32f` is too light for text on cream (1.5:1), so use `--accent` for anything with text and `--accent-vivid` only for graphic elements.

Older `styles.css` names (`--bg`, `--paper`, `--teal`, `--verified`, `--estimated` and others) are mapped onto these tokens near the top of `theme.css`. Don't use them in new code.

**Applying a theme:** set `data-theme="storm"` or `data-theme="daylight"` on `<html>`. Use `data-theme="auto"` to follow `prefers-color-scheme`. A missing preference uses Storm. The choice is saved per device in `localStorage` under `atlas:theme`.

---

## 3. Typography

### Font Stack

| Token        | Family                           | Weights loaded |
|--------------|----------------------------------|----------------|
| `--serif`    | Fraunces, Georgia, serif         | 300, 300 italic, 600, 900 |
| `--sans`     | DM Sans, system-ui, sans-serif   | 400, 500, 700  |
| `--mono`     | DM Mono, ui-monospace, monospace | 400            |
| `--wordmark` | Fraunces, Georgia, serif         | 600 in use     |

Google Fonts import (in `index.html`):
```html
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;0,9..144,900;1,9..144,300&family=DM+Sans:wght@400;500;700&family=DM+Mono:wght@400&display=swap" rel="stylesheet" />
```

### Type Scale (measured in Storm at 1280px wide)

| Role                    | Size / line | Weight | Family   | Notes | Selector |
|-------------------------|-------------|--------|----------|-------|----------|
| Wordmark                | 20 / 20     | 600    | Fraunces | 0.08em tracking, V in `--accent` | `.logo-word`, `.logo-v` |
| Wordmark subline        | 10 / 10     | 700    | DM Sans  | 0.32em tracking, uppercase | `.logo-sub` |
| Header nav              | 13 / 24     | 500    | DM Sans  | `--accent` | `.app-nav a` |
| Hero title              | 40 / 44     | 300    | Fraunces | −0.01em tracking | `.hero-title` |
| Hero subtitle           | 15 / 24     | 500    | DM Sans  | `--ink-soft` | `.hero-subtitle` |
| Venture title           | 32 / 38     | 600    | Fraunces |  | `.trip-header h1` |
| Venture card title      | 26 / 32     | 600    | Fraunces |  | `.trip-row h3` |
| Wizard step title       | 28 / 34     | 700    | DM Sans  |  | `.wizard h1` |
| H2                      | 20 / 26     | 700    | DM Sans  |  | `h2` |
| H3                      | 16 / 22     | 700    | DM Sans  |  | `h3` |
| Body                    | 15 / 24     | 400    | DM Sans  |  | `body` |
| Small                   | 13 / 20     | 400    | DM Sans  |  | `.small`, `.field-hint`, `.trip-row-when` |
| Field label             | 13 / 16     | 700    | DM Sans  | 0.04em tracking | `.field-label` |
| Eyebrow / section label | 13 / 16     | 700    | DM Sans  | 0.08em tracking, uppercase | `.eyebrow`, `.section-label` |
| Chip                    | 12 / 16     | 700    | DM Sans  | 0.04em tracking, uppercase | `.chip` |
| Footer line             | 10 / 14     | 400    | DM Sans  |  | `.app-footer p` |
| Printed sheet title     | 22pt        | —      | —        | print only | `.sheet h1` |

**Rule:** headings default to DM Sans 700. Fraunces is reserved for editorial moments: the wordmark, the hero title, Venture titles and Venture card titles. An early rule in `theme.css` sets `h1`–`h3` to Fraunces 600, but later rules override it. Measure in the browser before changing heading styles.

---

## 4. Spacing & Layout

Spacing tokens: `--space-1` 4px, `--space-2` 8px, `--space-4` 16px, `--space-6` 24px. Many rules still use literal pixel values. Prefer the tokens in new code.

| Layout           | Value |
|------------------|-------|
| Page max width   | 1280px (Home, Ventures, Venture workspace) |
| Narrow page      | 780px (wizard and other `.page.narrow` screens) |
| Page padding     | 40px left and right at desktop widths |
| Header           | One 68px row (see §9) |
| Card padding     | 24px (`.card`) |

---

## 5. Border Radius

| Token           | Value | Use |
|-----------------|-------|-----|
| `--radius-xs`   | 2px   | Crisp data elements |
| `--radius-sm`   | 6px   | Inputs, fields, standard buttons |
| `--radius-md`   | 10px  | Cards, Venture cards, the hero card, the wizard's primary button |
| `--radius-pill` | 999px | Chips, nav links, progress dots, step numbers |

`--radius` is an alias for `--radius-md`.

---

## 6. Shadow Tokens

Exact values for both themes are in `theme.css`.

| Token                     | What it does | Where it's used |
|---------------------------|--------------|-----------------|
| `--shadow-etch`           | Etched text shadow | Headings and step titles |
| `--shadow-glint`          | Fine top and bottom highlight | Links, eyebrows, active nav, ghost buttons, estimate badges |
| `--shadow-sunlit`         | Raised, lit accent | Primary and Choose buttons, `.btn-sunlit` |
| `--shadow-prism`          | Multicolor prism glow | Hover state of featured and upcoming Venture cards |
| `--button-shadow-raised`  | Soft raised button | Neumorphic controls at rest |
| `--button-shadow-pressed` | Inset with a 1.5px stroke | Pressed and selected toggles |

`--shadow` is `none` on purpose, because data surfaces stay flat. A Venture card at rest uses `0 2px 10px rgba(0,0,0,.45), 0 1px 3px rgba(0,0,0,.25)`.

---

## 7. Icon System

### Library

WILDSTROM uses **[Lucide React](https://lucide.dev)** (MIT license) as its icon foundation.  
No custom SVG files. No generator script. Import and render directly.

- **Package:** `lucide-react`
- **React component:** `src/ui/Icon.tsx`
- **Icon count:** 37 ORIVOIR semantic names → 37 Lucide components (all verified 24×24)

### Usage

```tsx
import { Icon } from '@/ui/Icon';

// Inline — inherits color from surrounding CSS context
<Icon name="destinations" size={20} />

// With accessible label (icon has standalone meaning)
<Icon name="flights" size={20} label="Flights" />

// Optional stroke weight override (Lucide default is 2)
<Icon name="settings" size={20} strokeWidth={1.5} />
```

### How Color Works

Lucide icons render via `currentColor` by default. Set color on the icon's container or via the `color` prop for explicit overrides. The `.icon-tile` gradient pattern below is the intended treatment once it is built.

### Icon Tile (gradient container)

> **Not built yet.** `.icon-tile` is not defined in `theme.css`. The CSS below is the proposed design. It references `--radius-lg`, which doesn't exist, so use `--radius-md` when implementing it, and move the gradients into theme tokens.

```css
.icon-tile {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);  /* 16px */
  /* gradient is set per variant below */
}

/* Storm theme gradient variants */
[data-theme="storm"] .icon-tile--accent {
  background: var(--accent-vivid);
  color: #1d222f;
}
[data-theme="storm"] .icon-tile--sky {
  background: linear-gradient(135deg, #5ec4f0 0%, #2dd4bf 100%);
  color: #1d222f;
}
[data-theme="storm"] .icon-tile--warm {
  background: linear-gradient(135deg, #f5a623 0%, #f27059 100%);
  color: #1d222f;
}
[data-theme="storm"] .icon-tile--muted {
  background: linear-gradient(135deg, #2f3850 0%, #3a4561 100%);
  color: #9ba8bb;
}

/* Daylight theme gradient variants */
[data-theme="daylight"] .icon-tile--accent {
  background: linear-gradient(135deg, #d4c842 0%, #b89c00 100%);
  color: #262b33;
}
[data-theme="daylight"] .icon-tile--sky {
  background: linear-gradient(135deg, #1a7fa8 0%, #0d7a6e 100%);
  color: #f5f4ec;
}
[data-theme="daylight"] .icon-tile--warm {
  background: linear-gradient(135deg, #c47d00 0%, #b53d26 100%);
  color: #f5f4ec;
}
[data-theme="daylight"] .icon-tile--muted {
  background: linear-gradient(135deg, #dedad0 0%, #cdc8b8 100%);
  color: #6b6878;
}
```

### React Usage

```tsx
import { Icon } from '@/ui/Icon';

// Inline icon (inherits color from surrounding text)
<Icon name="destinations" size={20} />

// Standalone tile with gradient treatment
<div className="icon-tile icon-tile--accent">
  <Icon name="adventure" size={24} />
</div>

// With accessible label
<Icon name="flights" size={20} label="Flights" />
```

### Complete Icon Set

| Name          | Category    | Lucide Component   | Notes                            |
|---------------|-------------|--------------------|----------------------------------|
| adventure     | Navigation  | `Sunrise`          | More evocative than Sun          |
| explore       | Navigation  | `Compass`          | —                                |
| trip          | Navigation  | `Luggage`          | —                                |
| itinerary     | Navigation  | `CalendarCheck`    | —                                |
| destinations  | Navigation  | `MapPin`           | —                                |
| map           | Navigation  | `Map`              | —                                |
| plan          | Navigation  | `ClipboardList`    | —                                |
| bookings      | Navigation  | `Ticket`           | —                                |
| flights       | Navigation  | `PlaneTakeoff`     | More dynamic than Plane          |
| stays         | Navigation  | `BedDouble`        | Better than Bed                  |
| local         | Navigation  | `House`            | —                                |
| cruise        | Navigation  | `Ship`             | Passenger liner silhouette       |
| activities    | Activity    | `Dumbbell`         | Footprints used below for hiking |
| nature        | Activity    | `TreePine`         | Cleaner than Trees               |
| beach         | Activity    | `Palmtree`         | Better ORIVOIR vibe than Umbrella|
| mountains     | Activity    | `Mountain`         | —                                |
| city          | Activity    | `Building2`        | —                                |
| road-trip     | Activity    | `Car`              | Route is alt                     |
| hiking        | Activity    | `Footprints`       | —                                |
| camping       | Activity    | `TentTree`         | Better than Tent                 |
| cycling       | Activity    | `Bike`             | —                                |
| water-sports  | Activity    | `Sailboat`         | More specific than Waves         |
| wildlife      | Activity    | `PawPrint`         | Better than Bird                 |
| food-drink    | Food/Social | `UtensilsCrossed`  | —                                |
| eating-out    | Food/Social | `Soup`             | Distinct from food-drink         |
| cooking       | Food/Social | `CookingPot`       | Better than ChefHat              |
| party-club    | Food/Social | `PartyPopper`      | Distinct from concert            |
| festival      | Food/Social | `Sparkles`         | PartyPopper taken above          |
| concert       | Food/Social | `Guitar`           | Distinct from party-club         |
| culture       | Food/Social | `Landmark`         | —                                |
| events        | Food/Social | `CalendarDays`     | No conflict with CalendarCheck   |
| favorites     | Utility     | `Heart`            | —                                |
| saved         | Utility     | `Bookmark`         | —                                |
| share         | Utility     | `Share2`           | Better shape than Share          |
| collaborate   | Utility     | `UsersRound`       | Warmer than Users                |
| filters       | Utility     | `SlidersHorizontal`| —                                |
| settings      | Utility     | `Settings2`        | Gear style                       |

---

## 8. Component Patterns

### Buttons, cards, chips and fields (measured)

These are summaries. The exact rules live in `theme.css`.

| Element        | Radius | Padding            | Type                      | Notes |
|----------------|--------|--------------------|---------------------------|-------|
| `.btn`         | 6px    | 10px 20px          | DM Sans 700, 15px         | Accent text, raised button shadow |
| `.btn-primary` | 6px (10px in the wizard) | 10px 20px | DM Sans 700, 15px | Accent fill, `--on-accent` text, `--shadow-sunlit` |
| `.btn-lg`      | 6px    | 14px 24px          | DM Sans 700, 16px         | Home **Start a Venture** |
| `.btn-ghost`   | 6px    | 10px 20px          | DM Sans 700, 15px         | Transparent, accent text |
| `.card`        | 10px   | 24px               | —                         | `--surface-200` |
| `.trip-row`    | 10px   | 16px 12px 16px 24px| —                         | Venture card (§9 for hover) |
| `input`        | 6px    | 10px 14px          | DM Sans 400, 15 / 24      | `.input-lg`: 20px text, 14px 16px padding |
| `.chip`        | 999px  | 3px 10px           | DM Sans 700, 12px, uppercase | Status and filter chips |
| `.budget-pill` | 999px  | 4px 12px           | DM Sans 700, 13px         | Budget target under the Venture title (BUDGET-01): `--surface-200` with a `--line` border; hover and active use `--accent`. `.unset` (**+Set budget**) is transparent with a dashed `--accent` border and accent text. Transitions only under `prefers-reduced-motion: no-preference`. |

### Status Colors

| State | Treatment |
|-------|-----------|
| Estimated price | `.badge-estimated`: accent text and border on a transparent background. `--estimate` in budget bars. |
| Verified price | `.badge-verified`: accent fill with `--on-accent` text. `--thicket` in budget bars. |
| Good fit | `.tag-good`: `--thistle` fill with dark text |
| Venture status chips | **Booked:** `--sunlit` fill. **Dates set:** `--accent` fill. **In planning:** default chip. **Draft:** `--surface-200` with a `--line` border and `--ink-soft` text. |
| Error, over budget | `--danger` |

### Icon Controls Pill

Header pill container for theme-toggle, settings, and icon actions. Pairs with `.icon-controls-pill button` for individual actions.

```css
.icon-controls-pill {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  background: color-mix(in srgb, var(--surface-200) 90%, transparent);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-pill);
  padding: 4px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
```

```tsx
<div className="icon-controls-pill">
  <button aria-label="Toggle theme"><Icon name="settings" size={18} /></button>
  <button aria-label="Open filters"><Icon name="filters" size={18} /></button>
</div>
```

### Brief Block

Editorial left-accent callout — used for AI research status, planning notes, or important contextual information. Accent bar uses `--accent-vivid`.

```css
.brief-block {
  border-left: 3px solid var(--accent-vivid);
  padding: 2px 0 2px 16px;
}
.brief-block strong {
  display: block;
  font: 700 15px/22px var(--sans);
  color: var(--ink);
  margin-bottom: 4px;
}
.brief-block p {
  margin: 0;
  font-size: 14px;
  line-height: 21px;
  color: var(--ink-soft);
}
```

```tsx
<div className="brief-block">
  <strong>Research note</strong>
  <p>Flight prices to Tokyo are typically lowest 6–8 weeks out. Consider booking before mid-April.</p>
</div>
```

### Brief Card

AI research brief display — card with monospaced body text and a landscape-gradient icon badge. Used when surfacing structured research output.

```css
.brief-card {
  background: var(--surface-200);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-md);
  padding: 16px 20px;
  display: flex;
  gap: 16px;
  align-items: flex-start;
}
.brief-card-body {
  flex: 1;
  font: 400 13px/20px var(--mono);
  color: var(--ink-soft);
  margin: 0;
}
.brief-card-icon {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  /* Landscape palette gradient — matches CTA button and hero SVG */
  background: linear-gradient(135deg, #f5a623 0%, #f27059 60%, #2dd4bf 100%);
  color: #fff;
  box-shadow: var(--shadow);
}
```

```tsx
<div className="brief-card">
  <div className="brief-card-icon">
    <Icon name="explore" size={22} />
  </div>
  <p className="brief-card-body">
    Kyoto in October offers ideal weather (18–24°C), autumn foliage beginning in
    late October, and reduced summer crowds. UNESCO sites: Kinkaku-ji, Fushimi Inari,
    Ryoan-ji. Recommend 3–4 nights minimum.
  </p>
</div>
```

### CTA Landscape Button

Full-width call-to-action button with the ORIVOIR landscape palette gradient — lime leading into warm orange, coral, and teal horizon. The gradient echoes the `orivoir-landscape.svg` hero illustration.

```css
.btn-cta-landscape {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 16px 20px;
  border: 0;
  border-radius: var(--radius-md);
  font: 700 16px/1 var(--sans);
  color: var(--on-accent);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  background: linear-gradient(
    to right,
    var(--accent-vivid) 0%,
    var(--accent-vivid) 35%,
    #d4a234 58%,
    #3ec4b0 80%,
    #3a7a9e 100%
  );
  box-shadow: var(--shadow-sunlit);
  text-shadow: none;
}
.btn-cta-landscape:hover {
  filter: brightness(1.06);
}
.btn-cta-landscape .arrow {
  flex: none;
  opacity: 0.9;
}
```

```tsx
<button className="btn-cta-landscape">
  <span>Start planning your adventure</span>
  <Icon name="adventure" size={20} className="arrow" />
</button>
```

> **Gradient palette:** `--accent-vivid` (lime) → `#d4a234` (warm gold) → `#3ec4b0` (sea) → `#3a7a9e` (deep sky). Matches the landscape SVG's atmospheric horizon. Use `var(--on-accent)` (`#272c35` Storm / `#f0f9c6` Daylight) for button text.

---

## 9. Header and Hero Art

- **Header:** one 68px row holding the wordmark, the centered nav (Home, Ventures, Planner) and flat utility icons (theme, profile, settings). There's no illustration in the header. On phones a bottom nav carries the same three destinations.
- **Hero:** the home hero card (`.hero-card`, 10px radius, 48px 40px padding) holds the atmospheric landscape `public/hero/orivoir-landscape.svg` (`.hero-landscape`). It loads through `import.meta.env.BASE_URL`, so it works under `/ATLAS/`. Copy: "Good things **await.**" (with "await." in the accent), a subtitle, and **Start a Venture →**.
- **Save status:** the sync badge sits under the Venture title, not in the header.
- `public/hero/hero-{wide,tall}.{jpg,webp}` and `scripts/grade-hero.py` belong to the earlier photo hero. The UI doesn't reference them.

---

## 10. Motion

Transitions should be functional and minimal. The first four rows are guidance; the card-hover row is measured from the code.

| Property     | Duration | Easing            |
|--------------|----------|-------------------|
| Color, bg    | 150ms    | `ease`            |
| Transform    | 200ms    | `cubic-bezier(.2,0,.2,1)` |
| Fade in/out  | 200ms    | `ease`            |
| Panel slide  | 280ms    | `cubic-bezier(.2,0,.2,1)` |
| Venture card hover (border, glow) | 560ms | `ease` — rest and hover shadows have the same layers, so the glow eases in |

Do not animate layout (width, height, top, left) in the critical path. Use `transform` and `opacity` for all animated states.

---

## 11. Accessibility

- **Contrast:** text against its background must be at least 4.5:1 (WCAG AA). Measured values:
  - Storm accent on the page: 8.4:1, on cards: 7.4:1
  - Daylight accent on the page: 5.5:1, on cards: 4.9:1
  - `--on-accent` text on accent fills: 7.4:1 in Storm, 5.5:1 in Daylight
  - Daylight `--accent-vivid` on cream: 1.5:1, so it is never used for text
- **Focus:** buttons and links use `outline: 2px solid var(--focus-ring); outline-offset: 2px` on `:focus-visible`. Menus and wizard answers use an accent tint or border instead.
- **Icons:** add `aria-hidden="true"` when decorative. Use `aria-label` or an `.sr-only` label when the icon carries meaning.
- **Form fields:** always associate a `<label>` with its input.
- **Motion:** The sync pulse and Budget pill transitions run only with `prefers-reduced-motion: no-preference`. The sync label and status dot remain visible with reduced motion. Wrap new non-essential animation in `@media (prefers-reduced-motion: no-preference)`, including the planned departure-screen clouds, and add the guard to existing transitions.

---

## 12. File Conventions

```
src/
  ui/
    Icon.tsx        ← Icon component (wraps lucide-react)
  theme.css         ← token values and WILDSTROM component rules (exact values)
  styles.css        ← base layout and legacy styles that theme.css re-skins
public/hero/
  orivoir-landscape.svg ← home hero landscape
docs/
  design-system.md  ← THIS FILE (describes the system; update with every UI change)
```

Icons are sourced from the `lucide-react` npm package. No local SVG files or generator script.

---

## 13. Change Log

| Date       | Change |
|------------|--------|
| 2026-11-26 | Docs only: "candidate range" now reads "proposed dates" (D5). The availability calendar's styles arrive with its M2 build. No UI change. |
| 2026-11-23 | **Time zone** select in Set the Scene's optional details and in Venture settings, using the existing field and `.stack-sm` spacing. No new tokens or CSS. |
| 2026-11-22 | Storm is the first-visit default. Choosing Auto saves the device-following preference. The sync indicator stays steady with reduced motion. |
| 2026-11-21 | Budget pill (`.budget-pill`) under the Venture title shows the target as entered or **+Set budget**, and opens the new Budget view; the budget target controls moved there from Venture settings. Borders use `--accent`, not `--accent-vivid`, so the dashed outline stays visible on Daylight cream. First rule guarded by `prefers-reduced-motion`. |
| 2026-11-21 | Venture settings: budget basis toggle (Total / Per person) reuses `.segmented`; the per-person field hint shows the group total. Budget panel shows the per-person amount next to the total. No new tokens. |
| 2026-11-21 | Doc brought in line with the code. Rebuilt the theme table from `theme.css` and removed tokens that were never implemented: `--surface-300/400/500`, `--ink-faint`, `--warm`, `--sky`, `--sea`, `--coral`, `--border`, `--shadow-sm/md/lg`, `--glow-accent`. Type scale, spacing, radius, shadows and components are now measured. Header and hero section rewritten. Reduced-motion gap recorded. |
| 2026-11-19 | Budget step polish: flat Skip link, outlined ghost Back button, helper spacing |
| 2026-11-19 | Hero title Fraunces 300; hero subtitle `--ink-soft` |
| 2026-11-19 | Featured and upcoming Venture cards use the sandbox card (`--surface-200`, `--line` border, 10px radius). On hover the prism glow eases in over 0.56s through matching eight-layer shadow lists. All Venture cards get the hover lift. |
| 2026-11-19 | Header reworked into one 68px row. Landscape art moved into the home hero card. Save status moved beside the Venture title. Nav set at 13px / 500 with 6px 14px padding. |
| 2026-11-19 | Wordmark: 600 weight, 20px, 0.08em tracking, V in `--accent` |
| 2026-11-19 | Storm `--accent`, `--accent-vivid`, `--sunlit` and `--focus-ring` changed from chartreuse `#f4ec2a` to gold `#dfb84b`. `--flare` `#f0d882`, `--thicket` `#387476`, `--line` 10% ink. `--ink-soft` set to 75% ink, raised from 55% for contrast. |
| 2026-11-17 | Storm chartreuse accents updated to `#f4ec2a` |
| 2026-11-16 | Storm/Daylight tokens derived from UI prototype screenshots |
| 2026-11-16 | Added `--accent-vivid` token: Storm `#c0df30`, Daylight `#bad32f` (graphic-only) |
| 2026-11-16 | Storm `--accent` updated to `#c0df30`; `--sunlit` to `#dcf020`; `--focus-ring` to `#c0df30` |
| 2026-11-16 | Daylight `--focus-ring` updated to `#bad32f` (vivid lime, per prototype) |
| 2026-11-16 | Storm `--surface-200` corrected to `#252c3d` (elevated surfaces lighter than body) |
| 2026-11-16 | New components: `.icon-controls-pill`, `.brief-block`, `.brief-card`, `.btn-cta-landscape` |
| 2026-11-16 | Added `cruise` (Ship) icon; `OrivoirIcon` alias exported |
| 2026-11-16 | Switched icon system to Lucide React; custom SVGs removed |
| 2026-11-16 | Icon.tsx rewritten to map 36 ORIVOIR names → Lucide components |
| 2026-11-16 | Initial WILDSTROM spec written and committed to repo |
| 2026-11-15 | Font stack updated: Fraunces 600+900 / DM Sans / DM Mono |
| 2026-11-15 | Wordmark weight updated to 900; serif override clarified |
| 2026-11-14 | Clover & Rye renamed WILDSTROM; Storm/Daylight themes set |
