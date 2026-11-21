import type { Diagram, EdgeType, ValidationOptions } from '../engine';
import type { Tappable } from '../ui/diagram/DiagramView';

export type Mechanic = 'decode' | 'build' | 'debug';

/** Three depth layers for every challenge. */
export interface Explanation {
  intuitive: string;
  scientific: string;
  /** Optional mathematical layer; unlocked progressively, never blocking. */
  math: string;
}

interface StepBase {
  id: string;
  prompt: string;
  /** Two-tier hints: first orients, second shows the relevant rule. */
  hints: [string, string];
  /** Short line shown when the step is solved (before moving on). */
  solved?: string;
}

export interface TapStep extends StepBase {
  kind: 'tap';
  diagram: Diagram;
  /** Correct element ids. */
  targets: string[];
  /** 'any': one correct tap solves it. 'all': select the full set and check. */
  mode: 'any' | 'all';
  tappable: Tappable;
  /** Feedback for specific wrong elements. */
  wrong?: Record<string, string>;
  wrongDefault: string;
}

export interface ChoiceOption {
  id: string;
  text: string;
  correct?: boolean;
  /** Explanation shown when this option is picked (especially when wrong). */
  feedback?: string;
  diagram?: Diagram;
}

export interface ChoiceStep extends StepBase {
  kind: 'choice';
  diagram?: Diagram;
  /** Show the diagram with "watch it in time" playback controls. */
  playback?: boolean;
  /** Several labelled diagrams shown side by side (comparisons). */
  diagrams?: { label: string; diagram: Diagram }[];
  options: ChoiceOption[];
}

export interface BuildStep extends StepBase {
  kind: 'build';
  /** Starting diagram: locked edges are fixed; editable ones may be changed. */
  diagram: Diagram;
  palette: EdgeType[];
  validation: ValidationOptions;
  /** A reference diagram shown as a thumbnail (e.g. "build a different one"). */
  reference?: { label: string; diagram: Diagram };
}

export type Step = TapStep | ChoiceStep | BuildStep;

export interface Level {
  id: number;
  chapter: number;
  title: string;
  mechanic: Mechanic;
  /** Observe: the small scientific mystery presented to the player. */
  intro: string;
  steps: Step[];
  /** Comprehend: the success feedback. */
  success: string;
  explanation: Explanation;
  /** Concept ids unlocked in the collection. */
  concepts: string[];
}

export interface Chapter {
  id: number;
  title: string;
  subtitle: string;
  goals: string;
  color: string;
}

export interface Concept {
  id: string;
  title: string;
  kind: 'particle' | 'rule' | 'process' | 'idea';
  summary: string;
  body: string;
  diagram?: Diagram;
  symbol?: string;
}

export interface Content {
  chapters: Chapter[];
  levels: Level[];
  concepts: Concept[];
}
