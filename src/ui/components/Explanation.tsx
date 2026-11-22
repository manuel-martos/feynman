import { useState } from 'react';
import type { Explanation as Ex } from '../../game/types';
import type { Layer } from '../../game/store';
import { sfx } from '../audio';

const TABS: { id: Layer; label: string; q: string }[] = [
  { id: 'intuitive', label: 'Intuitiva', q: '¿Qué estoy viendo?' },
  { id: 'scientific', label: 'Científica', q: '¿Qué significa físicamente?' },
  { id: 'math', label: 'Matemática', q: '¿Cómo se expresa matemáticamente?' },
];

export function Explanation({ ex, mathUnlocked, onView }: { ex: Ex; mathUnlocked: boolean; onView?: (l: Layer) => void }) {
  const [tab, setTab] = useState<Layer>('intuitive');
  const current = TABS.find((t) => t.id === tab)!;
  return (
    <div className="explanation">
      <div className="tabs" role="tablist" aria-label="Profundidad de la explicación">
        {/* The math layer stays hidden until it's unlocked (level 5), rather than shown as a dead tab. */}
        {TABS.filter((t) => t.id !== 'math' || mathUnlocked).map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`tab ${tab === t.id ? 'is-active' : ''}`}
            onClick={() => {
              setTab(t.id);
              onView?.(t.id);
              sfx('tap');
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="tab-panel" role="tabpanel" key={tab}>
        <p className="tab-q">{current.q}</p>
        <p className={tab === 'math' ? 'math' : ''}>{ex[tab]}</p>
      </div>
    </div>
  );
}
