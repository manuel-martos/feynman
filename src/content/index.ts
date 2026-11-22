/**
 * Locale registry. Spanish is the source content; English and Catalan are text overlays
 * (see ./localize.ts). The exports below are live bindings: `setLocale` swaps them, and the
 * app remounts its screens when the language changes, so every reader sees the new values.
 */
import type { Issue, Timeline } from '../engine';
import type { Content } from '../game/types';
import { issueText as issueTextCa } from './ca/issues';
import { narrate as narrateCa } from './ca/narrate';
import { practiceText as practiceCa } from './ca/practice';
import { issueText as issueTextEn } from './en/issues';
import { narrate as narrateEn } from './en/narrate';
import { practiceText as practiceEn } from './en/practice';
import { contentEs } from './es';
import { issueText as issueTextEs, type IssueText } from './es/issues';
import { narrate as narrateEs } from './es/narrate';
import { practiceText as practiceEs } from './es/practice';
import { strings as stringsCa } from './locales/ca';
import { strings as stringsEn } from './locales/en';
import { localize } from './localize';
import type { Caption } from './narrate';
import { practiceSession as session, type PracticeText } from './practice';

export type Locale = 'es' | 'ca' | 'en';
export const LOCALES: Locale[] = ['es', 'ca', 'en'];

interface Pack {
  content: () => Content;
  issueText: (i: Issue) => IssueText;
  narrate: (tl: Timeline, step: number) => Caption;
  practice: PracticeText;
}

const lazy = <T,>(f: () => T) => {
  let v: T | undefined;
  return () => (v ??= f());
};

const PACKS: Record<Locale, Pack> = {
  es: { content: () => contentEs, issueText: issueTextEs, narrate: narrateEs, practice: practiceEs },
  ca: { content: lazy(() => localize(contentEs, stringsCa)), issueText: issueTextCa, narrate: narrateCa, practice: practiceCa },
  en: { content: lazy(() => localize(contentEs, stringsEn)), issueText: issueTextEn, narrate: narrateEn, practice: practiceEn },
};

/** The first supported language in the user's preference list; English otherwise. */
export function detectLocale(languages: readonly string[]): Locale {
  for (const tag of languages) {
    const l = tag.toLowerCase().split('-')[0];
    if ((LOCALES as string[]).includes(l)) return l as Locale;
  }
  return 'en';
}

export let locale: Locale = 'es';
export let content: Content = PACKS.es.content();
export let issueText = PACKS.es.issueText;
export let narrate = PACKS.es.narrate;
export let practiceText = PACKS.es.practice;

export function setLocale(l: Locale) {
  const p = PACKS[l];
  locale = l;
  content = p.content();
  issueText = p.issueText;
  narrate = p.narrate;
  practiceText = p.practice;
}

/** Content, issue texts and narration for a given locale (used by the shared export). */
export const pack = (l: Locale) => ({ content: PACKS[l].content(), issueText: PACKS[l].issueText, narrate: PACKS[l].narrate, practice: PACKS[l].practice });

export function practiceSession(levelsDone: number) {
  return session(levelsDone, practiceText, (i) => issueText(i).body);
}

export type { Caption, IssueText };
