import { describe, expect, it } from 'vitest';
import { timeline, validate } from '../engine';
import { ca as uiCa } from '../i18n/ca';
import { en as uiEn } from '../i18n/en';
import { es as uiEs } from '../i18n/es';
import { process } from './diagrams';
import { contentEs } from './es';
import { strings as stringsCa } from './locales/ca';
import { strings as stringsEn } from './locales/en';
import { extractStrings } from './localize';
import { detectLocale, pack, practiceSession, setLocale } from './index';

const source = extractStrings(contentEs);

describe.each([
  ['ca', stringsCa],
  ['en', stringsEn],
] as const)('%s content translation', (locale, strings) => {
  it('translates exactly the Spanish strings, none empty', () => {
    expect(Object.keys(strings).sort()).toEqual(Object.keys(source).sort());
    expect(Object.entries(strings).filter(([, v]) => !v.trim())).toEqual([]);
  });

  it('keeps the structure of the Spanish content', () => {
    const c = pack(locale).content;
    expect(c.levels.map((l) => [l.id, l.steps.map((s) => s.id)])).toEqual(contentEs.levels.map((l) => [l.id, l.steps.map((s) => s.id)]));
    expect(c.levels[0].title).toBe(strings[Object.keys(strings).find((k) => k.endsWith('.title') && k.startsWith('levels.1.'))!]);
  });
});

describe('interface dictionaries', () => {
  /** Shape of a dictionary: keys, array lengths and function arities. */
  const shape = (v: unknown): unknown =>
    typeof v === 'function' ? `fn/${v.length}` : Array.isArray(v) ? v.map(shape) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, shape(x)])) : typeof v;

  it.each([['ca', uiCa], ['en', uiEn]])('%s has the same shape as Spanish', (_, d) => {
    expect(shape(d)).toEqual(shape(uiEs));
  });
});

describe('locale selection', () => {
  it('picks the first supported language and falls back to English', () => {
    expect(detectLocale(['ca-ES', 'es-ES'])).toBe('ca');
    expect(detectLocale(['es-MX'])).toBe('es');
    expect(detectLocale(['de-DE', 'fr'])).toBe('en');
    expect(detectLocale([])).toBe('en');
  });

  it('switches issue texts, narration and Mastery questions together', () => {
    const d = process('moller', 't');
    d.edges[0] = { ...d.edges[0], from: d.edges[0].to, to: d.edges[0].from };
    const issue = validate(d).issues[0];
    try {
      setLocale('en');
      expect(pack('en').issueText(issue).title).toBe('The arrows don\'t flow');
      expect(pack('en').narrate(timeline(process('moller', 't')), 0).text).toBe('Two electrons come in.');
      expect(practiceSession(0).every((s) => /^[A-Z]/.test(s.prompt) && !/[¿áéíóúñ]/.test(s.prompt))).toBe(true);
      setLocale('ca');
      expect(pack('ca').narrate(timeline(process('moller', 't')), 0).text).toBe('Entren dos electrons.');
    } finally {
      setLocale('es');
    }
  });
});
