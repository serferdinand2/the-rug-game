// The player area's income mat and era slots (#27 design §2.3-2.4), from a seat in the game view.
import { describeEffects } from '../describe.js';
import { exposedSpaces } from '../engine/game.js';
import { INCOME_MAT, INSPIRED_MAT } from '../engine/data/income-mat.js';
import { BUILDING_IDS } from '../engine/data/ids.js';
import {
	buildingName,
	landmarkName,
	roman,
	tapestryName,
} from '../game-names.js';
import { article, capitalize, joinList, pluralOf } from '../words.js';
import { reservedWords } from '../reserved-words.js';
import { spaceGlyphs } from '../glyphs.js';

/** @typedef {import('../engine/data/effects.js').Effect} Effect */

/**
 * One space of an income row.
 * @typedef {Object} IncomeSpaceView
 * @property {string} name - The innovation, as printed
 * @property {string} reward - Its income and scoring in words, or '' when it has neither
 * @property {import('../glyphs.js').Glyph[]} incomeGlyphs - Income effects as shared symbols
 * @property {import('../glyphs.js').Glyph[]} scoreGlyphs - Scoring effects as shared symbols
 * @property {boolean} covered - A building still sits on it
 * @property {string} label - The space in words: "Barter. Income: Gain 1 coin", or "Barter, covered by a market"
 * @property {boolean} improved - An inspiration tile improves it: spaces 2, 4 and 6 of an inspired row (#35)
 */

/**
 * One building row of the income mat.
 * @typedef {Object} IncomeRowView
 * @property {import('../engine/data/ids.js').BuildingId} building
 * @property {string} name - The row's buildings, as its heading names them: "Markets"
 * @property {number} left - Buildings still on the row, 0 to 5
 * @property {IncomeSpaceView[]} spaces - Six, left to right
 * @property {boolean} inspired - The seat's inspiration tile is on this row (#35)
 */

/**
 * One era slot of the tapestry strip.
 * @typedef {Object} EraSlotView
 * @property {number} era - 1 to 4
 * @property {string | null} card - The slot's top card name, 'Maker of Fire' for an uncovered era 1, or null when none
 * @property {boolean} faceDown - A card sits on the slot but is hidden
 * @property {boolean} active - The seat's THIS ERA ability rests on this slot's top card
 * @property {string | null} id - The top card's id, null for Maker of Fire, an empty slot or a face-down card
 * @property {string} heading - "Era II", or "Era II · Active" for the active slot
 * @property {string} text - The card's name, "Face-down card" or "Not yet chosen"
 * @property {string[]} pieces - What the top card holds, such as "a Farm" or "the Forge" (A&A's cards, #37)
 * @property {any[]} held - The same pieces as the engine places them, which the Eras tab draws on the card (#184)
 * @property {string[]} [overlay] - F&F's fifth slot only: the items reserved on the income mat's overlay, in words (#39)
 */

/**
 * The seat's four income rows. A space is covered unless the engine counts it exposed (#128). A row with the seat's
 * inspiration tile reads its improved spaces (#35, 03 §2.8).
 * @param {any} seat - A seat of the game view
 * @returns {IncomeRowView[]}
 */
export function incomeRows(seat) {
	return BUILDING_IDS.map((building) => {
		const left = seat.incomeMat.buildings[building];
		// The spaces showing, by identity: the Artificers may slide a building and leave a gap (#40).
		const exposed = new Set(exposedSpaces(seat, building));
		const inspired =
			Array.isArray(seat.inspired) && seat.inspired.includes(building);
		/** @type {readonly import('../engine/data/income-mat.js').IncomeSpace[]} */
		const mat = inspired ? INSPIRED_MAT[building] : INCOME_MAT[building];
		return {
			building,
			name: pluralOf(buildingName(building)),
			left,
			inspired,
			spaces: mat.map((space) => {
				const incomeGlyphs = spaceGlyphs(space.income);
				const scoreGlyphs = spaceGlyphs(space.score);
				const reward = /** @type {[string, readonly Effect[]][]} */ ([
					['Income', space.income],
					['Score', space.score],
				])
					.filter(([, effects]) => effects.length > 0)
					.map(
						([label, effects]) =>
							`${label}: ${describeEffects(effects)}`
					)
					.join('. ');
				const covered = !exposed.has(space);
				return {
					name: space.name,
					reward,
					incomeGlyphs,
					scoreGlyphs,
					covered,
					improved: space.inspired === true,
					label: covered
						? `${space.name}, covered by ${article(building)} ${building}`
						: `${space.name}. ${reward}`,
				};
			}),
		};
	});
}

/**
 * The seat's four era slots.
 * @param {any} seat - A seat of the game view
 * @returns {EraSlotView[]} Four slots, and with F&F a fifth for the income mat's overlay (#39)
 */
export function eraSlots(seat) {
	const active = seat.era?.card ?? null;
	const slots = [1, 2, 3, 4].map((era) => {
		const slot = eraSlot(seat, era, active);
		/** @type {any[]} */
		const held = (slot.id && seat.onCards?.[slot.id]) || [];
		return {
			...slot,
			held,
			pieces: held.map((piece) =>
				'building' in piece
					? `${article(buildingName(piece.building))} ${buildingName(piece.building)}`
					: `the ${landmarkName(piece.landmark)}`
			),
			heading: `Era ${roman(era)}${slot.active ? ' · Active' : ''}`,
			text:
				slot.card ??
				(slot.faceDown ? 'Face-down card' : 'Not yet chosen'),
		};
	});
	if (!Array.isArray(seat.reserved)) {
		return slots;
	}
	// F&F's overlay (#39), awaiting review: what waits there for income turn 5.
	const overlay = seat.reserved.map(reservedWords);
	return [
		...slots,
		{
			era: 5,
			card: null,
			faceDown: false,
			active: false,
			id: null,
			pieces: [],
			held: [],
			overlay,
			heading: 'Income turn 5',
			text:
				overlay.length > 0
					? capitalize(joinList(overlay))
					: 'Nothing reserved',
		},
	];
}

/**
 * The era to show by default: the active slot, otherwise the latest slot with a card.
 * @param {readonly EraSlotView[]} slots
 * @returns {number | null}
 */
export function defaultEra(slots) {
	return (
		slots.find((slot) => slot.active)?.era ??
		slots.findLast((slot) => slot.id !== null || slot.faceDown)?.era ??
		null
	);
}

/**
 * The slot of the era the seat is in (#174): the one `defaultEra` picks, else the latest that shows anything, such as
 * the printed Maker of Fire; null with no slots.
 * @param {readonly EraSlotView[]} slots
 * @returns {EraSlotView | null}
 */
export function currentEra(slots) {
	const era = defaultEra(slots);
	return (
		slots.find((slot) => slot.era === era) ??
		slots.findLast((slot) => slot.card !== null || slot.faceDown) ??
		null
	);
}

/**
 * One era slot's card, before its words.
 * @param {any} seat
 * @param {number} era
 * @param {string | null} active - The card the seat's THIS ERA ability rests on
 * @returns {Omit<EraSlotView, 'heading' | 'text' | 'pieces' | 'held'>}
 */
function eraSlot(seat, era, active) {
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
		return { era, card: null, faceDown: false, active: false, id: null };
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
}
