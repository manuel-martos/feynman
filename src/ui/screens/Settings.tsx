import { useState } from 'react';
import { content } from '../../content';
import { useGame } from '../../game/store';

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
    a.download = `feynman-quest-datos-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    navigator.clipboard?.writeText(json).then(() => setCopied(true), () => {});
  };

  return (
    <div className="screen settings with-nav">
      <header className="page-head">
        <h1>Ajustes</h1>
      </header>

      <section className="card list">
        <Toggle label="Sonido" desc="Efectos al conectar líneas y acertar" checked={settings.sound} onChange={(v) => setSetting('sound', v)} />
        <Toggle label="Vibración" desc="Respuesta háptica en el móvil" checked={settings.haptics} onChange={(v) => setSetting('haptics', v)} />
        <Toggle label="Reducir movimiento" desc="Desactiva las animaciones continuas" checked={settings.reducedMotion} onChange={(v) => setSetting('reducedMotion', v)} />
      </section>

      <section className="card">
        <h3 className="card-title">Pruebas con usuarios</h3>
        <p className="muted">
          El juego guarda en este dispositivo métricas anónimas de aprendizaje: errores, pistas, tiempos y capas de explicación consultadas. Nunca salen del dispositivo, salvo que las exportes tú.
        </p>
        <button className="btn block" onClick={exportData}>
          Exportar datos de prueba (JSON)
        </button>
        {copied && <p className="muted small">También se han copiado al portapapeles.</p>}
      </section>

      <section className="card">
        <h3 className="card-title">Progreso</h3>
        {!confirm ? (
          <button className="btn ghost danger block" onClick={() => setConfirm(true)}>
            Reiniciar progreso
          </button>
        ) : (
          <div className="confirm">
            <p>¿Seguro? Perderás estrellas, XP y colección.</p>
            <div className="two-btns">
              <button className="btn ghost" onClick={() => setConfirm(false)}>
                Cancelar
              </button>
              <button
                className="btn danger"
                onClick={() => {
                  reset();
                  setConfirm(false);
                }}
              >
                Sí, reiniciar
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="card about">
        <h3 className="card-title">Acerca de</h3>
        <p className="muted">
          Feynman Quest v{__APP_VERSION__}. {content.levels.length} niveles de electrodinámica cuántica (QED), del orden árbol a los bucles. Convención: el tiempo avanza de izquierda a derecha.
        </p>
        <p className="muted small">
          Un diagrama de Feynman representa una contribución a una amplitud de probabilidad, no una fotografía de trayectorias. Las soluciones las comprueba un validador determinista.
        </p>
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
