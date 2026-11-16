/**
 * ORIVOIR Icon Registry
 *
 * Single source of truth for all ORIVOIR semantic icon names.
 * Maps ORIVOIR names → Lucide React components, with metadata
 * for documentation, tooling, and icon-picker UIs.
 *
 * Usage:
 *   import { ICON_MAP, type IconName } from './icons';
 */

import {
  Sunrise,
  Compass,
  Luggage,
  CalendarCheck,
  MapPin,
  Map,
  ClipboardList,
  Ticket,
  PlaneTakeoff,
  BedDouble,
  House,
  Ship,
  Dumbbell,
  TreePine,
  Palmtree,
  Mountain,
  Building2,
  Car,
  Footprints,
  TentTree,
  Bike,
  Sailboat,
  PawPrint,
  UtensilsCrossed,
  Soup,
  CookingPot,
  PartyPopper,
  Sparkles,
  Guitar,
  Landmark,
  CalendarDays,
  Heart,
  Bookmark,
  Share2,
  UsersRound,
  SlidersHorizontal,
  Settings2,
  type LucideIcon,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type IconCategory = 'Navigation' | 'Activity' | 'Food/Social' | 'Utility';

export interface IconDefinition {
  /** ORIVOIR semantic name used in <Icon name="…" /> */
  name: string;
  /** Functional group for filtering and documentation */
  category: IconCategory;
  /** Lucide component name as a string — for docs, audits, and tooling */
  lucide: string;
  /** Short rationale or disambiguation note */
  notes: string;
  /** Actual Lucide React component — used at render time */
  component: LucideIcon;
}

// ---------------------------------------------------------------------------
// Registry — 37 icons, authoritative list
// ---------------------------------------------------------------------------

export const ICON_REGISTRY: IconDefinition[] = [
  // Navigation (12)
  { name: 'adventure',    category: 'Navigation',   lucide: 'Sunrise',           notes: 'More evocative than Sun',                  component: Sunrise        },
  { name: 'explore',      category: 'Navigation',   lucide: 'Compass',           notes: 'Discovery + wayfinding',                   component: Compass        },
  { name: 'trip',         category: 'Navigation',   lucide: 'Luggage',           notes: 'Packed bag = trip in progress',            component: Luggage        },
  { name: 'itinerary',    category: 'Navigation',   lucide: 'CalendarCheck',     notes: 'Planned + confirmed schedule',             component: CalendarCheck  },
  { name: 'destinations', category: 'Navigation',   lucide: 'MapPin',            notes: 'Place marker; plural sense',               component: MapPin         },
  { name: 'map',          category: 'Navigation',   lucide: 'Map',               notes: 'Folded map; overview/cartography',         component: Map            },
  { name: 'plan',         category: 'Navigation',   lucide: 'ClipboardList',     notes: 'Checklist; planning mode',                 component: ClipboardList  },
  { name: 'bookings',     category: 'Navigation',   lucide: 'Ticket',            notes: 'Confirmed reservations',                   component: Ticket         },
  { name: 'flights',      category: 'Navigation',   lucide: 'PlaneTakeoff',      notes: 'Departure; air travel',                    component: PlaneTakeoff   },
  { name: 'stays',        category: 'Navigation',   lucide: 'BedDouble',         notes: 'Accommodation; overnight',                 component: BedDouble      },
  { name: 'local',        category: 'Navigation',   lucide: 'House',             notes: 'Local / neighborhood / home base',         component: House          },
  { name: 'cruise',       category: 'Navigation',   lucide: 'Ship',              notes: 'Passenger liner; distinct from Sailboat',  component: Ship           },

  // Activity (11)
  { name: 'activities',   category: 'Activity',     lucide: 'Dumbbell',          notes: 'General activities / fitness',             component: Dumbbell       },
  { name: 'nature',       category: 'Activity',     lucide: 'TreePine',          notes: 'Forest / wilderness / greenery',           component: TreePine       },
  { name: 'beach',        category: 'Activity',     lucide: 'Palmtree',          notes: 'Tropical / coastal',                       component: Palmtree       },
  { name: 'mountains',    category: 'Activity',     lucide: 'Mountain',          notes: 'Alpine / high elevation',                  component: Mountain       },
  { name: 'city',         category: 'Activity',     lucide: 'Building2',         notes: 'Urban / cityscape',                        component: Building2      },
  { name: 'road-trip',    category: 'Activity',     lucide: 'Car',               notes: 'Self-drive / road journey',                component: Car            },
  { name: 'hiking',       category: 'Activity',     lucide: 'Footprints',        notes: 'On-foot trail walking',                    component: Footprints     },
  { name: 'camping',      category: 'Activity',     lucide: 'TentTree',          notes: 'Tent camping; outdoor overnight',          component: TentTree       },
  { name: 'cycling',      category: 'Activity',     lucide: 'Bike',              notes: 'Bicycle / cycle touring',                  component: Bike           },
  { name: 'water-sports', category: 'Activity',     lucide: 'Sailboat',          notes: 'Sailing / water activities',               component: Sailboat       },
  { name: 'wildlife',     category: 'Activity',     lucide: 'PawPrint',          notes: 'Animals / safari / nature watching',       component: PawPrint       },

  // Food / Social (8)
  { name: 'food-drink',   category: 'Food/Social',  lucide: 'UtensilsCrossed',   notes: 'General food & beverage category',         component: UtensilsCrossed },
  { name: 'eating-out',   category: 'Food/Social',  lucide: 'Soup',              notes: 'Restaurants / dining',                     component: Soup           },
  { name: 'cooking',      category: 'Food/Social',  lucide: 'CookingPot',        notes: 'Cooking classes / markets',                component: CookingPot     },
  { name: 'party-club',   category: 'Food/Social',  lucide: 'PartyPopper',       notes: 'Nightlife / celebrations',                 component: PartyPopper    },
  { name: 'festival',     category: 'Food/Social',  lucide: 'Sparkles',          notes: 'Festivals / special events',               component: Sparkles       },
  { name: 'concert',      category: 'Food/Social',  lucide: 'Guitar',            notes: 'Live music / performance',                 component: Guitar         },
  { name: 'culture',      category: 'Food/Social',  lucide: 'Landmark',          notes: 'Museums / heritage / monuments',           component: Landmark       },
  { name: 'events',       category: 'Food/Social',  lucide: 'CalendarDays',      notes: 'Scheduled events; date-specific',          component: CalendarDays   },

  // Utility (6)
  { name: 'favorites',    category: 'Utility',      lucide: 'Heart',             notes: 'Liked / favourited items',                 component: Heart          },
  { name: 'saved',        category: 'Utility',      lucide: 'Bookmark',          notes: 'Bookmarked / saved for later',             component: Bookmark       },
  { name: 'share',        category: 'Utility',      lucide: 'Share2',            notes: 'Share action',                             component: Share2         },
  { name: 'collaborate',  category: 'Utility',      lucide: 'UsersRound',        notes: 'Group / co-planning',                      component: UsersRound     },
  { name: 'filters',      category: 'Utility',      lucide: 'SlidersHorizontal', notes: 'Filter / sort controls',                   component: SlidersHorizontal },
  { name: 'settings',     category: 'Utility',      lucide: 'Settings2',         notes: 'App settings / preferences',               component: Settings2      },
];

// ---------------------------------------------------------------------------
// Derived exports — built from the registry so they stay in sync
// ---------------------------------------------------------------------------

/** Union of all valid ORIVOIR icon name strings */
export type IconName = (typeof ICON_REGISTRY)[number]['name'];

/** Record mapping every ORIVOIR icon name to its Lucide component */
export const ICON_MAP = Object.fromEntries(
  ICON_REGISTRY.map(({ name, component }) => [name, component])
) as Record<IconName, LucideIcon>;
