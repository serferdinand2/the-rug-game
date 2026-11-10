// The civilization cards' live state (#78): what each spot on a card shows, from the seat's civData, and the spots the viewer's open decision offers there.
// game.js goes first: the civilization modules can't be the first engine modules imported (docs/architecture.md).
import './engine/game.js';
import { ENTERTAINERS_GRID } from './engine/civs/entertainers.js';
import { MERRYMAKERS_COLUMNS } from './engine/civs/merrymakers.js';
import { MILITANTS_SPACES } from './engine/civs/militants.js';
import { HISTORIANS_SQUARES } from './engine/civs/historians.js';
import { MYSTICS_PROPHECIES } from './engine/civs/mystics.js';
import { TRADERS_TOKENS } from './engine/civs/traders.js';
import { ISOLATIONISTS_TOKENS } from './engine/civs/isolationists.js';
import { HERALDS_TOKENS } from './engine/civs/heralds.js';
import { describeEffects } from './describe.js';
import { seatName } from './game-names.js';

/**
 * What a spot on a card shows: a player's piece on it (a Utilitarians token beside a landmark among them), a used
 * Leaders track, Treasure Hunters treasure, Tinkerers or Spies option, or reserve token, a space or square uncovered, a
 * Merrymakers column whose token has left the start, a Mystics prediction, or a prediction reached.
 * @typedef {'token' | 'used' | 'exposed' | 'moved' | 'chosen' | 'reached'} SpotMark
 */

/**
 * A card's live state, as CivilizationCard draws it.
 * @typedef {Object} CivCardView
 * @property {Record<string, SpotMark[]>} marks - What each spot shows now, by spot id
 * @property {Record<string, number[]>} choices - The spots the viewer's open decision offers on this card, each with
 *   the indexes of its answers; empty when there is nothing to choose here
 * @property {Record<string, string>} [pieces] - The piece on a spot, such as the income building on a Craftsmen space
 */

/**
 * The civilizations whose cards draw a seat's live state, in the order built: the first six's decisions are answered on
 * their card (#78); the Treasure Hunters', the Tinkerers' and the Spies' cards only mark the treasures and options
 * used, and the Utilitarians' the landmarks with a token beside them, as those are picked in the panel (#33); the
 * Traders', the Isolationists' and the Heralds' cards empty a reserve square for each token out (#180); the
 * Collectors' marks each item collected (#37). The Inventors'
 * card waits: its transfer box shows a card they took, which their civData alone can't tell.
 */
export const CARD_CIVS = Object.freeze([
	'entertainers',
	'merrymakers',
	'leaders',
	'militants',
	'historians',
	'mystics',
	'treasure-hunters',
	'tinkerers',
	'spies',
	'utilitarians',
	'traders',
	'isolationists',
	'heralds',
	// A&A (#37): each item collected marks its space; the Relentless' tokens, the Renegades' space and the Urban
	// Planners' kept landmarks show too.
	'collectors',
	'relentless',
	'renegades',
	'urban-planners',
	// F&F (#40): the Werefolk's tile, the Artificers' buildings set aside, the Faefolk's spot, the Celestials' token, the
	// Genies' tokens, the Illuminati's dice and the Merfolk's submerged cards. The Weefolk's tokens show on the cities.
	'werefolk',
	'artificers',
	'faefolk',
	'celestials',
	'genies',
	'illuminati',
	'merfolk',
]);

/** The token reserves whose civData counts the tokens still on the card (#180), with how many each starts with. */
const RESERVES = /** @type {Readonly<Record<string, number>>} */ (
	Object.freeze({
		traders: TRADERS_TOKENS,
		isolationists: ISOLATIONISTS_TOKENS,
		heralds: HERALDS_TOKENS,
	})
);

/** The card each slot purpose is answered on. The Historians' tile to discard stays in the panel. */
const CARD_OF_PURPOSE = /** @type {Readonly<Record<string, string>>} */ (
	Object.freeze({
		entertainers: 'entertainers',
		merrymakers: 'merrymakers',
		leaders: 'leaders',
		militantsRow: 'militants',
		militantsPlace: 'militants',
		historians: 'historians',
	})
);

/** The Militants' spaces by row, as the card reads them. */
const MILITANT_SPACES = /** @type {Record<string, any[]>} */ (MILITANTS_SPACES);

const MILITANT_ROWS = /** @type {const} */ (['top', 'bottom']);

/**
 * What each spot of a civilization's card shows, from its civData.
 * @param {string} civ - The civilization's id
 * @param {any} data - The seat's civData for it; undefined before its setup
 * @returns {Record<string, SpotMark[]>}
 */
