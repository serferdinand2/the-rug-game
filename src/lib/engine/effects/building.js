// The building effect: take an income building off the income mat, to be placed in the capital city (#16).
import { emit } from '../events.js';
import { playerSeat } from '../state.js';
import { triggered } from '../abilities.js';

/**
 * The income buildings a list of effects would gain, when it gains nothing but buildings and none of them is left on
 * the player's income mat: such an option would gain nothing, so it can't be picked (R117, FAQ #23). Null for any
 * other list, an empty one included. The client reads it from the view, whose income mats are public.
 * @param {import('../state.js').State} state
 * @param {number} player
 * @param {object[]} effects
 * @returns {import('../data/ids.js').BuildingId[] | null}
 */
export function buildingsOut(state, player, effects) {
	if (
		!Array.isArray(effects) ||
		effects.length === 0 ||
		!effects.every(
			(effect) =>
				Object.keys(effect).length === 1 &&
				typeof (/** @type {any} */ (effect).building) === 'string'
		)
	) {
		return null;
	}
	const { buildings } = playerSeat(state, player).incomeMat;
	const ids = effects.map(
		(effect) =>
			/** @type {import('../data/ids.js').BuildingId} */ (
				/** @type {any} */ (effect).building
			)
	);
	return ids.every((id) => buildings[id] === 0) ? ids : null;
}

/** The income buildings' names, for a player's error. */
const BUILDING_NAMES = /** @type {Readonly<Record<string, string>>} */ (
	Object.freeze({
		house: 'House',
		market: 'Market',
		farm: 'Farm',
		armory: 'Armory',
	})
);

/**
 * The error for picking what would gain only buildings none of which is left (R117): "You have no House left."
 * @param {string[]} buildings
 * @returns {string}
 */
export function noneLeftMessage(buildings) {
	const names = buildings.map((id) => BUILDING_NAMES[id] ?? id);
	const list =
		names.length > 1
			? `${names.slice(0, -1).join(', ')} or ${names.at(-1)}`
			: names[0];
	return `You have no ${list} left.`;
}

/**
 * Takes the leftmost income building of a type off the income mat and hands it to placement; its triggers follow.
 * With none of that type left, nothing is gained, and no other type replaces it (FAQ #23).
 * @type {import('../state.js').EffectHandler}
 */
export function building(ctx, player, value) {
	const id = /** @type {import('../data/ids.js').BuildingId} */ (value);
	const seat = playerSeat(ctx.state, player);
	if (seat.incomeMat.buildings[id] === 0) {
		emit(ctx.state, { type: 'noBuildingLeft', player, building: id });
		return;
	}
	seat.incomeMat.buildings[id] -= 1;
	emit(ctx.state, { type: 'buildingGained', player, building: id });
	ctx.push([
		{ player, kind: 'placeBuilding', building: id },
		...triggered(ctx.state, 'buildingGained', { player, building: id }),
	]);
}
