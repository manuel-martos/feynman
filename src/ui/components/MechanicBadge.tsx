import type { Mechanic } from '../../game/types';

const LABEL: Record<Mechanic, string> = { decode: 'Decode', build: 'Build', debug: 'Debug' };
const HINT: Record<Mechanic, string> = { decode: 'Descifra el diagrama', build: 'Construye la interacción', debug: 'Encuentra el error' };
const ICON: Record<Mechanic, string> = { decode: '◉', build: '✦', debug: '⚠' };

export function MechanicBadge({ mechanic, long = false }: { mechanic: Mechanic; long?: boolean }) {
  return (
    <span className={`badge mech-${mechanic}`}>
      <span aria-hidden>{ICON[mechanic]}</span> {LABEL[mechanic]}
      {long && <span className="badge-sub"> · {HINT[mechanic]}</span>}
    </span>
  );
}
