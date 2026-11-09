// The table log's words (#29): every event type the engine can emit is worded or deliberately silent, and secrets stay with their owner.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SILENT, eventText, foldTurns, logEntries } from '../src/lib/log.js';
import {
	civilizationName,
	landmarkName,
	tapestryName,
} from '../src/lib/game-names.js';
import { view } from '../src/lib/engine/game.js';
import { SHARED_SECRETS } from '../src/lib/engine/view.js';
import { CAPITAL_MATS } from '../src/lib/engine/data/capitals.js';
import { simulate } from './helpers/simulation.mjs';

/** The engine's source folder, scanned for the event types it can emit. */
const ENGINE = fileURLToPath(new URL('../src/lib/engine/', import.meta.url));

/** What a log line must never show. */
const BAD_WORDS = ['undefined', 'null', 'NaN', '[object'];

/** A two-seat game, as a view names its seats. */
const GAME = { seats: [{ name: 'Ana' }, { name: 'Bo' }] };

/**
 * One real-shaped event of every type the engine emits, without its `type` and `seq`: the worded ones and the silent.
 * @type {Record<string, Record<string, any>>}
 */
const SAMPLES = {
	achievementClaimed: { player: 1, achievement: 'middle-island', vp: 10 },
	alchemistsBust: { player: 1 },
	alchemistsRolled: {
		player: 1,
		track: 'technology',
		marked: ['technology'],
	},
	benefitCopied: { player: 2, track: 'science', space: 1, from: 1 },
	bonusPaid: { player: 1, track: 'science', space: 2 },
	buildingGained: { player: 1, building: 'house' },
	buildingPlaced: {
		player: 1,
		building: 'house',
		row: 3,
		col: 4,
		automatic: false,
	},
	buildingsSwapped: { player: 1, a: 12, b: 20 },
	capitalChosen: { player: 1, secret: { capital: 4 } },
	capitalDealt: { player: 1, options: [2, 4] },
	capitalScored: { player: 1, rows: 1, columns: 2, uniform: 1 },
	cardsDiscarded: { player: 2, deck: 'tapestry', cards: ['trade-economy'] },
	landmarkCardsDrawn: {
		player: 2,
		count: 3,
		secret: { landmarkCards: ['skyscraper', 'tv-station', 'urban-farm'] },
	},
	landmarkCardKept: { player: 2, card: 'skyscraper', auto: false },
	landmarkCardGoalMet: { player: 1, card: 'skyscraper' },
	cardsDrawn: { player: 1, count: 1, secret: { cards: ['militarism'] } },
	cardsRevealed: {
		player: 1,
		cards: ['monarchy', 'trap-2'],
		found: 'renaissance',
	},
	civAbilityUsed: { player: 1, civ: 'historians' },
	civChosen: { player: 1, secret: { civ: 'historians' } },
	civDiscarded: { player: 1, civ: 'mystics' },
	civGained: { player: 1, civ: 'nomads' },
	civsDealt: { player: 1, secret: { civs: ['merrymakers', 'the-chosen'] } },
	civsDrawn: {
		player: 1,
		count: 2,
		secret: { civs: ['leaders', 'traders'] },
	},
	conquerDiceRolled: { player: 1, red: 4, black: 5 },
	conquered: { player: 1, hex: '-2_-2', trapped: false },
	cubePlaced: { player: 2, plot: 69 },
	deckShuffled: { deck: 'civs', count: 15 },
	districtsCleared: { player: 1, districts: [8] },
	districtsCompleted: { player: 1, districts: [5, 6] },
	lilyPadsCounted: { player: 1, pads: 4, vp: 8 },
	entertainersMoved: { player: 2, space: 'c1r2' },
	eraEnded: { player: 1, card: 'militarism', ability: 'militarism' },
	eraStarted: { player: 1, card: 'espionage', ability: 'monarchy' },
	explored: { player: 1, hex: '1_3', tile: 26, orient: 5, vp: 1 },
	firstBonus: { player: 1, era: 2 },
	firstPlayerChosen: { player: 2 },
	gameCreated: {
		version: 'original',
		expansions: [],
		variants: [],
		map: 'small',
		seats: [
			{ seat: 1, name: 'Ana' },
			{ seat: 2, name: 'Bo' },
		],
	},
	gameEnded: {
		result: {
			ranking: [
				{ seat: 2, place: 1, vp: 87 },
				{ seat: 1, place: 2, vp: 80 },
			],
			ties: [],
		},
	},
	handSeen: {
		player: 1,
		from: 2,
		secret: { cards: ['academia', 'trap-2'] },
	},
	heraldsCopied: { player: 2, owner: 1, card: 'espionage' },
	historiansGave: { player: 1, to: 2, square: 1 },
	incomeTurnStarted: { player: 1, turn: 1 },
	inventorsMarked: { player: 2, owner: 1, card: 'transistors' },
	inventorsTook: { player: 2, from: 1, card: 'transistors' },
	landmarkGained: {
		player: 2,
		landmark: 'rubber-works',
		track: 'technology',
	},
	landmarkPlaced: {
		player: 2,
		landmark: 'rubber-works',
		row: -2,
		col: 0,
		rotation: 2,
		automatic: false,
	},
	merrymakersMoved: { player: 2, column: 0, level: 1 },
	militantsCovered: { player: 1, row: 'top', space: 3 },
	militantsUncovered: { player: 1, row: 'bottom', space: 0 },
	noBuildingLeft: { player: 2, building: 'armory' },
	noCivLeft: { player: 1 },
	noColonialism: { player: 1 },
	noStatusQuo: { player: 1 },
	freeBonus: { player: 1, track: 'military', space: 8 },
	noConquer: { player: 1 },
	noCopy: { player: 2 },
	noExplore: { player: 1 },
	noInvent: { player: 1 },
	noMasterpiece: { player: 1 },
	masterpieceCreated: { player: 1, card: 'art-deco', from: 'deck' },
	masterpiecesRefreshed: {
		player: 1,
		discarded: ['ballet', 'fresco', 'mime'],
		faceUp: ['painting', 'theater', 'topiary'],
	},
	masterpieceDeckShuffled: { count: 9 },
	masterpieceFired: { player: 1, card: 'fresco', owner: 2 },
	masterpieceFlipped: { player: 1, card: 'mime' },
	noBroadcast: { player: 1 },
	inspired: { player: 1, row: 'armory' },
	noInspire: { player: 1 },
	noLandmarkLeft: { player: 2, landmark: 'library' },
	noMove: { player: 2 },
	noOutpost: { player: 1 },
	noSpaceTile: { player: 1 },
	noTapestryOnTop: { player: 2 },
	noTechBenefit: { player: 2 },
	noTrade: { player: 2 },
	noUpgrade: { player: 1 },
	oncePerTurnUsed: { player: 1, card: 'lithium-ion-battery' },
	outpostPlaced: { player: 1, hex: '-2_-2' },
	outpostRaised: { player: 2, hex: '1_2' },
	outpostToppled: { player: 2, hex: '-1_-2', by: 1 },
	outpostsPlaced: { player: 1, hex: '0_2', count: 2 },
	partnerChosen: { player: 2, opponent: 1, track: 'science' },
	piecePlacedOnMap: { player: 1, hex: '1_2', piece: { building: 'farm' } },
	placedBesideMat: { player: 1, landmark: 'lighthouse' },
	buildingMoved: {
		player: 1,
		building: 'farm',
		from: { row: 0, col: 0 },
		to: { row: 0, col: 3 },
	},
	playerFinished: { player: 1 },
	prophecyMade: { player: 2, category: 'techCards', value: 1 },
	prophecyReached: { player: 1, category: 'territories' },
	resourcesConverted: {
		player: 2,
		resources: { worker: 1, coin: 1 },
		vp: 4,
	},
	resourcesGained: { player: 1, gained: { coin: 1 }, lost: {} },
	resourcesLost: { player: 1, lost: { culture: 1 } },
	resourcesPaid: { player: 1, paid: { food: 1 } },
	responseDeclined: { player: 2, hex: '-1_-2' },
	responsePlayed: { player: 2, hex: '1_2', card: 'trap-7', attacker: 1 },
	retreated: { player: 2, hex: '1_2', to: '0_2' },
	counterPlayed: { player: 1, card: 'double-cross', defender: 2, hex: '1_2' },
	counterDeclined: { player: 1, hex: '1_2' },
	tapestryStolen: { player: 1, from: 2, secret: { cards: ['academia'] } },
	tapestryGiven: { player: 1, to: 2, secret: { cards: ['academia'] } },
	surprisePartyThrown: { player: 2, attacker: 1, hex: '1_2' },
	surrenderRolled: { player: 2, red: 0, black: 3 },
	scienceDieRolled: { player: 1, track: 'technology' },
	setupDone: {},
	setupRevealed: {
		picks: [
			{ seat: 1, capital: 4, civ: 'historians' },
			{ seat: 2, capital: 1, civ: 'the-chosen' },
		],
	},
	landmarkDiscarded: { player: 1, landmark: 'villa', card: 'calculus' },
	landmarkPlacedOnTech: {
		player: 1,
		landmark: 'barracks',
		card: 'astrolabe',
	},
	plagueDrawn: { player: 1, civ: 'the-chosen' },
	relentlessToken: { player: 1, tokens: 2 },
	renegadesMoved: { player: 1, at: 2 },
	itemCollected: { player: 1, item: 'tech' },
	landmarkStored: { player: 1, landmark: 'forge' },
	landmarkUnstored: { player: 1, landmark: 'forge' },
	gamblersRevealed: { player: 1, cards: ['feudalism', 'academia'] },
	relentlessCashed: { player: 1, tokens: 3 },
	spymasterPlayed: { player: 2, mover: 1, track: 'science' },
	spymasterDeclined: { player: 2 },
	piecePlacedOnCard: {
		player: 1,
		card: 'commercial-center',
		building: 'farm',
		row: 0,
		col: 1,
	},
	parksDieRolled: { player: 1, die: 'red', face: 2 },
	cardPiecesMoved: {
		player: 1,
		card: 'commercial-center',
		pieces: ['farm', 'barracks'],
	},
	spaceActivated: { player: 1, track: 'exploration', space: 1 },
	spaceExplored: { player: 1, tile: 7 },
	spiesUsed: {
		player: 1,
		option: 4,
		from: 2,
		card: 'clocks',
		icon: 'circle',
	},
	tapestryPlayed: { player: 1, era: 2, card: 'militarism', faceDown: false },
	techBenefitUsed: { player: 1, card: 'the-nail', icon: 'square' },
	techDeckShuffled: { count: 12 },
	techDrawn: {
		player: 1,
		count: 3,
		secret: { cards: ['bakery', 'barn', 'compass'] },
	},
	techRecycled: { player: 1, card: 'com-tower' },
	techDisplayRefreshed: {
		discarded: ['irrigation', 'telescope', 'compass'],
		faceUp: ['vaccines', 'anesthesia', 'paper'],
	},
	techInvented: { player: 1, card: 'transistors', from: 'display' },
	techUpgraded: {
		player: 1,
		card: 'transistors',
		from: 'bottom',
		to: 'middle',
	},
	tileBenefit: { player: 1, hex: '1_2', tile: null },
	tileGiven: { player: 1, to: 2, tile: 19 },
	tilesDiscarded: { player: 1, stack: 'territory', tiles: [26] },
	tilesGained: { player: 1, stack: 'territory', tiles: [26] },
	timedOut: { player: 2 },
	tinkerersUsed: { player: 1, option: 2 },
	tokenMoved: { player: 1, track: 'exploration', from: 0, to: 1 },
	tokenPlaced: { player: 2, civ: 'traders', hex: '0_2' },
	treasureRolled: { player: 1, die: 'black', faces: [0, 4] },
	tokenRestarted: { player: 1, from: 'technology', to: 'military' },
	trackBlocked: { player: 1, track: 'technology' },
	trackUnblocked: { player: 1, track: 'technology' },
	tradeMade: { player: 1, offer: 0, host: 2 },
	turnChosen: { player: 1, turn: 'income' },
	turnStarted: { player: 1 },
	undone: { player: 1, from: 40 },
	utilitariansToken: { player: 1, landmark: 'academy', from: 'forge' },
	vpGained: { player: 1, vp: 3, total: 20 },
	vpPaid: { player: 2, vp: 15, total: 0 },
};

