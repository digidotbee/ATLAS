import { useEffect, useState } from 'react';

export type ThemePref = 'auto' | 'storm' | 'daylight';
const KEY = 'atlas:theme';

function read(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'storm' || v === 'daylight' ? v : 'auto';
  } catch {
    return 'auto';
  }
}

function apply(p: ThemePref) {
  const el = document.documentElement;
  if (p === 'auto') delete el.dataset.theme;
  else el.dataset.theme = p;
}

// Apply before first paint to avoid a flash of the wrong mode.
apply(read());

const listeners = new Set<(p: ThemePref) => void>();

/** Per-device display preference (not synced): Auto follows the device's light/dark setting. */
export function useThemePref(): [ThemePref, (p: ThemePref) => void, 'storm' | 'daylight'] {
  const [pref, setPref] = useState<ThemePref>(read);
  const [systemLight, setSystemLight] = useState(() => window.matchMedia?.('(prefers-color-scheme: light)').matches ?? false);
  useEffect(() => {
    const l = (p: ThemePref) => setPref(p);
    listeners.add(l);
    const mq = window.matchMedia?.('(prefers-color-scheme: light)');
    const onMq = () => setSystemLight(mq.matches);
    mq?.addEventListener('change', onMq);
    return () => {
      listeners.delete(l);
      mq?.removeEventListener('change', onMq);
    };
  }, []);
  const set = (p: ThemePref) => {
    try {
      if (p === 'auto') localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, p);
    } catch {
      // Storage blocked (private mode): the choice still applies for this visit.
    }
    apply(p);
    listeners.forEach((fn) => fn(p));
  };
  const effective = pref === 'auto' ? (systemLight ? 'daylight' : 'storm') : pref;
  return [pref, set, effective];
}
