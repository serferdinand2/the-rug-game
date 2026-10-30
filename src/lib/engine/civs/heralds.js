// The Heralds (02 §1.2): a token on a visible WHEN PLAYED tapestry card each income turn copies its ability, and whoever starts with them may play a card on Maker of Fire at the end of income turn 1 (R35).
import { emit } from '../events.js';
import { playerSeat } from '../state.js';
import { triggered } from '../abilities.js';
import { askSlot } from '../decisions/choose-slot.js';
import { visibleCards } from '../tapestry.js';
import { copyAbility } from '../effects/tapestry.js';
import { takeTapestryCard } from '../effects/gain.js';
import { tapestryCard } from '../data/tapestry-cards.js';

/**
 * The Heralds' own state.
 * @typedef {Object} HeraldsData
 * @property {number} tokens - The tokens still on the mat
 * @property {string[]} cards - The tapestry cards holding a Herald token, in the order placed
 */

/**
 * Puts a Herald token on the card picked (`slot`, `{ player, card }`) and gains the card's ability as the player's own,
 * with no card of theirs behind it (#19's `copyAbility`). The card stays where it is.
 * @type {import('../state.js').AutomaticKind}
 */
export function heraldsToken(ctx, op) {
	const player = /** @type {number} */ (op.player);
	const { player: owner, card } = op.slot;
	/** @type {HeraldsData} */
	const data = playerSeat(ctx.state, player).civData.heralds;
	data.tokens -= 1;
	data.cards.push(card);
	emit(ctx.state, { type: 'heraldsCopied', player, owner, card });
	copyAbility(ctx, player, null, card);
}

/**
 * Offers to play one of `options`, cards from the hand, on Maker of Fire, the era-1 slot. Declining is allowed, so it
 * asks even for one card; with none, nothing is asked.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {string[]} options
 */
function offerMakerOfFire(ctx, player, options) {
	if (options.length === 0) {
		return;
	}
	ctx.push([
		{
			player,
			kind: 'chooseTapestry',
			options: [...options],
			era: 1,
			optional: true,
		},
	]);
}

/**
 * R35's draw, which replaces the original Maker of Fire play: tapestry cards are drawn until a WHEN PLAYED one (a trap
 * counts, R22). Every card drawn is revealed: the others are discarded, and the card found goes to the hand, with the
 * `tapestryGained` triggers a drawn card has. It alone may then go on Maker of Fire, unless it is Renaissance.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 */
function drawForMakerOfFire(ctx, player) {
	const { state } = ctx;
	/** @type {string[]} */
	const revealed = [];
	let found = takeTapestryCard(ctx);
	while (found !== undefined && tapestryCard(found).timing !== 'played') {
		revealed.push(found);
		found = takeTapestryCard(ctx);
	}
	if (revealed.length === 0 && found === undefined) {
		return;
	}
	// Discarded only now, so a reshuffle during the draw never deals them again.
	state.supply.tapestry.discard.push(...revealed);
	emit(state, {
		type: 'cardsRevealed',
		player,
		cards: revealed,
		found: found ?? null,
	});
	if (found === undefined) {
		return;
	}
	playerSeat(state, player).hand.push(found);
	// The offer goes under the triggers of gaining the card, which resolve first, as for any card drawn.
	if (found !== 'renaissance') {
		offerMakerOfFire(ctx, player, [found]);
	}
	ctx.push(triggered(state, 'tapestryGained', { player, cards: [found] }));
}

/** The tokens the Heralds start with, for the engine and the card (#107). */
export const HERALDS_TOKENS = 4;

/** @type {import('./civ.js').Civ} */
export const heralds = {
	id: 'heralds',
	incomeTurns: [2, 3, 4, 5],
	setup(ctx, player) {
		playerSeat(ctx.state, player).civData.heralds =
			/** @type {HeraldsData} */ ({ tokens: HERALDS_TOKENS, cards: [] });
	},
	// You may put a token on a visible WHEN PLAYED card, on any income mat, that holds no Herald token yet.
	income(ctx, player) {
		const { state } = ctx;
		/** @type {HeraldsData} */
		const data = playerSeat(state, player).civData.heralds;
		if (data.tokens === 0) {
			return;
		}
		askSlot(ctx, player, {
			options: visibleCards(state)
				.filter(
					({ card }) =>
						tapestryCard(card).timing === 'played' &&
						!data.cards.includes(card)
				)
				.map(({ player: owner, card }) => ({ player: owner, card })),
			optional: true,
			purpose: 'heralds',
			then: { kind: 'heraldsToken' },
		});
	},
	// The original printing: whoever started with the Heralds may play any card from the hand on Maker of Fire. Under the
	// current rules R35's draw (the adjustment) replaces this play.
	firstTurnEnd(ctx, player) {
		const { state } = ctx;
		const seat = playerSeat(state, player);
		if (state.version === 'current' || seat.civs[0] !== 'heralds') {
			return;
		}
		offerMakerOfFire(ctx, player, seat.hand);
	},
	adjustment: {
		firstTurnEnd: drawForMakerOfFire,
	},
};