/**
 * Every event type the engine's source can emit, read from its `type: '…'` literals, with the table layer's two.
 * @returns {Set<string>}
 */
function engineEventTypes() {
	const types = new Set(['timedOut', 'undone']);
	for (const file of readdirSync(ENGINE, { recursive: true })) {
		const path = String(file);
		if (!path.endsWith('.js')) {
			continue;
		}
		const source = readFileSync(join(ENGINE, path), 'utf8');
		for (const [, type] of source.matchAll(/type: '([a-zA-Z]+)'/g)) {
			types.add(type);
		}
	}
	return types;
}

/**
 * An event of a sampled type, numbered.
 * @param {string} type
 * @param {Record<string, any>} [fields] - Replace the sample's
 * @returns {Record<string, any>}
 */
function sample(type, fields = {}) {
	return { type, ...structuredClone(SAMPLES[type]), ...fields, seq: 7 };
}

/**
 * Checks that a log line is a sentence a player can read.
 * @param {unknown} text
 * @param {string} what - Named in the failure
 */
function assertSentence(text, what) {
	assert.equal(typeof text, 'string', `${what} is not a string`);
	const words = /** @type {string} */ (text);
	for (const bad of BAD_WORDS) {
		assert.ok(!words.includes(bad), `${what} reads "${words}"`);
	}
	assert.match(words, /^[A-Z]/, `${what} starts in lower case: "${words}"`);
	assert.ok(words.endsWith('.'), `${what} has no full stop: "${words}"`);
	assert.ok(!words.includes('  '), `${what} has a double space: "${words}"`);
}

