// The Collectors (A&A, #37; 03 §2.4): one item a turn of a type their mat doesn't hold yet, gained on an advance turn, for 1 resource of their choice; VP for the items at the end.
import { emit } from '../events.js';
import { isPlayerSeat, playerSeat } from '../state.js';
import { takeOutpost } from '../outposts.js';

/**
 * The items on the mat, one of each type: the cards' and tile's ids (face down, view.js hides them from the others),
 * and `turn`, the turn the last one came on.
 * @typedef {{ items: { outpost?: true, house?: true, landmark?: string, tapestry?: string, territory?: number, tech?: string }, turn: number | null }} CollectorsData
 */

/** @typedef {'outpost' | 'house' | 'landmark' | 'tapestry' | 'territory' | 'tech'} ItemType */

/** The VP for 1 to 6 items at the end (03 §2.4). */
const ITEM_VP = [0, 1, 3, 6, 10, 15, 21];

/**
 * A player's Collectors data, if they hold the Collectors.
 * @param {import('../state.js').State} state
 * @param {number} player
 * @returns {CollectorsData | undefined}
 */
function dataOf(state, player) {
	if (!isPlayerSeat(state, player)) {
		return undefined;
	}
	const seat = playerSeat(state, player);
	return seat.civs.includes('collectors')
		? seat.civData.collectors
		: undefined;
}

/**
 * Whether an item of a type gained now may go on the Collectors' mat: on the player's own advance turn, while they
 * play, with none of that type there yet and no item collected this turn (Mike Young, 03 §2.4).
 * @param {import('../state.js').State} state
 * @param {number} player
 * @param {ItemType} type
 * @returns {boolean}
 */
export function collectorsMay(state, player, type) {
	const data = dataOf(state, player);
	return (
		data !== undefined &&
		state.current === player &&
		state.turnKind === 'advance' &&
		data.turn !== state.turn &&
		data.items[type] === undefined &&
		!playerSeat(state, player).finished
	);
}

/**
 * Puts an item on the Collectors' mat and gives 1 resource of the player's choice.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {ItemType} type
 * @param {string | number | true} item
 */
export function collect(ctx, player, type, item) {
	const data = /** @type {CollectorsData} */ (dataOf(ctx.state, player));
	/** @type {Record<string, unknown>} */ (data.items)[type] = item;
	data.turn = ctx.state.turn;
	emit(ctx.state, { type: 'itemCollected', player, item: type });
	ctx.push([
		{
			player,
			kind: 'effects',
			effects: [{ gain: { any: 1 } }],
			origin: 'civ',
		},
	]);
}

/**
 * The offer to put a card or tile just gained on the mat; the player may decline.
 * @param {number} player
 * @param {ItemType} type
 * @param {(string | number)[]} options
 * @returns {import('../state.js').NewOperation}
 */
function offerItem(player, type, options) {
	return { player, kind: 'chooseCollect', options: [...options], type };
}

/**
 * Takes a tapestry card, territory tile or tech card the player chose (`chooseCollect`) to the mat, if it may still go
 * there and is still where it was gained.
 * @type {import('../state.js').AutomaticKind}
 */
export function collectorsTake(ctx, op) {
	const player = /** @type {number} */ (op.player);
	/** @type {ItemType} */
	const type = op.type;
	if (!collectorsMay(ctx.state, player, type)) {
		return;
	}
	const seat = playerSeat(ctx.state, player);
	const rows = /** @type {const} */ (['bottom', 'middle', 'top']);
	const from =
		type === 'tapestry'
			? seat.hand
			: type === 'territory'
				? seat.territoryTiles
				: rows
						.map((row) => seat.tech[row])
						.find((row) => row.includes(op.slot));
	const at =
		/** @type {(string | number)[] | undefined} */ (from)?.indexOf(
			op.slot
		) ?? -1;
	if (!from || at === -1) {
		return;
	}
	from.splice(at, 1);
	collect(ctx, player, type, op.slot);
}

/**
 * The collectOutpost effect: an outpost from the supply onto the mat, instead of the conquer it came with (R129).
 * @type {import('../state.js').EffectHandler}
 */
export function collectOutpost(ctx, player) {
	if (!collectorsMay(ctx.state, player, 'outpost')) {
		return;
	}
	takeOutpost(ctx, player);
	collect(ctx, player, 'outpost', true);
}

/**
 * How many items a seat's Collectors mat holds.
 * @param {import('../state.js').PlayerSeat} seat
 * @returns {number}
 */
export function collected(seat) {
	/** @type {CollectorsData | undefined} */
	const data = seat.civData.collectors;
	return data ? Object.keys(data.items).length : 0;
}

/** @type {import('./civ.js').Civ} */
export const collectors = {
	id: 'collectors',
	setup(ctx, player) {
		playerSeat(ctx.state, player).civData.collectors =
			/** @type {CollectorsData} */ ({ items: {}, turn: null });
	},
	hooks: {
		tapestryGained: (state, owner, { player, cards }) =>
			owner === player && collectorsMay(state, owner, 'tapestry')
				? [offerItem(owner, 'tapestry', cards)]
				: [],
		tilesGained: (state, owner, { player, stack, tiles }) =>
			owner === player &&
			stack === 'territory' &&
			collectorsMay(state, owner, 'territory')
				? [offerItem(owner, 'territory', tiles)]
				: [],
		invented: (state, owner, { player, card }) =>
			owner === player && collectorsMay(state, owner, 'tech')
				? [offerItem(owner, 'tech', [card])]
				: [],
		// The end of the game: the items' VP, at the end of the final income turn.
		turnEnding(state, owner, { player }) {
			const seat = playerSeat(state, owner);
			const count = collected(seat);
			return owner === player &&
				state.turnKind === 'income' &&
				seat.incomeTurns === 5 &&
				count > 0
				? [
						{
							player: owner,
							kind: 'effects',
							effects: [{ vp: ITEM_VP[count] }],
						},
					]
				: [];
		},
	},
	adjustment: {
		// Current rules (F&F p.32): 1 resource of your choice.
		setup(ctx, player) {
			ctx.push([
				{ player, kind: 'effects', effects: [{ gain: { any: 1 } }] },
			]);
		},
	},
};
