// The arts track on the board (#35 part 4): the fifth row with its prices and symbols, its words, its key and the track
// question, all only with the arts track in play.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { view } from '../src/lib/engine/game.js';
import { TRACKS } from '../src/lib/engine/data/tracks.js';
import { TRACK_IDS } from '../src/lib/engine/data/ids.js';
import { masterpiece } from '../src/lib/engine/data/masterpieces.js';
import { tierSymbols, trackBoard } from '../src/lib/board.js';
import { bonusGlyphs, spaceGlyphs } from '../src/lib/glyphs.js';
import { describeEffects, priceWords } from '../src/lib/describe.js';
import { describeAnswer } from '../src/lib/decision-words.js';
import { hotkeyAction } from '../src/lib/hotkeys.js';
import { shortcutGroups, SHORTCUTS } from '../src/lib/shortcuts.js';
import { advanceOptions, footerView } from '../src/lib/turn.js';
import { readyTurn, startedGame } from './helpers/engine.mjs';
import { AA } from './helpers/arts.mjs';

const RICH = { coin: 3, food: 3, worker: 3, culture: 3 };

/** The first player's view of a started game with these options. */
const viewOf = (/** @type {any} */ options) =>
	view(startedGame(2, options).state, 1);

/** The texts of a list of glyphs: a word's text, or the glyph's kind. */
const texts = (/** @type {any[]} */ glyphs) =>
	glyphs.map((g) => (g.kind === 'word' ? g.text : g.kind));

test('with the arts track the board has a fifth row, Arts, with its three landmarks', () => {
	const board = trackBoard(viewOf(AA));
	assert.deepEqual(
		board.map((track) => track.id),
		[...TRACK_IDS, 'arts']
	);
	const arts = board[4];
	assert.equal(arts.name, 'Arts');
	assert.equal(arts.spaces.length, 12);
	assert.deepEqual(
		arts.spaces.flatMap((space, i) =>
			space.landmark ? [[i + 1, space.landmark]] : []
		),
		[
			[4, 'Clock Tower'],
			[7, 'Opera House'],
			[10, 'Holocenter'],
		]
	);
});

test('a base game, and an A&A game without the arts track, keep four rows', () => {
	assert.equal(trackBoard(viewOf({})).length, 4);
	assert.equal(
		trackBoard(viewOf({ ...AA, variants: ['no-arts-track'] })).length,
		4
	);
});

test("the arts track's tier prices: any 1, 2 different, any 3, 2 of the same type (owner: ≠ and =)", () => {
	assert.deepEqual(
		[1, 2, 3, 4].map((tier) =>
			tierSymbols('arts', /** @type {1 | 2 | 3 | 4} */ (tier))
		),
		[
			['any'],
			['any', 'any', 'different'],
			['any', 'any', 'any'],
			['any', 'any', 'same'],
		]
	);
	assert.equal(
		priceWords(['any', 'any', 'different']),
		'2 different resources'
	);
	assert.equal(
		priceWords(['any', 'any', 'same']),
		'2 resources of the same type'
	);
});

test('the arts spaces show their new effects as words, as the mockup does', () => {
	const benefit = (/** @type {number} */ space) =>
		texts(spaceGlyphs(TRACKS.arts[space].benefit));
	assert.deepEqual(benefit(3), ['Create']);
	assert.deepEqual(benefit(5), ['Inspire']);
	assert.deepEqual(benefit(6), ['Broadcast', 'or', 'Any building']);
	assert.deepEqual(benefit(7), ['May refresh', 'Create']);
	assert.deepEqual(benefit(8), ['Inspire']);
	assert.deepEqual(benefit(12), ['Fire 3']);
	for (const space of [5, 11]) {
		assert.deepEqual(
			texts(bonusGlyphs(TRACKS.arts[space].bonus)?.gain ?? []),
			['Create'],
			`space ${space}`
		);
	}
});

test('the Holocenter counts income buildings, not "Thing"', () => {
	assert.deepEqual(texts(spaceGlyphs(TRACKS.arts[10].benefit)), [
		'Any building',
		'vp',
		'per',
		'Building',
	]);
});

test('Theater counts the spaces advanced on Arts', () => {
	assert.match(
		describeEffects(masterpiece('theater').effects),
		/space you have advanced on Arts/
	);
});

test('an answer on the arts track names it', () => {
	assert.equal(
		describeAnswer(
			{ kind: 'chooseRoll', player: 1, answers: [] },
			{ track: 'arts' }
		),
		'Arts'
	);
});

test('the track question lists the arts track fifth, only with the arts track', () => {
	const { state, player } = readyTurn(
		2,
		(seat) => {
			seat.resources = { ...RICH };
		},
		AA
	);
	const game = view(state, player);
	const footer = footerView(game, player, {
		overviewOpen: false,
		noticeOpen: false,
		incomeAsk: false,
		trackAsk: true,
		selected: null,
		options: advanceOptions(game, player),
		paying: false,
		income: null,
		incomeStep: null,
	});
	assert.deepEqual(footer.tracks?.at(-1), {
		track: 'arts',
		label: '5 · Arts',
		enabled: true,
	});
	assert.equal(footer.tracks?.length, 5);
});

test('key 5 answers the arts track only when it is offered', () => {
	assert.deepEqual(
		hotkeyAction('5', { asking: true, tracks: ['science', 'arts'] }),
		{ type: 'track', track: 'arts' }
	);
	assert.equal(
		hotkeyAction('5', { asking: true, tracks: ['science', 'military'] }),
		null
	);
});

test('the shortcut sheet lists 1–5 with the arts track and 1–4 without', () => {
	const trackLine = (/** @type {readonly any[]} */ groups) =>
		groups
			.flatMap((group) => group.shortcuts)
			.find((shortcut) => shortcut.action.startsWith('Then answer it'));
	const arts = trackLine(shortcutGroups([...TRACK_IDS, 'arts']));
	assert.deepEqual(arts?.keys, [['1–5']]);
	assert.equal(
		arts?.action,
		'Then answer it: 1 Exploration, 2 Science, 3 Technology, 4 Military or 5 Arts.'
	);
	assert.deepEqual(trackLine(SHORTCUTS)?.keys, [['1–4']]);
});