/**
 * The names and ids an event's secret holds, which another seat's line must not show.
 * @param {Record<string, any>} secret
 * @returns {string[]}
 */
function secretWords(secret) {
	/** @type {string[]} */
	const words = [];
	for (const [key, value] of Object.entries(secret)) {
		const values = Array.isArray(value) ? value : [value];
		for (const item of values) {
			if (key === 'capital') {
				const mat = CAPITAL_MATS.find((m) => m.number === item);
				words.push(/** @type {string} */ (mat?.name));
			} else if (key === 'cards') {
				words.push(item, tapestryName(item));
			} else if (key === 'landmarkCards') {
				words.push(item, landmarkName(item));
			} else if (key === 'civ' || key === 'civs') {
				words.push(item, civilizationName(item));
			} else {
				assert.fail(`no words known for the secret field ${key}`);
			}
		}
	}
	return words;
}

test('every event type the engine can emit is worded, or deliberately silent', () => {
	const types = engineEventTypes();
	assert.ok(types.size > 90, `only ${types.size} event types found`);
	for (const type of types) {
		assert.ok(
			Object.hasOwn(SAMPLES, type),
			`${type} has no sample here: add one, then word it in log.js or list it in SILENT`
		);
		const text = eventText(sample(type), GAME);
		if (SILENT.has(type)) {
			assert.equal(text, null, `${type} is silent but reads "${text}"`);
		} else {
			assertSentence(text, type);
		}
	}
	for (const type of SILENT) {
		assert.ok(types.has(type), `${type} is in SILENT but no event has it`);
	}
	for (const type of Object.keys(SAMPLES)) {
		assert.ok(types.has(type), `${type} is sampled but no event has it`);
	}
});

test('an unknown or malformed event gets no words, and never a crash', () => {
	assert.equal(eventText({ type: 'somethingNew', player: 1 }, GAME), null);
	assert.equal(eventText(null, GAME), null);
	assert.equal(eventText(/** @type {any} */ ({ player: 1 }), GAME), null);
	const odd = [undefined, null, 'x', -1, 1.5, 99, [], {}, [null]];
	for (const type of Object.keys(SAMPLES)) {
		const bare = eventText({ type }, undefined);
		if (bare !== null) {
			assertSentence(bare, `a bare ${type}`);
		}
		for (const field of Object.keys(SAMPLES[type])) {
			for (const value of odd) {
				const text = eventText(sample(type, { [field]: value }), GAME);
				if (text !== null) {
					assertSentence(
						text,
						`${type} with ${field} ${JSON.stringify(value)}`
					);
				}
			}
		}
	}
});

