// The Recyclers (03 §1.3): 3 tech cards drawn to keep 1, an upgrade of their own on income turns 2-5, top-row cards sent back to the bottom row for 5 VP, and inventing from the tech discard pile.
import { emit } from '../events.js';
import { playerSeat } from '../state.js';
import { triggered } from '../abilities.js';
import { drawTech } from '../tech.js';
import { psionic } from './psionics.js';

/** The tech cards the Recyclers draw when they come in, of which they keep 1. */
export const RECYCLERS_DRAW = 3;

/** The VP for each top-row card the Recyclers send back to the bottom row. */
export const RECYCLERS_VP = 5;

/**
 * Keeps one drawn tech card in the bottom row and discards the others face up. The card kept is a tech card gained,
 * so only it triggers what inventing triggers, as the tapestry card kept from a draw does (my call).
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {string} card
 * @param {string[]} others - The other cards drawn
 */
export function keepTech(ctx, player, card, others) {
	const { state } = ctx;
	playerSeat(state, player).tech.bottom.push(card);
	emit(state, { type: 'techInvented', player, card, from: 'deck' });
	if (others.length > 0) {
		state.supply.tech.discard.push(...others);
		emit(state, {
			type: 'cardsDiscarded',
			player,
			deck: 'tech',
			cards: [...others],
		});
	}
	ctx.push([
		...triggered(state, 'invented', { player, card }),
		...triggered(state, 'countsChanged', { player }),
	]);
}

/**
 * Sends a top-row card back to the end of the bottom row, for 5 VP, in place of an upgrade the Recyclers take. It is
 * no upgrade: no benefit, and nothing that answers upgrades follows (Golden Age, Alliance, the Inventors). An Inventors
 * token on the card goes down with it (03 §1.8).
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {string} card
 * @throws {Error} For a card not in the top row: every caller checks first, so that is a bug, not a player's mistake
 */
export function recycleCard(ctx, player, card) {
	const { tech } = playerSeat(ctx.state, player);
	const at = tech.top.indexOf(card);
	if (at === -1) {
		throw new Error('recycleCard found that card is not in the top row.');
	}
	tech.top.splice(at, 1);
	tech.bottom.push(card);
	emit(ctx.state, { type: 'techRecycled', player, card });
	ctx.push([
		{
			player,
			kind: 'effects',
			effects: [{ vp: RECYCLERS_VP }],
			origin: 'civ',
		},
	]);
}

/** @type {import('./civ.js').Civ} */
export const recyclers = {
	id: 'recyclers',
	incomeTurns: [2, 3, 4, 5],
	// At setup or when gained mid-game (R113): 3 cards from the deck, 1 kept. Fewer left, they keep one of those; a
	// lone card is kept without asking. Income turn 1 has no upgrade step, so "you may not upgrade it during your first
	// income turn" needs nothing.
	setup(ctx, player) {
		/** @type {string[]} */
		const cards = [];
		// The Psionics draw one more (R74).
		const count = RECYCLERS_DRAW + (psionic(ctx.state, player) ? 1 : 0);
		while (cards.length < count) {
			const card = drawTech(ctx);
			if (card === null) {
				break;
			}
			cards.push(card);
		}
		emit(ctx.state, {
			type: 'techDrawn',
			player,
			count: cards.length,
			secret: { cards },
		});
		if (cards.length === 1) {
			keepTech(ctx, player, cards[0], []);
		} else if (cards.length > 1) {
			ctx.push([{ player, kind: 'chooseKeepTech', options: cards }]);
		}
	},
	// You may upgrade a tech card, as well as in step 3.
	income(ctx, player) {
		ctx.push([
			{
				player,
				kind: 'effects',
				effects: [{ upgrade: { optional: true } }],
			},
		]);
	},
	adjustment: {
		setup(ctx, player) {
			ctx.push([{ player, kind: 'effects', effects: [{ upgrade: {} }] }]);
		},
	},
};
