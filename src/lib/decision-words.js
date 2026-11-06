// The decisions' titles and answers in words (#26 design §8, #126): what the decision panel asks, and each answer it offers.
// game.js first: it loads the civilization modules in an order free of their import cycle.
import './engine/game.js';
import { RECYCLERS_VP } from './engine/civs/recyclers.js';
import { TREASURES } from './engine/civs/treasure-hunters.js';
import { TINKERERS_STEP_BACK } from './engine/civs/tinkerers.js';
import {
	LIGHTHOUSE_TRADE,
	UTILITARIANS_ADVANCE_VP,
	UTILITARIANS_LANDMARKS,
} from './engine/civs/utilitarians.js';
import { DARK_AGES_ADVANCES, REVOLUTION_MORE } from './engine/effects/cards.js';
import { countVp } from './engine/effects/vp.js';
import { TRACKS, advanceCost } from './engine/data/tracks.js';
import { TECH_CARDS } from './engine/data/tech-cards.js';
import { LANDMARKS } from './engine/data/landmarks.js';
import { TERRITORY_TILES } from './engine/data/territory-tiles.js';
import {
	EXPANSION_SPACE_TILES,
	SPACE_TILES,
} from './engine/data/space-tiles.js';
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
import { amountWords, capitalize, joinList, signed, wordsOf } from './words.js';
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
 * The tapestry card whose rules opened a decision, from its `source` (#148), or null.
 * @param {Decision} decision
 * @returns {string | null}
 */
function tapestrySource(decision) {
	const card = isRecord(decision.source) ? decision.source.tapestry : null;
	return typeof card === 'string' ? card : null;
}

/** The choices some tapestry cards offer, after the card's name (#148); any other card's reads "choose one". */
const TAPESTRY_CHOICES = /** @type {Readonly<Record<string, string>>} */ (
	Object.freeze({
		feudalism: 'a resource, or VP for your landmarks?',
		revolution: 'a resource, or stand your outposts back up?',
		diplomacy: 'choose an income building to gain',
		'surprise-party': '10 VP, or an Armory?',
	})
);

/** The VP counters an answer can total from the viewer's own view (#148): what their seat shows of itself. */
const COUNTED = Object.freeze(['landmark', 'techCard']);

/**
 * What a VP counter answer comes to now, after its words: " (2 now: 6 VP)", or " (none yet: 0 VP)" (#148). Empty for
 * any other answer, or a table that doesn't show the player's seat, such as another player's.
 * @param {unknown} option - One of a chooseOption's options
 * @param {Decision} decision
 * @param {Table | undefined} table
 * @returns {string}
 */
function vpNow(option, decision, table) {
	const vp =
		Array.isArray(option) && option.length === 1 && isRecord(option[0])
			? option[0].vp
			: null;
	const seat = /** @type {Record<string, any> | undefined} */ (
		table?.seats?.[decision.player - 1]
	);
	if (
		!isRecord(vp) ||
		!COUNTED.includes(vp.per) ||
		seat?.kind !== 'player' ||
		!isRecord(seat.capital) ||
		!isRecord(table?.hexes)
	) {
		return '';
	}
	const count = countVp(/** @type {any} */ (table), decision.player, vp.per);
	const total = count * (isCount(vp.each) ? vp.each : 1);
	return count === 0 ? ' (none yet: 0 VP)' : ` (${count} now: ${total} VP)`;
}

/**
 * A civilization's offer of a gain it may take (#148): the civilization, the move that set it off, and what it gives.
 * @param {Decision} decision - A chooseOption with the purpose 'civOffer'
 * @param {Table | undefined} table
 * @returns {string}
 */
function civOfferTitle(decision, table) {
	if (typeof decision.civ !== 'string') {
		return 'Use your civilization?';
	}
	const civ = civilizationName(decision.civ);
	const from = isCount(decision.from)
		? seatName(table, decision.from)
		: 'An opponent';
	const source = isRecord(decision.source) ? decision.source : {};
	if (
		decision.civ === 'inventors' &&
		typeof source.tech === 'string' &&
		(source.icon === 'circle' || source.icon === 'square')
	) {
		return `${civ}: ${from} upgraded ${techName(source.tech)}; gain its ${source.icon} benefit?`;
	}
	if (decision.civ === 'traders' && typeof source.hex === 'string') {
		return `${civ}: ${from} conquered ${hexName(source.hex)}; gain the die they didn't keep?`;
	}
	if (decision.civ === 'isolationists') {
		return `${civ}: put a token on the territory you just conquered, and gain a resource?`;
	}
	return `Use your ${civ}?`;
}

/**
 * A shared advance's question (#148): the card and, for another player, whose it is, then the track.
 * @param {Decision} decision - A chooseMove with `shared`: { by, card }
 * @param {Table | undefined} table
 * @returns {string}
 */
function sharedMoveTitle(decision, table) {
	const { by, card } = decision.shared;
	const name = tapestryName(card);
	const whose =
		by === decision.player ? name : `${seatName(table, by)}'s ${name}`;
	const [first] = Array.isArray(decision.options) ? decision.options : [];
	const track =
		isRecord(first) && isTrack(first.track)
			? trackName(first.track)
			: 'its track';
	const without = decision.benefit === false ? ', without the benefit' : '';
	return `${whose}: advance on ${track}${without}${decision.optional ? '?' : ''}`;
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
 * @type {Record<string, (decision: Decision, table: Table | undefined) => string>}
 */
const SLOT_TITLES = {
	loseResource: () => 'Choose a resource to lose',
	payResource: () => 'Choose a resource to pay',
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
	treasureHunters: () => 'Choose a treasure to claim',
	tinkerers: () => 'Put a Tinkerers token on an option?',
	tinkerersPayBack: () => 'Pay back: choose one of your track spaces',
	spies: () => 'Put a Spies token on an option?',
	spiesCard: () => "Choose a neighbour's tapestry card to copy",
	spiesTile: () => "Choose a tile in a neighbour's supply",
	spiesSpace: () => "Choose a neighbour's track space",
	spiesTech: () => "Choose a neighbour's tech card",
	spiesLook: (d, table) =>
		`Look at ${seatName(table, Array.isArray(d.options) ? d.options[0] : undefined)}'s hand?`,
	utilitariansLandmark: () =>
		'Choose a tier II landmark for your Utilitarians',
	utilitariansPlace: () =>
		'Put a Utilitarians token beside a landmark you own?',
	utilitariansToken: (d) => {
		const [first] = Array.isArray(d.options) ? d.options : [];
		if (!isRecord(first) || typeof first.landmark !== 'string') {
			return 'Switch on a Utilitarians landmark?';
		}
		const verb = first.from === 'mat' ? 'Put' : 'Move';
		return `${verb} a Utilitarians token beside the ${landmarkName(first.landmark)}?`;
	},
};

/**
 * What each landmark the Utilitarians' mat lists does while a token is beside it (03 §1.3), after its name, for the
 * panel: the tier II ones' own words, and each tier III one's VP for its track.
 * @type {Readonly<Record<string, string>>}
 */
const UTILITARIANS_ABILITIES = Object.freeze({
	forge: 'whenever you upgrade a tech card to your top row, gain 1 resource of your choice',
	barracks: "whenever you conquer, also gain the red die's result",
	lighthouse: `once each advance turn, before or after you advance, you may discard ${amountWords('territory', LIGHTHOUSE_TRADE.pay.territory ?? 0)} to gain 1 resource of your choice`,
	apothecary:
		'whenever you gain another landmark, gain 1 resource of your choice',
	...Object.fromEntries(
		UTILITARIANS_LANDMARKS.flatMap((id) => {
			const source = LANDMARKS.find(
				(landmark) => landmark.id === id
			)?.source;
			return source && 'tier' in source && source.tier === 3
				? [
						[
							id,
							`whenever you advance to a space in tier III or IV of ${trackName(source.track)}, gain ${UTILITARIANS_ADVANCE_VP} VP`,
						],
					]
				: [];
		})
	),
});

/**
 * A listed landmark with what its ability does: "Forge: whenever you upgrade …"; null for any other slot.
 * @param {unknown} slot
 * @returns {string | null}
 */
function utilitariansAbility(slot) {
	return typeof slot === 'string' &&
		Object.hasOwn(UTILITARIANS_ABILITIES, slot)
		? `${landmarkName(slot)}: ${UTILITARIANS_ABILITIES[slot]}`
		: null;
}

/** What each Treasure Hunters treasure rolls once its resource is gained, by its die (03 §1.3). */
const TREASURE_ROLLS = /** @type {Readonly<Record<string, string>>} */ ({
	black: 'roll the black conquer die twice and gain one result',
	science: 'roll the science die twice and advance on one result',
	conquer: 'roll both conquer dice and gain both results',
	red: 'roll the red conquer die twice and gain both results',
});

/** The Tinkerers' options by number, named as their card names them (03 §1.3), for the panel and the log. */
export const TINKERERS_OPTION_NAMES =
	/** @type {Readonly<Record<number, string>>} */ (
		Object.freeze({
			1: 'Pay back',
			2: 'Catch up',
			3: 'Step back',
			4: 'Jump ahead',
		})
	);

/** What each Tinkerers option does, after its name. */
const TINKERERS_OPTION_WORDS = /** @type {Readonly<Record<number, string>>} */ (
	Object.freeze({
		1: 'gain what advancing into one of your track spaces cost',
		2: 'advance to the closest opponent ahead, with the benefit but not the bonus',
		3: `go back ${TINKERERS_STEP_BACK} spaces, with the benefit, and you may pay the bonus`,
		4: 'move to the next space with a bonus and take that bonus for free, without the benefit',
	})
);

/** The Spies' options by number, named as their card names them (03 §1.3), for the panel. */
export const SPIES_OPTION_NAMES =
	/** @type {Readonly<Record<number, string>>} */ (
		Object.freeze({
			1: 'A WHEN PLAYED card',
			2: 'A tile in their supply',
			3: 'Their track position',
			4: 'Their tech card',
		})
	);

/** What each Spies option gains from a neighbour, after its name. */
const SPIES_OPTION_WORDS = /** @type {Readonly<Record<number, string>>} */ (
	Object.freeze({
		1: "gain the effect of a When Played tapestry card face up on a neighbour's income mat",
		2: "gain the benefit of a territory or space tile in a neighbour's supply",
		3: "gain the benefit of a neighbour's track space, without its bonus",
		4: "gain the benefit of a neighbour's middle-row or top-row tech card",
	})
);

/** Every space tile the engine knows, the base game's and the expansions'. */
const SPACE_TILES_KNOWN = Object.freeze([
	...SPACE_TILES,
	...EXPANSION_SPACE_TILES,
]);

/**
 * A neighbour's tile a Spies option takes, with what it gives: "Bo's space tile 5: gain 1 coin, 1 worker and 8 VP".
 * An ongoing space tile gives its VP only while it stays in their supply (03 §1.5).
 * @param {Record<string, any>} slot - `{ player, stack, tile }`
 * @param {Table | undefined} table
 * @returns {string | null} Null for a slot of another shape
 */
function spiesTileWords(slot, table) {
	const owner = seatName(table, slot.player);
	if (
		slot.stack === 'territory' &&
		isCount(slot.tile) &&
		slot.tile >= 1 &&
		slot.tile <= TERRITORY_TILES.length
	) {
		const benefit = TERRITORY_TILES[slot.tile - 1].benefit;
		return `${owner}'s territory tile ${slot.tile}: ${effectsPhrase(benefit, table, true)}`;
	}
	const tile =
		slot.stack === 'space'
			? SPACE_TILES_KNOWN.find(({ id }) => id === slot.tile)
			: undefined;
	if (!tile) {
		return null;
	}
	const words = `${owner}'s space tile ${slot.tile}: ${spaceTileWords(slot.tile, table)}`;
	return tile.ongoing
		? `${words}, while it stays in ${owner}'s supply`
		: words;
}

/**
 * What picking a hex does for the Infiltrators (03 §1.3): a token on the capital-city territory of the seat that started
 * there, or an outpost sharing the territory of the seat whose lone outpost stands there.
 * @param {string} hex
 * @param {Table | undefined} table - A view, whose seats name their `start` and whose hexes their outposts
 * @returns {string | null} Null when the table doesn't say
 */
function infiltratorsWords(hex, table) {
	const seats = /** @type {readonly Record<string, any>[]} */ (
		table?.seats ?? []
	);
	const capital = seats.findIndex((seat) => seat?.start === hex);
	if (capital !== -1) {
		return `put a token on ${seatName(table, capital + 1)}'s capital-city territory`;
	}
	const [lone] = table?.hexes?.[hex]?.outposts ?? [];
	return isRecord(lone) && isCount(lone.seat)
		? `share it with ${seatName(table, lone.seat)}`
		: null;
}

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
	chooseOrder: (d) => {
		const card = tapestrySource(d);
		if (card === 'renaissance') {
			return 'Renaissance: choose the next track to advance on';
		}
		return card
			? `${tapestryName(card)}: choose what comes next`
			: 'Choose what comes next';
	},
	chooseOption: (d, table) => {
		switch (d.purpose) {
			case 'civOffer':
				return civOfferTitle(d, table);
			case 'riverfolkDiscard':
				return 'Discard the Riverfolk for another civilization?';
			case 'militarism':
				return 'Place an outpost on the territory you explored?';
			case 'exploitation':
				return 'Choose what exploring gives you';
			case 'cartography':
				return 'Conquer the territory you just explored?';
			case 'islandersDiscard':
				return 'Discard the Islanders for another civilization?';
			case 'islandersExplore':
				return 'Explore a tile onto your Islanders mat?';
			case 'islandersPlace':
				return 'Place a tile on your Islanders mat?';
			case 'aliens':
				return 'Explore a space tile onto your Aliens mat, or gain a resource';
			case 'treasureHunters':
				return 'Keep one of the two black die results';
			default: {
				const card = tapestrySource(d);
				return card
					? `${tapestryName(card)}: ${TAPESTRY_CHOICES[card] ?? 'choose one'}`
					: 'Choose one';
			}
		}
	},
	chooseMove: (d, table) => {
		if (
			isRecord(d.shared) &&
			isCount(d.shared.by) &&
			typeof d.shared.card === 'string'
		) {
			return sharedMoveTitle(d, table);
		}
		if (d.purpose === 'socialism') {
			return 'Socialism: move a token to the closest opponent on its track, without benefit or bonus';
		}
		if (
			d.purpose === 'tinkerers' &&
			Object.hasOwn(TINKERERS_OPTION_NAMES, d.option)
		) {
			return `${TINKERERS_OPTION_NAMES[d.option]}: choose a token to move`;
		}
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
	confirmEndTurn: () => 'Nothing left to do this turn',
	chooseTapestry: (d) => {
		if (d.purpose === 'heralds') {
			return 'Heralds: play a When Played card on top of Maker of Fire?';
		}
		if (d.purpose === 'tyranny') {
			const [after] = Array.isArray(d.afterPlay) ? d.afterPlay : [];
			const vp =
				isRecord(after) && isCount(after.vp)
					? `, for ${after.vp} VP`
					: '';
			return `Tyranny: play the card you just gained on top of it${vp}?`;
		}
		return d.optional
			? 'Play a tapestry card?'
			: 'Choose a tapestry card to play';
	},
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
	chooseSpaceTile: (d) =>
		typeof d.civ === 'string'
			? `Choose a space tile to explore onto your ${civilizationName(d.civ)} mat`
			: 'Choose a space tile to explore',
	chooseConquer: () => 'Choose a territory to conquer',
	chooseDie: () => 'Choose a die to keep',
	chooseResponse: (d, table) =>
		isCount(d.attacker)
			? `Respond to the conquest by ${seatName(table, d.attacker)}?`
			: 'Respond to the conquest?',
	chooseCounter: (d, table) =>
		isCount(d.defender)
			? `Counter ${seatName(table, d.defender)}'s trap?`
			: 'Counter the trap?',
	chooseInvent: () => 'Choose a tech card to invent',
	chooseUpgrade: (d) => {
		// The card just invented, or a Recyclers' recycle instead (#33).
		if (typeof d.only === 'string') {
			return `Upgrade ${techName(d.only)}, or recycle a top-row card`;
		}
		return d.optional
			? 'Upgrade a tech card?'
			: 'Choose a tech card to upgrade';
	},
	chooseTechBenefit: (d) =>
		d.icon === 'square'
			? 'Choose a tech card in your top row for its square benefit'
			: 'Choose a tech card in your middle row for its circle benefit',
	chooseLandmark: (d) =>
		d.purpose === 'dystopia'
			? 'Dystopia: choose a track landmark nobody has claimed'
			: 'Choose a landmark',
	chooseDiscard: (d) => {
		// The Advisors' discard down to 4 (#33).
		if (isCount(d.downTo)) {
			return `Discard a tapestry card, down to ${d.downTo} in your hand`;
		}
		return isCount(d.vpEach)
			? `Discard a tapestry card for ${d.vpEach} VP?`
			: 'Discard a tapestry card?';
	},
	chooseKeep: () => 'Choose a tapestry card to keep',
	chooseKeepTech: () => 'Choose a tech card to keep',
	chooseLandmarkCard: () => 'Keep a landmark card',
	chooseTrade: (d, table) => {
		// The Utilitarians' Lighthouse (#33).
		// Mandatory when only its resource pays for the turn's advance.
		if (d.purpose === 'lighthouse') {
			const tiles = amountWords(
				'territory',
				LIGHTHOUSE_TRADE.pay.territory ?? 0
			);
			return d.optional
				? `Use your Lighthouse: discard ${tiles} for a resource?`
				: `Use your Lighthouse: discard ${tiles} for a resource to advance with`;
		}
		// Olympic Host (#148): the host's card, and the trade it offers.
		const [offer] = Array.isArray(d.offers) ? d.offers : [];
		if (isCount(d.host) && isRecord(offer)) {
			const whose =
				d.host === d.player
					? 'Olympic Host'
					: `${seatName(table, d.host)}'s Olympic Host`;
			return `${whose}: ${paymentVerbs(offer.pay)} to ${effectsPhrase(offer.gain, table, true)}?`;
		}
		if (tapestrySource(d) === 'guilds') {
			return 'Guilds: pay VP for resources, or resources for VP';
		}
		const host = isCount(d.host) ? ` with ${seatName(table, d.host)}` : '';
		return d.optional ? `Make a trade${host}?` : `Choose a trade${host}`;
	},
	chooseTrack: (d) => {
		switch (d.purpose) {
			case 'darkAges':
				return `Dark Ages: choose the track to advance ${DARK_AGES_ADVANCES} times on`;
			case 'dictatorship':
				return 'Dictatorship: advance on a track, and close it to opponents';
			case 'sharedAdvance': {
				const then = isRecord(d.then) ? d.then : {};
				const who =
					then.others === 'opponents'
						? 'every opponent'
						: 'your neighbours';
				const words = `a track you and ${who} may advance on`;
				return isRecord(then.shared) &&
					typeof then.shared.card === 'string'
					? `${tapestryName(then.shared.card)}: choose ${words}`
					: `Choose ${words}`;
			}
			case 'statusQuo':
				return "Which track's bonus for this tier?";
			default:
				return 'Choose a track';
		}
	},
	chooseRoll: () => 'Choose one of the two science die results',
	chooseScienceDie: () => 'Choose the science die to roll',
	chooseSpace: () =>
		"Trade Economy: choose an opponent's track space to gain its benefit",
	chooseHex: (d) => {
		if (d.purpose === 'manifestDestiny') {
			return 'Gain the benefit of a territory tile you control?';
		}
		if (d.purpose === 'retreat') {
			return 'Where does your outpost retreat to?';
		}
		if (d.purpose === 'treasureHunters') {
			return 'Move a Treasure Hunters token onto a territory?';
		}
		if (d.purpose === 'infiltrators') {
			return "Share a territory, or put a token on an opponent's capital-city territory?";
		}
		if (d.purpose === 'colonialism') {
			return 'Colonialism: choose a territory tile you control, for 1 resource per land terrain on it';
		}
		if (d.purpose === 'revolution') {
			return d.optional
				? 'Revolution: stand up another toppled outpost?'
				: 'Revolution: choose a territory where your toppled outpost stands back up';
		}
		return d.optional ? 'Choose a territory?' : 'Choose a territory';
	},
	chooseGift: () => 'Give a territory tile to an opponent for 3 VP?',
	// The Advisors' gift: instead of a neighbour's draw, or one of their new cards for VP (#33).
	chooseGive: (d, table) => {
		const who = isCount(d.to) ? seatName(table, d.to) : 'a neighbour';
		return isCount(d.vp)
			? `Give ${who} one of your new tapestry cards for ${d.vp} VP?`
			: `Give ${who} a tapestry card instead of their draw?`;
	},
	choosePartner: () => 'Choose your partner for this era',
	chooseCopy: (d) =>
		d.espionage
			? 'Espionage: choose a tapestry card on an income mat to copy'
			: 'Choose a tapestry card to copy',
	chooseConversion: (d) =>
		isCount(d.max)
			? `Convert up to ${d.max} food into other resources for 2 VP each?`
			: 'Convert food into other resources for 2 VP each?',
	chooseCivAbility: () => 'Choose which civilization goes next',
	chooseSlot: (d, table) =>
		(Object.hasOwn(SLOT_TITLES, d.purpose) &&
			SLOT_TITLES[d.purpose](d, table)) ||
		(d.optional ? 'Choose one, or decline' : 'Choose one'),
	chooseAlchemists: () => 'Roll again?',
	chooseProphecy: (d) =>
		Object.hasOwn(PROPHECIES, d.category)
			? PROPHECIES[d.category][0]
			: 'Make a prophecy',
	chooseSwap: () => 'Swap two income buildings in your capital?',
	chooseCube: () => 'Choose a plot for an Architects cube',
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
	payResource: (slot) =>
		RESOURCE_IDS.includes(slot) ? `Pay ${amountWords(slot, 1)}` : null,
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
	treasureHunters: (slot, decision, table) => {
		const treasure = TREASURES.find(({ terrain }) => terrain === slot);
		return treasure
			? `${capitalize(treasure.terrain)}: ${effectPhrase({ gain: treasure.gain }, table)}, then ${TREASURE_ROLLS[treasure.die]}`
			: null;
	},
	tinkerers: (slot) =>
		Object.hasOwn(TINKERERS_OPTION_NAMES, slot)
			? `${TINKERERS_OPTION_NAMES[slot]}: ${TINKERERS_OPTION_WORDS[slot]}`
			: null,
	tinkerersPayBack: (slot, decision, table) =>
		isRecord(slot) &&
		isTrack(slot.track) &&
		isCount(slot.space) &&
		slot.space >= 1 &&
		slot.space < TRACKS[slot.track].length
			? `${spaceName(slot.track, slot.space)} on ${trackName(slot.track)}: ${effectPhrase({ gain: advanceCost(slot.track, slot.space) }, table)}`
			: null,
	spies: (slot) =>
		Object.hasOwn(SPIES_OPTION_NAMES, slot)
			? `${SPIES_OPTION_NAMES[slot]}: ${SPIES_OPTION_WORDS[slot]}`
			: null,
	spiesCard: (slot, decision, table) =>
		isRecord(slot) && typeof slot.card === 'string'
			? `${seatName(table, slot.player)}'s ${tapestryName(slot.card)}`
			: null,
	spiesTile: (slot, decision, table) =>
		isRecord(slot) ? spiesTileWords(slot, table) : null,
	spiesSpace: (slot, decision, table) => {
		if (
			!isRecord(slot) ||
			!isTrack(slot.track) ||
			!isCount(slot.space) ||
			slot.space < 1 ||
			slot.space >= TRACKS[slot.track].length
		) {
			return null;
		}
		const entry = TRACKS[slot.track][slot.space];
		return `${seatName(table, slot.player)}'s ${spaceName(slot.track, slot.space)} on ${trackName(slot.track)}: ${effectsPhrase(entry.benefit, table, entry.ordered)}`;
	},
	spiesTech: (slot, decision, table) => {
		const card = isRecord(slot) ? techCardOf(slot.card) : undefined;
		if (!card || (slot.icon !== 'circle' && slot.icon !== 'square')) {
			return null;
		}
		const circle = slot.icon === 'circle';
		const row = circle ? 'middle row' : 'top row';
		const benefit = circle ? card.circle : card.square;
		return `${seatName(table, slot.player)}'s ${card.name}, ${row}: ${effectsPhrase(benefit, table, false)}`;
	},
	spiesLook: (slot, decision, table) =>
		isCount(slot) && slot > 0
			? `Look at ${seatName(table, slot)}'s hand`
			: null,
	utilitariansLandmark: utilitariansAbility,
	utilitariansPlace: utilitariansAbility,
	utilitariansToken: (slot) => {
		if (
			!isRecord(slot) ||
			!Object.hasOwn(UTILITARIANS_ABILITIES, slot.landmark)
		) {
			return null;
		}
		const to = landmarkName(slot.landmark);
		if (slot.from === 'mat') {
			return `Put a token from your mat beside the ${to}`;
		}
		return Object.hasOwn(UTILITARIANS_ABILITIES, slot.from)
			? `Move the token from the ${landmarkName(slot.from)} to the ${to}`
			: null;
	},
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
		// The Riverfolk gained mid-game: declining keeps them (#33).
		if (d.purpose === 'riverfolkDiscard') {
			return a.option === 0
				? 'Keep the Riverfolk'
				: 'Discard them and gain another';
		}
		// The Islanders gained mid-game: declining keeps them (#165).
		if (d.purpose === 'islandersDiscard') {
			return a.option === 0
				? 'Keep the Islanders'
				: 'Discard them and gain another';
		}
		const option = d.options[a.option];
		if (Array.isArray(option) && option.length === 0) {
			return 'Decline';
		}
		if (d.purpose === 'islandersExplore') {
			return 'Explore a tile onto the mat';
		}
		if (d.purpose === 'islandersPlace') {
			return 'Place a tile on the mat';
		}
		// Revolution's own rules, in words rather than the card's name (#148).
		if (isRecord(option?.[0]) && 'revolution' in option[0]) {
			return `Stand up to ${1 + REVOLUTION_MORE} of your toppled outposts, toppling the opponents' outposts there`;
		}
		// The black die's "?" on a territory the Treasure Hunters claimed, not conquered (#33).
		if (
			d.purpose === 'treasureHunters' &&
			isRecord(option?.[0]) &&
			'tileBenefit' in option[0]
		) {
			return 'Gain the benefit of the territory tile you claimed';
		}
		return (
			capitalize(effectsPhrase(option, table, true)) +
			vpNow(option, d, table)
		);
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
		// A shared advance's title names the track already (#148).
		if (isRecord(d.shared)) {
			return `Advance to ${spaceName(a.track, a.from + 1)}`;
		}
		return `Advance on ${track} to ${spaceName(a.track, a.from + 1)}`;
	},
	chooseRepeat: (a) =>
		isTrack(a.track) && isCount(a.space)
			? `Repeat ${spaceName(a.track, a.space)}`
			: null,
	chooseRestart: (a) =>
		isTrack(a.track) ? `Start again on ${trackName(a.track)}` : null,
	confirmEndTurn: () => 'End turn',
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
	chooseCounter: (a) => {
		if (a.card === null) {
			return "Don't counter";
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
		if (typeof a.card !== 'string') {
			return null;
		}
		// The Recyclers' discard pile (#33).
		return a.from === 'discard'
			? `${techName(a.card)}, from the discard pile`
			: techName(a.card);
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
		// The Recyclers' recycle (#33).
		if (tech?.top?.includes(a.card)) {
			return `${techName(a.card)}, back to the bottom row for ${RECYCLERS_VP} VP`;
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
	chooseKeepTech: (a) =>
		typeof a.card === 'string' ? `Keep ${techName(a.card)}` : null,
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
	chooseTrack: (a, d) => {
		if (!isTrack(a.track)) {
			return null;
		}
		const track = trackName(a.track);
		if (d.purpose === 'darkAges') {
			return `${track}: advance ${DARK_AGES_ADVANCES} times, and go back once on each other track`;
		}
		if (d.purpose === 'dictatorship') {
			return `${track}: no opponent advances on it until your next turn`;
		}
		return track;
	},
	chooseRoll: (a) => (isTrack(a.track) ? trackName(a.track) : null),
	chooseScienceDie: (a) =>
		a.die === 'd20' ? 'The d20' : a.die === 'd12' ? 'The d12' : null,
	chooseSpace: (a, d, table) =>
		isTrack(a.track) && isCount(a.space)
			? `${spaceName(a.track, a.space)} (${seatName(table, a.player)})`
			: null,
	chooseHex: (a, d, table) => {
		if (a.hex === null) {
			return 'Decline';
		}
		if (typeof a.hex !== 'string') {
			return null;
		}
		const hex = capitalize(hexName(a.hex));
		const does =
			d.purpose === 'infiltrators'
				? infiltratorsWords(a.hex, table)
				: null;
		return does ? `${hex}: ${does}` : hex;
	},
	chooseGift: (a, d, table) => {
		if (a.tile === null) {
			return "Don't give a tile";
		}
		return isCount(a.tile)
			? `Give tile ${a.tile} to ${seatName(table, a.player)}`
			: null;
	},
	chooseGive: (a, d, table) => {
		if (a.card === null) {
			const who = isCount(d.to) ? seatName(table, d.to) : 'them';
			return isCount(d.vp)
				? `Don't give ${who} a card`
				: `Let ${who} draw`;
		}
		return typeof a.card === 'string'
			? `Give ${tapestryName(a.card)}`
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
	chooseCube: (a) =>
		Number.isInteger(a.row) && Number.isInteger(a.col)
			? capitalize(plotName(a.row, a.col))
			: null,
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
