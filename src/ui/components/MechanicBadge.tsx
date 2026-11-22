import type { Mechanic } from '../../game/types';
import { t } from '../../i18n';

const LABEL: Record<Mechanic, string> = { decode: 'Decode', build: 'Build', debug: 'Debug' };
const ICON: Record<Mechanic, string> = { decode: '◉', build: '✦', debug: '⚠' };

export function MechanicBadge({ mechanic, long = false }: { mechanic: Mechanic; long?: boolean }) {
  return (
    <span className={`badge mech-${mechanic}`}>
      <span aria-hidden>{ICON[mechanic]}</span> {LABEL[mechanic]}
      {long && <span className="badge-sub"> · {t.mechanic[mechanic]}</span>}
    </span>
  );
}
