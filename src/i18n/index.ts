/**
 * Interface language. `t` is a live binding swapped by `applyLocale`; the app remounts its
 * screens when the language changes, so components can read `t` directly during render.
 */
import { detectLocale, setLocale, type Locale } from '../content';
import type { LanguagePref } from '../game/store';
import { ca } from './ca';
import { en } from './en';
import { es, type Dict } from './es';

const DICTS: Record<Locale, Dict> = { es, ca, en };

/** Each language named in itself, for the picker. */
export const LANGUAGE_NAMES: Record<Locale, string> = { es: 'Español', ca: 'Català', en: 'English' };

export let t: Dict = es;
let current: Locale = 'es';

export function resolveLocale(pref: LanguagePref | undefined): Locale {
  if (pref && pref !== 'auto') return pref;
  const langs = typeof navigator === 'undefined' ? [] : navigator.languages?.length ? navigator.languages : [navigator.language];
  return detectLocale(langs.filter(Boolean));
}

export function applyLocale(l: Locale) {
  if (l === current && t === DICTS[l]) return;
  current = l;
  t = DICTS[l];
  setLocale(l);
  if (typeof document !== 'undefined') document.documentElement.lang = l;
}

export type { Dict };
