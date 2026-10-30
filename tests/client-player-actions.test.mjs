// What other players just did (#153): fresh events as display items, the queue that plays them, and its 4-second timer.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import '../src/lib/engine/game.js';
import {
	EMPTY_QUEUE,
	MAX_LINES,
	actionsOf,
	queueAdd,
	queueCurrent,
	queueNext,
	queuePosition,
} from '../src/lib/player-actions.js';
import {
	ACTION_MS,
	pauseTimer,
	resumeTimer,
	startTimer,
	timeLeft,
	timerOver,
} from '../src/lib/action-timer.js';

const GAME = {
	seats: [
		{ seat: 1, name: 'Lazar', kind: 'player', civs: ['leaders'] },
		{ seat: 2, name: 'Mira', kind: 'player', civs: [] },
		{ seat: 3, name: 'Ana', kind: 'player', civs: [] },
	],
	hexes: { '-3_-2': { tile: 12, orient: 2, outposts: [], tokens: [] } },
};

/** Events numbered from `from`, in order. */
function numbered(events, from = 1) {
	return events.map((event, index) => ({ seq: from + index, ...event }));
}

/** The headline as plain words. */
function words(item) {
	return item.headline.map((part) => part.text).join('');
}

test("an opponent's face-up tapestry card shows the card, their name and the log's words", () => {
	const [item, ...rest] = actionsOf(
		numbered([
			{
				type: 'tapestryPlayed',
				player: 1,
				era: 4,
				card: 'industrialism',
				faceDown: false,
			},
			{
				type: 'eraStarted',
				player: 1,
				card: 'industrialism',
				ability: 'industrialism',
			},
		]),
		GAME,
		2
	);
	assert.equal(rest.length, 0);
	assert.equal(item.kind, 'tapestry');
	assert.equal(item.player, 1);
	assert.equal(item.name, 'Lazar');
	assert.equal(item.color, 'var(--player-1)');
	assert.deepEqual(item.picture, { card: 'industrialism' });
	assert.equal(words(item), 'Lazar played Industrialism');
	assert.equal(item.text, 'Lazar played Industrialism.');
	assert.deepEqual(
		item.headline.map((part) => part.role),
		['who', 'plain', 'name']
	);
	assert.deepEqual(item.lines, [
		"Lazar's Industrialism took effect for this era.",
	]);
	assert.equal(item.context, 'Leaders');
});

test('a face-down tapestry card shows a card back and says so', () => {
	const [item] = actionsOf(
		numbered([
			{
				type: 'tapestryPlayed',
				player: 1,
				era: 2,
				card: null,
				faceDown: true,
			},
		]),
		GAME,
		2
	);
	assert.equal(item.kind, 'tapestry');
	assert.deepEqual(item.picture, { card: null });
	assert.equal(item.text, 'Lazar played a tapestry card face down.');
});

test('a face-down card never names a card, even one the event carries', () => {
	const [item] = actionsOf(
		numbered([
			{
				type: 'tapestryPlayed',
				player: 1,
				era: 2,
				card: 'industrialism',
				faceDown: true,
			},
		]),
		GAME,
		2
	);
	assert.deepEqual(item.picture, { card: null });
	assert.ok(!JSON.stringify(item).includes('industrialism'));
});

test('a trap played as a tapestry card says a trap', () => {
	const [item] = actionsOf(
		numbered([
			{
				type: 'tapestryPlayed',
				player: 1,
				era: 3,
				card: 'trap',
				faceDown: false,
			},
		]),
		GAME,
		2
	);
	assert.equal(item.text, 'Lazar played a trap as a tapestry card.');
	assert.deepEqual(item.picture, { card: 'trap' });
});

test('an advance names the space and track, and shows the landmark it gained', () => {
	const [item] = actionsOf(
		numbered([
			{
				type: 'tokenMoved',
				player: 1,
				track: 'exploration',
				from: 3,
				to: 4,
			},
			{
				type: 'landmarkGained',
				player: 1,
				landmark: 'lighthouse',
				track: 'exploration',
			},
			{ type: 'tilesGained', player: 1, stack: 'territory', tiles: [23] },
		]),
		GAME,
		2
	);
	assert.equal(item.kind, 'advance');
	assert.deepEqual(item.picture, {
		track: 'exploration',
		space: 4,
		landmark: 'lighthouse',
	});
	assert.equal(item.text, 'Lazar advanced to Navigation on Exploration.');
	assert.deepEqual(
		item.headline.map((part) => part.role),
		['who', 'plain', 'name', 'plain', 'name']
	);
	assert.deepEqual(item.lines, [
		'Lazar gained the Lighthouse.',
		'Lazar gained territory tile 23.',
	]);
});