export function civCardMarks(civ, data) {
	/** @type {Record<string, SpotMark[]>} */
	const marks = {};
	if (!data) {
		return marks;
	}
	const mark = (/** @type {string} */ spot, /** @type {SpotMark} */ what) => {
		(marks[spot] ??= []).push(what);
	};
	// Each token out has left the reserve, emptied from the left, as the Utilitarians' below.
	if (Object.hasOwn(RESERVES, civ)) {
		for (let i = 0; i < RESERVES[civ] - data.tokens; i++) {
			mark(`token${i}`, 'used');
		}
	}
	switch (civ) {
		case 'collectors':
			for (const type of Object.keys(data.items)) {
				mark(type, 'token');
			}
			break;
		case 'relentless':
			for (let i = 0; i < data.tokens; i++) {
				mark('tokens', 'token');
			}
			break;
		case 'renegades':
			if (data.at > 0) {
				mark(`tier${data.at}`, 'token');
			}
			break;
		case 'urban-planners':
			for (const landmark of data.stored) {
				mark(`stored-${landmark}`, 'token');
			}
			break;
		case 'entertainers':
			mark(data.at, 'token');
			break;
		case 'merrymakers':
			data.levels.forEach(
				(/** @type {number} */ level, /** @type {number} */ column) => {
					if (level > 0) {
						mark(`m${column}`, 'moved');
					}
					mark(`m${column}l${level}`, 'token');
				}
			);
			break;
		case 'leaders':
			for (const track of data.used) {
				mark(track, 'used');
			}
			break;
		case 'militants':
			for (const row of MILITANT_ROWS) {
				data[row].forEach(
					(
						/** @type {boolean} */ covered,
						/** @type {number} */ space
					) => {
						mark(`${row}${space}`, covered ? 'token' : 'exposed');
					}
				);
			}
			break;
		case 'historians':
			data.squares.forEach(
				(
					/** @type {boolean} */ covered,
					/** @type {number} */ square
				) => {
					mark(`square${square}`, covered ? 'token' : 'exposed');
				}
			);
			break;
		case 'mystics':
			for (const [category, value] of Object.entries(data.predictions)) {
				mark(`${category}:${value}`, 'chosen');
			}
			for (const category of data.reached) {
				mark(category, 'reached');
			}
			break;
		case 'treasure-hunters':
			for (const terrain of data.used) {
				mark(terrain, 'used');
			}
			break;
		case 'tinkerers':
		case 'spies':
			for (const option of data.used) {
				mark(`option${option}`, 'used');
			}
			break;
		// F&F (#40): a token on the box, and what the label names.
		case 'werefolk':
			if (data.tile !== null) {
				mark('tile', 'token');
				mark(`tile:${data.tile}`, 'token');
			}
			break;
		case 'artificers':
			for (const _ of data.aside) {
				mark('aside', 'token');
			}
			break;
		case 'faefolk':
			mark('token', 'token');
			mark(`spot:${data.spot}`, 'token');
			break;
		case 'celestials':
			if (data.hex) {
				mark('float', 'token');
			}
			break;
		case 'genies':
			for (const _ of data.tokens) {
				mark('tokens', 'token');
			}
			break;
		case 'illuminati':
			for (const _ of data.onMat) {
				mark('dice', 'token');
			}
			break;
		// The others see a count of the cards; their player sees the cards.
		case 'merfolk': {
			const count = Array.isArray(data.submerged)
				? data.submerged.length
				: data.submerged;
			for (let i = 0; i < count; i++) {
				mark('submerged', 'token');
			}
			break;
		}
		// Each token out sits beside its landmark's box and has left the reserve, emptied from the left.
		case 'utilitarians':
			data.active.forEach(
				(
					/** @type {string} */ landmark,
					/** @type {number} */ index
				) => {
					mark(landmark, 'token');
					mark(`token${index}`, 'used');
				}
			);
			break;
	}
	return marks;
}

/**
 * The civilization whose card a decision is answered on, or null for a decision answered elsewhere.
 * @param {any} decision
 * @returns {string | null}
 */
export function cardCivOf(decision) {
	if (decision?.kind === 'chooseProphecy') {
		return 'mystics';
	}
	if (decision?.kind === 'chooseSlot') {
		return CARD_OF_PURPOSE[decision.purpose] ?? null;
	}
	return null;
}

/**
 * The deciding seat's civData for a civilization, from the view.
 * @param {any} game
 * @param {number} player
 * @param {string} civ
 * @returns {any}
 */
