import { useGame } from '../../game/store';
import { href, type Route } from '../router';

const ITEMS: { route: Route; label: string; icon: string }[] = [
  { route: { name: 'home' }, label: 'Inicio', icon: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z' },
  { route: { name: 'map' }, label: 'Campaña', icon: 'M9 4l6 2 6-2v15l-6 2-6-2-6 2V6zM9 4v15M15 6v15' },
  { route: { name: 'library' }, label: 'Colección', icon: 'M4 5h6v14H4zM14 5h6v14h-6zM4 9h6M14 9h6' },
  { route: { name: 'settings' }, label: 'Ajustes', icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 14H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 3V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 21 10h.1a2 2 0 1 1 0 4H21a1.7 1.7 0 0 0-1.6 1z' },
];

export function BottomNav({ active }: { active: Route['name'] }) {
  const newConcepts = useGame((s) => s.concepts.filter((c) => !s.seenConcepts.includes(c)).length);
  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {ITEMS.map((it) => (
        <a key={it.label} href={href(it.route)} className={active === it.route.name ? 'is-active' : ''} aria-current={active === it.route.name ? 'page' : undefined}>
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
            <path d={it.icon} />
          </svg>
          <span>{it.label}</span>
          {it.route.name === 'library' && newConcepts > 0 && <i className="dot" aria-label={`${newConcepts} nuevos`} />}
        </a>
      ))}
    </nav>
  );
}
