// createGame(): a new base game whose first decisions are the players' simultaneous setup picks.
import { PlayerError } from './errors.js';
import { emit } from './events.js';
import { shuffle } from './random.js';
import { push, pushGroup } from './stack.js';
import { run } from './loop.js';
import { afterSetupSteps } from './after-setup.js';
import { civsFor, tapestryFor, techDeck } from './decks.js';
import { EXPANSIONS } from '../art/catalog.js';
import { MAPS } from './data/maps.js';
import { CAPITAL_MATS, SMALL_MAP_PAIRS } from './data/capitals.js';
import { landmarksFor } from './data/landmarks.js';
import { landmarkCardsFor } from './data/landmark-cards.js';
import { ACHIEVEMENTS } from './data/achievements.js';
import { TERRITORY_TILES } from './data/territory-tiles.js';
import { spaceTilesFor } from './data/space-tiles.js';
import {
	VERSIONS,
	TRACK_IDS,
	ARTS_TRACK,
	RESOURCE_IDS,
	BUILDING_IDS,
} from './data/ids.js';
import { artsTrackOn } from './data/tracks.js';
import { MASTERPIECES } from './data/masterpieces.js';

/**
 * The expansions whose setup is built, so a table may choose them. Each expansion issue adds its code (#32, #35, #39).
 * Plans & Ploys is offered from #32 on, with its civilizations and cards to follow in #33 (owner, 2026-10-31).
 * Arts & Architecture is offered from #35 on, its mats and cards to follow in #36 and #37, as for #32 (#35 design §3.1).
 * @type {readonly string[]}
 */
export const EXPANSIONS_BUILT = Object.freeze(['pp', 'aa']);

/**
 * One official optional variant a table may switch on (03 FF.2.6, 01 §2.2).
 * @typedef {Object} Variant
 * @property {string} id
 * @property {string} name - For the new-table screen
 * @property {string} [expansion] - The expansion code the variant needs switched on
 */

/**
 * The optional variants a table may switch on, chosen by the owner (#53 design §2). Those that need an expansion
 * join with it: civilizations from one expansion (#33) and either science die (#35).
 * @type {readonly Readonly<Variant>[]}
 */
export const VARIANTS = Object.freeze(
	[
		{
			id: 'tapestry-draft',
			name: 'Income turn 1: draw 2 tapestry cards, keep 1',
		},
		{ id: 'civ-draft', name: 'Gaining a civilization: draw 2, keep 1' },
		{
			id: 'neoprene-nanotechnology',
			name: "Nanotechnology's bonus discards 2 tech cards",
		},
		{
			id: 'no-radio-battery',
			name: 'Leave out Radio and Lithium-Ion Battery',
		},
		{ id: 'closest-island', name: 'Start on the island closest to you' },
		{
			id: 'civs-from-pp',
			name: 'All civilizations from Plans & Ploys',
			expansion: 'pp',
		},
		// The arts track is optional (03 §2): with A&A on it is in play unless this variant leaves it out (owner, #35).
		{
			id: 'no-arts-track',
			name: 'Play without the arts track',
			expansion: 'aa',
		},
		// Handed on from #53; it also needs the arts track, which checkOptions() checks.
		{
			id: 'either-science-die',
			name: 'Roll either science die (d12 or d20)',
			expansion: 'aa',
		},
	].map((variant) => Object.freeze(variant))
);

/**
 * Checks the players, throwing PlayerError for each problem in the spec's order.
 * @param {unknown} players
 */
function checkPlayers(players) {
	if (!Array.isArray(players) || players.length < 1 || players.length > 5) {
		throw new PlayerError('A game needs 1 to 5 players.');
	}
	for (const player of players) {
		if (!player || typeof player !== 'object') {
			throw new PlayerError('Every player needs a name.');
		}
		if (typeof player.name !== 'string') {
			throw new PlayerError('Every player needs a name.');
		}
	}
}

/**
 * Checks a game's options, as a table does whenever its host changes them, throwing PlayerError for the first problem.
 * @param {{ version: unknown, expansions?: unknown, variants?: unknown }} options
 * @throws {PlayerError} For an unknown version, an unknown or unbuilt expansion, or an unknown or repeated variant
 */
