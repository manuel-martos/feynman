import { useEffect } from 'react';
import { useGame } from './game/store';
import { setSoundEnabled } from './ui/audio';
import { useRoute } from './ui/router';
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

  useEffect(() => {
    setSoundEnabled(settings.sound);
    document.documentElement.dataset.motion = settings.reducedMotion ? 'reduced' : 'full';
  }, [settings]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [route.name]);

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
      <main className="app-frame">{screen}</main>
    </div>
  );
}
