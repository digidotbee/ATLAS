import { useEffect, useState } from 'react';

export type ThemePref = 'auto' | 'storm' | 'daylight';
const KEY = 'atlas:theme';

function read(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'auto' || v === 'daylight' ? v : 'storm';
  } catch {
    return 'storm';
  }
}

function apply(p: ThemePref) {
  document.documentElement.dataset.theme = p;
}

// Apply before first paint to avoid a flash of the wrong mode.
let currentPref = read();
apply(currentPref);

const listeners = new Set<(p: ThemePref) => void>();

/** Per-device display preference (not synced): Auto follows the device's light/dark setting. */
export function useThemePref(): [ThemePref, (p: ThemePref) => void, 'storm' | 'daylight'] {
  const [pref, setPref] = useState<ThemePref>(currentPref);
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
      localStorage.setItem(KEY, p);
    } catch {
      // Storage blocked (private mode): the choice still applies for this visit.
    }
    currentPref = p;
    apply(p);
    listeners.forEach((fn) => fn(p));
  };
  const effective = pref === 'auto' ? (systemLight ? 'daylight' : 'storm') : pref;
  return [pref, set, effective];
}
