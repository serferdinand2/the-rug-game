// The game's names as players read them (#123, #101): tracks, spaces, resources, pieces, cards, civilizations, seats, hexes, achievements, numerals, rules versions, expansions and variants.
import { TRACKS } from './engine/data/tracks.js';
import { tapestryCard } from './engine/data/tapestry-cards.js';
import { TECH_CARDS } from './engine/data/tech-cards.js';
import { ACHIEVEMENTS } from './engine/data/achievements.js';
import { ASSETS, EXPANSIONS } from './art/catalog.js';
import { capitalize, nounOf, signed, titleOf } from './words.js';

/** @typedef {{ seats?: readonly { name?: string }[] }} Table - A state or a view: the seats' names */

const TRACK_NAMES = /** @type {Readonly<Record<string, string>>} */ ({
	exploration: 'Exploration',
	science: 'Science',
	technology: 'Technology',
	military: 'Military',
});

const RESOURCE_NAMES = /** @type {Readonly<Record<string, string>>} */ ({
	coin: 'Coin',
	food: 'Food',
	worker: 'Worker',
	culture: 'Culture',
});

/** The achievements by the short names the strip shows; the engine's own names are longer. */
const ACHIEVEMENT_NAMES = /** @type {Readonly<Record<string, string>>} */ ({
	'complete-track': 'Complete a track',
	'topple-two': 'Topple two outposts',
	'middle-island': 'Conquer the middle',
});

/** The rules versions as the lobby's mockup names them, in full and in the settings row (owner, #101). */
const VERSION_NAMES =
	/** @type {Readonly<Record<string, { full: string, short: string }>>} */ ({
		current: { full: 'Current rules', short: 'Current rules' },
		original: { full: 'Original 2019 rules', short: 'Original 2019' },
	});

/** The variants (#53) by the lobby's short row titles; the engine's full names are their tooltips. */
const VARIANT_NAMES = /** @type {Readonly<Record<string, string>>} */ ({
	'tapestry-draft': 'Tapestry draft',
	'civ-draft': 'Civilization draft',
	'neoprene-nanotechnology': 'Neoprene Nanotechnology',
	'no-radio-battery': 'No Radio or Battery',
	'closest-island': 'Closest island',
});

const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

/**
 * Whether a value is a whole number of things.
 * @param {unknown} value
 * @returns {value is number}
 */
function isCount(value) {
	return Number.isInteger(value) && /** @type {number} */ (value) >= 0;
}

/**
 * A catalog asset's name by its id.
 * @param {string} id - Such as 'landmark/tv-station'
 * @returns {string | undefined}
 */
function assetName(id) {
	return ASSETS.find((asset) => asset.id === id)?.name;
}

/**
 * A track's name, such as "Exploration".
 * @param {unknown} track
 * @returns {string}
 */
export function trackName(track) {
	if (typeof track !== 'string') {
		return 'a track';
	}
	return TRACK_NAMES[track] ?? titleOf(track);
}

/**
 * A track space's name, such as "Ships", from the engine's track; space 0 is the start.
 * @param {unknown} track
 * @param {unknown} space
 * @returns {string}
 */
export function spaceName(track, space) {
	const spaces =
		typeof track === 'string' && Object.hasOwn(TRACKS, track)
			? TRACKS[/** @type {keyof typeof TRACKS} */ (track)]
			: null;
	if (!spaces || !isCount(space) || space >= spaces.length) {
		return isCount(space) ? `space ${space}` : 'a space';
	}
	return space === 0 ? 'the start' : spaces[space].name;
}

/**
 * A resource's name as a title or a tooltip shows it: "Coin", and "Resource of your choice" for `any`. Any other id
 * comes back as it is.
 * @param {string} id - A resource, or 'any'
 * @returns {string}
 */
export function resourceName(id) {
	if (id === 'any') {
		return capitalize(nounOf('any', 1));
	}
	return RESOURCE_NAMES[id] ?? id;
}

/**
 * An income building's name, such as "Farm".
 * @param {unknown} building
 * @returns {string}
 */
export function buildingName(building) {
	return typeof building === 'string' ? titleOf(building) : 'Building';
}

/**
 * A landmark's name, such as "Train Station" or "TV Station", from the art catalog, which names every landmark of
 * the game and its expansions.
 * @param {unknown} id
 * @returns {string}
 */
export function landmarkName(id) {
	if (typeof id !== 'string') {
		return 'Landmark';
	}
	return assetName(`landmark/${id}`) ?? titleOf(id);
}

