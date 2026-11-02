// The Advisors (03 §1.3, §1.8): they start with 3 tapestry cards, score their hand and discard down to 4 on income turns 2-5, and on a neighbour's advance turn may give them a card from hand instead of each one they would draw.
import { emit } from '../events.js';
import { isPlayerSeat, neighbours, playerSeat } from '../state.js';
import { advisorsBeside, drawTapestry } from '../effects/gain.js';
import { triggered } from '../abilities.js';

/** The tapestry cards they draw when they come in, at setup or mid-game (03 §1.3, R113). */
export const ADVISORS_CARDS = 3;

/** The VP for each of those cards they give a neighbour when gained mid-game (03 §1.3). */
export const ADVISORS_GIFT_VP = 5;

/** The hand they discard down to at the start of income turns 2-5 (03 §1.3). */
export const ADVISORS_HAND = 4;

/**
 * Draws up to `count` tapestry cards from the deck for a player and pushes what gaining them triggers, as the gain
 * effect does when nobody gives a card instead.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {number} count
 */
function drawGained(ctx, player, count) {
	const cards = drawTapestry(ctx, player, count);
	if (cards.length > 0) {
		ctx.push(triggered(ctx.state, 'tapestryGained', { player, cards }));
	}
}

/**
 * The question of which of their new cards to give `to`, for 5 VP each, the other neighbours (`after`) asked next; null
 * when none of `cards` is still in their hand.
 * @param {import('../state.js').State} state
 * @param {number} player - The Advisors
 * @param {number} to
 * @param {number[]} after
 * @param {string[]} cards
 * @returns {import('../state.js').NewOperation | null}
 */
function newCardsGift(state, player, to, after, cards) {
	const { hand } = playerSeat(state, player);
	const left = cards.filter((card) => hand.includes(card));
	if (left.length === 0) {
		return null;
	}
	return {
		player,
		kind: 'chooseGive',
		to,
		after: [...after],
		cards: left,
		vp: ADVISORS_GIFT_VP,
	};
}

/**
 * One tapestry card a neighbour would draw on their advance turn (`count` of them left). While advisorsBeside() finds
 * Advisors who may give, they are asked first (`chooseGive`, whose answer draws or gives); otherwise the neighbour draws
 * the rest from the deck. Each card asks again, so a card the Advisors drew instead may be given for the next.
 * @type {import('../state.js').AutomaticKind}
 */
export function advisorsDraw(ctx, op) {
	const player = /** @type {number} */ (op.player);
	/** @type {number} */
	const count = op.count;
	const advisors = advisorsBeside(ctx.state, player);
	if (advisors === null) {
		drawGained(ctx, player, count);
		return;
	}
	ctx.push([
		{ player: advisors, kind: 'chooseGive', to: player, origin: 'civ' },
		...(count > 1
			? [{ player, kind: 'advisorsDraw', count: count - 1 }]
			: []),
	]);
}

/**
 * What an answer to `chooseGive` does. Instead of a neighbour's draw: declined, the neighbour draws from the deck;
 * a card given goes to their hand, as a card they gained, and the Advisors draw 1 (03 §1.3). Of their new cards: each
 * one given gains 5 VP and asks again while one is left; declined, the next neighbour is asked.
 * The card given is the secret of both seats (`tapestryGiven`, which view() shows to its `to` as well).
 * @param {import('../state.js').Context} ctx
 * @param {import('../state.js').Operation} decision
 * @param {string | null} card
 */
export function giveAnswered(ctx, decision, card) {
	const { state } = ctx;
	const player = /** @type {number} */ (decision.player);
	/** @type {number} */
	const to = decision.to;
	/** @type {string[] | undefined} */
	const cards = decision.cards;
	if (card === null) {
		if (cards === undefined) {
			drawGained(ctx, to, 1);
			return;
		}
		const [next, ...after] = decision.after;
		const ask =
			next === undefined
				? null
				: newCardsGift(state, player, next, after, cards);
		ctx.push(ask ? [ask] : []);
		return;
	}
	const { hand } = playerSeat(state, player);
	hand.splice(hand.indexOf(card), 1);
	playerSeat(state, to).hand.push(card);
	emit(state, {
		type: 'tapestryGiven',
		player,
		to,
		secret: { cards: [card] },
	});
	const gained = triggered(state, 'tapestryGained', {
		player: to,
		cards: [card],
	});
	if (cards === undefined) {
		ctx.push([
			...gained,
			{ player, kind: 'effects', effects: [{ gain: { tapestry: 1 } }] },
		]);
		return;
	}
	const again = newCardsGift(
		state,
		player,
		to,
		decision.after,
		cards.filter((c) => c !== card)
	);
	ctx.push([
		{ player, kind: 'effects', effects: [{ vp: ADVISORS_GIFT_VP }] },
		...gained,
		...(again ? [again] : []),
	]);
}

/** @type {import('./civ.js').Civ} */
export const advisors = {
	id: 'advisors',
	// Solo play leaves them out (03 §1.7); #31 reads this.
	solo: false,
	incomeTurns: [2, 3, 4, 5],
	// 3 tapestry cards whenever they come in (R113). Gained mid-game, they may give any of those 3 to their neighbours,
	// asked of each neighbour in seat order; the Shadow Empire is never one (03 §1.7).
	setup(ctx, player, midGame) {
		const { state } = ctx;
		const cards = drawTapestry(ctx, player, ADVISORS_CARDS);
		const near = neighbours(state, player)
			.filter((seat) => isPlayerSeat(state, seat))
			.sort((a, b) => a - b);
		const [to, ...after] = near;
		const gift =
			midGame && to !== undefined
				? newCardsGift(state, player, to, after, cards)
				: null;
		ctx.push([
			...(cards.length > 0
				? triggered(state, 'tapestryGained', { player, cards })
				: []),
			...(gift ? [gift] : []),
		]);
	},
	// 1 VP per card in hand; then, holding more than 4, discard down to 4, which gains 1 resource of their choice.
	income(ctx, player) {
		const { hand } = playerSeat(ctx.state, player);
		ctx.push([
			...(hand.length > 0
				? [{ player, kind: 'effects', effects: [{ vp: hand.length }] }]
				: []),
			...(hand.length > ADVISORS_HAND
				? [
						{
							player,
							kind: 'chooseDiscard',
							downTo: ADVISORS_HAND,
						},
						{
							player,
							kind: 'effects',
							effects: [{ gain: { any: 1 } }],
						},
					]
				: []),
		]);
	},
};