test('every event of random games reads well in every seat’s view, and a secret only in its owner’s', () => {
	// 1 to 5 players, both versions, both policies, with and without the variants.
	const games = [0, 1, 2, 3, 4, 7, 13, 21, 22, 23, 24, 36];
	/** @type {Set<string>} */
	const worded = new Set();
	for (const index of games) {
		let last = 0;
		simulate(index, {
			check(state) {
				const fresh = state.events.filter((e) => e.seq > last);
				if (fresh.length === 0) {
					return;
				}
				last = fresh[fresh.length - 1].seq;
				const seats = [null, ...state.seats.map((s) => s.seat)];
				for (const seat of seats) {
					const seen = view(state, seat);
					for (const event of seen.events.filter(
						(e) => e.seq >= fresh[0].seq
					)) {
						const text = eventText(event, seen);
						const what = `game ${index}, ${event.type} #${event.seq} for seat ${seat}`;
						if (text === null) {
							continue;
						}
						assertSentence(text, what);
						worded.add(event.type);
						const full = fresh.find((e) => e.seq === event.seq);
						// A shared secret also belongs to the seat its event names (#33).
						const sharer =
							full && Object.hasOwn(SHARED_SECRETS, full.type)
								? full[SHARED_SECRETS[full.type]]
								: undefined;
						if (
							full?.secret &&
							full.player !== seat &&
							sharer !== seat
						) {
							for (const secret of secretWords(full.secret)) {
								assert.ok(
									!text.includes(secret),
									`${what} shows the secret ${secret}: "${text}"`
								);
							}
						}
					}
				}
			},
		});
	}
	// The games reach the common events, so a type that never reads in them is a wording bug.
	for (const type of [
		'turnStarted',
		'incomeTurnStarted',
		'tokenMoved',
		'resourcesGained',
		'tapestryPlayed',
		'cardsDrawn',
		'civsDealt',
		'civChosen',
		'explored',
		'conquered',
		'techInvented',
		'techUpgraded',
		'vpGained',
		'playerFinished',
		'gameEnded',
	]) {
		assert.ok(worded.has(type), `${type} never read in the games`);
	}
});

test('an Arts & Architecture deal names the advanced mat beside the basic ones (#36)', () => {
	assert.equal(
		eventText(
			{ type: 'capitalDealt', player: 1, options: [2, 4], advanced: 10 },
			GAME
		),
		'Ana was dealt the Wetland and Desert capitals, and the advanced Cloud City, to choose from.'
	);
	assert.equal(
		eventText(
			{ type: 'capitalDealt', player: 2, options: [5], advanced: 7 },
			GAME
		),
		'Bo was dealt the Grassland capital, and the advanced Archipelago, to choose from.'
	);
});

test('a secret is named for its owner and kept from everyone else', () => {
	const drawn = sample('cardsDrawn');
	assert.equal(eventText(drawn, GAME), 'Ana drew Militarism.');
	const { secret, ...hidden } = drawn;
	assert.ok(secret);
	assert.equal(eventText(hidden, GAME), 'Ana drew a tapestry card.');
	assert.equal(
		eventText({ ...hidden, count: 2 }, GAME),
		'Ana drew 2 tapestry cards.'
	);
	assert.equal(
		eventText(sample('civsDealt'), GAME),
		'Ana was dealt the Merrymakers and The Chosen to choose from.'
	);
	assert.equal(
		eventText({ type: 'civsDealt', player: 1 }, GAME),
		'Ana was dealt civilizations to choose from.'
	);
	assert.equal(
		eventText(sample('civChosen'), GAME),
		'Ana chose the Historians.'
	);
	assert.equal(
		eventText({ type: 'civChosen', player: 1 }, GAME),
		'Ana chose a civilization.'
	);
	assert.equal(
		eventText(sample('capitalChosen'), GAME),
		'Ana chose the Desert capital.'
	);
	assert.equal(
		eventText({ type: 'capitalChosen', player: 1 }, GAME),
		'Ana chose a capital.'
	);
	assert.equal(
		eventText(sample('civsDrawn', { secret: undefined }), GAME),
		'Ana drew 2 civilizations.'
	);
	// The Recyclers' draw (#33).
	assert.equal(
		eventText(sample('techDrawn'), GAME),
		'Ana drew Bakery, Barn and Compass to keep one.'
	);
	assert.equal(
		eventText(sample('techDrawn', { secret: undefined }), GAME),
		'Ana drew 3 tech cards to keep one.'
	);
	assert.equal(
		eventText(
			sample('techDrawn', { count: 1, secret: { cards: ['barn'] } }),
			GAME
		),
		'Ana drew Barn.'
	);
	assert.equal(
		eventText(sample('techDrawn', { count: 1, secret: undefined }), GAME),
		'Ana drew a tech card.'
	);
	assert.equal(
		eventText(sample('techDrawn', { count: 0, secret: undefined }), GAME),
		'Ana found no tech card left to draw.'
	);
	// The Spies' look at a neighbour's hand (#33).
	assert.equal(
		eventText(sample('handSeen'), GAME),
		"Ana looked at Bo's hand: Academia and a trap."
	);
	assert.equal(
		eventText(sample('handSeen', { secret: undefined }), GAME),
		"Ana looked at Bo's hand."
	);
	// The Advisors' gift, whose card both they and the neighbour see (#33).
	assert.equal(
		eventText(sample('tapestryGiven'), GAME),
		'Ana gave Academia to Bo.'
	);
	assert.equal(
		eventText(sample('tapestryGiven', { secret: undefined }), GAME),
		'Ana gave Bo a tapestry card.'
	);
});