export function checkOptions({ version, expansions = [], variants = [] }) {
	if (!VERSIONS.some((v) => v.id === version)) {
		throw new PlayerError(`Unknown rules version: ${version}.`);
	}
	if (!Array.isArray(expansions)) {
		throw new PlayerError('The expansions must be a list.');
	}
	for (const code of expansions) {
		// The base game is not an expansion, so only the three real ones are known.
		const known = EXPANSIONS.find(
			(e) => e.code === code && e.code !== 'base'
		);
		if (!known) {
			throw new PlayerError(`Unknown expansion: ${code}.`);
		}
		if (!EXPANSIONS_BUILT.includes(code)) {
			throw new PlayerError(`${known.name} isn't available yet.`);
		}
	}
	if (!Array.isArray(variants)) {
		throw new PlayerError('The variants must be a list.');
	}
	for (const variant of variants) {
		if (!VARIANTS.some((v) => v.id === variant)) {
			throw new PlayerError(`Unknown variant: ${variant}.`);
		}
	}
	if (new Set(variants).size < variants.length) {
		throw new PlayerError('Each variant may be switched on only once.');
	}
	for (const id of variants) {
		const variant = VARIANTS.find((v) => v.id === id);
		if (variant?.expansion && !expansions.includes(variant.expansion)) {
			const name = EXPANSIONS.find(
				(e) => e.code === variant.expansion
			)?.name;
			throw new PlayerError(
				`The variant "${variant.name}" needs ${name}.`
			);
		}
	}
	if (
		variants.includes('either-science-die') &&
		variants.includes('no-arts-track')
	) {
		const variant = VARIANTS.find((v) => v.id === 'either-science-die');
		throw new PlayerError(
			`The variant "${variant?.name}" needs the arts track.`
		);
	}
}

/**
 * A seat at the start: empty, with its tokens on every track start (01 §2.2), the arts track's too when it is in play.
 * @param {number} seat
 * @param {string} name
 * @param {readonly string[]} tracks - The tracks in play
 * @returns {import('./state.js').PlayerSeat}
 */
function newSeat(seat, name, tracks) {
	// The arts track brings each player's masterpieces and inspiration tiles (#35).
	const arts = tracks.includes(ARTS_TRACK);
	return {
		seat,
		kind: 'player',
		name,
		vp: 0,
		vpSources: {},
		tracks: /** @type {any} */ (
			Object.fromEntries(tracks.map((id) => [id, [0]]))
		),
		restartedTracks: [],
		outposts: 8,
		incomeTurns: 0,
		finished: false,
		resources: /** @type {any} */ (
			Object.fromEntries(RESOURCE_IDS.map((id) => [id, 0]))
		),
		incomeMat: {
			buildings: /** @type {any} */ (
				Object.fromEntries(BUILDING_IDS.map((id) => [id, 5]))
			),
			tapestry: [[], [], [], []],
			faceDown: [],
		},
		capital: { mat: null, buildings: [], landmarks: [], cubes: [] },
		besideMat: [],
		hand: [],
		tech: { bottom: [], middle: [], top: [] },
		territoryTiles: [],
		spaceTiles: [],
		exploredSpace: [],
		civs: [],
		civData: {},
		era: null,
		picks: {},
		landmarkCard: null,
		start: null,
		...(arts && { masterpieces: [], inspired: [] }),
	};
}

/**
 * The masterpiece supply: the 20 cards shuffled, 3 of them face up (03 §2.2, setup step 2).
 * @param {import('./random.js').Random} random
 * @returns {{ deck: string[], faceUp: string[], discard: string[] }}
 */
function masterpieceSupply(random) {
	const deck = shuffle(
		MASTERPIECES.map((m) => m.id),
		random
	);
	return { deck: deck.slice(3), faceUp: deck.slice(0, 3), discard: [] };
}

/**
 * What every setup step works on.
 * @typedef {Object} SetupContext
 * @property {import('./state.js').State} state - Being built; the steps change it
 * @property {import('./state.js').PlayerSeat[]} seats - The same objects as `state.seats`
 * @property {import('./random.js').Random} random
 * @property {import('./state.js').NewLane[]} lanes - One per seat: the decisions that seat opens with
 * @property {{ player: number, hex: string }[]} starts - Where each seat's two outposts begin
 */

/**
 * The start regions round each map side, in capital-number order: on the large map the start hexes of capitals 1–6,
 * on the small map the shared spots 1/6, 2/4 and 3/5. Each island's start hex is its centre (R110).
 */
