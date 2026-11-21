/** Stars reward understanding: errors and hints reduce them, time never does. */
export function starsFor(mistakes: number, hints: number): 1 | 2 | 3 {
  if (mistakes === 0 && hints === 0) return 3;
  if (mistakes <= 2 && hints <= 1) return 2;
  return 1;
}

export const XP_BASE = 50;
export const XP_PER_STAR = 25;

/** XP gained when finishing a level, only counting improvements. */
export function xpGain(previousStars: number, newStars: number): number {
  const base = previousStars === 0 ? XP_BASE : 0;
  return base + Math.max(0, newStars - previousStars) * XP_PER_STAR;
}

export interface Rank {
  title: string;
  minXp: number;
}

export const RANKS: Rank[] = [
  { title: 'Curioso', minXp: 0 },
  { title: 'Aprendiz cuántico', minXp: 300 },
  { title: 'Lector de diagramas', minXp: 800 },
  { title: 'Constructor de vértices', minXp: 1500 },
  { title: 'Físico de partículas', minXp: 2400 },
  { title: 'Discípulo de Feynman', minXp: 3000 },
];

export function rankFor(xp: number): { rank: Rank; next?: Rank; progress: number } {
  let i = 0;
  while (i + 1 < RANKS.length && xp >= RANKS[i + 1].minXp) i++;
  const rank = RANKS[i];
  const next = RANKS[i + 1];
  const progress = next ? (xp - rank.minXp) / (next.minXp - rank.minXp) : 1;
  return { rank, next, progress };
}
