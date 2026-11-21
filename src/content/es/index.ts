import type { Content } from '../../game/types';
import { chapter1 } from './ch1';
import { chapter2 } from './ch2';
import { chapter3 } from './ch3';
import { chapter4 } from './ch4';
import { chapter5 } from './ch5';
import { chapter6 } from './ch6';
import { chapter7 } from './ch7';
import { chapters, concepts } from './concepts';

export const contentEs: Content = {
  chapters,
  levels: [...chapter1, ...chapter2, ...chapter3, ...chapter4, ...chapter5, ...chapter6, ...chapter7],
  concepts,
};
