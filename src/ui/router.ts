import { useEffect, useState } from 'react';

export type Route =
  | { page: 'trips' }
  | { page: 'new' }
  | { page: 'profile' }
  | { page: 'settings' }
  | { page: 'trip'; id: string; tab: TripTab }
  | { page: 'print'; id: string }
  | { page: 'notFound'; hash: string };

export type TripTab = 'plan' | 'dates' | 'explore' | 'itinerary' | 'setup';
const TABS: TripTab[] = ['plan', 'dates', 'explore', 'itinerary', 'setup'];

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts.length === 0) return { page: 'trips' };
  const [a, b, c] = parts;
  if (a === 'new' && !b) return { page: 'new' };
  if (a === 'profile' && !b) return { page: 'profile' };
  if (a === 'settings' && !b) return { page: 'settings' };
  if (a === 'trip' && b) {
    if (!c) return { page: 'trip', id: b, tab: 'plan' };
    if (c === 'print') return { page: 'print', id: b };
    if ((TABS as string[]).includes(c)) return { page: 'trip', id: b, tab: c as TripTab };
  }
  return { page: 'notFound', hash };
}

export function href(r: Exclude<Route, { page: 'notFound' }>): string {
  switch (r.page) {
    case 'trips':
      return '#/';
    case 'trip':
      return `#/trip/${r.id}/${r.tab}`;
    case 'print':
      return `#/trip/${r.id}/print`;
    default:
      return `#/${r.page}`;
  }
}

export function go(r: Exclude<Route, { page: 'notFound' }>): void {
  window.location.hash = href(r);
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const on = () => {
      setRoute(parseHash(window.location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}
