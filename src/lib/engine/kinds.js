// Fills the registry of decision kinds and automatic operation kinds (registry.js holds it, #166); import this module, or game.js, so they are registered.
import { DECISIONS, AUTOMATIC } from './registry.js';
import './civs/index.js';
import { chooseTurn } from './decisions/choose-turn.js';
import { confirmEndTurn } from './decisions/confirm-end-turn.js';
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
import { chooseCounter } from './decisions/choose-counter.js';
import { chooseInvent } from './decisions/choose-invent.js';
import { chooseUpgrade } from './decisions/choose-upgrade.js';
import { chooseTechBenefit } from './decisions/choose-tech-benefit.js';
import { chooseLandmark } from './decisions/choose-landmark.js';
import { chooseDiscard } from './decisions/choose-discard.js';
import { chooseKeep } from './decisions/choose-keep.js';
import { chooseKeepTech } from './decisions/choose-keep-tech.js';
import { chooseLandmarkCard } from './decisions/choose-landmark-card.js';
import { chooseTrade } from './decisions/choose-trade.js';
import { chooseTrack } from './decisions/choose-track.js';
import { chooseRoll } from './decisions/choose-roll.js';
import { chooseSpace } from './decisions/choose-space.js';
import { chooseHex } from './decisions/choose-hex.js';
import { chooseGift } from './decisions/choose-gift.js';
import { chooseGive } from './decisions/choose-give.js';
import { chooseCopy } from './decisions/choose-copy.js';
import { choosePartner } from './decisions/choose-partner.js';
import { chooseConversion } from './decisions/choose-conversion.js';
import { chooseCivAbility } from './decisions/choose-civ-ability.js';
import { chooseSlot } from './decisions/choose-slot.js';
import { olympicHostEnd, sharedAdvanceOn } from './effects/players.js';
import { darkAgesOn, dictate, colonize, revolt } from './effects/cards.js';
import { upgradeTech } from './effects/tech.js';
import { copyBenefit } from './eras.js';
import { conquerDice } from './effects/conquer.js';
import { placeBuilding, placeLandmark } from './placing.js';
import { runSetupSteps } from './after-setup.js';
import {
	civAbilities,
	civIncome,
	civSetup,
	civAdjust,
	civFirstTurnEnd,
} from './civ-turns.js';
import { loseResource } from './effects/lose.js';
import { payResource } from './effects/pay.js';
import { chooseAlchemists } from './decisions/choose-alchemists.js';
import { chooseProphecy } from './decisions/choose-prophecy.js';
import { chooseSwap } from './decisions/choose-swap.js';
import { chooseCube } from './decisions/choose-cube.js';
import { leadersAdvance } from './civs/leaders.js';
import { merrymakersMove } from './civs/merrymakers.js';
import { retreatTo, surrenderDice } from './responses.js';
import {
	cartographyCheck,
	manifestDestinyBenefit,
	territoryBenefit,
	statusQuoBonus,
} from './effects/pp-cards.js';
import { entertainersMove } from './civs/entertainers.js';
import { alchemistsRoll } from './civs/alchemists.js';
import { mysticsCheck } from './civs/mystics.js';
import { riverfolkStart, riverfolkClear } from './civs/riverfolk.js';
import { islandersPlace, islandersScore } from './civs/islanders.js';
import { architectsCube } from './civs/architects.js';
import { tradersToken } from './civs/traders.js';
import {
	treasureHex,
	treasureClaim,
	treasureRoll,
} from './civs/treasure-hunters.js';
import { tinkerersOption, tinkerersPayBack } from './civs/tinkerers.js';
import {
	spiesOption,
	spiesTake,
	spiesLookOffer,
	spiesLook,
} from './civs/spies.js';
import {
	utilitariansStart,
	utilitariansPlace,
	utilitariansOffer,
	utilitariansToken,
	utilitariansLighthouse,
	utilitariansLighthouseUsed,
} from './civs/utilitarians.js';
import { infiltrate } from './civs/infiltrators.js';
import { advisorsDraw } from './civs/advisors.js';
import { heraldsToken } from './civs/heralds.js';
import { historiansToken, historiansDiscard } from './civs/historians.js';
import { inventorsToken, inventorsTake } from './civs/inventors.js';
import {
	militantsTake,
	militantsUncover,
	militantsCover,
} from './civs/militants.js';

Object.assign(DECISIONS, {
	chooseTurn,
	confirmEndTurn,
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
	chooseCounter,
	chooseInvent,
	chooseUpgrade,
	chooseTechBenefit,
	chooseLandmark,
	chooseDiscard,
	chooseKeep,
	chooseKeepTech,
	chooseTrade,
	chooseTrack,
	chooseRoll,
	chooseSpace,
	chooseHex,
	chooseGift,
	chooseGive,
	choosePartner,
	chooseCopy,
	chooseConversion,
	chooseCivAbility,
	chooseSlot,
	chooseAlchemists,
	chooseProphecy,
	chooseSwap,
	chooseCube,
	chooseLandmarkCard,
});

Object.assign(AUTOMATIC, {
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
	copyBenefit,
	civAbilities,
	civIncome,
	civSetup,
	civAdjust,
	civFirstTurnEnd,
	loseResource,
	payResource,
	leadersAdvance,
	merrymakersMove,
	entertainersMove,
	alchemistsRoll,
	mysticsCheck,
	riverfolkStart,
	riverfolkClear,
	islandersPlace,
	islandersScore,
	architectsCube,
	tradersToken,
	treasureHex,
	treasureClaim,
	treasureRoll,
	tinkerersOption,
	tinkerersPayBack,
	spiesOption,
	spiesTake,
	spiesLookOffer,
	spiesLook,
	utilitariansStart,
	utilitariansPlace,
	utilitariansOffer,
	utilitariansToken,
	utilitariansLighthouse,
	utilitariansLighthouseUsed,
	infiltrate,
	advisorsDraw,
	militantsTake,
	militantsUncover,
	militantsCover,
	heraldsToken,
	historiansToken,
	historiansDiscard,
	inventorsToken,
	inventorsTake,
	cartographyCheck,
	manifestDestinyBenefit,
	territoryBenefit,
	statusQuoBonus,
	retreatTo,
	surrenderDice,
});

export { DECISIONS, AUTOMATIC };
