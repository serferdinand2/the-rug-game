// The decisions' titles and answers in words (#26 design §8, #126): what the decision panel asks, and each answer it offers.
import { TECH_CARDS } from './engine/data/tech-cards.js';
import { spaceTileWords } from './area/terrain.js';
import { CAPITAL_MATS } from './engine/data/capitals.js';
import { RED_DIE, BLACK_DIE } from './engine/data/dice.js';
import { RESOURCE_IDS, TRACK_IDS } from './engine/data/ids.js';
import { GRID_SIZE } from './capital.js';
import {
	amounts,
	describeTurn,
	effectPhrase,
	effectsPhrase,
	paymentVerbs,
} from './describe.js';
import {
	amountWords,
	capitalize,
	joinList,
	signed,
	titleOf,
	wordsOf,
} from './words.js';
import {
	buildingName,
	civilizationName,
	hexName,
	landmarkName,
	seatName,
	spaceName,
	tapestryName,
	techName,
	trackName,
} from './game-names.js';

/** @typedef {Record<string, any>} Decision - An open decision as a view shows it */
/** @typedef {Record<string, any>} Answer - One of a decision's answers */
/** @typedef {import('./describe.js').Table} Table - A state or a view: the seats' names, and the map */

/** What a decision's answer reads when its shape is not one this module knows. */
const ANY_ANSWER = 'Choose this option';

/** The Mystics' prophecy categories (02 §1.2): the question, and what one and many of the things counted are called. */
export const PROPHECIES =
	/** @type {Readonly<Record<string, [string, string, string]>>} */ ({
		techCards: [
			'Predict how many tech cards you will have',
			'tech card',
			'tech cards',
		],
		districts: [
			'Predict how many districts you will complete',
			'complete district',
			'complete districts',
		],
		territories: [
			'Predict how many territories you will control',
			'territory',
			'territories',
		],
		tracks: [
			'Predict how many tracks you will complete',
			'completed track',
			'completed tracks',
		],
	});

/**
 * Whether a value is a plain object.
 * @param {unknown} value
 * @returns {value is Record<string, any>}
 */
