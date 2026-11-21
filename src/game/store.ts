import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { starsFor, xpGain } from './scoring';

export type Layer = 'intuitive' | 'scientific' | 'math';

export interface LevelProgress {
  stars: number;
  completions: number;
}

/** Local playtest metrics (design doc §8). Never leaves the device. */
export interface LevelMetrics {
  starts: number;
  completions: number;
  mistakes: number;
  hints: number;
  totalMs: number;
  /** Did the player complete it without hints on their first completion? */
  firstNoHelp?: boolean;
  /** Did they start the next level voluntarily right after? */
  continuedToNext: number;
  layers: Record<Layer, number>;
  firstCompletedAt?: string;
}

export interface Settings {
  sound: boolean;
  haptics: boolean;
  reducedMotion: boolean;
}

export interface LevelResult {
  stars: 1 | 2 | 3;
  xp: number;
  newConcepts: string[];
  firstTime: boolean;
  previousStars: number;
}

interface State {
  onboarded: boolean;
  xp: number;
  progress: Record<number, LevelProgress>;
  concepts: string[];
  seenConcepts: string[];
  settings: Settings;
  metrics: Record<number, LevelMetrics>;
  mastery: { sessions: number; correct: number; total: number };

  finishOnboarding: () => void;
  startLevel: (id: number, fromPrevious: boolean) => void;
  completeLevel: (id: number, mistakes: number, hints: number, ms: number, concepts: string[]) => LevelResult;
  recordLayer: (id: number, layer: Layer) => void;
  markConceptsSeen: () => void;
  recordMastery: (correct: number, total: number) => void;
  setSetting: <K extends keyof Settings>(k: K, v: Settings[K]) => void;
  reset: () => void;
}

const emptyMetrics = (): LevelMetrics => ({
  starts: 0,
  completions: 0,
  mistakes: 0,
  hints: 0,
  totalMs: 0,
  continuedToNext: 0,
  layers: { intuitive: 0, scientific: 0, math: 0 },
});

const initial = {
  onboarded: false,
  xp: 0,
  progress: {} as Record<number, LevelProgress>,
  concepts: [] as string[],
  seenConcepts: [] as string[],
  settings: { sound: true, haptics: true, reducedMotion: false } as Settings,
  metrics: {} as Record<number, LevelMetrics>,
  mastery: { sessions: 0, correct: 0, total: 0 },
};

export const useGame = create<State>()(
  persist(
    (set, get) => ({
      ...initial,
      finishOnboarding: () => set({ onboarded: true }),
      startLevel: (id, fromPrevious) =>
        set((s) => {
          const metrics = { ...s.metrics };
          const m = { ...(metrics[id] ?? emptyMetrics()) };
          m.starts++;
          metrics[id] = m;
          if (fromPrevious && metrics[id - 1]) metrics[id - 1] = { ...metrics[id - 1], continuedToNext: metrics[id - 1].continuedToNext + 1 };
          return { metrics };
        }),
      completeLevel: (id, mistakes, hints, ms, concepts) => {
        const s = get();
        const prev = s.progress[id];
        const stars = starsFor(mistakes, hints);
        const previousStars = prev?.stars ?? 0;
        const xp = xpGain(previousStars, stars);
        const newConcepts = concepts.filter((c) => !s.concepts.includes(c));
        const m = { ...(s.metrics[id] ?? emptyMetrics()) };
        if (!m.completions) {
          m.firstNoHelp = hints === 0;
          m.firstCompletedAt = new Date().toISOString();
        }
        m.completions++;
        m.mistakes += mistakes;
        m.hints += hints;
        m.totalMs += ms;
        set({
          xp: s.xp + xp,
          progress: { ...s.progress, [id]: { stars: Math.max(previousStars, stars), completions: (prev?.completions ?? 0) + 1 } },
          concepts: [...s.concepts, ...newConcepts],
          metrics: { ...s.metrics, [id]: m },
        });
        return { stars, xp, newConcepts, firstTime: !prev, previousStars };
      },
      recordLayer: (id, layer) =>
        set((s) => {
          const m = { ...(s.metrics[id] ?? emptyMetrics()) };
          m.layers = { ...m.layers, [layer]: m.layers[layer] + 1 };
          return { metrics: { ...s.metrics, [id]: m } };
        }),
      markConceptsSeen: () => set((s) => ({ seenConcepts: [...s.concepts] })),
      recordMastery: (correct, total) =>
        set((s) => ({ mastery: { sessions: s.mastery.sessions + 1, correct: s.mastery.correct + correct, total: s.mastery.total + total } })),
      setSetting: (k, v) => set((s) => ({ settings: { ...s.settings, [k]: v } })),
      reset: () => set({ ...initial, onboarded: true, settings: get().settings }),
    }),
    {
      name: 'feynman-quest',
      version: 1,
      storage: createJSONStorage(() => {
        try {
          localStorage.setItem('__fq', '1');
          localStorage.removeItem('__fq');
          return localStorage;
        } catch {
          const mem = new Map<string, string>();
          return { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => void mem.set(k, v), removeItem: (k) => void mem.delete(k) };
        }
      }),
    },
  ),
);

export const isLevelUnlocked = (progress: Record<number, LevelProgress>, id: number) => id === 1 || !!progress[id - 1];
export const totalStars = (progress: Record<number, LevelProgress>) => Object.values(progress).reduce((a, p) => a + p.stars, 0);
/** Math layer unlocks after finishing chapter 1 (level 5). */
export const mathUnlocked = (progress: Record<number, LevelProgress>) => !!progress[5];
