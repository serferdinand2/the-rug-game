// createGame(): a new base game whose first decisions are the players' simultaneous setup picks.
import { PlayerError } from './errors.js';
import { emit } from './events.js';
import { shuffle } from './random.js';
import { push, pushGroup } from './stack.js';
import { run } from './loop.js';
import { AFTER_SETUP } from './after-setup.js';
import { BASE_CIVS, BASE_TAPESTRY, BASE_TECH } from './decks.js';
import { EXPANSIONS } from '../art/catalog.js';
import { MAPS } from './data/maps.js';
import { CAPITAL_MATS, SMALL_MAP_PAIRS } from './data/capitals.js';
import { LANDMARKS } from './data/landmarks.js';
import { ACHIEVEMENTS } from './data/achievements.js';
import { TERRITORY_TILES } from './data/territory-tiles.js';
import { SPACE_TILES } from './data/space-tiles.js';
import { VERSIONS, TRACK_IDS, RESOURCE_IDS, BUILDING_IDS } from './data/ids.js';

/**
 * Checks the options, throwing PlayerError for each problem in the spec's order.
 * @param {{ players: unknown, version: string, expansions: unknown }} options
 */
function validate({ players, version, expansions }) {
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
		throw new PlayerError(`${known.name} isn't available yet.`);
	}
}

/**
 * A seat at the start: empty, with its tokens on every track start (01 §2.2).
 * @param {number} seat
 * @param {string} name
 * @returns {import('./state.js').PlayerSeat}
 */
function newSeat(seat, name) {
	return {
		seat,
		kind: 'player',
		name,
		vp: 0,
		tracks: /** @type {any} */ (
			Object.fromEntries(TRACK_IDS.map((id) => [id, [0]]))
		),
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
		},
		capital: { mat: null },
		besideMat: [],
		hand: [],
		tech: { bottom: [], middle: [], top: [] },
		territoryTiles: [],
		spaceTiles: [],
		exploredSpace: [],
		civs: [],
		picks: {},
	};
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
 * Two outposts for each seat on its start hex.
 * @param {SetupContext} setup
 */
function placeOutposts({ state, starts }) {
	for (const { player, hex } of starts) {
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
	const civs = shuffle(BASE_CIVS, random);
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
	placeOutposts,
	dealCivs,
	chooseFirstPlayer,
];

/**
 * Starts a new base game for 1 to 5 players. The first decisions are every player's setup picks, open at once.
 * @param {Object} options
 * @param {{ name: string }[]} options.players - In seat order, which is clockwise and turn order
 * @param {import('./data/ids.js').VersionId} options.version
 * @param {string[]} [options.expansions] - None are built yet
 * @param {import('./random.js').Random} options.random
 * @returns {import('./state.js').State}
 * @throws {PlayerError} For a bad player count or name, version or expansion
 * @throws {TypeError} When `random` is not a function
 */
export function createGame({ players, version, expansions = [], random }) {
	validate({ players, version, expansions });
	if (typeof random !== 'function') {
		throw new TypeError('createGame needs a random function.');
	}
	const count = players.length;
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
				},
			];
		})
	);
	const tech = shuffle(BASE_TECH, random);
	const seats = players.map((p, i) => newSeat(i + 1, p.name));

	/** @type {import('./state.js').State} */
	const state = {
		version,
		expansions: [...expansions],
		map,
		phase: 'setup',
		first: 1,
		current: null,
		seats,
		supply: {
			tech: {
				deck: tech.slice(3),
				faceUp: tech.slice(0, 3),
				discard: [],
			},
			tapestry: { deck: shuffle(BASE_TAPESTRY, random), discard: [] },
			territory: shuffle(
				TERRITORY_TILES.map((t) => t.id),
				random
			),
			space: shuffle(
				SPACE_TILES.map((t) => t.id),
				random
			),
			civs: [],
			capitals: [],
		},
		hexes,
		landmarks: LANDMARKS.map((l) => l.id),
		achievements: Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, []])),
		pending: [],
		nextId: 1,
		seq: 0,
		events: [],
	};
	emit(state, {
		type: 'gameCreated',
		version,
		expansions: state.expansions,
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
		{ player: null, kind: 'setupSteps', steps: [...AFTER_SETUP] },
	]);
	pushGroup(state, setup.lanes);
	run(state, random);
	return state;
}