test('the important events read as plain sentences', () => {
	/** @type {[Record<string, any>, string | null][]} */
	const cases = [
		[sample('turnStarted'), "Ana's turn."],
		[sample('incomeTurnStarted', { turn: 2 }), 'Ana began income turn 2.'],
		[
			sample('tokenMoved', { from: 4, to: 5 }),
			'Ana advanced to Ships on Exploration.',
		],
		[
			sample('tokenMoved', { track: 'science', from: 3, to: 2 }),
			'Ana went back to Mathematics on Science.',
		],
		[
			sample('explored', { vp: 2 }),
			'Ana explored hex 1,3, matching 2 sides.',
		],
		[sample('explored', { vp: 0 }), 'Ana explored hex 1,3.'],
		[sample('spaceExplored'), 'Ana explored space tile 7.'],
		// The Aliens' mat (#33).
		[
			sample('spaceExplored', { civ: 'aliens' }),
			'Ana explored space tile 7 onto their Aliens mat.',
		],
		[
			sample('tilesDiscarded', { stack: 'space', tiles: [16] }),
			'Ana discarded space tile 16.',
		],
		[
			sample('tilesDiscarded', {
				stack: 'space',
				tiles: [16],
				civ: 'aliens',
			}),
			'Ana discarded space tile 16 from their Aliens mat.',
		],
		[sample('conquered'), 'Ana conquered hex −2,−2.'],
		[
			sample('conquered', { trapped: true }),
			"Ana's conquest of hex −2,−2 failed.",
		],
		[
			sample('responsePlayed'),
			"Bo's trap stopped Ana's conquest of hex 1,2.",
		],
		[
			sample('outpostToppled'),
			"Bo's outpost on hex −1,−2 was toppled by Ana.",
		],
		[
			sample('conquerDiceRolled'),
			"Ana rolled the conquer dice: red 1 VP for each territory, black the territory's benefit.",
		],
		[
			sample('landmarkGained', { player: 1, landmark: 'lighthouse' }),
			'Ana gained the Lighthouse.',
		],
		[
			sample('buildingPlaced', { building: 'farm' }),
			'Ana placed a Farm in their capital.',
		],
		[
			sample('buildingPlaced', { building: 'armory', craftsmen: 1 }),
			'Ana placed an Armory in Craftsmen column 2.',
		],
		[
			sample('achievementClaimed', { achievement: 'complete-track' }),
			'Ana claimed the achievement Complete a track.',
		],
		[sample('vpGained'), 'Ana scored 3 VP.'],
		[
			sample('vpGained', { source: 'tapestry' }),
			'Ana scored 3 VP from a tapestry card.',
		],
		[
			sample('vpGained', { source: 'income' }),
			'Ana scored 3 VP in their income turn.',
		],
		[sample('vpGained', { source: 'other' }), 'Ana scored 3 VP.'],
		[sample('vpGained', { vp: 0 }), null],
		[
			sample('vpGained', { vp: -4, source: 'civ' }),
			'Ana lost 4 VP from their civilization.',
		],
		[
			sample('districtsCleared'),
			'Ana covered the last impassable plot of a district in their capital.',
		],
		[
			sample('districtsCleared', { districts: [1, 2] }),
			'Ana covered the last impassable plots of 2 districts in their capital.',
		],
		[sample('districtsCleared', { districts: [] }), null],
		[
			sample('resourcesPaid', { paid: { coin: 1, food: 1 } }),
			'Ana paid 1 coin and 1 food.',
		],
		[
			sample('resourcesGained', { gained: { culture: 2 } }),
			'Ana gained 2 culture.',
		],
		[
			sample('resourcesGained', {
				gained: { coin: 1 },
				lost: { food: 2 },
			}),
			'Ana gained 1 coin; 2 food went over the limit of 8.',
		],
		[sample('resourcesGained', { gained: {} }), null],
		[
			sample('tapestryPlayed', { card: 'monarchy' }),
			'Ana played Monarchy.',
		],
		[
			sample('tapestryPlayed', { card: null, faceDown: true }),
			'Ana played a tapestry card face down.',
		],
		[
			sample('tapestryPlayed', { card: 'trap-4' }),
			'Ana played a trap as a tapestry card.',
		],
		[sample('techInvented', { card: 'clocks' }), 'Ana invented Clocks.'],
		[
			sample('techInvented', { card: 'clocks', from: 'discard' }),
			'Ana invented Clocks from the discard pile.',
		],
		[
			sample('techRecycled'),
			'Ana recycled Com Tower back to the bottom row.',
		],
		// The Treasure Hunters' treasures (#33).
		[
			sample('treasureRolled'),
			"Ana's Treasure Hunters rolled the black conquer die twice: 1 coin and the territory's benefit.",
		],
		[
			sample('treasureRolled', { die: 'red', faces: [1, 4] }),
			"Ana's Treasure Hunters rolled the red conquer die twice: 5 VP and 1 VP for each territory.",
		],
		[
			sample('treasureRolled', { die: 'science', faces: [0, 3] }),
			"Ana's Treasure Hunters rolled the science die twice: Exploration and Military.",
		],
		// With the arts track the science die is the d20 (#35).
		[
			sample('treasureRolled', {
				die: 'science',
				faces: [4, 0],
				scienceDie: 'd20',
			}),
			"Ana's Treasure Hunters rolled the science die twice: Arts and Exploration.",
		],
		[
			sample('treasureRolled', { die: 'conquer', faces: [1, 2] }),
			"Ana's Treasure Hunters rolled the conquer dice: red 5 VP, black 1 food.",
		],
		[
			sample('tokenPlaced', { player: 1, civ: 'treasure-hunters' }),
			'Ana placed a Treasure Hunters token on hex 0,2.',
		],
		// The Infiltrators' shared territory and their token on a capital-city territory (#33).
		[
			sample('outpostPlaced', { hex: '-1_-1', sharedWith: 2 }),
			"Ana placed an outpost on hex −1,−1 beside Bo's, sharing the territory.",
		],
		[
			sample('tokenPlaced', {
				player: 1,
				civ: 'infiltrators',
				capital: 2,
			}),
			"Ana placed an Infiltrators token on Bo's capital-city territory, hex 0,2.",
		],
		// The Tinkerers' options (#33).
		[
			sample('tinkerersUsed'),
			'Ana put a Tinkerers token on option 2, Catch up.',
		],
		[
			sample('tinkerersUsed', { option: 4 }),
			'Ana put a Tinkerers token on option 4, Jump ahead.',
		],
		// The Spies' options, each naming what it took from whom (#33).
		[
			sample('spiesUsed', {
				option: 1,
				card: 'double-cross',
				icon: undefined,
			}),
			"Ana put a Spies token on option 1 and copied Double Cross from Bo's income mat.",
		],
		[
			sample('spiesUsed', { option: 1, card: 'trap-1', icon: undefined }),
			"Ana put a Spies token on option 1 and copied a trap from Bo's income mat.",
		],
		[
			sample('spiesUsed', {
				option: 2,
				card: undefined,
				icon: undefined,
				stack: 'space',
				tile: 16,
			}),
			"Ana put a Spies token on option 2 and took the benefit of space tile 16 in Bo's supply.",
		],
		[
			sample('spiesUsed', {
				option: 2,
				card: undefined,
				icon: undefined,
				stack: 'territory',
				tile: 1,
			}),
			"Ana put a Spies token on option 2 and took the benefit of territory tile 1 in Bo's supply.",
		],
		[
			sample('spiesUsed', {
				option: 3,
				card: undefined,
				icon: undefined,
				track: 'science',
				space: 5,
			}),
			"Ana put a Spies token on option 3 and took the benefit of Bo's space, Chemistry on Science.",
		],
		[
			sample('spiesUsed'),
			"Ana put a Spies token on option 4 and took the circle benefit of Bo's Clocks.",
		],
		[
			sample('spiesUsed', { card: 'calendar', icon: 'square' }),
			"Ana put a Spies token on option 4 and took the square benefit of Bo's Calendar.",
		],
		[
			sample('spiesUsed', { option: 7 }),
			'Ana put a Spies token on an option.',
		],
		// The Utilitarians' tokens, put out from their mat or moved (#33).
		[
			sample('utilitariansToken', { from: undefined }),
			'Ana put a Utilitarians token beside the Academy.',
		],
		[
			sample('utilitariansToken'),
			'Ana moved a Utilitarians token from the Forge to the Academy.',
		],
		[
			sample('landmarkGained', {
				player: 1,
				landmark: 'barracks',
				civ: 'utilitarians',
			}),
			'Ana gained the Barracks.',
		],
		[
			sample('techUpgraded', { card: 'clocks' }),
			'Ana upgraded Clocks to the middle row.',
		],
		[
			sample('techBenefitUsed'),
			'Ana took the square benefit of The Nail, which stays in the top row.',
		],
		[
			sample('techBenefitUsed', { card: 'ammonia', icon: 'circle' }),
			'Ana took the circle benefit of Ammonia, which stays in the middle row.',
		],
		[
			sample('eraStarted'),
			"Ana's copy of Monarchy took effect for this era.",
		],
		[sample('eraEnded'), "Ana's Militarism ended."],
		[
			sample('capitalScored'),
			'Ana scored their capital: 1 complete row, 2 complete columns and 1 line of a single building type.',
		],
		[sample('capitalScored', { rows: 0, columns: 0, uniform: 0 }), null],
		[
			sample('setupRevealed'),
			'The picks were revealed: Ana has the Historians and the Desert capital; Bo has The Chosen and the Mountain capital.',
		],
		[
			sample('cardsRevealed'),
			'Ana revealed and discarded Monarchy and a trap, then kept Renaissance.',
		],
		[sample('tradeMade'), "Ana took up Bo's offer."],
		[
			sample('timedOut', { player: 1 }),
			"Ana's clock ran out; the rest of the turn was played for them.",
		],
		[sample('undone'), 'Ana took back a choice.'],
		[sample('gameEnded'), 'The game is over: Bo won with 87 VP.'],
		[
			sample('gameEnded', {
				result: {
					ranking: [
						{ seat: 1, place: 1, vp: 87 },
						{ seat: 2, place: 1, vp: 87 },
					],
					ties: [],
				},
			}),
			'The game is over: Ana and Bo share the win with 87 VP.',
		],
		[
			sample('gameCreated'),
			'A new game began for Ana and Bo under the Original 2019 rules.',
		],
		[
			sample('gameCreated', {
				version: 'current',
				variants: ['tapestry-draft', 'closest-island'],
			}),
			'A new game began for Ana and Bo under the Current rules, with the variants Tapestry draft and Closest island.',
		],
		[sample('spaceActivated'), null],
	];
	for (const [event, expected] of cases) {
		assert.equal(eventText(event, GAME), expected, event.type);
	}
});

