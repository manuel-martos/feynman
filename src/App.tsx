import { useEffect, useReducer } from 'react';
import { useGame } from './game/store';
import { applyLocale, resolveLocale } from './i18n';
import { setSoundEnabled } from './ui/audio';
import { useRoute } from './ui/router';
import { BottomNav } from './ui/components/BottomNav';
import { Home } from './ui/screens/Home';
import { LevelScreen } from './ui/screens/LevelScreen';
import { Library } from './ui/screens/Library';
import { MapScreen } from './ui/screens/MapScreen';
import { Onboarding } from './ui/screens/Onboarding';
import { Practice } from './ui/screens/Practice';
import { Settings } from './ui/screens/Settings';

export function App() {
  const route = useRoute();
  const onboarded = useGame((s) => s.onboarded);
  const settings = useGame((s) => s.settings);
  // Re-resolve 'auto' when the browser's language changes.
  const [, relocale] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    window.addEventListener('languagechange', relocale);
    return () => window.removeEventListener('languagechange', relocale);
  }, []);
  // Applied during render so every screen below reads the new language; the keys below remount them.
  const locale = resolveLocale(settings.language);
  applyLocale(locale);

  useEffect(() => {
    setSoundEnabled(settings.sound);
    document.documentElement.dataset.motion = settings.reducedMotion ? 'reduced' : 'full';
  }, [settings]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [route.name]);

  const showNav = onboarded && ['home', 'map', 'library', 'settings'].includes(route.name);
  let screen;
  if (!onboarded && route.name !== 'level') screen = <Onboarding />;
  else
    switch (route.name) {
      case 'level':
        screen = <LevelScreen id={route.id} />;
        break;
      case 'map':
        screen = <MapScreen chapter={route.chapter} />;
        break;
      case 'library':
        screen = <Library />;
        break;
      case 'settings':
        screen = <Settings />;
        break;
      case 'practice':
        screen = <Practice />;
        break;
      default:
        screen = <Home />;
    }

  return (
    <div className="app">
      <div className="cosmos" aria-hidden />
      <main className="app-frame" key={locale}>
        {screen}
      </main>
      {/* Lives outside the animated screen so it never moves or remounts. */}
      {showNav && <BottomNav key={locale} active={route.name} />}
    </div>
  );
}
