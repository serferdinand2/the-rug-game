// The registry of decision kinds and automatic operation kinds.
import { chooseTurn } from './decisions/choose-turn.js';
import { chooseCapital } from './decisions/choose-capital.js';
import { chooseCiv } from './decisions/choose-civ.js';
import { chooseResource } from './decisions/choose-resource.js';
import { runEffects } from './effects/index.js';
import { runSetupSteps } from './after-setup.js';

/** @type {Record<string, import('./state.js').DecisionKind>} */
export const DECISIONS = {
	chooseTurn,
	chooseCapital,
	chooseCiv,
	chooseResource,
};

/** @type {Record<string, import('./state.js').AutomaticKind>} */
export const AUTOMATIC = { effects: runEffects, setupSteps: runSetupSteps };