/**
 * A tapestry card by id, through the engine's lookup, so each of the 7 trap copies is the trap; null for an id no
 * card has.
 * @param {unknown} id
 * @returns {import('./engine/data/tapestry-cards.js').TapestryCard | null}
 */
export function tapestryCardOf(id) {
	if (typeof id !== 'string') {
		return null;
	}
	try {
		return tapestryCard(id);
	} catch {
		// The engine throws for an id no card has, which only a hand-made view can hold.
		return null;
	}
}

/**
 * A tapestry card's name, such as "Age of Sail"; the 7 trap copies are each "Trap".
 * @param {unknown} id
 * @returns {string}
 */
export function tapestryName(id) {
	if (typeof id !== 'string') {
		return 'a face-down card';
	}
	return tapestryCardOf(id)?.name ?? titleOf(id);
}

/**
 * A tech card's name, such as "Light Bulb".
 * @param {unknown} id
 * @returns {string}
 */
export function techName(id) {
	if (typeof id !== 'string') {
		return 'a tech card';
	}
	return TECH_CARDS.find((card) => card.id === id)?.name ?? titleOf(id);
}

/**
 * A civilization's name, such as "The Chosen".
 * @param {unknown} id
 * @returns {string}
 */
export function civilizationName(id) {
	if (typeof id !== 'string') {
		return 'a civilization';
	}
	return assetName(`civ/${id}`) ?? titleOf(id);
}

/**
 * A player's civilization as the chips, the cards and the standings name it: their first, or "Setting up" before
 * they have one.
 * @param {{ civs?: readonly string[] }} seat - A player seat of a state or view
 * @returns {string}
 */
export function civilizationOf(seat) {
	return seat.civs?.length ? civilizationName(seat.civs[0]) : 'Setting up';
}

/**
 * A seat's player's name, from a state or view: "Player 2" for a seat without a name, and "a player" for no seat.
 * @param {Table | null | undefined} table
 * @param {unknown} seat
 * @returns {string}
 */
export function seatName(table, seat) {
	if (!isCount(seat) || seat === 0) {
		return 'a player';
	}
	return table?.seats?.[seat - 1]?.name ?? `Player ${seat}`;
}

/**
 * A map hex: "hex 2,−1", from its key '2_-1'; capitalize it to start a sentence.
 * @param {unknown} key
 * @returns {string}
 */
export function hexName(key) {
	const match = typeof key === 'string' && /^(-?\d+)_(-?\d+)$/.exec(key);
	if (!match) {
		return 'a territory';
	}
	return `hex ${signed(Number(match[1]))},${signed(Number(match[2]))}`;
}

/**
 * An achievement's name, as short as the achievement strip shows it, such as "Complete a track".
 * @param {string} id
 * @returns {string}
 */
export function achievementName(id) {
	return (
		ACHIEVEMENT_NAMES[id] ??
		ACHIEVEMENTS.find((achievement) => achievement.id === id)?.name ??
		titleOf(id)
	);
}

/**
 * An era or tier number as a Roman numeral.
 * @param {number} number - 1 to 10.
 * @returns {string} The numeral, such as 'IV'.
 */
export function roman(number) {
	const numeral = NUMERALS[number - 1];
	if (!Number.isInteger(number) || !numeral) {
		throw new RangeError(
			`Roman numerals here run from 1 to 10, not ${number}`
		);
	}
	return numeral;
}

/**
 * A rules version's name, the same everywhere (owner, #101): "Current rules" or "Original 2019 rules"; the settings
 * row's short name is "Original 2019". An id no version has comes back as it is.
 * @param {string} id - 'current' or 'original'
 * @param {{ short?: boolean }} [options]
 * @returns {string}
 */
export function versionName(id, { short = false } = {}) {
	const names = VERSION_NAMES[id];
	if (!names) {
		return id;
	}
	return short ? names.short : names.full;
}

/**
 * An expansion's name, as the art catalog names it: "Plans & Ploys", and "Base game" for 'base'. A code no edition
 * has comes back as it is.
 * @param {string} code - Such as 'pp', 'aa', 'ff' or 'base'
 * @returns {string}
 */
export function expansionName(code) {
	return EXPANSIONS.find((edition) => edition.code === code)?.name ?? code;
}

/**
 * A variant's short name, as the lobby's settings row titles it, such as "Tapestry draft".
 * @param {string} id
 * @param {string} [fallback] - What a variant without a short name reads, such as the server's full name; its id by default
 * @returns {string}
 */
export function variantName(id, fallback = id) {
	return VARIANT_NAMES[id] ?? fallback;
}
