// The gain effect: resources (capped at 8), territory and space tiles, tapestry cards, and a choice of any.
import { emit } from '../events.js';
import { shuffle } from '../random.js';
import { playerSeat } from '../state.js';
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
 */
function gainTiles(ctx, player, stack, count) {
	const seat = playerSeat(ctx.state, player);
	const tiles = ctx.state.supply[stack].splice(0, count);
	seat[stack === 'territory' ? 'territoryTiles' : 'spaceTiles'].push(
		...tiles
	);
	emit(ctx.state, { type: 'tilesGained', player, stack, tiles });
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
 * Draws up to `count` tapestry cards into the hand.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {number} count
 * @returns {string[]} The cards drawn
 */
function drawTapestry(ctx, player, count) {
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
 * Gains what a Gain names, in this order: named resources, territory, space, tapestry, then any.
 * Drawing at least one tapestry card has triggers, which come before the choice of any.
 * @type {import('../state.js').EffectHandler}
 */
export function gain(ctx, player, value) {
	const known = [...RESOURCE_IDS, 'any', 'territory', 'space', 'tapestry'];
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
	if (value.tapestry) {
		const cards = drawTapestry(ctx, player, value.tapestry);
		if (cards.length > 0) {
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
