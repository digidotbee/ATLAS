import React from 'react';
import { ICON_MAP, type IconName } from './icons';

export type { IconName };

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
 * Full icon registry lives in ./icons.ts.
 */

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

/**
 * Alias for `Icon` — use whichever reads better in context.
 * Both are identical; `OrivoirIcon` signals ORIVOIR semantic names
 * rather than raw Lucide names.
 */
export const OrivoirIcon = Icon;
