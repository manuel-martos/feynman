import { describe, expect, it } from 'vitest';
import { rankFor, starsFor, xpGain } from './scoring';

describe('scoring', () => {
  it('stars', () => {
    expect(starsFor(0, 0)).toBe(3);
    expect(starsFor(1, 0)).toBe(2);
    expect(starsFor(0, 1)).toBe(2);
    expect(starsFor(3, 0)).toBe(1);
    expect(starsFor(0, 2)).toBe(1);
  });
  it('xp only rewards improvements', () => {
    expect(xpGain(0, 3)).toBe(125);
    expect(xpGain(2, 3)).toBe(25);
    expect(xpGain(3, 1)).toBe(0);
  });
  it('max campaign xp reaches the top rank', () => {
    expect(rankFor(24 * 125).rank.title).toBe('Discípulo de Feynman');
    expect(rankFor(0).next?.minXp).toBe(300);
  });
});