test('going back on a track is a line, not an advance', () => {
	const items = actionsOf(
		numbered([
			{
				type: 'tokenMoved',
				player: 1,
				track: 'science',
				from: 2,
				to: 4,
			},
			{
				type: 'tokenMoved',
				player: 1,
				track: 'military',
				from: 3,
				to: 2,
			},
		]),
		GAME,
		2
	);
	assert.equal(items.length, 1);
	assert.equal(items[0].lines.length, 1);
	assert.match(items[0].lines[0], /went back/);
});

test('an invented and an upgraded tech card show the card, the upgrade its rows', () => {
	const [invent, upgrade] = actionsOf(
		numbered([
			{ type: 'techInvented', player: 3, card: 'compass', from: 'face' },
			{
				type: 'techUpgraded',
				player: 3,
				card: 'compass',
				from: 'middle',
				to: 'top',
			},
		]),
		GAME,
		2
	);
	assert.equal(invent.kind, 'invent');
	assert.equal(invent.name, 'Ana');
	assert.deepEqual(invent.picture, { card: 'compass' });
	assert.equal(invent.text, 'Ana invented Compass.');
	assert.equal(upgrade.kind, 'upgrade');
	assert.deepEqual(upgrade.picture, {
		card: 'compass',
		from: 'middle',
		to: 'top',
	});
	assert.equal(upgrade.text, 'Ana upgraded Compass to the top row.');
});

test('an explore shows the tile as it lies and the hex', () => {
	const [item] = actionsOf(
		numbered([
			{
				type: 'explored',
				player: 1,
				hex: '-2_-1',
				tile: 23,
				orient: 1,
				vp: 2,
			},
			{ type: 'vpGained', player: 1, vp: 2, source: 'map' },
		]),
		GAME,
		2
	);
	assert.equal(item.kind, 'explore');
	assert.deepEqual(item.picture, { hex: '-2_-1', tile: 23, orient: 1 });
	assert.equal(item.text, 'Lazar explored hex −2,−1, matching 2 sides.');
	assert.deepEqual(item.lines, ['Lazar scored 2 VP on the map.']);
});

test('a conquer starts at its outpost, and keeps the toppled outpost and the dice', () => {
	const [item, ...rest] = actionsOf(
		numbered([
			{ type: 'outpostPlaced', player: 1, hex: '-3_-2' },
			{ type: 'outpostToppled', player: 2, hex: '-3_-2', by: 1 },
			{ type: 'conquered', player: 1, hex: '-3_-2', trapped: false },
			{ type: 'conquerDiceRolled', player: 1, red: 1, black: 2 },
		]),
		GAME,
		2
	);
	assert.equal(rest.length, 0);
	assert.equal(item.kind, 'conquer');
	assert.deepEqual(item.picture, {
		hex: '-3_-2',
		tile: 12,
		orient: 2,
		dice: { red: 1, black: 2 },
		trapped: false,
	});
	assert.equal(item.text, 'Lazar conquered hex −3,−2.');
	assert.ok(
		item.lines.includes("Mira's outpost on hex −3,−2 was toppled by Lazar.")
	);
});

test('a trapped conquest says it failed', () => {
	const [item] = actionsOf(
		numbered([
			{ type: 'conquered', player: 1, hex: '-3_-2', trapped: true },
		]),
		GAME,
		2
	);
	assert.equal(item.text, "Lazar's conquest of hex −3,−2 failed.");
	assert.equal(item.picture.trapped, true);
});

test('an outpost placed without a conquest is a line of what came before', () => {
	const items = actionsOf(
		numbered([
			{
				type: 'explored',
				player: 1,
				hex: '-2_-1',
				tile: 23,
				orient: 1,
				vp: 0,
			},
			{
				type: 'outpostPlaced',
				player: 1,
				hex: '-2_-1',
				militarism: true,
			},
		]),
		GAME,
		2
	);
	assert.equal(items.length, 1);
	assert.equal(items[0].kind, 'explore');
	assert.equal(items[0].lines.length, 1);
});

