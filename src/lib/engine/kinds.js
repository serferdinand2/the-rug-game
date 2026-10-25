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
import { rollResearch, researchRolled } from './effects/research.js';
import { endTurn } from './turn.js';
import { runIncomeSteps, playFaceDown } from './income.js';
import { chooseTapestry } from './decisions/choose-tapestry.js';
import { tapestryAbility } from './tapestry.js';
import { runEffects } from './effects/index.js';
import { choosePlacement } from './decisions/choose-placement.js';
import { chooseExplore } from './decisions/choose-explore.js';
import { chooseSpaceTile } from './decisions/choose-space-tile.js';
import { chooseConquer } from './decisions/choose-conquer.js';
import { chooseDie } from './decisions/choose-die.js';
import { chooseResponse } from './decisions/choose-response.js';
import { chooseInvent } from './decisions/choose-invent.js';
import { chooseUpgrade } from './decisions/choose-upgrade.js';
import { chooseTechBenefit } from './decisions/choose-tech-benefit.js';
import { chooseLandmark } from './decisions/choose-landmark.js';
import { chooseDiscard } from './decisions/choose-discard.js';
import { chooseTrade } from './decisions/choose-trade.js';
import { chooseTrack } from './decisions/choose-track.js';
import { chooseRoll } from './decisions/choose-roll.js';
import { chooseSpace } from './decisions/choose-space.js';
import { chooseHex } from './decisions/choose-hex.js';
import { chooseGift } from './decisions/choose-gift.js';
import { choosePartner } from './decisions/choose-partner.js';
import { olympicHostEnd, sharedAdvanceOn } from './effects/players.js';
import { darkAgesOn, dictate, colonize, revolt } from './effects/cards.js';
import { upgradeTech } from './effects/tech.js';
import { conquerDice } from './effects/conquer.js';
import { placeBuilding, placeLandmark } from './placing.js';
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
	choosePlacement,
	chooseExplore,
	chooseSpaceTile,
	chooseConquer,
	chooseDie,
	chooseResponse,
	chooseInvent,
	chooseUpgrade,
	chooseTechBenefit,
	chooseLandmark,
	chooseDiscard,
	chooseTrade,
	chooseTrack,
	chooseRoll,
	chooseSpace,
	chooseHex,
	chooseGift,
	choosePartner,
};

/** @type {Record<string, import('./state.js').AutomaticKind>} */
export const AUTOMATIC = {
	effects: runEffects,
	setupSteps: runSetupSteps,
	bonus: offerBonus,
	endTurn,
	research: rollResearch,
	researchRolled,
	incomeSteps: runIncomeSteps,
	faceDownTapestry: playFaceDown,
	tapestryAbility,
	placeBuilding,
	placeLandmark,
	conquerDice,
	upgradeTech,
	olympicHostEnd,
	sharedAdvanceOn,
	darkAgesOn,
	dictate,
	colonize,
	revolt,
};