export const ISLANDS = Object.freeze({
	large: Object.freeze(CAPITAL_MATS.map((mat) => mat.start.large)),
	small: Object.freeze(
		SMALL_MAP_PAIRS.map(([mat]) => CAPITAL_MATS[mat - 1].start.small)
	),
});

/**
 * The closest-island variant: players start round the map in seat order, spaced as evenly as the islands allow, from
 * a random island (R110). Alone, a player keeps R40's start.
 * @param {SetupContext} setup
 */
function startOnIslands({ state, seats, random, starts }) {
	if (seats.length === 1 || !state.variants.includes('closest-island')) {
		return;
	}
	const islands = ISLANDS[state.map];
	const first = random(islands.length);
	starts.forEach((start, i) => {
		start.hex =
			islands[
				(first + Math.floor((i * islands.length) / seats.length)) %
					islands.length
			];
	});
}

/**
 * Capital mats, and where each player's two outposts start.
 * @param {SetupContext} setup
 */
function dealCapitals({ state, seats, random, lanes, starts }) {
	const count = seats.length;
	if (state.map === 'large') {
		const mats = shuffle([1, 2, 3, 4, 5, 6], random);
		seats.forEach((s, i) => {
			s.capital.mat = mats[i];
			starts.push({
				player: s.seat,
				hex: CAPITAL_MATS[mats[i] - 1].start.large,
			});
			emit(state, {
				type: 'capitalDealt',
				player: s.seat,
				capital: mats[i],
			});
		});
		state.supply.capitals = mats.slice(count);
	} else {
		const pairs = shuffle(SMALL_MAP_PAIRS, random);
		seats.forEach((s, i) => {
			const options = [...pairs[i]];
			lanes[i].ops.push({
				player: s.seat,
				kind: 'chooseCapital',
				options,
			});
			// R40: a solo player always starts on 2/4, whichever pair they are dealt.
			const hex =
				count === 1 ? '0_2' : CAPITAL_MATS[options[0] - 1].start.small;
			starts.push({ player: s.seat, hex });
			emit(state, { type: 'capitalDealt', player: s.seat, options });
		});
		state.supply.capitals = pairs.slice(count).flat();
	}
}

/**
 * Two outposts for each seat on its start hex, which the seat records (#33: Manifest Destiny, the Infiltrators).
 * @param {SetupContext} setup
 */
function placeOutposts({ state, seats, starts }) {
	for (const { player, hex } of starts) {
		const seat = seats.find((s) => s.seat === player);
		if (seat) {
			seat.start = hex;
		}
		state.hexes[hex].outposts.push(
			{ seat: player, toppled: false },
			{ seat: player, toppled: false }
		);
		emit(state, { type: 'outpostsPlaced', player, hex, count: 2 });
	}
}

/**
 * Civilizations: 2 each, kept with a decision.
 * @param {SetupContext} setup
 */
function dealCivs({ state, seats, random, lanes }) {
	const civs = shuffle(civsFor(state.expansions, state.variants), random);
	seats.forEach((s, i) => {
		const options = civs.slice(2 * i, 2 * i + 2);
		lanes[i].ops.push({ player: s.seat, kind: 'chooseCiv', options });
		emit(state, {
			type: 'civsDealt',
			player: s.seat,
			secret: { civs: options },
		});
	});
	state.supply.civs = civs.slice(2 * seats.length);
}

/**
 * The first player, at random.
 * @param {SetupContext} setup
 */
function chooseFirstPlayer({ state, seats, random }) {
	state.first = random(seats.length) + 1;
	emit(state, { type: 'firstPlayerChosen', player: state.first });
}

/**
 * The setup steps, in order; expansion issues add their own here.
 * The decks are shuffled before the steps run, so the order of `random` calls is part of the contract.
 * @type {((setup: SetupContext) => void)[]}
 */
export const SETUP_STEPS = [
	dealCapitals,
	startOnIslands,
	placeOutposts,
	dealCivs,
	chooseFirstPlayer,
];

/**
 * Starts a new base game for 1 to 5 players. The first decisions are every player's setup picks, open at once.
 * @param {Object} options
 * @param {{ name: string }[]} options.players - In seat order, which is clockwise and turn order
 * @param {import('./data/ids.js').VersionId} options.version
 * @param {string[]} [options.expansions] - Codes from EXPANSIONS_BUILT
 * @param {string[]} [options.variants] - Ids from VARIANTS
 * @param {boolean} [options.confirmEnd] - Whether each turn waits for its player to end it (#146); tables switch it on
 * @param {import('./random.js').Random} options.random
 * @returns {import('./state.js').State}
 * @throws {PlayerError} For a bad player count or name, version, expansion or variant
 * @throws {TypeError} When `random` is not a function
 */
