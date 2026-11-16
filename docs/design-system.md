# WILDSTROM Design System
### Source of Truth — ORIVOIR Adventure Planner

> **This document is authoritative.** All future UI development, component creation, and theme decisions must reference and stay consistent with the specifications here. Update this document when tokens, components, or patterns change. Never update the app without updating this document.

---

## 1. Brand Identity

**Product name:** ORIVOIR.  
**Brand mark:** "ORIVOIR." — the period is part of the mark; always include it.  
**Tagline:** ADVENTURE PLANNER  
**Design system name:** WILDSTORM  

ORIVOIR is a family travel planning application. The visual language is editorial, nature-informed, and calm. It avoids corporate dashboard aesthetics in favor of a magazine-meets-field-journal quality.

---

## 2. Themes

WILDSTROM ships two complete, switchable themes. Both share the same CSS token names; values differ.

| Token            | Storm (dark)            | Daylight (light)        | Notes                                        |
|------------------|-------------------------|-------------------------|----------------------------------------------|
| `--surface-100`  | `#1d222f`               | `#f5f4ec`               | Body background                              |
| `--surface-200`  | `#252c3d`               | `#e9e8db`               | Cards, elevated surfaces (lighter in Storm)  |
| `--surface-300`  | `#2f3850`               | `#dedad0`               | —                                            |
| `--surface-400`  | `#3a4561`               | `#cdc8b8`               | —                                            |
| `--surface-500`  | `#4d5c7a`               | `#b8b1a0`               | —                                            |
| `--ink`          | `#f7faee`               | `#262b33`               | Primary text                                 |
| `--ink-muted`    | `#9ba8bb`               | `#6b6878`               | Secondary text                               |
| `--ink-faint`    | `#4d5c7a`               | `#b8b1a0`               | Disabled / hint text                         |
| `--accent`       | `#c0df30`               | `#6b6418`               | Text-safe accent: headings, links, nav labels|
| `--accent-vivid` | `#c0df30`               | `#bad32f`               | **Graphic-use accent: borders, button fills, checkboxes, indicators — never standalone text on light bg** |
| `--sunlit`       | `#dcf020`               | `#b89c00`               | Special highlights, hero accents             |
| `--warm`         | `#f5a623`               | `#c47d00`               | —                                            |
| `--sky`          | `#5ec4f0`               | `#1a7fa8`               | —                                            |
| `--sea`          | `#2dd4bf`               | `#0d7a6e`               | —                                            |
| `--coral`        | `#f27059`               | `#b53d26`               | —                                            |
| `--focus-ring`   | `#c0df30`               | `#bad32f`               | Vivid lime — per UI prototype                |
| `--on-accent`    | `#272c35`               | `#f0f9c6`               | Text over accent backgrounds                 |
| `--border`       | `rgba(255,255,255,.08)` | `rgba(0,0,0,.08)`       | —                                            |
| `--shadow`       | (see §8)                | (see §8)                | —                                            |

> **`--accent` vs `--accent-vivid`:** Storm uses the same value for both tokens; the split matters in Daylight where vivid chartreuse (`#bad32f`) lacks the contrast for text on cream (`#f5f4ec`) but reads fine on graphical elements. Use `--accent` for anything with text; use `--accent-vivid` for borders, button/chip fills, checkboxes, and status indicators.

**Applying a theme:** Add `data-theme="storm"` or `data-theme="daylight"` to `<html>` or any ancestor element. Storm is the default.

---

## 3. Typography

### Font Stack

| Token       | Family                           | Weights loaded |
|-------------|----------------------------------|----------------|
| `--serif`   | Fraunces, Georgia, serif         | 600, 900       |
| `--sans`    | DM Sans, system-ui, sans-serif   | 400, 500, 700  |
| `--mono`    | DM Mono, ui-monospace, monospace | 400            |
| `--wordmark`| Fraunces, Georgia, serif         | 900            |

Google Fonts import (in `index.html`):
```html
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,900&family=DM+Sans:wght@400;500;700&family=DM+Mono:wght@400&display=swap" rel="stylesheet" />
```

### Type Scale

