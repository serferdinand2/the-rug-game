// The income mat: its 4 building rows of 6 spaces, with their income and VP icons, and the 4 tapestry slots (01 §4.2, §5).
import { deepFreeze } from './ids.js';

/** @typedef {import('./ids.js').BuildingId} BuildingId */
/** @typedef {import('./effects.js').Effect} Effect */
/** @typedef {import('./effects.js').Gain} Gain */

/**
 * One space of a building row. Space 1 is always exposed; taking a building uncovers the next one.
 * @typedef {Object} IncomeSpace
 * @property {string} id - The innovation's name as a slug, such as 'currency'
 * @property {string} name - The innovation, as printed
 * @property {BuildingId} row
 * @property {number} space - 1–6, left to right
 * @property {Effect[]} income - Gained in step 4 of income turns 1–4
 * @property {Effect[]} score - Scored in step 3 of income turns 2–5
 * @property {boolean} prerequisite - A landmark tech card's prerequisite names this space (R18)
 */

/**
 * One era slot of the tapestry strip.
 * @typedef {Object} TapestrySlot
 * @property {number} era - 1–4
 * @property {string | null} printed - The tapestry printed on the slot, or null for an empty one
 * @property {Gain | null} firstBonus - Gained before covering the slot when neither neighbour has started this era
 */

// R18: the prerequisite is met while that space has no building on it, for you or either neighbour.
const PREREQUISITES = [
	'currency',
	'banking',
	'farming',
	'breeding',
	'writing',
	'telephone',
];

/**
 * A building row's six spaces, left to right.
 * @param {BuildingId} row
 * @param {[name: string, income: Effect[], score: Effect[]][]} spaces
 * @returns {IncomeSpace[]}
 */
function buildingRow(row, spaces) {
	return spaces.map(([name, income, score], index) => {
		const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
		return {
			id,
			name,
			row,
			space: index + 1,
			income,
			score,
			prerequisite: PREREQUISITES.includes(id),
		};
	});
}

/**
 * The four building rows, by building type: `INCOME_MAT.market[1]` is Currency, the row's space 2.
 * Repeated icons stack: each exposed copy scores on its own (01 §5).
 * @type {Readonly<Record<BuildingId, readonly IncomeSpace[]>>}
 */
export const INCOME_MAT = deepFreeze({
	market: buildingRow('market', [
		['Barter', [{ gain: { coin: 1 } }], [{ vp: { per: 'techCard' } }]],
		['Currency', [{ gain: { coin: 1 } }], []],
		['Banking', [], [{ vp: { per: 'techCard' } }]],
		['Credit Cards', [{ gain: { coin: 1 } }], []],
		['E-Commerce', [{ gain: { coin: 1 } }], [{ vp: { per: 'techCard' } }]],
		['Biometrics', [], [{ vp: 10 }]],
	]),
	house: buildingRow('house', [
		['Symbology', [{ gain: { worker: 1 } }], [{ scoreCapital: {} }]],
		['Language', [{ gain: { worker: 1 } }], []],
		['Writing', [], [{ scoreCapital: {} }]],
		['Telephone', [{ gain: { worker: 1 } }], []],
		['Email', [{ gain: { worker: 1 } }], [{ scoreCapital: {} }]],
		['Neural Implants', [], [{ vp: 10 }]],
	]),
	farm: buildingRow('farm', [
		['Hunting', [{ gain: { food: 1, territory: 1 } }], []],
		['Farming', [{ gain: { food: 1 } }], []],
		['Breeding', [], [{ vp: 4 }]],
		['Preservation', [{ gain: { food: 1 } }], []],
		['Fertilization', [{ gain: { food: 1 } }], [{ vp: 7 }]],
		['Food Printing', [], [{ vp: 10 }]],
	]),
	armory: buildingRow('armory', [
		['Ceremony', [{ gain: { culture: 1, tapestry: 1 } }], []],
		['Racing', [{ gain: { culture: 1 } }], []],
		['Team Sports', [], [{ vp: { per: 'territory' } }]],
		['Tabletop Games', [{ gain: { culture: 1 } }], []],
		[
			'Video Games',
			[{ gain: { culture: 1 } }],
			[{ vp: { per: 'territory' } }],
		],
		['Virtual Reality', [], [{ vp: 10 }]],
	]),
});

/**
 * The tapestry strip, era 1 to 4. Era 1 is printed with Maker of Fire, so income turn 1 plays no card (01 §4.2).
 * @type {readonly TapestrySlot[]}
 */
export const TAPESTRY_SLOTS = deepFreeze([
	{ era: 1, printed: 'Maker of Fire', firstBonus: null },
	{ era: 2, printed: null, firstBonus: { any: 1 } },
	{ era: 3, printed: null, firstBonus: { any: 2 } },
	{ era: 4, printed: null, firstBonus: { any: 3 } },
]);