export function createGame({
	players,
	version,
	expansions = [],
	variants = [],
	confirmEnd = false,
	random,
}) {
	checkPlayers(players);
	checkOptions({ version, expansions, variants });
	if (typeof random !== 'function') {
		throw new TypeError('createGame needs a random function.');
	}
	const arts = artsTrackOn(expansions, variants);
	// R59: the Automa has no decision cards for the arts track, so no solo game uses it.
	if (players.length === 1 && arts) {
		throw new PlayerError(
			'The arts track needs 2 or more players: there is no Automa with it (R59).'
		);
	}
	const count = players.length;
	// R116: setup deals every player 2 civilizations. No table has too few today (the variant "All civilizations from
	// Plans & Ploys" has 10, enough for 5 players); the check stays for a deck that ever does.
	const deck = civsFor(expansions, variants).length;
	if (deck < 2 * count) {
		const variant = VARIANTS.find((v) => v.id === 'civs-from-pp');
		throw new PlayerError(
			`The variant "${variant?.name}" seats at most ${Math.floor(deck / 2)} players: its ${deck} civilizations deal 2 each.`
		);
	}
	const map = count >= 4 ? 'large' : 'small';
	const side = MAPS[map];

	/** @type {Record<string, import('./state.js').Hex>} */
	const hexes = Object.fromEntries(
		side.hexes.map((key) => {
			const printed = side.printed[key];
			return [
				key,
				{
					tile: printed ? printed.tile : null,
					orient: printed ? printed.orient : 0,
					outposts: [],
					tokens: [],
				},
			];
		})
	);
	const tech = shuffle(techDeck(variants), random);
	const tracks = arts ? [...TRACK_IDS, ARTS_TRACK] : TRACK_IDS;
	const seats = players.map((p, i) => newSeat(i + 1, p.name, tracks));

	/** @type {import('./state.js').State} */
	const state = {
		version,
		expansions: [...expansions],
		variants: [...variants],
		confirmEnd,
		map,
		phase: 'setup',
		first: 1,
		current: null,
		turn: 0,
		turnKind: null,
		seats,
		supply: {
			tech: {
				deck: tech.slice(3),
				faceUp: tech.slice(0, 3),
				discard: [],
			},
			tapestry: {
				deck: shuffle(tapestryFor(expansions), random),
				discard: [],
			},
			territory: shuffle(
				TERRITORY_TILES.map((t) => t.id),
				random
			),
			territoryDiscard: [],
			space: shuffle(
				spaceTilesFor(expansions).map((t) => t.id),
				random
			),
			spaceDiscard: [],
			// Shuffled only with an expansion that has landmark cards, P&P's or A&A's, so a base game draws as it always
			// did (#32, #35).
			landmarkCards:
				landmarkCardsFor(expansions).length > 0
					? shuffle(
							landmarkCardsFor(expansions).map((c) => c.id),
							random
						)
					: [],
			civs: [],
			civDiscard: [],
			capitals: [],
			// Last, and only with the arts track, so a game without it draws as it always did (#35).
			...(arts && { masterpieces: masterpieceSupply(random) }),
		},
		hexes,
		landmarks: landmarksFor(expansions, variants).map((l) => l.id),
		achievements: Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, []])),
		activated: [],
		usedThisTurn: [],
		lockedTech: [],
		takenTiers: [],
		blocks: [],
		result: null,
		pending: [],
		nextId: 1,
		seq: 0,
		events: [],
	};
	emit(state, {
		type: 'gameCreated',
		version,
		expansions: state.expansions,
		variants: state.variants,
		map,
		seats: seats.map((s) => ({ seat: s.seat, name: s.name })),
	});

	/** @type {SetupContext} */
	const setup = {
		state,
		seats,
		random,
		lanes: seats.map((s) => ({ player: s.seat, ops: [] })),
		starts: [],
	};
	for (const step of SETUP_STEPS) {
		step(setup);
	}

	push(state, state.pending, [
		{
			player: null,
			kind: 'setupSteps',
			steps: afterSetupSteps(expansions),
		},
	]);
	pushGroup(state, setup.lanes);
	run(state, random);
	return state;
}