test('an income turn plays its card on its own, then one summary of the rest', () => {
	const items = actionsOf(
		numbered([
			{ type: 'turnStarted', player: 1 },
			{ type: 'turnChosen', player: 1, turn: 'income' },
			{ type: 'incomeTurnStarted', player: 1, turn: 4 },
			{
				type: 'tapestryPlayed',
				player: 1,
				era: 4,
				card: 'industrialism',
				faceDown: false,
			},
			{
				type: 'techUpgraded',
				player: 1,
				card: 'compass',
				from: 'bottom',
				to: 'middle',
			},
			{ type: 'vpGained', player: 1, vp: 12, source: 'income' },
			{
				type: 'resourcesGained',
				player: 1,
				gained: { coin: 3, food: 2 },
			},
		]),
		GAME,
		2
	);
	assert.deepEqual(
		items.map((item) => item.kind),
		['tapestry', 'income']
	);
	assert.equal(items[0].context, 'Leaders · Income turn 4');
	const [, income] = items;
	assert.equal(income.text, 'Lazar took income turn 4.');
	assert.deepEqual(income.picture, { turn: 4 });
	assert.deepEqual(income.lines, [
		'Lazar upgraded Compass to the middle row.',
		'Lazar scored 12 VP in their income turn.',
		'Lazar gained 3 coins and 2 food.',
	]);
});

test('in an income turn, the card keeps its own lines, and the score and income go to the summary', () => {
	const [card, income] = actionsOf(
		numbered([
			{ type: 'incomeTurnStarted', player: 1, turn: 2 },
			{
				type: 'tapestryPlayed',
				player: 1,
				era: 2,
				card: 'trap',
				faceDown: false,
			},
			{ type: 'vpGained', player: 1, vp: 10, source: 'tapestry' },
			{ type: 'vpGained', player: 1, vp: 3, source: 'income' },
			{ type: 'resourcesGained', player: 1, gained: { coin: 1 } },
		]),
		GAME,
		2
	);
	assert.deepEqual(card.lines, ['Lazar scored 10 VP from a tapestry card.']);
	assert.deepEqual(income.lines, [
		'Lazar scored 3 VP in their income turn.',
		'Lazar gained 1 coin.',
	]);
});

test('an income turn that began in an earlier batch is still summed up as one', () => {
	const history = numbered([
		{ type: 'turnStarted', player: 1 },
		{ type: 'incomeTurnStarted', player: 1, turn: 3 },
	]);
	const fresh = numbered(
		[
			{
				type: 'techUpgraded',
				player: 1,
				card: 'compass',
				from: 'bottom',
				to: 'middle',
			},
			{ type: 'vpGained', player: 1, vp: 5, source: 'income' },
		],
		3
	);
	const items = actionsOf(fresh, GAME, 2, [...history, ...fresh]);
	assert.deepEqual(
		items.map((item) => item.kind),
		['income']
	);
	assert.equal(items[0].lines.length, 2);
});

test('an income turn with nothing to say shows nothing', () => {
	const items = actionsOf(
		numbered([
			{ type: 'turnStarted', player: 1 },
			{ type: 'incomeTurnStarted', player: 1, turn: 3 },
		]),
		GAME,
		2
	);
	assert.deepEqual(items, []);
});

test('income turn 1, which everyone takes in setup, shows nothing', () => {
	const items = actionsOf(
		numbered([
			{ type: 'incomeTurnStarted', player: 1, turn: 1 },
			{ type: 'resourcesGained', player: 1, gained: { coin: 1 } },
		]),
		GAME,
		2
	);
	assert.deepEqual(items, []);
});

test("a tapestry card played in income turn 1, on the Heralds' Maker of Fire, still shows", () => {
	const items = actionsOf(
		numbered([
			{ type: 'incomeTurnStarted', player: 1, turn: 1 },
			{ type: 'resourcesGained', player: 1, gained: { coin: 1 } },
			{
				type: 'tapestryPlayed',
				player: 1,
				era: 1,
				card: 'industrialism',
				faceDown: false,
			},
		]),
		GAME,
		2
	);
	assert.deepEqual(
		items.map((item) => [item.kind, item.context]),
		[['tapestry', 'Leaders · Income turn 1']]
	);
});

test("the viewer's own actions show nothing, with the lines that follow them", () => {
	const items = actionsOf(
		numbered([
			{
				type: 'tokenMoved',
				player: 2,
				track: 'science',
				from: 0,
				to: 1,
			},
			{ type: 'resourcesGained', player: 2, gained: { coin: 1 } },
			{ type: 'turnStarted', player: 3 },
			{ type: 'techInvented', player: 3, card: 'compass', from: 'face' },
		]),
		GAME,
		2
	);
	assert.deepEqual(
		items.map((item) => [item.kind, item.player, item.lines.length]),
		[['invent', 3, 0]]
	);
});

