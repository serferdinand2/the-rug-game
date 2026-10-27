// Paying a cost: resources of the player's choice, or territory tiles, tapestry cards and tech cards they discard.
import { PlayerError } from './errors.js';
import { emit } from './events.js';
import { playerSeat } from './state.js';
import { RESOURCE_IDS } from './data/ids.js';

/** @typedef {import('./data/effects.js').Cost} Cost */
/** @typedef {import('./data/ids.js').ResourceId} ResourceId */
/** @typedef {import('./state.js').PlayerSeat} PlayerSeat */

/**
 * How a player pays a cost: the actual resources, and the ids of what they discard.
 * @typedef {Object} Payment
 * @property {number} [coin]
 * @property {number} [worker]
 * @property {number} [food]
 * @property {number} [culture]
 * @property {number[]} [territory] - Territory tiles from the supply
 * @property {string[]} [tapestry] - Tapestry cards from the hand
 * @property {string[]} [tech] - Tech cards from any row
 * @property {number} [vp] - Victory points
 */

/** The kinds of things a cost may ask a player to discard. */
const DISCARDS = /** @type {const} */ (['territory', 'tapestry', 'tech']);

/** What each discard is called in a message. */
const DISCARD_NAMES = {
	territory: 'territory tiles from your supply',
	tapestry: 'tapestry cards from your hand',
	tech: 'tech cards',
};

/**
 * The things a seat could discard of one kind, in the order it holds them.
 * @param {PlayerSeat} seat
 * @param {'territory' | 'tapestry' | 'tech'} kind
 * @returns {(number | string)[]}
 */
function held(seat, kind) {
	if (kind === 'territory') {
		return seat.territoryTiles;
	}
	if (kind === 'tapestry') {
		return seat.hand;
	}
	return [...seat.tech.bottom, ...seat.tech.middle, ...seat.tech.top];
}

/**
 * Every way to choose `size` items from a list, keeping the list's order.
 * @template T
 * @param {readonly T[]} items
 * @param {number} size
 * @returns {T[][]}
 */
function combinations(items, size) {
	if (size === 0) {
		return [[]];
	}
	/** @type {T[][]} */
	const found = [];
	for (let i = 0; i <= items.length - size; i++) {
		for (const rest of combinations(items.slice(i + 1), size - 1)) {
			found.push([items[i], ...rest]);
		}
	}
	return found;
}

/**
 * Every way to pay the resource part of a cost from what a seat holds.
 * @param {PlayerSeat} seat
 * @param {Cost} cost
 * @returns {Partial<Record<ResourceId, number>>[]}
 */
function resourcePayments(seat, cost) {
	/** @type {Record<string, number>} */
	const left = {};
	for (const id of RESOURCE_IDS) {
		left[id] = seat.resources[id] - (cost[id] ?? 0);
		if (left[id] < 0) {
			return [];
		}
	}
	/** @type {Record<string, number>[]} */
	const extras = [];
	/**
	 * @param {number} from
	 * @param {number} count
	 * @param {Record<string, number>} chosen
	 */
	const build = (from, count, chosen) => {
		if (count === 0) {
			extras.push(chosen);
			return;
		}
		for (let i = from; i < RESOURCE_IDS.length; i++) {
			const id = RESOURCE_IDS[i];
			if ((chosen[id] ?? 0) < left[id]) {
				build(i, count - 1, { ...chosen, [id]: (chosen[id] ?? 0) + 1 });
			}
		}
	};
	build(0, cost.any ?? 0, {});
	return extras.map((extra) => {
		/** @type {Partial<Record<ResourceId, number>>} */
		const payment = {};
		for (const id of RESOURCE_IDS) {
			const amount = (cost[id] ?? 0) + (extra[id] ?? 0);
			if (amount > 0) {
				payment[id] = amount;
			}
		}
		return payment;
	});
}

/**
 * Every way a player could pay a cost, resources in RESOURCE_IDS order and discards in the order they are held.
 * @param {import('./state.js').State} state
 * @param {number} player
 * @param {Cost} cost
 * @returns {Payment[]}
 */
export function payments(state, player, cost) {
	const seat = playerSeat(state, player);
	if (seat.vp < (cost.vp ?? 0)) {
		return [];
	}
	/** @type {Payment[]} */
	let found = resourcePayments(seat, cost);
	if (cost.vp) {
		found = found.map((payment) => ({ ...payment, vp: cost.vp }));
	}
	for (const kind of DISCARDS) {
		const count = cost[kind];
		if (!count) {
			continue;
		}
		const choices = combinations(held(seat, kind), count);
		found = found.flatMap((payment) =>
			choices.map((ids) => ({ ...payment, [kind]: ids }))
		);
	}
	return found;
}

/**
 * Whether a player holds enough to pay a cost.
 * @param {import('./state.js').State} state
 * @param {number} player
 * @param {Cost} cost
 * @returns {boolean}
 */
