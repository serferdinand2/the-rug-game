// Words for the engine's effects, costs, decisions and answers (#26 design §8): the short English the play screen shows.
import { TRACKS } from './engine/data/tracks.js';
import { LANDMARKS } from './engine/data/landmarks.js';
import { TAPESTRY_CARDS } from './engine/data/tapestry-cards.js';
import { TECH_CARDS } from './engine/data/tech-cards.js';
import { SPACE_TILES } from './engine/data/space-tiles.js';
import { CAPITAL_MATS } from './engine/data/capitals.js';
import { RED_DIE, BLACK_DIE } from './engine/data/dice.js';
import { TRACKS as TRACK_NAMES } from './ui.js';
import { ASSETS } from './art/catalog.js';
import { GRID_SIZE } from './capital.js';

/** @typedef {Record<string, any>} Effect - One engine effect, `{ kind: value }`, of any shape */
/** @typedef {Record<string, any>} Decision - An open decision as a view shows it */
/** @typedef {Record<string, any>} Answer - One of a decision's answers */
/** @typedef {{ seats?: readonly { name?: string }[], hexes?: Record<string, any> }} Table - A state or a view: the seats' names, and the map */

/** What a decision's answer reads when its shape is not one this module knows. */
const ANY_ANSWER = 'Choose this option';

/** What an effect reads when its kind is not one this module knows. */
const ANY_EFFECT = 'take this effect';

/** The minus sign hex keys show, as in "Hex 2,−1". */
const MINUS = '−';

/**
 * Each counted thing's name, one and many, in the order amounts are listed: the resources as the player overview
 * lists them, then VP, then tiles and cards.
 */
const NOUNS = /** @type {Readonly<Record<string, [string, string]>>} */ ({
	coin: ['coin', 'coins'],
	food: ['food', 'food'],
	worker: ['worker', 'workers'],
	culture: ['culture', 'culture'],
	any: ['resource of your choice', 'resources of your choice'],
	vp: ['VP', 'VP'],
	territory: ['territory tile', 'territory tiles'],
	space: ['space tile', 'space tiles'],
	tapestry: ['tapestry card', 'tapestry cards'],
	tech: ['tech card', 'tech cards'],
});

/** The order amounts are listed in. */
const ORDER = Object.keys(NOUNS);

/** What a cost discards rather than pays. */
const DISCARDS = ['territory', 'space', 'tapestry', 'tech'];

/** The resources, in the engine's order. */
const RESOURCES = ['coin', 'worker', 'food', 'culture'];

/** Words a title keeps in lower case, unless they come first. */
const SMALL_WORDS = ['of', 'and', 'for', 'the', 'a', 'an', 'on', 'in'];

/** The tapestry cards whose rules are their own effect kind. */
const CARD_RULES = [
	'darkAges',
	'socialism',
	'dictatorship',
	'revolution',
	'colonialism',
	'pleaForAid',
	'technocracy',
	'tradeEconomy',
	'coalBaron',
	'olympicHost',
];

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
 * A text with its first letter in upper case.
 * @param {string} text
 * @returns {string}
 */
