// Words for the engine's effects, costs, bonuses and payments (#26 design §8): the short English the play screen shows.
import { TRACK_IDS } from './engine/data/ids.js';
import {
	AMOUNT_ORDER,
	amountWords,
	article,
	capitalize,
	joinList,
	nounOf,
	pluralOf,
	wordsOf,
} from './words.js';
import {
	buildingName,
	civilizationName,
	hexName,
	landmarkName,
	seatName,
	tapestryName,
	techName,
	trackName,
} from './game-names.js';

/** @typedef {Record<string, any>} Effect - One engine effect, `{ kind: value }`, of any shape */
/** @typedef {Record<string, any>} Decision - An open decision as a view shows it */
/** @typedef {Record<string, any>} Answer - One of a decision's answers */
/** @typedef {import('./game-names.js').Table & { hexes?: Record<string, any> }} Table - A state or a view: the seats' names, and the map */

/** What an effect reads when its kind is not one this module knows. */
const ANY_EFFECT = 'take this effect';

/** What a cost discards rather than pays. */
const DISCARDS = ['territory', 'space', 'tapestry', 'tech'];

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
 * A price in words, its symbols counted in the order they first appear: "1 food and 1 resource of your choice",
 * "2 coins", and "nothing" for an empty price.
 * @param {readonly import('./ui.js').CostSymbol[]} symbols - One symbol per resource paid
 * @returns {string}
 */
export function priceWords(symbols) {
	/** @type {Map<string, number>} */
	const counts = new Map();
	for (const symbol of symbols) {
		counts.set(symbol, (counts.get(symbol) ?? 0) + 1);
	}
	if (counts.size === 0) {
		return 'nothing';
	}
	return joinList([...counts].map(([id, n]) => amountWords(id, n)));
}

/**
 * The amounts of a cost or gain, in AMOUNT_ORDER, then any other keys; zero, missing and odd values are left out.
 * @param {Record<string, unknown>} counts
 * @param {(key: string) => boolean} [only] - Which keys to take
 * @returns {string[]}
 */
export function amounts(counts, only = () => true) {
	const keys = [
		...AMOUNT_ORDER.filter((key) => key in counts),
		...Object.keys(counts).filter((key) => !AMOUNT_ORDER.includes(key)),
	];
	return keys
		.filter((key) => only(key))
		.flatMap((key) => {
			const n = counts[key];
			return isCount(n) && n > 0 ? [amountWords(key, n)] : [];
		});
}

/**
 * Whether a value is one of the four track ids.
 * @param {unknown} track
 * @returns {track is import('./engine/data/ids.js').TrackId}
 */
function isTrack(track) {
	return TRACK_IDS.includes(/** @type {any} */ (track));
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
	if (TRACK_IDS.every((track) => tracks.includes(track))) {
		return 'any track';
	}
	return joinList(tracks.map(trackName), 'or');
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
export function paymentVerbs(payment) {
	if (!isRecord(payment)) {
		return 'pay the cost';
	}
	const paid = amounts(payment, (key) => !DISCARDS.includes(key));
	/** @type {string[]} */
	const discarded = [];
	for (const key of DISCARDS) {
		const given = payment[key];
		if (isCount(given) && given > 0) {
			discarded.push(amountWords(key, given));
		} else if (Array.isArray(given) && given.length > 0) {
			if (key === 'territory' || key === 'space') {
				const ids = given.map((id) => (isCount(id) ? String(id) : '?'));
				discarded.push(`${nounOf(key, given.length)} ${joinList(ids)}`);
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
			const draw = `draw ${amountWords('tapestry', tapestry)} and keep ${keep}`;
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
export function effectPhrase(effect, table) {
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
		return `${n} ${pluralOf(name)}`;
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
export function effectsPhrase(effects, table, ordered) {
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