test('the log keeps the events’ order, marks turns, income turns and notices, and colours only seats', () => {
	const events = [
		{ type: 'gameCreated', ...SAMPLES.gameCreated, seq: 1 },
		{ type: 'setupDone', seq: 2 },
		{ type: 'turnStarted', player: 1, seq: 3 },
		{ type: 'turnChosen', player: 1, turn: 'income', seq: 4 },
		{ type: 'incomeTurnStarted', player: 1, turn: 1, seq: 5 },
		{
			type: 'resourcesGained',
			player: 1,
			gained: { coin: 2 },
			lost: {},
			seq: 6,
		},
		{ type: 'timedOut', player: 2, seq: 7 },
		{ type: 'undone', player: 1, from: 6, seq: 8 },
		{ type: 'playerFinished', player: 1, seq: 9 },
		{ type: 'gameEnded', ...SAMPLES.gameEnded, seq: 10 },
	];
	assert.deepEqual(logEntries(events, GAME), [
		{
			seq: 1,
			player: null,
			kind: 'line',
			text: 'A new game began for Ana and Bo under the Original 2019 rules.',
		},
		{ seq: 3, player: 1, kind: 'turn', text: "Ana's turn." },
		{ seq: 5, player: 1, kind: 'income', text: 'Ana began income turn 1.' },
		{ seq: 6, player: 1, kind: 'line', text: 'Ana gained 2 coins.' },
		{
			seq: 7,
			player: 2,
			kind: 'notice',
			text: "Bo's clock ran out; the rest of the turn was played for them.",
		},
		{ seq: 8, player: 1, kind: 'notice', text: 'Ana took back a choice.' },
		{
			seq: 9,
			player: 1,
			kind: 'notice',
			text: 'Ana has finished playing.',
		},
		{
			seq: 10,
			player: null,
			kind: 'notice',
			text: 'The game is over: Bo won with 87 VP.',
		},
	]);
	assert.deepEqual(logEntries([], GAME), []);
});