function capitalize(text) {
	return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * A list in words: "a", "a and b", "a, b and c".
 * @param {readonly string[]} items
 * @param {string} [word] - The last joining word, 'and' or 'or'
 * @returns {string}
 */
export function joinList(items, word = 'and') {
	if (items.length <= 1) {
		return items[0] ?? '';
	}
	return `${items.slice(0, -1).join(', ')} ${word} ${items[items.length - 1]}`;
}

/**
 * A whole number as shown, with a real minus sign.
 * @param {number} n
 * @returns {string}
 */
function signed(n) {
	return n < 0 ? `${MINUS}${-n}` : String(n);
}

/**
 * An id in words: 'the-chosen' or 'theChosen' to 'the chosen'.
 * @param {string} id
 * @returns {string}
 */
function wordsOf(id) {
	return id
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		.replace(/[-_]+/g, ' ')
		.toLowerCase()
		.trim();
}

/**
 * An id as a name: 'age-of-sail' to 'Age of Sail'.
 * @param {string} id
 * @returns {string}
 */
function titleOf(id) {
	return wordsOf(id)
		.split(' ')
		.map((word, i) =>
			i > 0 && SMALL_WORDS.includes(word) ? word : capitalize(word)
		)
		.join(' ');
}

/**
 * "a" or "an", for the name that follows.
 * @param {string} name
 * @returns {string}
 */
export function article(name) {
	return /^[aeiou]/i.test(name) ? 'an' : 'a';
}

/**
 * An amount of one counted thing: "1 coin", "2 resources of your choice".
 * @param {number} n
 * @param {string} key - A NOUNS key, or any other id
 * @returns {string}
 */
function amount(n, key) {
	const [one, many] = NOUNS[key] ?? [wordsOf(key), wordsOf(key)];
	return `${n} ${n === 1 ? one : many}`;
}

/**
 * The amounts of a cost or gain, in ORDER, then any other keys; zero, missing and odd values are left out.
 * @param {Record<string, unknown>} counts
 * @param {(key: string) => boolean} [only] - Which keys to take
 * @returns {string[]}
 */
function amounts(counts, only = () => true) {
	const keys = [
		...ORDER.filter((key) => key in counts),
		...Object.keys(counts).filter((key) => !ORDER.includes(key)),
	];
	return keys
		.filter((key) => only(key))
		.flatMap((key) => {
			const n = counts[key];
			return isCount(n) && n > 0 ? [amount(n, key)] : [];
		});
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
	return TRACK_NAMES.find((t) => t.id === track)?.name ?? titleOf(track);
}

/**
 * Whether a value is one of the four track ids.
 * @param {unknown} track
 * @returns {track is import('./engine/data/ids.js').TrackId}
 */
function isTrack(track) {
	return TRACK_NAMES.some((t) => t.id === track);
}

/**
 * A track space's name, such as "Ships"; space 0 is the start.
 * @param {unknown} track
 * @param {unknown} space
 * @returns {string}
 */
export function spaceName(track, space) {
	if (!isTrack(track) || !isCount(space) || space > 12) {
		return isCount(space) ? `space ${space}` : 'a space';
	}
	return space === 0 ? 'the start' : TRACKS[track][space].name;
}

/**
 * Several tracks as a choice: "Science", "Technology or Military", "any track".
 * @param {unknown} tracks
 * @returns {string}
 */
function tracksPhrase(tracks) {
	if (!Array.isArray(tracks) || tracks.length === 0) {
		return 'a track';
	}
	if (TRACK_NAMES.every((t) => tracks.includes(t.id))) {
		return 'any track';
	}
	return joinList(tracks.map(trackName), 'or');
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
 * A landmark's name, such as "Train Station".
 * @param {unknown} id
 * @returns {string}
 */
export function landmarkName(id) {
	if (typeof id !== 'string') {
		return 'Landmark';
	}
	return LANDMARKS.find((l) => l.id === id)?.name ?? titleOf(id);
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
	const wanted = /^trap-\d+$/.test(id) ? 'trap' : id;
	return TAPESTRY_CARDS.find((c) => c.id === wanted)?.name ?? titleOf(id);
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
 * A tech card's name, such as "Light Bulb".
 * @param {unknown} id
 * @returns {string}
 */
export function techName(id) {
	if (typeof id !== 'string') {
		return 'a tech card';
	}
	return techCardOf(id)?.name ?? titleOf(id);
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
	return ASSETS.find((a) => a.id === `civ/${id}`)?.name ?? titleOf(id);
}

/**
 * A seat's player's name, from a state or view.
 * @param {Table | undefined} table
 * @param {unknown} seat
 * @returns {string}
 */
export function seatName(table, seat) {
	if (!isCount(seat) || seat === 0) {
		return 'another player';
	}
	return table?.seats?.[seat - 1]?.name ?? `Player ${seat}`;
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
 * A map hex: "hex 2,−1", from its key '2_-1'.
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
 * How far a piece is turned: "turned once", "turned twice", "turned 3 times"; nothing when it isn't.
 * @param {unknown} turns
 * @returns {string}
 */
export function describeTurn(turns) {
	if (!isCount(turns) || turns === 0) {
		return '';
	}
	if (turns === 1) {
		return 'turned once';
	}
	return turns === 2 ? 'turned twice' : `turned ${turns} times`;
}

/**
 * What a VP counter counts, after "for each".
 * @param {unknown} per
 * @param {unknown} track - For 'trackSpace'
 * @returns {string}
 */
function counted(per, track) {
	switch (per) {
		case 'territory':
			return 'territory you control';
		case 'territoryTile':
			return 'territory tile in your supply';
		case 'techCard':
			return 'tech card you have';
		case 'tapestryCard':
			return 'tapestry card in your hand or on your income mat';
		case 'trackSpace':
			return isTrack(track)
				? `space you have advanced on ${trackName(track)}`
				: 'track space you have advanced';
		case 'trackLead':
			return 'track where nobody is ahead of you';
		case 'landmark':
			return 'landmark you own';
		case 'opponent':
			return 'opponent';
		case 'market':
		case 'house':
		case 'farm':
		case 'armory':
			return `${buildingName(per)} you own`;
		default:
			return typeof per === 'string' ? `${wordsOf(per)} you have` : 'one';
	}
}

/**
 * A cost or a payment as what the player does: "pay 1 coin", "discard 2 territory tiles", "pay nothing". A payment
 * names the tiles and cards it discards: "discard territory tile 17", "discard Democracy".
 * @param {unknown} payment
 * @returns {string}
 */
function paymentVerbs(payment) {
	if (!isRecord(payment)) {
		return 'pay the cost';
	}
	const paid = amounts(payment, (key) => !DISCARDS.includes(key));
	/** @type {string[]} */
	const discarded = [];
	for (const key of DISCARDS) {
		const given = payment[key];
		if (isCount(given) && given > 0) {
			discarded.push(amount(given, key));
		} else if (Array.isArray(given) && given.length > 0) {
			if (key === 'territory' || key === 'space') {
				const [one, many] = NOUNS[key];
				const ids = given.map((id) => (isCount(id) ? String(id) : '?'));
				discarded.push(
					`${given.length === 1 ? one : many} ${joinList(ids)}`
				);
			} else {
				discarded.push(
					...given.map(key === 'tech' ? techName : tapestryName)
				);
			}
		}
	}
	const parts = [
		...(paid.length > 0 ? [`pay ${joinList(paid)}`] : []),
		...(discarded.length > 0 ? [`discard ${joinList(discarded)}`] : []),
	];
	return parts.length > 0 ? parts.join(' and ') : 'pay nothing';
}

/**
 * The words of one effect kind, from its value; null for a value of a shape it doesn't know.
 * @typedef {(value: any, table: Table | undefined) => string | null} Phrase
 */

/** @type {Record<string, Phrase>} */
const PHRASES = {
	gain(value) {
		if (!isRecord(value)) {
			return null;
		}
		const { keep, ...rest } = value;
		if (isCount(keep) && isCount(rest.tapestry) && rest.tapestry > keep) {
			const { tapestry, ...others } = rest;
			const draw = `draw ${amount(tapestry, 'tapestry')} and keep ${keep}`;
			const items = amounts(others);
			return items.length > 0
				? `gain ${joinList(items)} and ${draw}`
				: draw;
		}
		const items = amounts(rest);
		return items.length > 0 ? `gain ${joinList(items)}` : 'gain nothing';
	},
	lose(value) {
		if (!isRecord(value)) {
			return null;
		}
		const items = amounts(value);
		return items.length > 0 ? `lose ${joinList(items)}` : 'lose nothing';
	},
	building(value) {
		const name = buildingName(value);
		return typeof value === 'string'
			? `gain ${article(name)} ${name}`
			: 'gain an income building';
	},
	landmark(value) {
		return `gain the ${landmarkName(value)} landmark`;
	},
	vp(value) {
		if (isCount(value)) {
			return `gain ${value} VP`;
		}
		if (!isRecord(value)) {
			return null;
		}
		const each = isCount(value.each) ? value.each : 1;
		return `gain ${each} VP for each ${counted(value.per, value.track)}`;
	},
	explore(value) {
		const where = value?.anywhere ? ' anywhere' : '';
		if (isCount(value?.tile)) {
			return `explore${where} with territory tile ${value.tile}`;
		}
		return `explore a territory${where}`;
	},
	exploreSpace(value) {
		return value?.fromGained
			? 'explore one of the space tiles just gained'
			: 'explore a space tile';
	},
	conquer(value) {
		const base = value?.anywhere
			? 'conquer a territory anywhere'
			: 'conquer a territory';
		if (value?.bothDice === 'always') {
			return `${base} with both dice`;
		}
		if (value?.bothDice === 'ifOpponent') {
			return `${base} with both dice if an opponent controlled it`;
		}
		return base;
	},
	// "to advance", not "and advance": a research is often one part of a list joined with "and".
	research(value) {
		const rolls =
			isCount(value?.rolls) && value.rolls > 1 ? value.rolls : 1;
		let words =
			rolls > 1
				? `roll the science die ${rolls} times to advance on each track rolled`
				: 'roll the science die to advance on the track rolled';
		if (value?.noBenefit) {
			words +=
				rolls > 1
					? ' without the benefits or bonuses'
					: ' without its benefit or bonus';
		}
		if (isCount(value?.offTrackVp)) {
			words += ` (${value.offTrackVp} VP instead for a track you have completed)`;
		}
		return words;
	},
	advance(value) {
		let words = `${value?.optional ? 'you may advance' : 'advance'} on ${tracksPhrase(value?.tracks)}`;
		if (value?.noBenefit) {
			words += ' without its benefit or bonus';
		}
		if (value?.noBonus) {
			words += ' without its bonus';
		}
		if (value?.freeBonus) {
			words += ' and take its bonus for free';
		}
		if (isCount(value?.offTrackVp)) {
			words += `, or gain ${value.offTrackVp} VP if you are at the end`;
		}
		return words;
	},
	regress(value) {
		const words = `go back 1 space on ${tracksPhrase(value?.tracks)}`;
		// The X: no benefit and no bonus, as an advance with the X says (02 §4, Time Travel).
		return value?.noBenefit
			? `${words} without its benefit or bonus`
			: `${words} and gain its benefit`;
	},
	repeat(value) {
		// The bonus may be paid too (02 §4 Lithium-Ion Battery, 01 §3.3 Academic Research).
		const words =
			'repeat the benefit of a track space you are on, and you may pay its bonus';
		return value?.oncePerTurn ? `once a turn, ${words}` : words;
	},
	invent(value) {
		const n = isCount(value?.count) && value.count > 0 ? value.count : 1;
		const kind = `${value?.faceUpOnly ? 'face-up ' : ''}${n === 1 ? 'tech card' : 'tech cards'}`;
		let words = `invent ${n === 1 ? 'a' : n} ${kind}`;
		if (value?.deckOnly) {
			words += ' from the deck';
		}
		if (value?.refresh) {
			words += ', after refreshing the face-up cards if you like';
		}
		if (value?.thenUpgrade) {
			words += n === 1 ? ', then upgrade it' : ', then upgrade them';
		}
		return words;
	},
	upgrade() {
		return 'upgrade a tech card';
	},
	techBenefit(value) {
		return value?.icon === 'square'
			? 'gain the square benefit of a tech card in your top row'
			: 'gain the circle benefit of a tech card in your middle row';
	},
	tapestryOnTop() {
		return 'play a tapestry card on top of your current one';
	},
	scoreCapital() {
		return 'score your capital city';
	},
	tileBenefit() {
		return 'gain the benefit of the territory tile you conquered';
	},
	gainCiv() {
		return 'draw another civilization from the deck';
	},
	restartToken() {
		return 'move this token to the start of any track';
	},
	// A choice among plain gains reads as one gain: "gain a Farm, a House or an Armory".
	choice(value, table) {
		if (!Array.isArray(value) || value.length === 0) {
			return null;
		}
		const gains = value.map(gainsOfAll);
		if (!gains.includes(null)) {
			const each = gains.map((g) =>
				joinList(gainNouns(/** @type {Gains} */ (g)))
			);
			return `gain ${joinList(each, 'or')}`;
		}
		const options = value.map((option) =>
			Array.isArray(option) && option.length === 0
				? 'nothing'
				: effectsPhrase(option, table, true)
		);
		return `choose one: ${joinList(options, 'or')}`;
	},
	eraPartner(value) {
		return value?.track
			? 'choose an opponent and a track for this era'
			: 'choose an opponent for this era';
	},
	copyTapestry() {
		return 'copy the ability of a visible tapestry card';
	},
	sharedAdvance(value) {
		const where =
			value?.track === 'roll'
				? 'roll the science die to advance on the track rolled'
				: 'advance on a track of your choice';
		const who =
			value?.others === 'neighbours'
				? 'your neighbours'
				: 'your opponents';
		const words = `${where}, then ${who} advance there without its benefit or bonus`;
		return value?.optional ? `${words}; anyone may decline` : words;
	},
	others(value, table) {
		if (!isRecord(value)) {
			return null;
		}
		const who =
			value.who === 'neighbours'
				? 'each of your neighbours'
				: 'each player, you first';
		return `${who}: ${effectsPhrase(value.effects, table, true)}`;
	},
	trade(value, table) {
		if (!isRecord(value) || !Array.isArray(value.offers)) {
			return null;
		}
		const host = isCount(value.host)
			? ` with ${seatName(table, value.host)}`
			: '';
		const offers = value.offers.map((offer) =>
			isRecord(offer)
				? `${paymentVerbs(offer.pay)} to ${effectsPhrase(offer.gain, table, true)}`
				: 'an offer'
		);
		const words = `make one trade${host}: ${joinList(offers, 'or')}`;
		return value.optional ? `you may ${words}` : words;
	},
	discardTapestry(value) {
		const each = isCount(value?.vpEach) ? value.vpEach : 1;
		return `discard any tapestry cards from your hand for ${each} VP each`;
	},
	anyBuilding() {
		return 'gain an income building of your choice';
	},
	trackLandmark() {
		return 'gain a track landmark nobody owns';
	},
	landmarkRank(value, table) {
		if (!isRecord(value)) {
			return null;
		}
		return (
			`if you have the fewest landmarks, ${effectsPhrase(value.fewest, table, true)}; ` +
			`if the most, ${effectsPhrase(value.most, table, true)}; ` +
			`otherwise, ties included, ${effectsPhrase(value.otherwise, table, true)}`
		);
	},
	placeOutpost(value) {
		return `place an outpost on ${hexName(value?.hex)}`;
	},
	placeToken(value) {
		const civ = civilizationName(value?.civ);
		return `place ${article(civ)} ${civ} token on ${hexName(value?.hex)}`;
	},
	...Object.fromEntries(
		CARD_RULES.map((kind) => [
			kind,
			/** @type {Phrase} */ (
				() =>
					`resolve ${tapestryName(wordsOf(kind).replace(/ /g, '-'))}`
			),
		])
	),
};

/**
 * One effect's words, in lower case unless a name comes first.
 * @param {unknown} effect
 * @param {Table | undefined} table
 * @returns {string}
 */
function effectPhrase(effect, table) {
	if (!isRecord(effect)) {
		return ANY_EFFECT;
	}
	const [kind] = Object.keys(effect);
	const phrase = Object.hasOwn(PHRASES, kind) ? PHRASES[kind] : undefined;
	return phrase?.(effect[kind], table) ?? ANY_EFFECT;
}

/**
 * What plain gains add up to: amounts by NOUNS key, and income buildings and landmarks by name.
 * @typedef {Object} Gains
 * @property {Record<string, number>} counts
 * @property {string[]} buildings
 * @property {string[]} landmarks
 */

/**
 * The things an effect gains, when it only gains things a list can name: resources, tiles, cards, a number of VP,
 * an income building or a landmark. Null for any other effect.
 * @param {unknown} effect
 * @returns {Gains | null}
 */
function gainsOf(effect) {
	if (!isRecord(effect) || Object.keys(effect).length !== 1) {
		return null;
	}
	const [[kind, value]] = Object.entries(effect);
	/** @type {Gains} */
	const gains = { counts: {}, buildings: [], landmarks: [] };
	if (kind === 'gain' && isRecord(value) && !('keep' in value)) {
		for (const [key, n] of Object.entries(value)) {
			if (isCount(n) && n > 0) {
				gains.counts[key] = n;
			}
		}
		return Object.keys(gains.counts).length > 0 ? gains : null;
	}
	if (kind === 'vp' && isCount(value) && value > 0) {
		gains.counts.vp = value;
		return gains;
	}
	if (kind === 'building' && typeof value === 'string') {
		gains.buildings.push(buildingName(value));
		return gains;
	}
	if (kind === 'landmark' && typeof value === 'string') {
		gains.landmarks.push(landmarkName(value));
		return gains;
	}
	return null;
}

/**
 * Adds one effect's gains to the gains so far.
 * @param {Gains} into - Changed in place
 * @param {Gains} gains
 */
function addGains(into, gains) {
	for (const [key, n] of Object.entries(gains.counts)) {
		into.counts[key] = (into.counts[key] ?? 0) + n;
	}
	into.buildings.push(...gains.buildings);
	into.landmarks.push(...gains.landmarks);
}

/**
 * What a list of effects gains, when every one of them is a plain gain; null otherwise.
 * @param {unknown} effects
 * @returns {Gains | null}
 */
function gainsOfAll(effects) {
	if (!Array.isArray(effects) || effects.length === 0) {
		return null;
	}
	/** @type {Gains} */
	const sum = { counts: {}, buildings: [], landmarks: [] };
	for (const effect of effects) {
		const gains = gainsOf(effect);
		if (!gains) {
			return null;
		}
		addGains(sum, gains);
	}
	return sum;
}

/**
 * Gains as a list of nouns: "1 coin", "8 VP", "a Farm", "2 Armories", "the Bakery landmark".
 * @param {Gains} gains
 * @returns {string[]}
 */
function gainNouns(gains) {
	const buildings = [...new Set(gains.buildings)].map((name) => {
		const n = gains.buildings.filter((b) => b === name).length;
		if (n === 1) {
			return `${article(name)} ${name}`;
		}
		return `${n} ${name.endsWith('y') ? `${name.slice(0, -1)}ies` : `${name}s`}`;
	});
	return [
		...amounts(gains.counts),
		...buildings,
		...gains.landmarks.map((name) => `the ${name} landmark`),
	];
}

/**
 * A list of effects in words, joined with "and", or with "then" when they run in order. Plain gains side by side
 * read as one ("gain 1 coin, 1 worker and 8 VP"), and the same effect twice in a row reads "twice".
 * @param {unknown} effects
 * @param {Table | undefined} table
 * @param {boolean} ordered
 * @returns {string}
 */
function effectsPhrase(effects, table, ordered) {
	if (!Array.isArray(effects)) {
		return ANY_EFFECT;
	}
	if (effects.length === 0) {
		return 'nothing';
	}
	/** @type {(string | Gains)[]} */
	const parts = [];
	for (const effect of effects) {
		const gains = gainsOf(effect);
		const last = parts[parts.length - 1];
		if (gains && last !== undefined && typeof last !== 'string') {
			addGains(last, gains);
		} else {
			parts.push(gains ?? effectPhrase(effect, table));
		}
	}
	/** @type {{ words: string, times: number }[]} */
	const phrases = [];
	for (const part of parts) {
		const words =
			typeof part === 'string'
				? part
				: `gain ${joinList(gainNouns(part))}`;
		const last = phrases[phrases.length - 1];
		if (last?.words === words) {
			last.times += 1;
		} else {
			phrases.push({ words, times: 1 });
		}
	}
	const said = phrases.map(({ words, times }) => {
		if (times === 1) {
			return words;
		}
		return times === 2 ? `${words} twice` : `${words} ${times} times`;
	});
	return ordered ? said.join(', then ') : joinList(said);
}

/**
 * A benefit, or any list of effects, as a short sentence: "Gain 1 coin and 1 culture", "Explore a territory".
 * @param {readonly Effect[]} effects
 * @param {{ state?: Table, ordered?: boolean }} [options] - `state` names the seats an effect mentions (a trade's
 *   host); `ordered` joins the parts with "then", for a benefit the reference prints with "then"
 * @returns {string}
 */
export function describeEffects(effects, { state, ordered = false } = {}) {
	return capitalize(effectsPhrase(effects, state, ordered));
}

/**
 * A cost as the things it asks for: "1 food and 1 resource of your choice", "2 territory tiles".
 * @param {import('./engine/data/effects.js').Cost} cost
 * @returns {string}
 */
export function describeCost(cost) {
	const items = isRecord(cost) ? amounts(cost) : [];
	return items.length > 0 ? joinList(items) : 'Nothing';
}

/**
 * A bonus as what paying it gets: "Pay 1 resource of your choice to gain a Farm".
 * @param {import('./engine/data/effects.js').Bonus} bonus
 * @param {{ state?: Table }} [options]
 * @returns {string}
 */
export function describeBonus(bonus, { state } = {}) {
	const gain = effectsPhrase(bonus?.gain, state, true);
	const pay = paymentVerbs(bonus?.pay);
	return pay === 'pay nothing'
		? capitalize(`${gain} for free`)
		: capitalize(`${pay} to ${gain}`);
}

/**
 * A payment, as chooseAdvance, chooseBonus and chooseTrade answers carry it: "Pay 1 food and 1 worker",
 * "Discard Democracy".
 * @param {import('./engine/payment.js').Payment} payment
 * @returns {string}
 */
export function describePayment(payment) {
	return capitalize(paymentVerbs(payment));
}

/**
 * The words of each tapestry card whose rules the engine keeps in code rather than in its effects: every THIS ERA
 * ability, the WHEN PLAYED cards whose rules are their own effect kind (CARD_RULES), and the trap's response. They
 * follow 02 §3, numbers exact, in this module's names for things.
 * @type {Readonly<Record<string, string>>}
 */
const TAPESTRY_RULES = Object.freeze({
	academia:
		'Whenever you invent a tech card or gain a tapestry card, gain 3 VP',
	'age-of-sail':
		'Whenever you explore, draw a total of 3 territory tiles. Before placing one, you may give 1 territory tile to an opponent to gain 3 VP',
	alliance:
		"Choose an opponent. Neither of you may conquer the other's territories. Whenever they upgrade a tech card, you gain the same benefit after them",
	'broker-of-peace':
		'You may not advance on Military. Whenever an opponent advances on Military, gain 3 VP',
	capitalism:
		'When you gain income, gain 2 VP for each coin earned. Whenever you gain a Market, also gain 1 coin',
	'coal-baron':
		'Gain 1 territory tile and explore with it, then each of your neighbours gains 1 territory tile',
	colonialism:
		'Choose a territory tile you control. Gain 1 resource for each different land terrain on it: a worker for mountain, culture for grassland, food for forest and a coin for desert',
	'dark-ages':
		'Go back 1 space on 3 different tracks if you can, then advance 3 times on the remaining track, without benefits or bonuses',
	dictatorship:
		'Advance on any track with its benefit; you may pay its bonus. Your opponents may not advance on that track until your next turn starts',
	empiricism:
		'Whenever you advance on Science, gain 2 VP. Whenever you roll the science die, roll it twice and choose 1 result',
	exploitation:
		'Whenever you place a territory tile on the map, you may gain double its benefit; if you do, gain no VP for its matching sides',
	'golden-age':
		'Ignore the prerequisites for upgrading tech cards. Whenever you upgrade a tech card, gain 3 VP',
	industrialism:
		'Whenever you invent a tech card, gain its circle benefit; the card stays in your bottom row',
	'marriage-of-state':
		'Choose a track and an opponent. After they gain a benefit on that track, you gain it too, without its bonus',
	mercantilism:
		'When you gain income, you may convert food you earned into other resources, gaining 2 VP for each food converted',
	militarism:
		'Whenever you explore a territory, you may also place an outpost on it. This is not a conquer',
	monarchy:
		'Whenever you place an income building in your capital city, gain 3 VP',
	'olympic-host':
		'Starting with you, each player may pay 1 worker to gain 10 VP. If at least 1 opponent pays, gain an income building from your income mat; if none does, gain 1 coin',
	'pillage-and-plunder':
		"Whenever you conquer an opponent's territory, gain the results of both conquer dice. Traps may not be played against you",
	// Its four advances are unordered, and each free bonus stays optional (FAQ #4).
	renaissance:
		'Advance once on each track, in any order, without their benefits. You may take each bonus you reach for free',
	'pirate-rule':
		'Whenever you conquer a territory tile, also gain the benefit on that tile',
	'plea-for-aid':
		'For each track where every other token is further advanced than yours, gain 2 VP and 1 resource of your choice',
	revisionism:
		'Whenever you gain a landmark on a track, also gain 1 resource of your choice. Whenever you reach a track landmark space already claimed, gain an Armory',
	revolution:
		"Choose one: gain 1 resource of your choice, or choose up to 3 territories with your toppled outposts, stand them up and topple those opponents' outposts",
	'steam-tycoon':
		'Invent a face-up tech card and upgrade it. Then each of your neighbours invents the top card of the tech deck',
	socialism:
		'Choose a track and advance or go back on it to match the closest opponent, without its benefit or bonus',
	technocracy:
		'If you are the first player to enter this era, invent a tech card and upgrade it. Otherwise gain 3 VP for each opponent',
	terraforming:
		'You may build on impassable plots of your capital. Each time you do, gain 5 VP',
	theocracy:
		'You may not advance on Science. Whenever you enter a new tier on any track, gain 4 VP',
	'trade-economy':
		"Choose an opponent's current space on any track and gain its benefit. If it has a bonus, that opponent may take it for free",
	trap: 'When an opponent tries to conquer one of your territories, discard this card. Gain 1 resource of your choice, keep control and topple their outpost; they still gain the benefit of 1 conquer die',
	tyranny:
		'When you gain a tapestry card, you may play it on top of this card at once. The first and only time you do, gain 5 VP',
	'wartime-economy':
		'Every bonus that costs resources of your choice is free',
});

/**
 * A tapestry card's face in words: its ability, and for the trap what it gains played as a tapestry card (R22).
 * A card whose rules are all effects reads as them.
 * @param {string} id - A card id; each trap copy, such as 'trap-3', is the trap
 * @returns {{ ability: string, note?: string }}
 */
export function describeTapestryCard(id) {
	const wanted = /^trap-\d+$/.test(id) ? 'trap' : id;
	const card = TAPESTRY_CARDS.find((c) => c.id === wanted);
	if (!card) {
		return { ability: capitalize(ANY_EFFECT) };
	}
	if (card.id === 'trap') {
		return {
			ability: TAPESTRY_RULES.trap,
			note: `Played as a tapestry card on an income turn: ${effectsPhrase(card.played, undefined, card.ordered)}`,
		};
	}
	if (Object.hasOwn(TAPESTRY_RULES, card.id)) {
		return { ability: TAPESTRY_RULES[card.id] };
	}
	return {
		ability: describeEffects(card.played, { ordered: card.ordered }),
	};
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
		RESOURCES.includes(slot) ? `Lose ${amount(1, slot)}` : null,
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
	if (typeof slot === 'string' && RESOURCES.includes(slot)) {
		return capitalize(amount(1, slot));
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
		const tile = SPACE_TILES.find((t) => t.id === a.tile);
		return tile
			? `Space tile ${a.tile}: ${effectsPhrase(tile.benefit, table, tile.ordered)}`
			: `Space tile ${a.tile}`;
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