export function canPay(state, player, cost) {
	const seat = playerSeat(state, player);
	if (seat.vp < (cost.vp ?? 0)) {
		return false;
	}
	let spare = 0;
	for (const id of RESOURCE_IDS) {
		const after = seat.resources[id] - (cost[id] ?? 0);
		if (after < 0) {
			return false;
		}
		spare += after;
	}
	if (spare < (cost.any ?? 0)) {
		return false;
	}
	return DISCARDS.every(
		(kind) => held(seat, kind).length >= (cost[kind] ?? 0)
	);
}

/**
 * Throws a PlayerError unless the payment is exactly the cost, from things the player holds.
 * @param {import('./state.js').State} state
 * @param {number} player
 * @param {Cost} cost
 * @param {Payment} payment
 * @throws {PlayerError}
 */
export function checkPayment(state, player, cost, payment) {
	const exactly = new PlayerError('Pay exactly the cost.');
	if (typeof payment !== 'object' || payment === null) {
		throw exactly;
	}
	const seat = playerSeat(state, player);
	const record = /** @type {Record<string, unknown>} */ (payment);
	for (const key of Object.keys(record)) {
		if (
			key !== 'vp' &&
			!RESOURCE_IDS.includes(/** @type {any} */ (key)) &&
			!DISCARDS.includes(/** @type {any} */ (key))
		) {
			throw new PlayerError(`You can't pay with ${key}.`);
		}
	}
	if ((record.vp ?? 0) !== (cost.vp ?? 0)) {
		throw exactly;
	}
	if ((cost.vp ?? 0) > seat.vp) {
		throw new PlayerError("You don't have enough VP.");
	}
	let total = 0;
	for (const id of RESOURCE_IDS) {
		const amount = record[id] ?? 0;
		if (typeof amount !== 'number' || !Number.isInteger(amount)) {
			throw exactly;
		}
		if (amount < 0 || (id in record && amount === 0)) {
			throw exactly;
		}
		if (amount < (cost[id] ?? 0)) {
			throw new PlayerError(`Pay ${cost[id]} ${id} of this cost.`);
		}
		if (amount > seat.resources[id]) {
			throw new PlayerError(`You don't have enough ${id}.`);
		}
		total += amount;
	}
	let owed = cost.any ?? 0;
	for (const id of RESOURCE_IDS) {
		owed += cost[id] ?? 0;
	}
	if (total !== owed) {
		throw exactly;
	}
	for (const kind of DISCARDS) {
		const count = cost[kind] ?? 0;
		const ids = record[kind];
		if (count === 0) {
			if (ids !== undefined) {
				throw exactly;
			}
			continue;
		}
		const wrong = new PlayerError(
			`Choose ${count} ${DISCARD_NAMES[kind]} to discard.`
		);
		if (!Array.isArray(ids) || ids.length !== count) {
			throw wrong;
		}
		const have = held(seat, kind);
		if (
			new Set(ids).size !== ids.length ||
			!ids.every((id) => have.includes(id))
		) {
			throw wrong;
		}
	}
}

/**
 * Removes what a checked payment names from the player, and discards it.
 * Territory tiles leave the game, because discarded tiles never return (FAQ #20); cards go onto their public piles.
 * @param {import('./state.js').Context} ctx
 * @param {number} player
 * @param {Payment} payment
 */
export function pay(ctx, player, payment) {
	const { state } = ctx;
	const seat = playerSeat(state, player);
	/** @type {Partial<Record<ResourceId, number>>} */
	const paid = {};
	for (const id of RESOURCE_IDS) {
		const amount = payment[id] ?? 0;
		if (amount > 0) {
			seat.resources[id] -= amount;
			paid[id] = amount;
		}
	}
	if (Object.keys(paid).length > 0) {
		emit(state, { type: 'resourcesPaid', player, paid });
	}
	if (payment.vp) {
		seat.vp -= payment.vp;
		seat.vpSources ??= {};
		seat.vpSources.paid = (seat.vpSources.paid ?? 0) - payment.vp;
		emit(state, { type: 'vpPaid', player, vp: payment.vp, total: seat.vp });
	}
	const tiles = payment.territory ?? [];
	if (tiles.length > 0) {
		seat.territoryTiles = seat.territoryTiles.filter(
			(tile) => !tiles.includes(tile)
		);
		state.supply.territoryDiscard.push(...tiles);
		emit(state, {
			type: 'tilesDiscarded',
			player,
			stack: 'territory',
			tiles,
		});
	}
	const tapestry = payment.tapestry ?? [];
	if (tapestry.length > 0) {
		seat.hand = seat.hand.filter((card) => !tapestry.includes(card));
		state.supply.tapestry.discard.push(...tapestry);
		emit(state, {
			type: 'cardsDiscarded',
			player,
			deck: 'tapestry',
			cards: tapestry,
		});
	}
	const tech = payment.tech ?? [];
	if (tech.length > 0) {
		for (const row of /** @type {const} */ (['bottom', 'middle', 'top'])) {
			seat.tech[row] = seat.tech[row].filter(
				(card) => !tech.includes(card)
			);
		}
		state.supply.tech.discard.push(...tech);
		emit(state, {
			type: 'cardsDiscarded',
			player,
			deck: 'tech',
			cards: tech,
		});
	}
}
