// The player area's income mat and era slots (#27 design §2.3-2.4), from a seat in the game view.
import { describeEffects } from '../describe.js';
import { exposedSpaces } from '../engine/game.js';
import { INCOME_MAT } from '../engine/data/income-mat.js';
import { BUILDING_IDS } from '../engine/data/ids.js';
import { tapestryName } from '../game-names.js';

/** @typedef {import('../engine/data/effects.js').Effect} Effect */

/**
 * One space of an income row.
 * @typedef {Object} IncomeSpaceView
 * @property {string} name - The innovation, as printed
 * @property {string} reward - Its income and scoring in words, or '' when it has neither
 * @property {boolean} covered - A building still sits on it
 */

/**
 * One building row of the income mat.
 * @typedef {Object} IncomeRowView
 * @property {import('../engine/data/ids.js').BuildingId} building
 * @property {number} left - Buildings still on the row, 0 to 5
 * @property {IncomeSpaceView[]} spaces - Six, left to right
 */

/**
 * One era slot of the tapestry strip.
 * @typedef {Object} EraSlotView
 * @property {number} era - 1 to 4
 * @property {string | null} card - The slot's top card name, 'Maker of Fire' for an uncovered era 1, or null when none
 * @property {boolean} faceDown - A card sits on the slot but is hidden
 * @property {boolean} active - The seat's THIS ERA ability rests on this slot's top card
 * @property {string | null} id - The top card's id, null for Maker of Fire, an empty slot or a face-down card
 */

/**
 * The seat's four income rows. A space is covered unless the engine counts it exposed (#128).
 * @param {any} seat - A seat of the game view
 * @returns {IncomeRowView[]}
 */
export function incomeRows(seat) {
	return BUILDING_IDS.map((building) => {
		const left = seat.incomeMat.buildings[building];
		const exposed = exposedSpaces(seat, building).length;
		return {
			building,
			left,
			spaces: INCOME_MAT[building].map((space, index) => ({
				name: space.name,
				reward: /** @type {[string, readonly Effect[]][]} */ ([
					['Income', space.income],
					['Score', space.score],
				])
					.filter(([, effects]) => effects.length > 0)
					.map(
						([label, effects]) =>
							`${label}: ${describeEffects(effects)}`
					)
					.join('. '),
				covered: index >= exposed,
			})),
		};
	});
}

/**
 * The seat's four era slots.
 * @param {any} seat - A seat of the game view
 * @returns {EraSlotView[]}
 */
export function eraSlots(seat) {
	const active = seat.era?.card ?? null;
	return [1, 2, 3, 4].map((era) => {
		const stack = seat.incomeMat.tapestry[era - 1] ?? [];
		// Era 1 shows the printed Maker of Fire until a card covers it, as the Heralds' may (R35).
		if (era === 1 && stack.length === 0) {
			return {
				era,
				card: 'Maker of Fire',
				faceDown: false,
				active: false,
				id: null,
			};
		}
		if (stack.length === 0) {
			return {
				era,
				card: null,
				faceDown: false,
				active: false,
				id: null,
			};
		}
		const id = stack[stack.length - 1];
		if (id === null) {
			return { era, card: null, faceDown: true, active: false, id: null };
		}
		return {
			era,
			card: tapestryName(id),
			faceDown: false,
			active: active === id,
			id,
		};
	});
}