| Role           | Size   | Weight | Family       | CSS class / element     |
|----------------|--------|--------|--------------|-------------------------|
| Wordmark       | 30px   | 900    | `--wordmark` | `.logo-word`            |
| Hero title     | 2.5rem | 600    | `--serif`    | `.hero-title`           |
| H1             | 2rem   | 700    | `--sans`     | `h1` default            |
| H2             | 1.5rem | 700    | `--sans`     | `h2` default            |
| H3             | 1.25rem| 700    | `--sans`     | `h3` default            |
| Trip header h1 | 2rem   | 600    | `--serif`    | `.trip-header h1`       |
| Trip row h3    | 1.1rem | 600    | `--serif`    | `.trip-row h3`          |
| Body           | 16px   | 400    | `--sans`     | `body`, `p`             |
| Small / caption| 13px   | 400    | `--sans`     | `.caption`, `small`     |
| Label          | 11px   | 500    | `--sans`     | `.label`                |
| Mono           | 13px   | 400    | `--mono`     | `.mono`, `code`         |

**Rule:** `h1`, `h2`, `h3`, `legend` default to `--sans` at 700. Only specific editorial contexts (`.trip-header h1`, `.trip-row h3`, `.hero-title`, `.sheet h1`) override to `--serif` at 600.

---

## 4. Spacing & Layout

Base spacing unit: **4px**

| Token      | Value |
|------------|-------|
| `--space-1`| 4px   |
| `--space-2`| 8px   |
| `--space-3`| 12px  |
| `--space-4`| 16px  |
| `--space-5`| 20px  |
| `--space-6`| 24px  |
| `--space-8`| 32px  |
| `--space-10`| 40px |
| `--space-12`| 48px |
| `--space-16`| 64px |

Max content width: `1280px`. Content padding: `--space-6` (24px) on mobile, `--space-8` (32px) ≥768px.

---

## 5. Border Radius

| Token        | Value  | Use                              |
|--------------|--------|----------------------------------|
| `--radius-sm`| 4px    | Chips, badges, small form fields |
| `--radius`   | 8px    | Cards, inputs, standard elements |
| `--radius-md`| 12px   | Drawers, modals, larger cards    |
| `--radius-lg`| 16px   | Icon tiles, feature panels       |
| `--radius-xl`| 24px   | Hero cards, fullscreen modals    |
| `--radius-full`| 9999px | Pills, avatars, circular elements|

---

## 6. Shadow Tokens

| Token          | Storm value                            | Daylight value                        |
|----------------|----------------------------------------|---------------------------------------|
| `--shadow-sm`  | `0 1px 3px rgba(0,0,0,.35)`           | `0 1px 3px rgba(0,0,0,.12)`          |
| `--shadow`     | `0 4px 12px rgba(0,0,0,.45)`          | `0 4px 12px rgba(0,0,0,.14)`         |
| `--shadow-md`  | `0 8px 24px rgba(0,0,0,.55)`          | `0 8px 24px rgba(0,0,0,.16)`         |
| `--shadow-lg`  | `0 16px 48px rgba(0,0,0,.65)`         | `0 16px 48px rgba(0,0,0,.2)`         |
| `--glow-accent`| `0 0 20px rgba(192,223,48,.35)`       | `0 0 20px rgba(107,100,24,.2)`       |

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

Lucide icons render via `currentColor` by default. Set color on the icon's container or via the `color` prop for explicit overrides. The `.icon-tile` gradient pattern below is the preferred treatment.

