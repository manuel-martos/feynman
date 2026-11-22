import { useState } from 'react';
import type { Explanation as Ex } from '../../game/types';
import type { Layer } from '../../game/store';
import { sfx } from '../audio';
import { t } from '../../i18n';

const LAYERS: Layer[] = ['intuitive', 'scientific', 'math'];

export function Explanation({ ex, mathUnlocked, onView }: { ex: Ex; mathUnlocked: boolean; onView?: (l: Layer) => void }) {
  const [tab, setTab] = useState<Layer>('intuitive');
  return (
    <div className="explanation">
      <div className="tabs" role="tablist" aria-label={t.explanation.label}>
        {/* The math layer stays hidden until it's unlocked (level 5), rather than shown as a dead tab. */}
        {LAYERS.filter((id) => id !== 'math' || mathUnlocked).map((id) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            className={`tab ${tab === id ? 'is-active' : ''}`}
            onClick={() => {
              setTab(id);
              onView?.(id);
              sfx('tap');
            }}
          >
            {t.explanation[id].label}
          </button>
        ))}
      </div>
      <div className="tab-panel" role="tabpanel" key={tab}>
        <p className="tab-q">{t.explanation[tab].q}</p>
        <p className={tab === 'math' ? 'math' : ''}>{ex[tab]}</p>
      </div>
    </div>
  );
}
