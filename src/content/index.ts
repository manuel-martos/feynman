import type { Content } from '../game/types';
import { contentEs } from './es';
import { issueText as issueTextEs } from './es/issues';

/** Locale registry — add a new folder (e.g. ./en) and register it here. */
const CONTENT: Record<string, Content> = { es: contentEs };
export const locale = 'es';
export const content: Content = CONTENT[locale];
export const issueText = issueTextEs;
export { practiceSession } from './es/practice';
export { narrate, type Caption } from './es/narrate';