function dataOf(game, player, civ) {
	return game.seats?.[player - 1]?.civData?.[civ];
}

/**
 * The spot on the card an answer picks: the Entertainers' space, the Merrymakers' cell a token climbs to, the Leaders'
 * track, the Militants' space a row's outpost leaves or covers, the Historians' square, or the Mystics' number. Null for
 * a decline and for any decision answered elsewhere.
 * @param {any} decision
 * @param {any} answer
 * @param {any} game - The game view, whose civData says where a token climbs to
 * @returns {string | null}
 */
export function cardSpot(decision, answer, game) {
	const civ = cardCivOf(decision);
	if (civ === 'mystics') {
		return Number.isInteger(answer.value)
			? `${decision.category}:${answer.value}`
			: null;
	}
	const slot = answer.slot;
	if (civ === null || slot === null || slot === undefined) {
		return null;
	}
	switch (decision.purpose) {
		case 'entertainers':
		case 'leaders':
			return String(slot);
		case 'merrymakers': {
			const levels = dataOf(game, decision.player, civ)?.levels ?? [];
			return `m${slot}l${(levels[slot] ?? 0) + 1}`;
		}
		case 'militantsRow':
		case 'militantsPlace': {
			const spaces = dataOf(game, decision.player, civ)?.[slot] ?? [];
			const space =
				decision.purpose === 'militantsRow'
					? spaces.indexOf(true)
					: spaces.lastIndexOf(false);
			return `${slot}${space}`;
		}
		case 'historians':
			return `square${slot.square}`;
		default:
			return null;
	}
}

/**
 * A reward as the card's spot names it: "2 VP" or "1 coin", without the "Gain".
 * @param {any} effect
 * @returns {string}
 */
function reward(effect) {
	return describeEffects([effect], {}).replace(/^Gain /, '');
}

/**
 * What a spot on the card gives, for the panel (#78): the reward a token moves to, the free advance, the space
 * uncovered or covered, the token given. Null for a decline, a Mystics number (its prompt words it already) and any
 * decision answered elsewhere.
 * @param {any} decision
 * @param {any} answer
 * @param {any} game - The game view
 * @returns {string | null}
 */
export function spotWords(decision, answer, game) {
	const spot = cardSpot(decision, answer, game);
	if (spot === null || decision.kind !== 'chooseSlot') {
		return null;
	}
	const slot = answer.slot;
	switch (decision.purpose) {
		case 'entertainers':
			return describeEffects(
				ENTERTAINERS_GRID[Number(spot[1]) - 1][Number(spot[3]) - 1],
				{}
			);
		case 'merrymakers': {
			const level = Number(spot.split('l')[1]);
			return describeEffects(MERRYMAKERS_COLUMNS[slot][level - 1], {});
		}
		case 'leaders':
			return describeEffects(
				[{ advance: { tracks: [slot], noBonus: true } }],
				{}
			);
		case 'militantsRow':
		case 'militantsPlace': {
			const space =
				MILITANT_SPACES[slot][Number(spot.slice(slot.length))];
			const verb =
				decision.purpose === 'militantsRow' ? 'Uncover' : 'Cover';
			return `${verb} the ${reward(space)} space`;
		}
		case 'historians': {
			const name = seatName(game, slot.to);
			return `Give ${name} a token, uncovering the ${reward(HISTORIANS_SQUARES[slot.square])} square`;
		}
		default:
			return null;
	}
}

/**
 * A seat's civilization card as it stands, and the spots the viewer's open decision offers on it.
 * @param {any} game - The game view
 * @param {number | null} seat - The card's seat
 * @param {string} civ - The card's civilization
 * @param {any} [decision] - The viewer's open decision; only one of this seat's, on this card, offers spots
 * @returns {CivCardView}
 */
export function civCardView(game, seat, civ, decision = null) {
	const marks =
		seat === null ? {} : civCardMarks(civ, dataOf(game, seat, civ));
	/** @type {Record<string, number[]>} */
	const choices = {};
	if (decision && decision.player === seat && cardCivOf(decision) === civ) {
		/** @type {any[]} */ (decision.answers ?? []).forEach(
			(answer, index) => {
				const spot = cardSpot(decision, answer, game);
				if (spot !== null) {
					(choices[spot] ??= []).push(index);
				}
			}
		);
	}
	return { marks, choices };
}

/** The Mystics' prediction categories, with the most each can be, in the card's order. */
export const PREDICTIONS = MYSTICS_PROPHECIES;
