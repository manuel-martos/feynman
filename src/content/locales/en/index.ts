import ch1 from './ch1.json';
import ch2 from './ch2.json';
import ch3 from './ch3.json';
import ch4 from './ch4.json';
import ch5 from './ch5.json';
import ch6 from './ch6.json';
import ch7 from './ch7.json';
import chapters from './chapters.json';
import concepts from './concepts.json';
import type { Strings } from '../../localize';

/** Content translation, by path (see ../../localize.ts). */
export const strings: Strings = { ...chapters, ...concepts, ...ch1, ...ch2, ...ch3, ...ch4, ...ch5, ...ch6, ...ch7 };
