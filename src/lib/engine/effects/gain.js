// The gain effect: resources (capped at 8), territory and space tiles, tapestry cards, and a choice of any.
import { emit } from '../events.js';
import { shuffle } from '../random.js';
import { neighbours, playerSeat } from '../state.js';
import { triggered } from '../abilities.js';
import { RESOURCE_IDS } from '../data/ids.js';

/** Most of one resource a player may hold (01 §1.2). */
export const RESOURCE_CAP = 8;

/**
 * Adds resources to a player, each up to the cap; the rest is lost.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {Partial<Record<import('../data/ids.js').ResourceId, number>>} resources
 */
export function gainResources(ctx, player, resources) {
	const seat = playerSeat(ctx.state, player);
	/** @type {Record<string, number>} */
	const gained = {};
	/** @type {Record<string, number>} */
	const lost = {};
	for (const id of RESOURCE_IDS) {
		const amount = resources[id] ?? 0;
		const kept = Math.min(amount, RESOURCE_CAP - seat.resources[id]);
		seat.resources[id] += kept;
		if (kept > 0) {
			gained[id] = kept;
		}
		if (amount > kept) {
			lost[id] = amount - kept;
		}
	}
	emit(ctx.state, { type: 'resourcesGained', player, gained, lost });
}

/**
 * Moves up to `count` tiles from the top of a supply stack to a player.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {'territory' | 'space'} stack
 * @param {number} count
 * @returns {number[]} The tiles gained, fewer than `count` when the stack runs out
 */
export function gainTiles(ctx, player, stack, count) {
	const seat = playerSeat(ctx.state, player);
	const tiles = ctx.state.supply[stack].splice(0, count);
	seat[stack === 'territory' ? 'territoryTiles' : 'spaceTiles'].push(
		...tiles
	);
	emit(ctx.state, { type: 'tilesGained', player, stack, tiles });
	return tiles;
}

/**
 * Takes the top tapestry card, first reshuffling the discards into an empty deck (01 §9.1, FAQ #24).
 * @param {import('../state.js').Context} ctx
 * @returns {string | undefined} Undefined when no card is left in the deck or the discards
 */
export function takeTapestryCard(ctx) {
	const { state } = ctx;
	const deck = state.supply.tapestry;
	if (deck.deck.length === 0 && deck.discard.length > 0) {
		deck.deck = shuffle(deck.discard, ctx.random);
		deck.discard = [];
		emit(state, {
			type: 'deckShuffled',
			deck: 'tapestry',
			count: deck.deck.length,
		});
	}
	return deck.deck.shift();
}

/**
 * Draws up to `count` tapestry cards into the hand, without the triggers of gaining them: the caller pushes those.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {number} count
 * @returns {string[]} The cards drawn
 */
export function drawTapestry(ctx, player, count) {
	const seat = playerSeat(ctx.state, player);
	/** @type {string[]} */
	const cards = [];
	while (cards.length < count) {
		const card = takeTapestryCard(ctx);
		if (card === undefined) {
			break;
		}
		cards.push(card);
	}
	seat.hand.push(...cards);
	emit(ctx.state, {
		type: 'cardsDrawn',
		player,
		count: cards.length,
		secret: { cards },
	});
	return cards;
}

/**
 * The seat of the Advisors who are asked before each tapestry card this player would draw now, or null (03 §1.3, #33):
 * only on the player's own advance turn, never an income turn; a neighbour of theirs who holds the Advisors, still plays
 * (03 §1.8: a finished player takes no action that needs input) and holds a card to give, asked whatever it is (#17);
 * and only while a card is left to draw, as with none the player would gain no card.
 * @param {import('../state.js').State} state
 * @param {number} player - The seat that would draw
 * @returns {number | null}
 */
export function advisorsBeside(state, player) {
	if (state.turnKind !== 'advance' || state.current !== player) {
		return null;
	}
	const { deck, discard } = state.supply.tapestry;
	if (deck.length + discard.length === 0) {
		return null;
	}
	const near = neighbours(state, player);
	const advisors = state.seats.find(
		(seat) =>
			seat.kind === 'player' &&
			near.includes(seat.seat) &&
			playerSeat(state, seat.seat).civs.includes('advisors')
	);
	if (advisors === undefined) {
		return null;
	}
	const { finished, hand } = playerSeat(state, advisors.seat);
	return !finished && hand.length > 0 ? advisors.seat : null;
}

/**
 * Gains what a Gain names, in this order: named resources, territory, space, tapestry, then any.
 * Drawing at least one tapestry card has triggers, which come before the choice of any. With `keep`, the player
 * first chooses which drawn card to keep (`chooseKeep`), and only it triggers (#53 design §4.1). When the Advisors may
 * give a card instead (advisorsBeside), the cards are drawn one at a time by `advisorsDraw`, each asking them first.
 * @type {import('../state.js').EffectHandler}
 */
export function gain(ctx, player, value) {
	const known = [
		...RESOURCE_IDS,
		'any',
		'territory',
		'space',
		'tapestry',
		'keep',
	];
	for (const key of Object.keys(value)) {
		if (!known.includes(key)) {
			throw new Error(`Unknown gain "${key}".`);
		}
	}
	/** @type {Partial<Record<import('../data/ids.js').ResourceId, number>>} */
	const named = {};
	for (const id of RESOURCE_IDS) {
		if (value[id]) {
			named[id] = value[id];
		}
	}
	if (Object.keys(named).length > 0) {
		gainResources(ctx, player, named);
	}
	if (value.territory) {
		gainTiles(ctx, player, 'territory', value.territory);
	}
	if (value.space) {
		gainTiles(ctx, player, 'space', value.space);
	}
	/** @type {import('../state.js').NewOperation[]} */
	const ops = [];
	if (value.keep !== undefined && value.keep !== 1) {
		throw new Error('Only keeping 1 drawn tapestry card is built.');
	}
	if (
		value.tapestry &&
		value.keep === undefined &&
		advisorsBeside(ctx.state, player) !== null
	) {
		ops.push({ player, kind: 'advisorsDraw', count: value.tapestry });
	} else if (value.tapestry) {
		const cards = drawTapestry(ctx, player, value.tapestry);
		if (value.keep !== undefined && cards.length > value.keep) {
			ops.push({
				player,
				kind: 'chooseKeep',
				options: cards,
				keep: value.keep,
			});
		} else if (cards.length > 0) {
			ops.push(
				...triggered(ctx.state, 'tapestryGained', { player, cards })
			);
		}
	}
	if (value.any) {
		ops.push({
			player,
			kind: 'chooseResource',
			count: value.any,
			from: 'any',
		});
	}
	ctx.push(ops);
}
