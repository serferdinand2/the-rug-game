// The Mystics (02 §1.2): four predictions at setup, 1 resource the first time a count reaches its prediction, and 10 VP for each exact one on income turn 5.
import { emit } from '../events.js';
import { playerSeat, seatOf } from '../state.js';
import { cityPlots, completeDistricts } from '../city.js';
import { countVp } from '../effects/vp.js';
import { LAST_SPACE, spacesAdvanced } from '../movement.js';
import { TRACK_IDS } from '../data/ids.js';

/** @typedef {'techCards' | 'districts' | 'territories' | 'tracks'} ProphecyCategory */

/**
 * The Mystics' own state.
 * @typedef {Object} MysticsData
 * @property {Partial<Record<ProphecyCategory, number>>} predictions - The number predicted in each category, once made
 * @property {ProphecyCategory[]} reached - The categories whose count has reached its prediction, in the order reached
 */

/**
 * The categories in the order they are predicted, each with the highest number it allows (the lowest is 1).
 * @type {{ category: ProphecyCategory, most: number }[]}
 */
const PROPHECIES = [
	{ category: 'techCards', most: 9 },
	{ category: 'districts', most: 9 },
	{ category: 'territories', most: 9 },
	{ category: 'tracks', most: 4 },
];

/** The card's prophecies, for the interface's live card (#78). */
export { PROPHECIES as MYSTICS_PROPHECIES };

/**
 * What a player counts now in each category: tech cards in every row, complete districts, controlled territories
 * and completed tracks.
 * @param {import('../state.js').State} state
 * @param {number} player
 * @returns {Record<ProphecyCategory, number>}
 */
function prophecyCounts(state, player) {
	const seat = playerSeat(state, player);
	return {
		techCards: countVp(state, player, 'techCard'),
		districts: completeDistricts(cityPlots(seat)).length,
		territories: countVp(state, player, 'territory'),
		tracks: TRACK_IDS.filter(
			(track) => spacesAdvanced(seat, track) === LAST_SPACE
		).length,
	};
}

/**
 * The operation that pays for each predicted category whose count equals its prediction now and hasn't before, or
 * none. It only reads, so a hook can call it at the moment of the check (#20 design §7). Before the Mystics are set
 * up there is nothing to check: the setup lanes run side by side, so another lane can change a count first.
 * @param {import('../state.js').State} state
 * @param {number} player
 * @returns {import('../state.js').NewOperation[]}
 */
function checkOps(state, player) {
	/** @type {MysticsData | undefined} */
	const data = playerSeat(state, player).civData.mystics;
	if (!data) {
		return [];
	}
	const counts = prophecyCounts(state, player);
	const categories = PROPHECIES.map(({ category }) => category).filter(
		(category) =>
			!data.reached.includes(category) &&
			data.predictions[category] === counts[category]
	);
	return categories.length > 0
		? [{ player, kind: 'mysticsCheck', categories }]
		: [];
}

/**
 * Asks for the prediction of the first category not predicted yet; once all four are made, checks the counts (BGA).
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 */
function nextProphecy(ctx, player) {
	/** @type {MysticsData} */
	const data = playerSeat(ctx.state, player).civData.mystics;
	const next = PROPHECIES.find(
		({ category }) => !Object.hasOwn(data.predictions, category)
	);
	if (!next) {
		ctx.push(checkOps(ctx.state, player));
		return;
	}
	ctx.push([
		{
			player,
			kind: 'chooseProphecy',
			category: next.category,
			options: Array.from({ length: next.most }, (_, i) => i + 1),
		},
	]);
}

/**
 * Records a prediction, then goes on to the next.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {ProphecyCategory} category
 * @param {number} value
 */
export function predict(ctx, player, category, value) {
	/** @type {MysticsData} */
	const data = playerSeat(ctx.state, player).civData.mystics;
	data.predictions[category] = value;
	emit(ctx.state, { type: 'prophecyMade', player, category, value });
	nextProphecy(ctx, player);
}

/**
 * Marks the categories a check found as reached and pays 1 resource of the player's choice for each. One reached
 * since the check was made is skipped, so each category pays once.
 * @type {import('../state.js').AutomaticKind}
 */
export function mysticsCheck(ctx, op) {
	const player = /** @type {number} */ (op.player);
	/** @type {MysticsData} */
	const data = playerSeat(ctx.state, player).civData.mystics;
	/** @type {ProphecyCategory[]} */
	const fresh = op.categories.filter(
		(/** @type {ProphecyCategory} */ category) =>
			!data.reached.includes(category)
	);
	for (const category of fresh) {
		data.reached.push(category);
		emit(ctx.state, { type: 'prophecyReached', player, category });
	}
	if (fresh.length > 0) {
		ctx.push([
			{
				player,
				kind: 'effects',
				effects: [{ gain: { any: fresh.length } }],
			},
		]);
	}
}

/** @type {import('./civ.js').Civ} */
export const mystics = {
	id: 'mystics',
	incomeTurns: [5],
	// At setup the four predictions, one category at a time; gained later, the Mystics are discarded for another civilization.
	setup(ctx, player, midGame) {
		const { state } = ctx;
		const seat = playerSeat(state, player);
		if (midGame) {
			seat.civs.splice(seat.civs.lastIndexOf('mystics'), 1);
			state.supply.civDiscard.push('mystics');
			emit(state, { type: 'civDiscarded', player, civ: 'mystics' });
			ctx.push([{ player, kind: 'effects', effects: [{ gainCiv: {} }] }]);
			return;
		}
		seat.civData.mystics = /** @type {MysticsData} */ ({
			predictions: {},
			reached: [],
		});
		nextProphecy(ctx, player);
	},
	// The final income turn: 10 VP for each category whose count equals its prediction; none before they are set up.
	income(ctx, player) {
		/** @type {MysticsData | undefined} */
		const data = playerSeat(ctx.state, player).civData.mystics;
		if (!data) {
			return;
		}
		const counts = prophecyCounts(ctx.state, player);
		const exact = PROPHECIES.filter(
			({ category }) => data.predictions[category] === counts[category]
		).length;
		if (exact > 0) {
			ctx.push([
				{ player, kind: 'effects', effects: [{ vp: 10 * exact }] },
			]);
		}
	},
	hooks: {
		// Whoever's change it was: an opponent's conquest can take one of the owner's territories. A finished owner
		// gains nothing from it, so nothing is checked.
		countsChanged: (state, owner) =>
			seatOf(state, owner).finished ? [] : checkOps(state, owner),
	},
	adjustment: {
		setup(ctx, player) {
			ctx.push([
				{ player, kind: 'effects', effects: [{ gain: { any: 1 } }] },
			]);
		},
	},
};
