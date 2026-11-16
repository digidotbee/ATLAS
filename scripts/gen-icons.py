#!/usr/bin/env python3
"""
WILDSTROM Icon Generator
Writes 36 production SVG glyph icons to src/assets/icons/
Each SVG: 24×24 viewBox, fill="currentColor", no baked-in gradient.
Gradient containers are applied via CSS for Storm/Daylight theme control.
"""

import os

OUT = os.path.join(os.path.dirname(__file__), '..', 'src', 'assets', 'icons')
os.makedirs(OUT, exist_ok=True)


def icon(name: str, *elems: str) -> None:
    inner = '\n  '.join(elems)
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
  {inner}
</svg>
'''
    path = os.path.join(OUT, f'{name}.svg')
    with open(path, 'w') as f:
        f.write(svg)
    print(f'  ✓  {name}.svg')


print('Writing icons to src/assets/icons/ …\n')

# ─── Core navigation ─────────────────────────────────────────────────────────

# adventure: sun disc (ORIVOIR mark) + horizon arc
icon('adventure',
     '<circle cx="12" cy="9" r="3.5"/>',
     '<path d="M12 2v2M12 15v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>',
     '<path fill-rule="evenodd" d="M3 20h18a9 9 0 0 0-18 0z"/>')

# explore: compass rose
icon('explore',
     '<path fill-rule="evenodd" d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 2a8 8 0 1 1 0 16A8 8 0 0 1 12 4z"/>',
     '<path d="M12 6 9.5 12.5h5L12 6z"/>',
     '<path d="M12 18l2.5-6.5h-5L12 18z" opacity=".55"/>',
     '<path d="M6 12l6.5 2.5v-5L6 12z" opacity=".55"/>',
     '<path d="M18 12l-6.5-2.5v5L18 12z"/>')

# trip: suitcase with handle
icon('trip',
     '<rect x="5" y="8" width="14" height="12" rx="1.5" fill-rule="evenodd"/>',
     '<rect x="9" y="4" width="6" height="4" rx="1" fill="none" stroke="currentColor" stroke-width="1.75"/>',
     '<rect x="5" y="13" width="14" height="1.5" rx=".75"/>',
     '<circle cx="8.5" cy="20.5" r="1.25" fill="var(--surface-100, #fff)"/>',
     '<circle cx="15.5" cy="20.5" r="1.25" fill="var(--surface-100, #fff)"/>')

# itinerary: calendar with checkmark
icon('itinerary',
     '<path fill-rule="evenodd" d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm0 2v14h14V5H5z"/>',
     '<rect x="8" y="2" width="2" height="4" rx="1"/>',
     '<rect x="14" y="2" width="2" height="4" rx="1"/>',
     '<rect x="5" y="9" width="14" height="1.5" rx=".75"/>',
     '<path d="M7.5 15.5 10.5 19 17 13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>')

# destinations: teardrop pin
icon('destinations',
     '<path fill-rule="evenodd" d="M12 2a7 7 0 0 1 7 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 0 1 7-7zm0 4.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z"/>')

# map: folded map
icon('map',
     '<path d="M9 3 3 6v15l6-3 6 3 6-3V3l-6 3-6-3z" fill-rule="evenodd"/>',
     '<path d="M9 3v15M15 6v15" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".55"/>')

# plan: checklist clipboard
icon('plan',
     '<path fill-rule="evenodd" d="M9 2h6a1 1 0 0 1 1 1v1h1a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1zm1 2v1a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V4h-4z"/>',
     '<rect x="8" y="10" width="2" height="2" rx=".5"/>',
     '<rect x="11.5" y="10.5" width="4.5" height="1" rx=".5"/>',
     '<rect x="8" y="14" width="2" height="2" rx=".5"/>',
     '<rect x="11.5" y="14.5" width="4.5" height="1" rx=".5"/>',
     '<rect x="8" y="18" width="2" height="2" rx=".5"/>',
     '<rect x="11.5" y="18.5" width="4.5" height="1" rx=".5"/>')

# bookings: ticket stub
icon('bookings',
     '<path fill-rule="evenodd" d="M3 7a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v3a2 2 0 0 0 0 4v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3a2 2 0 0 0 0-4V7zm12 1v8M7 10h4M7 14h4"/>',
     '<path d="M15 8v8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 1.5"/>',
     '<path d="M7 10h4M7 13h4" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/>')

# flights: aircraft from above
icon('flights',
     '<path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>')

# stays: bed with pillows
icon('stays',
     '<rect x="2" y="4" width="3" height="16" rx="1"/>',
     '<path fill-rule="evenodd" d="M5 10h14a3 3 0 0 1 3 3v7H5V10zm2.5 2a1.5 1.5 0 0 0 0 3h2a1.5 1.5 0 0 0 0-3h-2zm7 0a1.5 1.5 0 0 0 0 3h2a1.5 1.5 0 0 0 0-3h-2z"/>',
     '<rect x="5" y="7" width="14" height="3" rx="1"/>')

# local: house / home base
icon('local',
     '<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>')

# ─── Activity / category ──────────────────────────────────────────────────────

# activities: hiker silhouette
icon('activities',
     '<circle cx="12" cy="4.5" r="2"/>',
     '<path d="M9 9l-2.5 5h3l1.5 6h2l1.5-6h3L15 9c-.75-1-1.75-1.5-3-1.5S9.75 8 9 9z"/>',
     '<path d="M14.5 11.5l3 5" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>')

# nature: pine trees
icon('nature',
     '<path fill-rule="evenodd" d="M6 20h3v-4l-4.5-5H6l-4-5h8l-4 5h1.5L6 15v5zm7-2h4.5v-3l-3-3.5H15l-3-4h6l-3 4h.5l-3 3.5V18H13z"/>',
     '<rect x="10.5" y="18" width="2" height="2" rx=".5"/>')

# beach: palm tree + sun
icon('beach',
     '<circle cx="18" cy="5" r="2.5"/>',
     '<path d="M9 20c0-6 3-10 3-10s3 4 3 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
     '<path d="M12 10C9 7 5 7 4 9c3 0 5.5 1.5 8 4"/>',
     '<path d="M12 10c3-3 7-3 8-1-3 0-5.5 1.5-8 4"/>',
     '<path d="M4 20h16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
     '<path d="M5 20c1-3 3-5 7-5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
     '<path d="M19 20c-1-3-3-5-7-5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity=".55"/>')

# mountains: three peaks
icon('mountains',
     '<path d="M2 20 9 7l4.5 7L16 10l6 10H2z" fill-rule="evenodd"/>',
     '<path d="M9 7l-1.5 2.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity=".45"/>',
     '<path d="M16 10l-1 1.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity=".45"/>')

# city: skyline silhouette
icon('city',
     '<path fill-rule="evenodd" d="M1 21V9l4-3v2l3-4 3 4V3l4 4v3l3-2v13H1zm5-4h2v3H6v-3zm5 0h2v3h-2v-3zm5 0h2v3h-2v-3z"/>',
     '<rect x="6" y="11" width="2" height="2" rx=".5" fill="var(--surface-100, #1d222f)"/>',
     '<rect x="11" y="8" width="2" height="2" rx=".5" fill="var(--surface-100, #1d222f)"/>',
     '<rect x="16" y="12" width="2" height="2" rx=".5" fill="var(--surface-100, #1d222f)"/>')

# road-trip: car from side
icon('road-trip',
     '<path fill-rule="evenodd" d="M5 11l2-5h10l2 5v5H5v-5z"/>',
     '<path d="M7.5 11h9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity=".55"/>',
     '<path d="M9 6l-.75 5M15 6l.75 5" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" opacity=".35"/>',
     '<circle cx="8" cy="17" r="2" fill-rule="evenodd"/>',
     '<circle cx="8" cy="17" r=".75" fill="var(--surface-100, #1d222f)"/>',
     '<circle cx="16" cy="17" r="2" fill-rule="evenodd"/>',
     '<circle cx="16" cy="17" r=".75" fill="var(--surface-100, #1d222f)"/>',
     '<rect x="2" y="14" width="3" height="2" rx=".75"/>',
     '<rect x="19" y="14" width="3" height="2" rx=".75"/>')

# hiking: boot
icon('hiking',
     '<path fill-rule="evenodd" d="M5 14V7a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3h2a3 3 0 0 1 3 3v2a2 2 0 0 1 2 2v1H4v-1a2 2 0 0 1 1-1.73V14zm2-7h4v7H7V7z"/>',
     '<rect x="4" y="20" width="16" height="1" rx=".5" opacity=".5"/>')

# camping: tent with trees
icon('camping',
     '<path d="M12 3 4 20h16L12 3z" fill-rule="evenodd"/>',
     '<path d="M12 3l-3.5 17h7L12 3z" fill="var(--surface-100, #1d222f)" opacity=".3"/>',
     '<path d="M9 20v-5h6v5" fill="none" stroke="currentColor" stroke-width="1.5"/>',
     '<path d="M2 20 5 14l3 6" fill-rule="evenodd" opacity=".55"/>',
     '<path d="M22 20l-3-6-3 6" fill-rule="evenodd" opacity=".55"/>')

# cycling: bicycle
icon('cycling',
     '<circle cx="7" cy="15" r="4" fill-rule="evenodd"/>',
     '<circle cx="7" cy="15" r="1.75" fill="var(--surface-100, #1d222f)"/>',
     '<circle cx="17" cy="15" r="4" fill-rule="evenodd"/>',
     '<circle cx="17" cy="15" r="1.75" fill="var(--surface-100, #1d222f)"/>',
     '<path d="M7 15l5-7 5 7" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>',
     '<path d="M12 8h3" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>',
     '<path d="M14 6.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>')

# water-sports: surfboard + wave
icon('water-sports',
     '<path d="M5 8c5 0 9 3 14 3-5 0-9 3-14 3V8z" fill-rule="evenodd"/>',
     '<path d="M8 16c3 0 6-1.5 9-1.5-3 0-6 1.5-9 1.5z" fill-rule="evenodd" opacity=".55"/>',
     '<rect x="10" y="3" width="4" height="10" rx="2" transform="rotate(-30 12 8)"/>',
     '<path d="M14.5 5 13 9" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity=".45"/>')

# wildlife: deer silhouette
icon('wildlife',
     '<circle cx="12" cy="6" r="2"/>',
     '<path d="M10 8c-2 1-3 3-3 5h10c0-2-1-4-3-5"/>',
     '<rect x="9" y="13" width="2" height="5" rx="1"/>',
     '<rect x="13" y="13" width="2" height="5" rx="1"/>',
     '<path d="M9 8C7 6 6 4 7 3M15 8c2-2 3-4 2-5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
     '<path d="M7 3C6 2 5 2 4 3M17 3c1-1 2-1 3 0" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/>',
     '<path d="M9 8c0-1 .5-2 1-2.5" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" opacity=".45"/>')

# ─── Food / Social ────────────────────────────────────────────────────────────

# food-drink: fork + knife
icon('food-drink',
     '<path d="M8 2v5a2 2 0 0 0 2 2v13h2V9a2 2 0 0 0 2-2V2h-1v3.5h-1V2h-1v3.5h-1V2H8z" fill-rule="evenodd"/>',
     '<path fill-rule="evenodd" d="M15 2v7.5a2.5 2.5 0 0 0 1.5 2.3V22h2V11.8A2.5 2.5 0 0 0 20 9.5V2h-5z"/>')

# eating-out: cloche / plate cover
icon('eating-out',
     '<path fill-rule="evenodd" d="M12 4a9 9 0 0 1 9 8H3a9 9 0 0 1 9-8z"/>',
     '<rect x="2" y="13" width="20" height="2" rx="1"/>',
     '<rect x="10" y="2" width="4" height="3" rx="1"/>',
     '<circle cx="12" cy="2.5" r="1.25"/>')

# cooking: pot with steam
icon('cooking',
     '<rect x="4" y="10" width="16" height="9" rx="1.5" fill-rule="evenodd"/>',
     '<rect x="2" y="13" width="3" height="2.5" rx="1"/>',
     '<rect x="19" y="13" width="3" height="2.5" rx="1"/>',
     '<rect x="7" y="8.5" width="10" height="2" rx="1"/>',
     '<path d="M8 7c0-2 1.5-2 1.5-4M12 7c0-2 1.5-2 1.5-4M16 7c0-2 1.5-2 1.5-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
     '<path d="M6 14h12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity=".55"/>')

# party-club: disco ball
icon('party-club',
     '<path fill-rule="evenodd" d="M12 3a8 8 0 1 0 0 16A8 8 0 0 0 12 3zm0 2a6 6 0 0 1 6 6 6 6 0 0 1-6 6 6 6 0 0 1-6-6 6 6 0 0 1 6-6z"/>',
     '<path d="M6.1 9h11.8M6.1 15h11.8M9 5.3v13.4M12 4v16M15 5.3v13.4" fill="none" stroke="currentColor" stroke-width="1" opacity=".6"/>',
     '<path d="M8 3l1.5-2m6.5 2-1.5-2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
     '<rect x="10.5" y="1" width="3" height="2" rx="1"/>')

# festival: marquee tent
icon('festival',
     '<path fill-rule="evenodd" d="M12 2 2 10h3v9h14v-9h3L12 2z"/>',
     '<path d="M12 2v9" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".45"/>',
     '<rect x="9" y="14" width="6" height="5" rx="1"/>',
     '<path d="M9 14h6" fill="none" stroke="currentColor" stroke-width="1" opacity=".45"/>',
     '<path d="M5 7l-2 1.5M19 7l2 1.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity=".55"/>',
     '<path d="M12 2l1 2-1-.5-1 .5 1-2z"/>')

# concert: guitar
icon('concert',
     '<path fill-rule="evenodd" d="M14.5 2h-5a1 1 0 0 0-1 1v.5H7a1 1 0 0 0 0 2h1.5V13a5 5 0 1 0 7 0V5.5H17a1 1 0 0 0 0-2h-1.5V3a1 1 0 0 0-1-1z"/>',
     '<circle cx="12" cy="17" r="2.25" fill="var(--surface-100, #1d222f)" fill-rule="evenodd"/>',
     '<rect x="10.5" y="2" width="3" height="4" rx=".75" fill="var(--surface-100, #1d222f)"/>',
     '<path d="M10.5 6.5h3" fill="none" stroke="currentColor" stroke-width="1.5"/>',
     '<path d="M10.5 8h3" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".55"/>')

# culture: classical columns
icon('culture',
     '<rect x="4" y="18" width="16" height="2" rx=".75"/>',
     '<rect x="2" y="20" width="20" height="2" rx=".75"/>',
     '<rect x="6" y="8" width="2.5" height="10" rx=".75"/>',
     '<rect x="10.75" y="8" width="2.5" height="10" rx=".75"/>',
     '<rect x="15.5" y="8" width="2.5" height="10" rx=".75"/>',
     '<rect x="4" y="6" width="16" height="2" rx=".75"/>',
     '<path d="M12 2 4 6h16L12 2z" fill-rule="evenodd"/>')

# events: calendar with star
icon('events',
     '<path fill-rule="evenodd" d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm0 2v14h14V5H5z"/>',
     '<rect x="8" y="2" width="2" height="4" rx="1"/>',
     '<rect x="14" y="2" width="2" height="4" rx="1"/>',
     '<rect x="5" y="9" width="14" height="1.5" rx=".75"/>',
     '<path d="M12 12l1 2h2l-1.5 1.5.5 2-2-1-2 1 .5-2L9 14h2l1-2z"/>')

# ─── Utility ──────────────────────────────────────────────────────────────────

# favorites: heart
icon('favorites',
     '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>')

# saved: bookmark
icon('saved',
     '<path d="M17 3H7a2 2 0 0 0-2 2v16l7-3 7 3V5a2 2 0 0 0-2-2z"/>')

# share: three circles + lines
icon('share',
     '<circle cx="18" cy="5" r="3"/>',
     '<circle cx="6" cy="12" r="3"/>',
     '<circle cx="18" cy="19" r="3"/>',
     '<path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" fill="none" stroke="currentColor" stroke-width="1.75"/>')

# collaborate: two people
icon('collaborate',
     '<circle cx="9" cy="7" r="3.5"/>',
     '<path d="M2 20c0-3.87 3.13-7 7-7s7 3.13 7 7"/>',
     '<circle cx="17" cy="8" r="2.5" opacity=".7"/>',
     '<path d="M15 20c0-2.76 2.24-5 5-5" opacity=".7"/>')

# filters: sliders
icon('filters',
     '<path d="M4 6h16M4 12h16M4 18h16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>',
     '<circle cx="8" cy="6" r="2.25"/>',
     '<circle cx="16" cy="12" r="2.25"/>',
     '<circle cx="10" cy="18" r="2.25"/>')

# settings: gear / cog
icon('settings',
     '<path fill-rule="evenodd" d="M12 1l2.09 3.26L18 3l-1 3.9L20.5 9l-3.09 1.5L18 14l-3.91-.74L12 17l-2.09-2.74L6 14l1-3.5L3.5 9l3.09-1.5L5.5 3.74 9.5 4.74 12 1zm0 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>',
     '<circle cx="12" cy="12" r="2" fill="var(--surface-100, #1d222f)"/>')

print(f'\nDone — {len(["adventure","explore","trip","itinerary","destinations","map","plan","bookings","flights","stays","local","activities","nature","beach","mountains","city","road-trip","hiking","camping","cycling","water-sports","wildlife","food-drink","eating-out","cooking","party-club","festival","concert","culture","events","favorites","saved","share","collaborate","filters","settings"])} icons written to src/assets/icons/')
