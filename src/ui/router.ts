import { useSyncExternalStore } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'map'; chapter?: number }
  | { name: 'level'; id: number }
  | { name: 'library' }
  | { name: 'settings' }
  | { name: 'practice' };

export function parse(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  switch (parts[0]) {
    case 'map':
      return { name: 'map', chapter: parts[1] ? Number(parts[1]) : undefined };
    case 'level':
      return { name: 'level', id: Number(parts[1]) || 1 };
    case 'library':
      return { name: 'library' };
    case 'settings':
      return { name: 'settings' };
    case 'practice':
      return { name: 'practice' };
    default:
      return { name: 'home' };
  }
}

export function href(r: Route): string {
  switch (r.name) {
    case 'home':
      return '#/';
    case 'map':
      return r.chapter ? `#/map/${r.chapter}` : '#/map';
    case 'level':
      return `#/level/${r.id}`;
    default:
      return `#/${r.name}`;
  }
}

export function navigate(r: Route) {
  window.location.hash = href(r);
}

const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
};

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash, () => '');
  return parse(hash);
}
