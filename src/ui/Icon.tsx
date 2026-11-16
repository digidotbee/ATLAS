import React from 'react';
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

/**
 * WILDSTROM Icon component — powered by Lucide React
 *
 * Renders a Lucide icon using `currentColor` so it inherits color from the
 * CSS context. Wrap in an `.icon-tile` container to apply Storm / Daylight
 * gradient treatments:
 *
 *   <div className="icon-tile icon-tile--accent">
 *     <Icon name="adventure" size={20} />
 *   </div>
 *
 * Icon tile CSS is defined in theme.css under `.icon-tile`.
 */

export type IconName =
  | 'adventure'
  | 'explore'
  | 'trip'
  | 'itinerary'
  | 'destinations'
  | 'map'
  | 'plan'
  | 'bookings'
  | 'flights'
  | 'stays'
  | 'local'
  | 'activities'
  | 'nature'
  | 'beach'
  | 'mountains'
  | 'city'
  | 'road-trip'
  | 'hiking'
  | 'camping'
  | 'cycling'
  | 'water-sports'
  | 'wildlife'
  | 'food-drink'
  | 'eating-out'
  | 'cooking'
  | 'party-club'
  | 'festival'
  | 'concert'
  | 'culture'
  | 'events'
  | 'favorites'
  | 'saved'
  | 'share'
  | 'collaborate'
  | 'filters'
  | 'settings';

/** Maps ORIVOIR semantic icon names to Lucide components. */
const ICON_MAP: Record<IconName, LucideIcon> = {
  // Navigation
  adventure:    Sunrise,
  explore:      Compass,
  trip:         Luggage,
  itinerary:    CalendarCheck,
  destinations: MapPin,
  map:          Map,
  plan:         ClipboardList,
  bookings:     Ticket,
  flights:      PlaneTakeoff,
  stays:        BedDouble,
  local:        House,
  // Activity
  activities:   Dumbbell,
  nature:       TreePine,
  beach:        Palmtree,
  mountains:    Mountain,
  city:         Building2,
  'road-trip':  Car,
  hiking:       Footprints,
  camping:      TentTree,
  cycling:      Bike,
  'water-sports': Sailboat,
  wildlife:     PawPrint,
  // Food / Social
  'food-drink': UtensilsCrossed,
  'eating-out': Soup,
  cooking:      CookingPot,
  'party-club': PartyPopper,
  festival:     Sparkles,
  concert:      Guitar,
  culture:      Landmark,
  events:       CalendarDays,
  // Utility
  favorites:    Heart,
  saved:        Bookmark,
  share:        Share2,
  collaborate:  UsersRound,
  filters:      SlidersHorizontal,
  settings:     Settings2,
};

interface IconProps {
  /** ORIVOIR semantic icon name */
  name: IconName;
  /** Icon size in px; sets both width and height. Default: 24 */
  size?: number;
  /** Additional CSS class(es) to apply to the icon */
  className?: string;
  /** Explicit color; overrides CSS `color` inheritance */
  color?: string;
  /** Accessible label; use when the icon has semantic meaning standalone */
  label?: string;
  /** Stroke width override. Default: Lucide default (2) */
  strokeWidth?: number;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  className,
  color,
  label,
  strokeWidth,
}) => {
  const LucideComponent = ICON_MAP[name];

  if (!LucideComponent) {
    if (import.meta.env.DEV) {
      console.warn(`[Icon] Unknown icon name: "${name}"`);
    }
    // Render an invisible placeholder to avoid layout shifts
    return <span style={{ display: 'inline-block', width: size, height: size }} aria-hidden="true" />;
  }

  return (
    <LucideComponent
      size={size}
      color={color ?? 'currentColor'}
      strokeWidth={strokeWidth}
      aria-hidden={!label}
      role={label ? 'img' : undefined}
      aria-label={label}
      className={className}
    />
  );
};

export default Icon;