test('with Plans & Ploys a trap only says it was played, as the attacker may still cancel it (#33)', () => {
	const pp = { ...GAME, expansions: ['pp'] };
	assert.equal(
		eventText(sample('responsePlayed'), pp),
		"Bo played a trap against Ana's conquest of hex 1,2."
	);
	assert.equal(
		eventText(sample('responsePlayed'), GAME),
		"Bo's trap stopped Ana's conquest of hex 1,2."
	);
});

/**
 * A log line for the fold tests.
 * @param {number} seq
 * @param {'turn' | 'income' | 'line' | 'notice'} kind
 * @param {string} text
 * @returns {import('../src/lib/log.js').LogEntry}
 */
const entry = (seq, kind, text) => ({ seq, player: 1, kind, text });

test('the log folds every turn but the last two to its main event (#174)', () => {
	const entries = [
		entry(1, 'line', 'A new game began.'),
		entry(2, 'line', 'Ana was dealt two capitals.'),
		entry(3, 'turn', "Ana's turn."),
		entry(4, 'line', 'Ana paid 1 food.'),
		entry(5, 'line', 'Ana advanced to Rafts on Exploration.'),
		entry(6, 'line', 'Ana explored hex 1,0.'),
		entry(7, 'turn', "Bo's turn."),
		entry(8, 'income', 'Bo began income turn 2.'),
		entry(9, 'line', 'Bo gained 1 coin.'),
		entry(10, 'turn', "Ana's turn."),
		entry(11, 'line', 'Ana advanced to Wagons on Exploration.'),
	];
	const groups = foldTurns(entries);
	assert.deepEqual(
		groups.map((g) => [
			g.head?.seq ?? null,
			g.folded,
			g.lead?.seq ?? null,
			g.lines.length,
		]),
		[
			[null, true, 1, 2],
			[3, true, 5, 3],
			[7, false, 8, 2],
			[10, false, 11, 1],
		]
	);
});

test('a turn with one line, or none, stays open: there is nothing to fold (#174)', () => {
	const entries = [
		entry(1, 'turn', "Ana's turn."),
		entry(2, 'line', 'Ana advanced to Rafts on Exploration.'),
		entry(3, 'turn', "Bo's turn."),
		entry(4, 'turn', "Ana's turn."),
		entry(5, 'line', 'Ana gained 1 coin.'),
		entry(6, 'turn', "Bo's turn."),
	];
	assert.deepEqual(
		foldTurns(entries).map((g) => g.folded),
		[false, false, false, false]
	);
	assert.deepEqual(foldTurns([]), []);
});

test("a folded turn's main event falls back to its first line (#174)", () => {
	const entries = [
		entry(1, 'turn', "Ana's turn."),
		entry(2, 'line', 'Ana gained 1 coin.'),
		entry(3, 'line', 'Ana gained 1 food.'),
		entry(4, 'turn', "Bo's turn."),
		entry(5, 'turn', "Ana's turn."),
	];
	assert.equal(foldTurns(entries)[0].lead?.seq, 2);
});

