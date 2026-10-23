// The registry of decision kinds and automatic operation kinds.
import { chooseTurn } from './decisions/choose-turn.js';
import { runEffects } from './effects/index.js';

/** @type {Record<string, import('./state.js').DecisionKind>} */
export const DECISIONS = { chooseTurn };

/** @type {Record<string, import('./state.js').AutomaticKind>} */
export const AUTOMATIC = { effects: runEffects };