function isRecord(value) {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Whether a value is a whole number of things.
 * @param {unknown} value
 * @returns {value is number}
 */
function isCount(value) {
	return Number.isInteger(value) && /** @type {number} */ (value) >= 0;
}

/**
 * Whether a value is one of the engine's track ids.
 * @param {unknown} track
 * @returns {track is import('./engine/data/ids.js').TrackId}
 */
function isTrack(track) {
	return TRACK_IDS.includes(/** @type {any} */ (track));
}

/**
 * A tech card by id.
 * @param {unknown} id
 * @returns {import('./engine/data/tech-cards.js').TechCard | undefined}
 */
function techCardOf(id) {
	return TECH_CARDS.find((c) => c.id === id);
}

/**
 * Whose a piece or card is: "yours", or its player's name.
 * @param {Table | undefined} table
 * @param {unknown} seat
 * @param {Decision} decision - Its player is "you"
 * @returns {string}
 */
function whose(table, seat, decision) {
	return seat === decision.player ? 'yours' : seatName(table, seat);
}

/**
 * A capital plot from its row and column, counted from 0: "row 3, column 5". A landmark may hang over the edge,
 * so its top-left corner may sit at row 0 or above.
 * @param {number} row
 * @param {number} col
 * @returns {string}
 */
function plotName(row, col) {
	return `row ${signed(row + 1)}, column ${signed(col + 1)}`;
}

/**
 * A plot from its index in the grid, row by row.
 * @param {unknown} index
 * @returns {string}
 */
function plotAt(index) {
	if (!isCount(index)) {
		return 'a plot';
	}
	return plotName(Math.floor(index / GRID_SIZE), index % GRID_SIZE);
}

/**
 * A title from a decision's options for a slot pick, keyed by its `purpose`.
 * @type {Record<string, (decision: Decision) => string>}
 */
const SLOT_TITLES = {
	loseResource: () => 'Choose a resource to lose',
	architectsCube: () => 'Choose a plot for an Architects cube',
	merrymakers: () => 'Choose a Merrymakers column to move up',
	entertainers: () => 'Choose a space for the Entertainers token',
	heralds: () => 'Put a Heralds token on a tapestry card?',
	inventors: () => 'Put an Inventors token on a tech card?',
	traders: () => 'Put a Traders token on a territory?',
	historians: (d) =>
		d.optional
			? 'Discard a territory tile to give a Historians token?'
			: 'Choose an opponent for a Historians token',
	historiansTile: () => 'Choose a territory tile to discard',
	leaders: () => 'Advance with a Leaders square?',
	militantsRow: () => 'Choose a Militants row to take an outpost from',
	militantsPlace: () => 'Choose a Militants row for the outpost',
};

/**
 * Each decision kind's title.
 * @type {Record<string, (decision: Decision, table: Table | undefined) => string>}
 */
const TITLES = {
	chooseTurn: (d) =>
		Array.isArray(d.options) && !d.options.includes('advance')
			? 'Take an income turn'
			: 'Take income or advance',
	chooseCapital: () => 'Choose your capital city',
	chooseCiv: (d) =>
		d.midGame
			? 'Keep one of the civilizations you drew'
			: 'Choose your civilization',
	chooseResource: (d) =>
		isCount(d.count) && d.count > 1
			? `Choose ${d.count} resources`
			: 'Choose a resource',
	chooseBonus: (d, table) =>
		Array.isArray(d.gain)
			? `Take the bonus: ${effectsPhrase(d.gain, table, true)}?`
			: 'Take the bonus?',
	chooseAdvance: () => 'Choose a space to advance to',
	chooseOrder: () => 'Choose what comes next',
	chooseOption: (d) => {
		switch (d.purpose) {
			case 'civOffer':
				return 'Use your civilization?';
			case 'militarism':
				return 'Place an outpost on the territory you explored?';
			case 'exploitation':
				return 'Choose what exploring gives you';
			default:
				return 'Choose one';
		}
	},
	chooseMove: (d) => {
		if (d.direction === 'regress') {
			return 'Choose a track to go back on';
		}
		if (d.direction === 'jump') {
			return 'Choose a token to move';
		}
		return d.optional
			? 'Advance on a track?'
			: 'Choose a track to advance on';
	},
	chooseRepeat: () => 'Choose a space to repeat',
	chooseRestart: () => 'Choose a track to start your token on again',
	chooseTapestry: (d) =>
		d.optional ? 'Play a tapestry card?' : 'Choose a tapestry card to play',
	choosePlacement: (d) => {
		if (typeof d.landmark === 'string') {
			return `Where does the ${landmarkName(d.landmark)} go?`;
		}
		if (typeof d.building === 'string') {
			return `Where does the ${buildingName(d.building)} go?`;
		}
		return 'Where does it go?';
	},
	chooseExplore: () => 'Choose where to explore',
	chooseSpaceTile: () => 'Choose a space tile to explore',
	chooseConquer: () => 'Choose a territory to conquer',
	chooseDie: () => 'Choose a die to keep',
	chooseResponse: (d, table) =>
		isCount(d.attacker)
			? `Respond to the conquest by ${seatName(table, d.attacker)}?`
			: 'Respond to the conquest?',
	chooseInvent: () => 'Choose a tech card to invent',
	chooseUpgrade: (d) =>
		d.optional ? 'Upgrade a tech card?' : 'Choose a tech card to upgrade',
	chooseTechBenefit: (d) =>
		d.icon === 'square'
			? 'Choose a tech card in your top row for its square benefit'
			: 'Choose a tech card in your middle row for its circle benefit',
	chooseLandmark: () => 'Choose a landmark',
	chooseDiscard: (d) =>
		isCount(d.vpEach)
			? `Discard a tapestry card for ${d.vpEach} VP?`
			: 'Discard a tapestry card?',
	chooseKeep: () => 'Choose a tapestry card to keep',
	chooseLandmarkCard: () => 'Keep a landmark card',
	chooseTrade: (d, table) => {
		const host = isCount(d.host) ? ` with ${seatName(table, d.host)}` : '';
		return d.optional ? `Make a trade${host}?` : `Choose a trade${host}`;
	},
	chooseTrack: (d) => {
		switch (d.purpose) {
			case 'darkAges':
				return 'Choose a track for Dark Ages';
			case 'dictatorship':
				return 'Choose a track for Dictatorship';
			case 'sharedAdvance':
				return 'Choose a track to advance on';
			default:
				return 'Choose a track';
		}
	},
	chooseRoll: () => 'Choose one of the two science die results',
	chooseSpace: () => "Choose an opponent's track space to gain its benefit",
	chooseHex: (d) => {
		const words = ['colonialism', 'revolution'].includes(d.purpose)
			? `Choose a territory for ${titleOf(d.purpose)}`
			: 'Choose a territory';
		return d.optional ? `${words}?` : words;
	},
	chooseGift: () => 'Give a territory tile to an opponent for 3 VP?',
	choosePartner: () => 'Choose your partner for this era',
	chooseCopy: () => 'Choose a tapestry card to copy',
	chooseConversion: (d) =>
		isCount(d.max)
			? `Convert up to ${d.max} food into other resources for 2 VP each?`
			: 'Convert food into other resources for 2 VP each?',
	chooseCivAbility: () => 'Choose which civilization goes next',
	chooseSlot: (d) =>
		(Object.hasOwn(SLOT_TITLES, d.purpose) && SLOT_TITLES[d.purpose](d)) ||
		(d.optional ? 'Choose one, or decline' : 'Choose one'),
	chooseAlchemists: () => 'Roll again?',
	chooseProphecy: (d) =>
		Object.hasOwn(PROPHECIES, d.category)
			? PROPHECIES[d.category][0]
			: 'Make a prophecy',
	chooseSwap: () => 'Swap two income buildings in your capital?',
};

/** Small counts in words, for "the other two". */
const FEW = Object.freeze(['no', 'one', 'two', 'three', 'four']);

/**
 * Who keeps the landmark cards a drafter passes on (#32): as a clause, "Ana and Cy keep the other two", or as the
 * prompt's sentence, "Ana keeps one of the other two, and Cy the last."
 * @param {Decision} decision - A chooseLandmarkCard decision, with its `options` and `drafters`
 * @param {Table | undefined} table
 * @param {boolean} sentence
 * @returns {string}
 */
export function draftRest(decision, table, sentence) {
	const drafters = Array.isArray(decision.drafters) ? decision.drafters : [];
	const names = drafters.map((/** @type {number} */ seat) =>
		seatName(table, seat)
	);
	const left = Array.isArray(decision.options)
		? decision.options.length - 1
		: drafters.length;
	const end = sentence ? '.' : '';
	if (names.length === 0) {
		return `${sentence ? 'The' : 'the'} other goes back under the landmark deck${end}`;
	}
	if (names.length === 1) {
		return `${names[0]} gets the other${end}`;
	}
	const others = `the other ${FEW[left] ?? left}`;
	if (!sentence) {
		return `${joinList(names)} keep ${others}`;
	}
	const first = names.slice(0, -1);
	const each = first.length === 1 ? 'keeps one' : 'keep one each';
	return `${joinList(first)} ${each} of ${others}, and ${names.at(-1)} the last.`;
}

/**
 * A decision's question in words: "Choose a resource", "Take the bonus: gain a Farm?", "Where does the Farm go?".
 * @param {Decision} decision - An open decision; a stranger's view may lack its hidden fields
 * @param {Table} [table] - The view, to name the seats a question mentions
 * @returns {string}
 */
export function decisionTitle(decision, table) {
	const title = Object.hasOwn(TITLES, decision?.kind)
		? TITLES[decision.kind](decision, table)
		: '';
	return title || 'Make a choice';
}

/**
 * The answer to a slot pick, keyed by its `purpose`; null for a slot of another shape.
 * @type {Record<string, (slot: any, decision: Decision, table: Table | undefined) => string | null>}
 */
const SLOT_ANSWERS = {
	loseResource: (slot) =>
		RESOURCE_IDS.includes(slot) ? `Lose ${amountWords(slot, 1)}` : null,
	architectsCube: (slot) => (isCount(slot) ? capitalize(plotAt(slot)) : null),
	merrymakers: (slot) => (isCount(slot) ? `Column ${slot + 1}` : null),
	entertainers: (slot) => {
		const match = typeof slot === 'string' && /^c(\d+)r(\d+)$/.exec(slot);
		return match ? `Column ${match[1]}, row ${match[2]}` : null;
	},
	heralds: (slot, decision, table) =>
		isRecord(slot)
			? `${tapestryName(slot.card)} (${whose(table, slot.player, decision)})`
			: null,
	inventors: (slot, decision, table) =>
		isRecord(slot)
			? `${techName(slot.card)} (${whose(table, slot.player, decision)})`
			: null,
	historians: (slot, decision, table) =>
		isRecord(slot) && isCount(slot.square)
			? `Give a token to ${seatName(table, slot.to)}, uncovering square ${slot.square + 1}`
			: null,
	historiansTile: (slot) =>
		isCount(slot) ? `Discard territory tile ${slot}` : null,
	militantsRow: (slot) =>
		typeof slot === 'string' ? `The ${wordsOf(slot)} row` : null,
	militantsPlace: (slot) =>
		typeof slot === 'string' ? `The ${wordsOf(slot)} row` : null,
};

/**
 * A slot of a shape no purpose names: a track, a resource or a hex by name, otherwise null.
 * @param {unknown} slot
 * @returns {string | null}
 */
function anySlot(slot) {
	if (isTrack(slot)) {
		return trackName(slot);
	}
	if (
		typeof slot === 'string' &&
		RESOURCE_IDS.includes(/** @type {any} */ (slot))
	) {
		return capitalize(amountWords(slot, 1));
	}
	if (typeof slot === 'string' && hexName(slot) !== 'a territory') {
		return capitalize(hexName(slot));
	}
	return null;
}

/**
 * Each decision kind's answer in words; null for an answer of a shape it doesn't know.
 * @type {Record<string, (answer: Answer, decision: Decision, table: Table | undefined) => string | null>}
 */
const ANSWERS = {
	chooseTurn: (a) => {
		if (a.turn === 'income') {
			return 'Take income';
		}
		return a.turn === 'advance' ? 'Advance' : null;
	},
	chooseCapital: (a) => {
		const mat = isCount(a.capital)
			? CAPITAL_MATS[a.capital - 1]
			: undefined;
		return mat ? `${mat.name} capital (mat ${mat.number})` : null;
	},
	chooseCiv: (a) =>
		typeof a.civ === 'string' ? civilizationName(a.civ) : null,
	chooseCivAbility: (a) =>
		typeof a.civ === 'string' ? civilizationName(a.civ) : null,
	chooseResource: (a) => {
		const items = isRecord(a.resources) ? amounts(a.resources) : [];
		return items.length > 0 ? `Gain ${joinList(items)}` : null;
	},
	chooseBonus: (a) => {
		if (a.pay === null) {
			return 'No bonus';
		}
		if (!isRecord(a.pay)) {
			return null;
		}
		const pay = paymentVerbs(a.pay);
		return pay === 'pay nothing' ? 'Take it for free' : capitalize(pay);
	},
	chooseAdvance: (a) => {
		if (!isTrack(a.track) || !isCount(a.from)) {
			return null;
		}
		const to = `Advance to ${spaceName(a.track, a.from + 1)}`;
		return isRecord(a.pay) ? `${to} and ${paymentVerbs(a.pay)}` : to;
	},
	chooseOrder: (a, d, table) =>
		Array.isArray(d.effects) &&
		isCount(a.effect) &&
		a.effect < d.effects.length
			? capitalize(effectPhrase(d.effects[a.effect], table))
			: null,
	chooseOption: (a, d, table) => {
		if (
			!Array.isArray(d.options) ||
			!isCount(a.option) ||
			a.option >= d.options.length
		) {
			return null;
		}
		const option = d.options[a.option];
		return Array.isArray(option) && option.length === 0
			? 'Decline'
			: capitalize(effectsPhrase(option, table, true));
	},
	chooseMove: (a, d) => {
		if (a.track === null) {
			return "Don't move";
		}
		if (!isTrack(a.track) || !isCount(a.from)) {
			return null;
		}
		const track = trackName(a.track);
		if (isCount(a.to) || d.direction === 'jump') {
			const to = isCount(a.to)
				? spaceName(a.track, a.to)
				: 'another space';
			return `Move from ${spaceName(a.track, a.from)} to ${to} on ${track}`;
		}
		if (d.direction === 'regress') {
			return `Go back on ${track} to ${spaceName(a.track, a.from - 1)}`;
		}
		return `Advance on ${track} to ${spaceName(a.track, a.from + 1)}`;
	},
	chooseRepeat: (a) =>
		isTrack(a.track) && isCount(a.space)
			? `Repeat ${spaceName(a.track, a.space)}`
			: null,
	chooseRestart: (a) =>
		isTrack(a.track) ? `Start again on ${trackName(a.track)}` : null,
	chooseTapestry: (a) => {
		if (a.card === null) {
			return "Don't play a card";
		}
		return typeof a.card === 'string' ? tapestryName(a.card) : null;
	},
	choosePlacement: (a) => {
		if (a.besideMat === true) {
			return 'Beside your capital mat';
		}
		if (isCount(a.craftsmen)) {
			return `Craftsmen column ${a.craftsmen + 1}`;
		}
		if (typeof a.hex === 'string') {
			return capitalize(hexName(a.hex));
		}
		if (!Number.isInteger(a.row) || !Number.isInteger(a.col)) {
			return null;
		}
		const turn = describeTurn(a.rotation);
		const plot = capitalize(plotName(a.row, a.col));
		return turn ? `${plot}, ${turn}` : plot;
	},
	chooseExplore: (a) => {
		if (typeof a.hex !== 'string') {
			return null;
		}
		const hex = capitalize(hexName(a.hex));
		if (!isCount(a.tile)) {
			return hex;
		}
		const turn = describeTurn(a.orient);
		return `${hex} with tile ${a.tile}${turn ? `, ${turn}` : ''}`;
	},
	chooseSpaceTile: (a, d, table) => {
		if (!isCount(a.tile)) {
			return null;
		}
		return `Space tile ${a.tile}: ${spaceTileWords(a.tile, table)}`;
	},
	chooseConquer: (a, d, table) => {
		if (typeof a.hex !== 'string') {
			return null;
		}
		const hex = capitalize(hexName(a.hex));
		const outposts = table?.hexes?.[a.hex]?.outposts;
		const holders = Array.isArray(outposts)
			? outposts
					.filter((o) => isRecord(o) && !o.toppled)
					.map((o) => seatName(table, o.seat))
			: [];
		return holders.length > 0
			? `${hex}, held by ${joinList(holders)}`
			: hex;
	},
	chooseDie: (a, d, table) => {
		if (a.die !== 'red' && a.die !== 'black') {
			return null;
		}
		const faces = a.die === 'red' ? RED_DIE : BLACK_DIE;
		const face = isCount(d[a.die]) ? faces[d[a.die]] : undefined;
		const die = a.die === 'red' ? 'Red die' : 'Black die';
		return face ? `${die}: ${effectPhrase(face, table)}` : die;
	},
	chooseResponse: (a) => {
		if (a.card === null) {
			return "Don't respond";
		}
		return typeof a.card === 'string'
			? `Play ${tapestryName(a.card)}`
			: null;
	},
	chooseInvent: (a) => {
		if (a.refresh === true) {
			return 'Refresh the face-up cards first';
		}
		if (a.card === 'deck') {
			return 'The top card of the deck';
		}
		return typeof a.card === 'string' ? techName(a.card) : null;
	},
	chooseUpgrade: (a, d, table) => {
		if (a.card === null) {
			return "Don't upgrade";
		}
		if (typeof a.card !== 'string') {
			return null;
		}
		const tech = /** @type {Record<string, any> | undefined} */ (
			table?.seats?.[d.player - 1]
		)?.tech;
		if (tech?.bottom?.includes(a.card)) {
			return `${techName(a.card)}, to the middle row`;
		}
		if (tech?.middle?.includes(a.card)) {
			return `${techName(a.card)}, to the top row`;
		}
		return techName(a.card);
	},
	chooseTechBenefit: (a, d, table) => {
		const card = techCardOf(a.card);
		if (!card) {
			return typeof a.card === 'string' ? techName(a.card) : null;
		}
		const benefit = d.icon === 'square' ? card.square : card.circle;
		return `${card.name}: ${effectsPhrase(benefit, table, false)}`;
	},
	chooseLandmark: (a) =>
		typeof a.landmark === 'string' ? landmarkName(a.landmark) : null,
	chooseDiscard: (a) => {
		if (a.card === null) {
			return 'Stop discarding';
		}
		return typeof a.card === 'string'
			? `Discard ${tapestryName(a.card)}`
			: null;
	},
	chooseKeep: (a) =>
		typeof a.card === 'string' ? `Keep ${tapestryName(a.card)}` : null,
	chooseLandmarkCard: (a, d, table) =>
		typeof a.card === 'string'
			? `Keep ${landmarkName(a.card)}: ${draftRest(d, table, false)}`
			: null,
	chooseTrade: (a, d, table) => {
		if (a.offer === null) {
			return 'No trade';
		}
		const offer =
			Array.isArray(d.offers) && isCount(a.offer)
				? d.offers[a.offer]
				: undefined;
		if (!isRecord(offer)) {
			return null;
		}
		const gain = effectsPhrase(offer.gain, table, true);
		return capitalize(`${paymentVerbs(a.pay ?? offer.pay)} to ${gain}`);
	},
	chooseTrack: (a) => (isTrack(a.track) ? trackName(a.track) : null),
	chooseRoll: (a) => (isTrack(a.track) ? trackName(a.track) : null),
	chooseSpace: (a, d, table) =>
		isTrack(a.track) && isCount(a.space)
			? `${spaceName(a.track, a.space)} (${seatName(table, a.player)})`
			: null,
	chooseHex: (a) => {
		if (a.hex === null) {
			return 'Decline';
		}
		return typeof a.hex === 'string' ? capitalize(hexName(a.hex)) : null;
	},
	chooseGift: (a, d, table) => {
		if (a.tile === null) {
			return "Don't give a tile";
		}
		return isCount(a.tile)
			? `Give tile ${a.tile} to ${seatName(table, a.player)}`
			: null;
	},
	choosePartner: (a, d, table) => {
		if (!isCount(a.player)) {
			return null;
		}
		const name = seatName(table, a.player);
		return isTrack(a.track) ? `${name} on ${trackName(a.track)}` : name;
	},
	chooseCopy: (a, d, table) =>
		typeof a.card === 'string'
			? `Copy ${tapestryName(a.card)} (${whose(table, a.player, d)})`
			: null,
	chooseConversion: (a) => {
		if (!isRecord(a.resources)) {
			return null;
		}
		const items = amounts(a.resources);
		const total = Object.values(a.resources).reduce(
			(sum, n) => sum + (isCount(n) ? n : 0),
			0
		);
		return total === 0
			? 'Convert nothing'
			: `Convert ${total} food into ${joinList(items)}`;
	},
	chooseSlot: (a, d, table) => {
		if (a.slot === null) {
			return 'Decline';
		}
		const named = Object.hasOwn(SLOT_ANSWERS, d.purpose)
			? SLOT_ANSWERS[d.purpose](a.slot, d, table)
			: null;
		return named ?? anySlot(a.slot);
	},
	chooseAlchemists: (a) => {
		if (a.roll === true) {
			return 'Roll again';
		}
		return a.roll === false ? 'Stop and advance' : null;
	},
	chooseProphecy: (a, d) => {
		if (!isCount(a.value)) {
			return null;
		}
		if (!Object.hasOwn(PROPHECIES, d.category)) {
			return String(a.value);
		}
		const [, one, many] = PROPHECIES[d.category];
		return `${a.value} ${a.value === 1 ? one : many}`;
	},
	chooseSwap: (a) => {
		if (a.a === null) {
			return 'Stop swapping';
		}
		return isCount(a.a) && isCount(a.b)
			? `Swap the buildings at ${plotAt(a.a)} and ${plotAt(a.b)}`
			: null;
	},
};

/**
 * One answer of a decision in words, for its button: "Pay 1 food and 1 worker", "Row 3, column 5, turned once",
 * "Hex 2,−1 with tile 17, turned twice". An answer of a shape this module doesn't know reads "Choose this option".
 * @param {Decision} decision - The open decision the answer belongs to
 * @param {Answer} answer - One of its `answers`
 * @param {Table} [table] - The viewer's view, to name seats, the map's holders and the viewer's tech rows
 * @returns {string}
 */
export function describeAnswer(decision, answer, table) {
	if (!isRecord(decision) || !isRecord(answer)) {
		return ANY_ANSWER;
	}
	const words = Object.hasOwn(ANSWERS, decision.kind)
		? ANSWERS[decision.kind](answer, decision, table)
		: null;
	return words || ANY_ANSWER;
}
