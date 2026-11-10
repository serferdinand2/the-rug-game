// The Gamblers (A&A, #37; 03 §2.4): if started with, 3 tapestry cards revealed at the end of income turn 1 and the start of income turns 2-4, a WHEN PLAYED one played on that era's slot.
import { emit } from '../events.js';
import { playerSeat } from '../state.js';
import { triggered } from '../abilities.js';
import { askSlot } from '../decisions/choose-slot.js';
import { playTapestry } from '../tapestry.js';
import { takeTapestryCard } from '../effects/gain.js';
import { tapestryCard } from '../data/tapestry-cards.js';

/** @typedef {{ started: boolean }} GamblersData */

/** How many cards the Gamblers reveal each time. */
const REVEALED = 3;

/**
 * Reveals 3 tapestry cards: a WHEN PLAYED one (a trap counts, R22) is played on the era's slot and resolved, the
 * player choosing among several; with none, they keep 1 in hand. The rest are discarded (03 §2.4). A card that can't
 * be fully resolved resolves as far as it goes.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {number} era - 1 is Maker of Fire's slot
 */
function gamble(ctx, player, era) {
	/** @type {string[]} */
	const cards = [];
	while (cards.length < REVEALED) {
		const card = takeTapestryCard(ctx);
		if (card === undefined) {
			break;
		}
		cards.push(card);
	}
	if (cards.length === 0) {
		return;
	}
	emit(ctx.state, { type: 'gamblersRevealed', player, cards: [...cards] });
	const playable = cards.filter(
		(card) => tapestryCard(card).timing === 'played'
	);
	askSlot(
		ctx,
		player,
		playable.length > 0
			? {
					options: playable,
					purpose: 'gamblers',
					then: { kind: 'gamblersPlay', era, cards },
				}
			: {
					options: cards,
					purpose: 'gamblersKeep',
					then: { kind: 'gamblersKeep', cards },
				}
	);
}

/**
 * Plays the card the Gamblers chose on the era's slot, and discards the others revealed with it.
 * @type {import('../state.js').AutomaticKind}
 */
export function gamblersPlay(ctx, op) {
	const player = /** @type {number} */ (op.player);
	ctx.state.supply.tapestry.discard.push(
		...op.cards.filter((/** @type {string} */ card) => card !== op.slot)
	);
	playTapestry(ctx, player, op.slot, op.era);
}

/**
 * Keeps the card the Gamblers chose in the hand, a card gained, and discards the others.
 * @type {import('../state.js').AutomaticKind}
 */
export function gamblersKeep(ctx, op) {
	const player = /** @type {number} */ (op.player);
	ctx.state.supply.tapestry.discard.push(
		...op.cards.filter((/** @type {string} */ card) => card !== op.slot)
	);
	playerSeat(ctx.state, player).hand.push(op.slot);
	ctx.push(
		triggered(ctx.state, 'tapestryGained', { player, cards: [op.slot] })
	);
}

/**
 * Whether the player started the game with the Gamblers.
 * @param {import('../state.js').State} state
 * @param {number} player
 * @returns {boolean}
 */
function started(state, player) {
	/** @type {GamblersData | undefined} */
	const data = playerSeat(state, player).civData.gamblers;
	return data?.started === true;
}

/** @type {import('./civ.js').Civ} */
export const gamblers = {
	id: 'gamblers',
	// Their abilities are only for a player who starts with them (03 §2.4).
	setup(ctx, player, midGame) {
		playerSeat(ctx.state, player).civData.gamblers =
			/** @type {GamblersData} */ ({ started: !midGame });
	},
	incomeTurns: [2, 3, 4],
	// Before the era's own card, which then covers it.
	income(ctx, player, turn) {
		if (started(ctx.state, player)) {
			gamble(ctx, player, turn);
		}
	},
	firstTurnEnd(ctx, player) {
		if (started(ctx.state, player)) {
			gamble(ctx, player, 1);
		}
	},
};