test('a choice with every option a used-up building names them in the log (R117, #181)', () => {
	assert.equal(
		eventText(
			{
				type: 'noBuildingLeft',
				player: 1,
				building: null,
				buildings: ['farm', 'house', 'armory'],
			},
			GAME
		),
		'Ana had no Farm, House or Armory left to gain.'
	);
	assert.equal(
		eventText({ type: 'noBuildingLeft', player: 2, building: null }, GAME),
		'Bo had no income building left to gain.'
	);
});

test("the log names an income row as inspire's answer and the Income tab do (#183)", () => {
	assert.equal(
		eventText({ type: 'inspired', player: 1, row: 'market' }, GAME),
		'Ana placed an inspiration tile on the Markets row.'
	);
});

test('a landmark placed on an A&A tech card, and one discarded with its card (#37)', () => {
	assert.equal(
		eventText(
			{
				type: 'landmarkPlacedOnTech',
				player: 1,
				landmark: 'barracks',
				card: 'astrolabe',
			},
			GAME
		),
		'Ana placed the Barracks on Astrolabe.'
	);
	assert.equal(
		eventText(
			{
				type: 'landmarkDiscarded',
				player: 1,
				landmark: 'villa',
				card: 'calculus',
			},
			GAME
		),
		'Ana discarded the Villa with Calculus.'
	);
});

test("Plague's draw and Migration's outposts (#37)", () => {
	assert.equal(
		eventText({ type: 'plagueDrawn', player: 1, civ: 'the-chosen' }, GAME),
		'Ana drew The Chosen with Plague.'
	);
	assert.equal(
		eventText(
			{ type: 'outpostPlaced', player: 1, hex: '0_3', card: 'migration' },
			GAME
		),
		'Ana placed an outpost on hex 0,3 with Migration.'
	);
});

test("pieces on A&A's tapestry cards, and National Parks' die (#37)", () => {
	const text = (/** @type {Record<string, any>} */ e) => eventText(e, GAME);
	assert.equal(
		text({
			type: 'piecePlacedOnCard',
			player: 1,
			card: 'commercial-center',
			building: 'farm',
			row: 0,
			col: 1,
		}),
		'Ana placed a Farm on Commercial Center.'
	);
	assert.equal(
		text({
			type: 'piecePlacedOnCard',
			player: 1,
			card: 'space-race',
			landmark: 'barracks',
		}),
		'Ana placed the Barracks on Space Race.'
	);
	assert.equal(
		text({ type: 'parksDieRolled', player: 1, die: 'red', face: 2 }),
		'Ana rolled the red conquer die for National Parks.'
	);
	assert.equal(
		text({
			type: 'cardPiecesMoved',
			player: 1,
			card: 'commercial-center',
			pieces: ['farm', 'barracks'],
		}),
		'Commercial Center was covered: Ana put its Farm and the Barracks beside their capital mat.'
	);
	assert.equal(
		text({
			type: 'piecePlacedOnMap',
			player: 1,
			hex: '0_3',
			piece: { building: 'farm' },
			parks: true,
		}),
		'Ana placed a Farm on hex 0,3 with National Parks.'
	);
});

test('a Spymaster played reads in the log; a decline says nothing (R127)', () => {
	assert.equal(
		eventText(
			{ type: 'spymasterPlayed', player: 2, mover: 1, track: 'arts' },
			GAME
		),
		'Bo played Spymaster: they advance on Arts at the end of the turn.'
	);
	assert.equal(
		eventText({ type: 'spymasterDeclined', player: 2 }, GAME),
		null
	);
});

test("the Relentless' tokens (#37)", () => {
	assert.equal(
		eventText({ type: 'relentlessToken', player: 1, tokens: 2 }, GAME),
		'Ana put a token on their Relentless mat: 2 there.'
	);
	assert.equal(
		eventText({ type: 'relentlessToken', player: 1, tokens: 1 }, GAME),
		'Ana put a token on their Relentless mat: 1 there.'
	);
	assert.equal(
		eventText({ type: 'relentlessCashed', player: 1, tokens: 3 }, GAME),
		'Ana took 3 tokens off their Relentless mat.'
	);
});

test("the Renegades' token (#37)", () => {
	assert.equal(
		eventText({ type: 'renegadesMoved', player: 1, at: 2 }, GAME),
		'Ana moved their Renegades token to space II.'
	);
});

test("the Gamblers' reveal (#37)", () => {
	assert.equal(
		eventText(
			{
				type: 'gamblersRevealed',
				player: 1,
				cards: ['feudalism', 'academia'],
			},
			GAME
		),
		'Ana revealed Feudalism and Academia for the Gamblers.'
	);
});

test("the Urban Planners' kept landmarks (#37)", () => {
	assert.equal(
		eventText(
			{ type: 'landmarkStored', player: 1, landmark: 'forge' },
			GAME
		),
		'Ana kept the Forge on their Urban Planners mat.'
	);
	assert.equal(
		eventText(
			{ type: 'landmarkUnstored', player: 1, landmark: 'forge' },
			GAME
		),
		'Ana took the Forge off their Urban Planners mat to place it.'
	);
});

test("the Collectors' items (#37)", () => {
	assert.equal(
		eventText({ type: 'itemCollected', player: 1, item: 'tech' }, GAME),
		'Ana put a tech card on their Collectors mat.'
	);
	assert.equal(
		eventText({ type: 'itemCollected', player: 1, item: 'house' }, GAME),
		'Ana put a House on their Collectors mat.'
	);
});
