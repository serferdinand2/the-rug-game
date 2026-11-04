// The sound cue for a batch of fresh events (#29 design §7) and what moves for them (§8).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CUES, cueFor, shareSounds, soundCue } from '../src/lib/sound.js';
import {
	countAt,
	highlights,
	msOf,
	prefersReducedMotion,
} from '../src/lib/motion.js';
import { TUMBLE_MS } from '../src/lib/dice.js';
import { DECISIONS, openDecisions, play } from '../src/lib/engine/game.js';
import { newGame } from './helpers/engine.mjs';

/** @param {string} type @param {Record<string, any>} [fields] */
const ev = (type, fields = {}) => ({ seq: 1, type, player: 1, ...fields });

test('one cue at most for a batch, the most important', () => {
	assert.equal(cueFor([], 1), null);
	assert.equal(cueFor([ev('resourcesGained')], 1), null);
	assert.equal(cueFor([ev('tokenMoved')], 1), 'move');
	assert.equal(cueFor([ev('tokenMoved'), ev('buildingPlaced')], 1), 'place');
	assert.equal(
		cueFor([ev('explored'), ev('turnStarted', { player: 1 })], 1),
		'turn'
	);
	assert.equal(
		cueFor([ev('turnStarted', { player: 1 }), ev('achievementClaimed')], 1),
		'reward'
	);
	assert.equal(cueFor([ev('landmarkGained'), ev('gameEnded')], 1), 'over');
});

test("another player's turn starting is no cue for you, but at a hot-seat table every turn is", () => {
	assert.equal(cueFor([ev('turnStarted', { player: 2 })], 1), null);
	assert.equal(cueFor([ev('turnStarted', { player: 2 })], null), 'turn');
});

test('every cue has a sound file', () => {
	const audio = fileURLToPath(new URL('../static/audio/', import.meta.url));
	const files = readdirSync(audio);
	for (const cue of /** @type {(keyof typeof CUES)[]} */ (
		Object.keys(CUES)
	)) {
		assert.match(CUES[cue], /^[a-z_0-9]+$/);
		assert.ok(files.includes(`${CUES[cue]}.ogg`), `${cue} has no file`);
	}
});

test('the map, the capital and the chips move for what just happened', () => {
	const moved = highlights(
		[
			ev('explored', { hex: '1_2' }),
			ev('conquered', { hex: '0_1', player: 2 }),
			ev('outpostPlaced', { hex: '0_1', player: 2 }),
			ev('buildingPlaced', { building: 'farm', row: 3, col: 4 }),
			ev('buildingPlaced', {
				building: 'farm',
				row: 5,
				col: 5,
				player: 2,
			}),
			ev('landmarkPlaced', {
				landmark: 'lighthouse',
				row: -1,
				col: 2,
				rotation: 1,
			}),
			ev('vpGained', { vp: 3 }),
			ev('vpGained', { vp: 0, player: 2 }),
			ev('vpGained', { vp: 2, player: 3 }),
		],
		1
	);
	assert.deepEqual(moved.hexes, ['1_2', '0_1']);
	assert.deepEqual(moved.plots, [{ row: 3, col: 4 }]);
	assert.deepEqual(moved.landmarks, ['lighthouse']);
	assert.deepEqual(moved.vp, [1, 3]);
});

test("a building that went somewhere other than a plot (the Craftsmen's columns) glows nowhere", () => {
	assert.deepEqual(
		highlights([ev('buildingPlaced', { building: 'farm' })], 1).plots,
		[]
	);
});

test('nothing moves for nothing', () => {
	assert.deepEqual(highlights([], 1), {
		hexes: [],
		plots: [],
		landmarks: [],
		vp: [],
	});
});

test('a roll earns the dice cue, after a reward and before a turn (#61)', () => {
	assert.equal(cueFor([ev('conquerDiceRolled')], 1), 'dice');
	// #33: Surrender's roll sounds as the conquer dice do.
	assert.equal(cueFor([ev('surrenderRolled')], 1), 'dice');
	// #33: so do the Treasure Hunters' treasures.
	assert.equal(cueFor([ev('treasureRolled')], 1), 'dice');
	assert.equal(cueFor([ev('scienceDieRolled'), ev('tokenMoved')], 2), 'dice');
	assert.equal(cueFor([ev('alchemistsBust')], 1), 'dice');
	assert.equal(
		cueFor([ev('conquerDiceRolled'), ev('turnStarted', { player: 1 })], 1),
		'dice'
	);
	assert.equal(
		cueFor([ev('conquerDiceRolled'), ev('achievementClaimed')], 1),
		'reward'
	);
	// A roll sounds like dice clattering on a table, not the drop the pieces make.
	assert.equal(CUES.dice, 'dice_roll');
});

