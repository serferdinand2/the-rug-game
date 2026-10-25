// The building effect: take an income building off the income mat, to be placed in the capital city (#16).
import { emit } from '../events.js';
import { playerSeat } from '../state.js';
import { triggered } from '../abilities.js';

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
