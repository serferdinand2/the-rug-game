// The registry of decision kinds and automatic operation kinds.
import { chooseTurn } from './decisions/choose-turn.js';
import { chooseCapital } from './decisions/choose-capital.js';
import { chooseCiv } from './decisions/choose-civ.js';
import { chooseResource } from './decisions/choose-resource.js';
import { chooseBonus, offerBonus } from './decisions/choose-bonus.js';
import { chooseAdvance } from './decisions/choose-advance.js';
import { chooseOrder } from './decisions/choose-order.js';
import { chooseOption } from './decisions/choose-option.js';
import { chooseMove } from './decisions/choose-move.js';
import { chooseRepeat } from './decisions/choose-repeat.js';
import { chooseRestart } from './decisions/choose-restart.js';
import { rollResearch } from './effects/research.js';
import { endTurn } from './turn.js';
import { runIncomeSteps, playFaceDown } from './income.js';
import { chooseTapestry } from './decisions/choose-tapestry.js';
import { runEffects } from './effects/index.js';
import { runSetupSteps } from './after-setup.js';

/** @type {Record<string, import('./state.js').DecisionKind>} */
export const DECISIONS = {
	chooseTurn,
	chooseCapital,
	chooseCiv,
	chooseResource,
	chooseBonus,
	chooseAdvance,
	chooseOrder,
	chooseOption,
	chooseMove,
	chooseRepeat,
	chooseRestart,
	chooseTapestry,
};

/** @type {Record<string, import('./state.js').AutomaticKind>} */
export const AUTOMATIC = {
	effects: runEffects,
	setupSteps: runSetupSteps,
	bonus: offerBonus,
	endTurn,
	research: rollResearch,
	incomeSteps: runIncomeSteps,
	faceDownTapestry: playFaceDown,
};