### Icon Tile (gradient container)

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
  background: linear-gradient(135deg, #c0df30 0%, #dcf020 100%);
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

### Button

```css
.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius);
  font: 500 14px/1 var(--sans);
  letter-spacing: .02em;
  transition: background .15s, opacity .15s;
  cursor: pointer;
  border: none;
}
.btn-primary {
  background: var(--accent);
  color: var(--surface-100);
}
.btn-secondary {
  background: var(--surface-300);
  color: var(--ink);
}
.btn-ghost {
  background: transparent;
  color: var(--ink);
  border: 1px solid var(--border);
}
```

### Card

```css
.card {
  background: var(--surface-200);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
}
```

### Badge / Chip

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px var(--space-2);
  border-radius: var(--radius-full);
  font: 500 11px/1 var(--sans);
  letter-spacing: .04em;
  text-transform: uppercase;
  background: var(--surface-300);
  color: var(--ink-muted);
}
.badge--accent {
  background: var(--accent);
  color: var(--surface-100);
}
```

### Form Field

```css
.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.field label {
  font: 500 12px/1 var(--sans);
  letter-spacing: .04em;
  text-transform: uppercase;
  color: var(--ink-muted);
}
.input {
  background: var(--surface-300);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: var(--space-2) var(--space-3);
  font: 400 15px/1.4 var(--sans);
  color: var(--ink);
  transition: border-color .15s;
}
.input:focus {
  outline: none;
  border-color: var(--accent);
}
```

### Status Colors

| Status    | Storm bg              | Daylight bg          | Text              |
|-----------|-----------------------|----------------------|-------------------|
| Estimated | `--surface-300`       | `--surface-300`      | `--ink-muted`     |
| Selected  | accent at 20% opacity | accent at 20% opacity| `--accent`        |
| Confirmed | `--sea` at 15% opacity| `--sea` at 15% opacity| `--sea`          |
| Warning   | `--warm` at 15%       | `--warm` at 15%      | `--warm`          |
| Error     | `--coral` at 15%      | `--coral` at 15%     | `--coral`         |

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

## 9. ORIVOIR Header Illustration

The signature ORIVOIR header uses a sun-disc motif. CSS implementation:

```css
.orivoir-header {
  position: relative;
  overflow: hidden;
  background: var(--surface-100);
}
.orivoir-header__sun {
  position: absolute;
  /* Semicircle rising from bottom center */
  bottom: -40%;
  left: 50%;
  transform: translateX(-50%);
  width: 70%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: conic-gradient(
    from 180deg at 50% 100%,
    var(--sunlit) 0deg,
    var(--warm) 60deg,
    var(--coral) 120deg,
    transparent 180deg
  );
  opacity: .85;
}
```

---

## 10. Motion

Transitions should be functional and minimal.

| Property     | Duration | Easing            |
|--------------|----------|-------------------|
| Color, bg    | 150ms    | `ease`            |
| Transform    | 200ms    | `cubic-bezier(.2,0,.2,1)` |
| Fade in/out  | 200ms    | `ease`            |
| Panel slide  | 280ms    | `cubic-bezier(.2,0,.2,1)` |

Do not animate layout (width, height, top, left) in the critical path. Use `transform` and `opacity` for all animated states.

---

## 11. Accessibility

- Color contrast: all text against background ≥ 4.5:1 (WCAG AA). `--accent` (#c0df30 Storm / #6b6418 Daylight) is text-safe on its respective background. `--accent-vivid` is **not** text-safe on Daylight cream — use it only for graphic elements.
- Focus styles: all interactive elements use `outline: 2px solid var(--focus-ring); outline-offset: 3px` on `:focus-visible`. `--focus-ring` is vivid lime in both themes (Storm: `#c0df30`; Daylight: `#bad32f`) — high visibility on both backgrounds.
- Icons: use `aria-hidden="true"` when decorative. Use `aria-label` or `.sr-only` label when icon carries meaning.
- Form fields: always associate `<label>` with input via `for`/`id`.
- Motion: respect `prefers-reduced-motion`. Wrap all non-essential transitions in `@media (prefers-reduced-motion: no-preference)`.

---

## 12. File Conventions

```
src/
  ui/
    Icon.tsx        ← Icon component (wraps lucide-react)
  theme.css         ← CSS token definitions (authoritative for all tokens)
  styles.css        ← Base reset and global styles
docs/
  design-system.md  ← THIS FILE (source of truth)
```

Icons are sourced from the `lucide-react` npm package. No local SVG files or generator script.

---

## 13. Change Log

| Date       | Change                                                     |
|------------|------------------------------------------------------------|
| 2026-11-16 | Storm/Daylight tokens derived from UI prototype screenshots (source of truth) |
| 2026-11-16 | Added `--accent-vivid` token: Storm `#c0df30`, Daylight `#bad32f` (graphic-only) |
| 2026-11-16 | Storm `--accent` updated to `#c0df30`; `--sunlit` to `#dcf020`; `--focus-ring` to `#c0df30` |
| 2026-11-16 | Daylight `--focus-ring` updated to `#bad32f` (vivid lime, per prototype) |
| 2026-11-16 | Storm `--surface-200` corrected to `#252c3d` (elevated surfaces lighter than body) |
| 2026-11-16 | New components: `.icon-controls-pill`, `.brief-block`, `.brief-card`, `.btn-cta-landscape` |
| 2026-11-16 | Added `cruise` (Ship) icon; `OrivoirIcon` alias exported   |
| 2026-11-16 | Switched icon system to Lucide React; custom SVGs removed  |
| 2026-11-16 | Icon.tsx rewritten to map 36 ORIVOIR names → Lucide components |
| 2026-11-16 | Initial WILDSTROM spec written and committed to repo       |
| 2026-11-15 | Font stack updated: Fraunces 600+900 / DM Sans / DM Mono   |
| 2026-11-15 | Wordmark weight updated to 900; serif override clarified    |
| 2026-11-14 | Clover & Rye renamed WILDSTROM; Storm/Daylight themes set  |