test("the turn cue is not played for a seat's own automatic first turn (#77)", () => {
	let { state, random } = newGame(2);
	let before = state;
	while (state.phase === 'setup') {
		before = state;
		const decision = openDecisions(state)[0];
		const [first] = DECISIONS[decision.kind].answers(state, decision);
		state = play(
			state,
			/** @type {number} */ (decision.player),
			{ decision: decision.id, ...first },
			random
		);
	}
	// The move that ends setup runs both seats' income turn 1 and starts the first player's next turn.
	const events = state.events.filter((e) => e.seq > before.seq);
	const first = /** @type {number} */ (state.first);
	const second = first === 1 ? 2 : 1;
	assert.equal(cueFor(events, first), 'turn');
	assert.notEqual(cueFor(events, second), 'turn');
	assert.equal(cueFor(events, null), 'turn');
});

/**
 * A window whose matchMedia answers the reduced-motion query.
 * @param {boolean} reduce
 */
function windowAsking(reduce) {
	return {
		matchMedia: (/** @type {string} */ query) => ({
			matches: reduce && query === '(prefers-reduced-motion: reduce)',
		}),
	};
}

test('reduced motion is what the system asks for, and nothing without a window (#119)', () => {
	assert.equal(prefersReducedMotion(windowAsking(true)), true);
	assert.equal(prefersReducedMotion(windowAsking(false)), false);
	assert.equal(prefersReducedMotion({}), false);
	assert.equal(prefersReducedMotion(undefined), false);
	assert.equal(prefersReducedMotion(), false, 'Node has no window');
});

test('a CSS time is read in milliseconds (#119)', () => {
	assert.equal(msOf('220ms'), 220);
	assert.equal(msOf(' 0ms'), 0);
	assert.equal(msOf('0.38s'), 380);
	assert.equal(msOf('1s'), 1000);
	assert.equal(msOf(''), 0);
});

test('only motion.js asks for reduced motion, and the dice write no timing of their own (#119)', () => {
	const src = fileURLToPath(new URL('../src/', import.meta.url));
	const files = readdirSync(src, { recursive: true })
		.map(String)
		.filter(
			(file) => /\.(svelte|js)$/.test(file) && file !== 'lib/motion.js'
		);
	for (const file of files) {
		assert.doesNotMatch(
			readFileSync(`${src}${file}`, 'utf8'),
			/matchMedia/,
			`${file} asks for reduced motion itself`
		);
	}
	const board = `${src}lib/components/board/`;
	const die = readFileSync(`${board}Die.svelte`, 'utf8');
	assert.doesNotMatch(die, /rg-die-tumble\s+[\d.]+m?s/, 'Die names a length');
	assert.match(die, /var\(--rg-die-tumble\)/);
	const tray = readFileSync(`${board}DiceTray.svelte`, 'utf8');
	assert.doesNotMatch(
		tray,
		/FADE_MS|TUMBLE_MS = /,
		'the tray times its fade'
	);
	assert.equal(TUMBLE_MS, 1600);
});

test('a count runs from its old value to its new one, easing out, in whole numbers (#174)', () => {
	assert.equal(countAt(2, 6, 0), 2);
	assert.equal(countAt(2, 6, 1), 6);
	assert.equal(countAt(2, 6, 2), 6);
	assert.equal(countAt(2, 6, -1), 2);
	// Easing out: past halfway at half the time.
	assert.ok(countAt(0, 10, 0.5) > 5);
	assert.equal(countAt(10, 4, 1), 4);
	assert.ok(Number.isInteger(countAt(0, 7, 0.37)));
});

test('a component sounds a cue through the shared player, only while sound is on (#176)', () => {
	/** @type {any[]} */
	const heard = [];
	let on = false;
	soundCue('deal');
	shareSounds({
		play: (cue, how) => heard.push({ cue, ...how }),
		enabled: () => on,
	});
	soundCue('deal', { rate: 1.1 });
	assert.equal(heard.length, 0, 'silent while sound is off');
	on = true;
	soundCue('deal', { rate: 1.1 });
	assert.deepEqual(heard, [{ cue: 'deal', rate: 1.1 }]);
	shareSounds(null);
	soundCue('deal');
	assert.equal(heard.length, 1);
	assert.equal(CUES.deal, 'card_whoosh');
});

test('dealing a card is no event cue: a batch of events never earns it (#176)', () => {
	assert.notEqual(
		cueFor([ev('tapestryCardGained'), ev('tileGained')], 1),
		'deal'
	);
});
