import React from 'react';

/**
 * WILDSTROM Icon component
 *
 * Renders a glyph-only SVG icon from src/assets/icons/.
 * The icon itself is `fill="currentColor"` with no baked-in gradient.
 * Wrap in an `.icon-tile` container div with a CSS gradient class to
 * apply the Storm or Daylight gradient treatment:
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

interface IconProps {
  /** Icon name matching a file in src/assets/icons/ */
  name: IconName;
  /** Icon size in px; sets both width and height. Default: 24 */
  size?: number;
  /** Additional CSS class(es) to apply to the <svg> element */
  className?: string;
  /** Explicit color; overrides CSS `color` inheritance */
  color?: string;
  /** Accessible label; use when the icon has semantic meaning standalone */
  label?: string;
}

// Eagerly import all icons via Vite's import.meta.glob.
// Each entry is a raw SVG string (via ?raw suffix) keyed by filename.
const svgModules = import.meta.glob<string>('../assets/icons/*.svg', {
  eager: true,
  query: '?raw',
  import: 'default',
});

function getSvgContent(name: IconName): string | null {
  const key = `../assets/icons/${name}.svg`;
  return svgModules[key] ?? null;
}

/**
 * Extracts the inner SVG content (everything between <svg …> and </svg>)
 * and the viewBox attribute from a raw SVG string.
 */
function parseSvg(raw: string): { inner: string; viewBox: string } {
  const viewBoxMatch = raw.match(/viewBox="([^"]+)"/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 24 24';
  // Strip outer <svg …> wrapper — keep only child elements
  const inner = raw
    .replace(/<svg[^>]*>/, '')
    .replace(/<\/svg>/, '')
    .trim();
  return { inner, viewBox };
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  className,
  color,
  label,
}) => {
  const raw = getSvgContent(name);

  if (!raw) {
    if (import.meta.env.DEV) {
      console.warn(`[Icon] Missing icon: "${name}"`);
    }
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        className={className}
        style={color ? { color } : undefined}
      />
    );
  }

  const { inner, viewBox } = parseSvg(raw);

  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="currentColor"
      aria-hidden={!label}
      role={label ? 'img' : undefined}
      aria-label={label}
      className={className}
      style={color ? { color } : undefined}
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
};

export default Icon;
