/**
 * Content translation. Spanish (`./es`) is the source content: it holds the structure (diagrams,
 * answers, ids) as well as the text. Other locales are flat maps from a stable path to the
 * translated text, merged over the Spanish structure, so diagrams and answers are never duplicated.
 *
 * Paths use ids rather than positions wherever there is one, e.g.
 *   levels.3.steps.s1.prompt · levels.3.steps.s1.options.b.feedback · concepts.photon.body
 * `content.test.ts` checks that every locale has exactly the keys of the Spanish source.
 */
import type { Content } from '../game/types';

export type Strings = Record<string, string>;

/** Fields that hold player-facing text. */
const TEXT = new Set([
  'title', 'subtitle', 'goals', 'summary', 'body', 'intro', 'success', 'intuitive', 'scientific', 'math',
  'prompt', 'solved', 'wrongDefault', 'text', 'feedback', 'label',
]);
/** Containers whose every string value is text (`hints: [a, b]`, `wrong: { in1: '…' }`). */
const TEXT_CONTAINERS = new Set(['hints', 'wrong']);
/** Diagram geometry never holds translatable text. */
const SKIP = new Set(['diagram', 'nodes', 'edges']);

const segment = (x: unknown, i: number) =>
  x && typeof x === 'object' && 'id' in x ? String((x as { id: unknown }).id) : String(i);

function walk(v: unknown, path: string[], key: string, inText: boolean, visit: (path: string, s: string) => string): unknown {
  if (typeof v === 'string') return inText || TEXT.has(key) ? visit(path.join('.'), v) : v;
  if (Array.isArray(v)) return v.map((x, i) => walk(x, [...path, segment(x, i)], key, TEXT_CONTAINERS.has(key), visit));
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) {
      out[k] = SKIP.has(k) ? x : walk(x, [...path, k], k, TEXT_CONTAINERS.has(key), visit);
    }
    return out;
  }
  return v;
}

/** Every player-facing string of `content`, by path. */
export function extractStrings(content: Content): Strings {
  const out: Strings = {};
  walk(content, [], '', false, (p, s) => ((out[p] = s), s));
  return out;
}

/** `content` with its text replaced by `strings`; anything missing keeps the source text. */
export function localize(content: Content, strings: Strings): Content {
  return walk(content, [], '', false, (p, s) => strings[p] ?? s) as Content;
}