test('without a viewer (a spectator) every player shows', () => {
	const items = actionsOf(
		numbered([
			{ type: 'techInvented', player: 2, card: 'compass', from: 'face' },
		]),
		GAME,
		null
	);
	assert.equal(items.length, 1);
});

test('several actions keep the order they happened in, each with its own id', () => {
	const items = actionsOf(
		numbered(
			[
				{
					type: 'tokenMoved',
					player: 1,
					track: 'exploration',
					from: 3,
					to: 4,
				},
				{
					type: 'explored',
					player: 1,
					hex: '-2_-1',
					tile: 23,
					orient: 1,
					vp: 2,
				},
				{ type: 'turnStarted', player: 3 },
				{
					type: 'techInvented',
					player: 3,
					card: 'compass',
					from: 'face',
				},
			],
			40
		),
		GAME,
		2
	);
	assert.deepEqual(
		items.map((item) => [item.id, item.kind]),
		[
			['40', 'advance'],
			['41', 'explore'],
			['43', 'invent'],
		]
	);
});

test('lines stop at MAX_LINES and count the rest', () => {
	const gains = Array.from({ length: MAX_LINES + 3 }, () => ({
		type: 'resourcesGained',
		player: 1,
		gained: { coin: 1 },
	}));
	const [item] = actionsOf(
		numbered([
			{ type: 'techInvented', player: 1, card: 'compass', from: 'face' },
			...gains,
		]),
		GAME,
		2
	);
	assert.equal(item.lines.length, MAX_LINES);
	assert.equal(item.more, 3);
});

test('events that are not a list, or not events, give nothing', () => {
	assert.deepEqual(actionsOf(/** @type {any} */ (null), GAME, 2), []);
	assert.deepEqual(actionsOf([null, 3, 'x'], GAME, 2), []);
});

test('the queue plays its items in order, counting "1 of N", and empties at the end', () => {
	const [a, b, c] = ['1', '2', '3'].map((id) => ({ id }));
	let queue = queueAdd(EMPTY_QUEUE, [a, b]);
	assert.equal(queueCurrent(queue), a);
	assert.deepEqual(queuePosition(queue), { index: 1, count: 2 });
	// A batch that arrives while one plays joins the end, and N grows.
	queue = queueAdd(queue, [c]);
	assert.deepEqual(queuePosition(queue), { index: 1, count: 3 });
	queue = queueNext(queue);
	assert.equal(queueCurrent(queue), b);
	assert.deepEqual(queuePosition(queue), { index: 2, count: 3 });
	queue = queueNext(queueNext(queue));
	assert.equal(queueCurrent(queue), null);
	assert.deepEqual(queue, EMPTY_QUEUE);
	// The empty queue is never changed in place.
	assert.deepEqual(EMPTY_QUEUE, { items: [], at: 0 });
});

test('adding nothing leaves the queue as it was', () => {
	assert.equal(queueAdd(EMPTY_QUEUE, []), EMPTY_QUEUE);
});

test('the timer runs for 4 seconds, then is over', () => {
	assert.equal(ACTION_MS, 4000);
	const timer = startTimer(1000);
	assert.equal(timeLeft(timer, 1000), 4000);
	assert.equal(timeLeft(timer, 3500), 1500);
	assert.equal(timerOver(timer, 4999), false);
	assert.equal(timerOver(timer, 5000), true);
	assert.equal(timeLeft(timer, 9000), 0);
});

test('a paused timer keeps its time until it goes on', () => {
	let timer = startTimer(0);
	timer = pauseTimer(timer, 1000);
	assert.equal(timeLeft(timer, 1000), 3000);
	assert.equal(timeLeft(timer, 60_000), 3000);
	assert.equal(timerOver(timer, 60_000), false);
	timer = resumeTimer(timer, 60_000);
	assert.equal(timeLeft(timer, 61_000), 2000);
	assert.equal(timerOver(timer, 63_000), true);
});

test('pausing twice or going on twice changes nothing', () => {
	let timer = startTimer(0, 2000);
	timer = pauseTimer(pauseTimer(timer, 500), 900);
	assert.equal(timeLeft(timer, 900), 1500);
	timer = resumeTimer(resumeTimer(timer, 1000), 1400);
	assert.equal(timeLeft(timer, 1400), 1100);
});
