import { useState } from 'react';
import { content, LOCALES } from '../../content';
import { useGame, type LanguagePref } from '../../game/store';
import { LANGUAGE_NAMES, t } from '../../i18n';

export function Settings() {
  const { settings, setSetting, reset, metrics, progress, xp, mastery } = useGame();
  const [confirm, setConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  const exportData = () => {
    const payload = {
      app: 'feynman-quest',
      version: __APP_VERSION__,
      exportedAt: new Date().toISOString(),
      xp,
      progress,
      mastery,
      metrics,
      summary: {
        levelsCompleted: Object.keys(progress).length,
        tutorialCompleted: !!progress[5],
        firstFiveNoHelp: [1, 2, 3, 4, 5].every((i) => metrics[i]?.firstNoHelp),
      },
    };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `feynman-quest-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    navigator.clipboard?.writeText(json).then(() => setCopied(true), () => {});
  };

  const languages: LanguagePref[] = ['auto', ...LOCALES];
  const language = settings.language ?? 'auto';

  return (
    <div className="screen settings with-nav">
      <header className="page-head">
        <h1>{t.settings.title}</h1>
      </header>

      <section className="card list">
        <Toggle label={t.settings.sound} desc={t.settings.soundDesc} checked={settings.sound} onChange={(v) => setSetting('sound', v)} />
        <Toggle label={t.settings.haptics} desc={t.settings.hapticsDesc} checked={settings.haptics} onChange={(v) => setSetting('haptics', v)} />
        <Toggle label={t.settings.motion} desc={t.settings.motionDesc} checked={settings.reducedMotion} onChange={(v) => setSetting('reducedMotion', v)} />
      </section>

      <section className="card">
        <h3 className="card-title" id="language-title">
          {t.settings.language}
        </h3>
        <div className="language-picker" role="radiogroup" aria-labelledby="language-title">
          {languages.map((l) => (
            <button
              key={l}
              role="radio"
              aria-checked={language === l}
              lang={l === 'auto' ? undefined : l}
              className={`chip ${language === l ? 'is-active' : ''}`}
              onClick={() => setSetting('language', l)}
            >
              {l === 'auto' ? t.settings.auto : LANGUAGE_NAMES[l]}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h3 className="card-title">{t.settings.testing}</h3>
        <p className="muted">{t.settings.testingBody}</p>
        <button className="btn block" onClick={exportData}>
          {t.settings.export}
        </button>
        {copied && <p className="muted small">{t.settings.copied}</p>}
      </section>

      <section className="card">
        <h3 className="card-title">{t.settings.progress}</h3>
        {!confirm ? (
          <button className="btn ghost danger block" onClick={() => setConfirm(true)}>
            {t.settings.reset}
          </button>
        ) : (
          <div className="confirm">
            <p>{t.settings.confirm}</p>
            <div className="two-btns">
              <button className="btn ghost" onClick={() => setConfirm(false)}>
                {t.settings.cancel}
              </button>
              <button
                className="btn danger"
                onClick={() => {
                  reset();
                  setConfirm(false);
                }}
              >
                {t.settings.confirmReset}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="card about">
        <h3 className="card-title">{t.settings.about}</h3>
        <p className="muted">{t.settings.aboutBody(__APP_VERSION__, content.levels.length)}</p>
        <p className="muted small">{t.settings.aboutNote}</p>
      </section>
    </div>
  );
}

function Toggle({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="toggle-row">
      <span>
        <strong>{label}</strong>
        <small>{desc}</small>
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <i className="switch" aria-hidden />
    </label>
  );
}
