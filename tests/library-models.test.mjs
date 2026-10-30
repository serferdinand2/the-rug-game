// The library's review games (#131): the DecisionPanel and TrackBoard sections show models built from dealt games.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { trackBoard } from '../src/lib/board.js';
import { PromptState } from '../src/lib/prompt-state.svelte.js';
import {
	boardView,
	capWarning,
	guildsTrade,
	shuttleBonus,
	tanksPayment,
} from '../src/library/models.js';

test('the board review game has the mockup four players at their spaces', () => {
	const tracks = trackBoard(boardView());
	assert.deepEqual(
		tracks.map((track) => track.id),
		['exploration', 'science', 'technology', 'military']
	);
	assert.deepEqual(
		tracks[0].players.map((p) => [p.seat, p.name, p.position]),
		[
			[1, 'You', 4],
			[2, 'Ana', 2],
			[3, 'Marko', 5],
			[4, 'Vera', 1],
		]
	);
	assert.deepEqual(
		tracks.map((track) => track.players.map((p) => p.position)),
		[
			[4, 2, 5, 1],
			[2, 1, 3, 6],
			[5, 0, 2, 3],
			[1, 6, 0, 2],
		]
	);
	assert.deepEqual(
		tracks[0].spaces.flatMap((space, i) =>
			space.landmark ? [[i + 1, space.landmark]] : []
		),
		[
			[4, 'Lighthouse'],
			[7, 'Train Station'],
			[10, 'Launch Pad'],
		]
	);
});

test('the board review game says "then" on an ordered space, as the game does', () => {
	const words = trackBoard(boardView()).flatMap((track) =>
		track.spaces.map((space) => space.words)
	);
	assert.ok(words.some((text) => text.includes(' then ')));
});

test('the advance to Tanks is paid in rows: its culture fixed, two to pick', () => {
	const source = tanksPayment();
	assert.equal(source.advance?.track, 'military');
	assert.equal(source.advance?.to, 7);
	const prompt = new PromptState(source);
	assert.deepEqual(
		prompt.payModel?.rows.map((row) => row.fixed),
		['culture', null, null]
	);
	assert.equal(
		prompt.payModel?.lead,
		'Tier III costs 1 culture and 2 resources of your choice. Pick one in each empty row.'
	);
	assert.equal(prompt.payControls?.confirmLabel, 'Advance');
	assert.equal(prompt.payControls?.confirmDisabled, true);
	assert.equal(prompt.payControls?.cancelLabel, 'Cancel');
	prompt.payRow(1, 'coin');
	prompt.payRow(2, 'food');
	assert.equal(prompt.payControls?.confirmDisabled, false);
	assert.equal(
		prompt.payControls?.status,
		'Pay 1 coin, 1 food and 1 culture'
	);
});

test("Space Shuttle's bonus pays 3 of the player's 6 tiles, or is declined", () => {
	const source = shuttleBonus();
	const prompt = new PromptState(source);
	assert.equal(prompt.prompt?.title, 'Take the bonus: gain 10 VP?');
	assert.deepEqual(prompt.pick?.items, {
		kind: 'territory',
		ids: [6, 13, 19, 21, 25, 29],
		count: 3,
	});
	assert.equal(prompt.controls?.confirmLabel, 'Pay 3 tiles');
	assert.equal(prompt.controls?.cancelLabel, 'Decline');
	for (const tile of [6, 13, 19]) {
		prompt.pickTile(tile);
	}
	assert.deepEqual(prompt.pickBlocked, [21, 25, 29]);
	assert.equal(prompt.controls?.confirmDisabled, false);
});

test("Guilds' trades: the 15 VP one is out of reach, and a chosen offer goes Back", () => {
	const prompt = new PromptState(guildsTrade());
	assert.equal(prompt.prompt?.title, 'Choose a trade');
	assert.deepEqual(
		prompt.offering?.map((offer) => offer.enabled),
		[true, true, false, true, true, true]
	);
	assert.equal(prompt.controls?.status, 'Choose a trade.');
	assert.equal(prompt.controls?.cancelLabel, undefined);
	prompt.chooseOffer(4);
	assert.equal(prompt.pick?.rows.length, 2);
	assert.equal(prompt.controls?.cancelLabel, 'Back');
	prompt.cancel();
	assert.equal(prompt.offer, null);
});

test('three resources gained past the cap warn what would be lost', () => {
	const prompt = new PromptState(capWarning());
	assert.equal(prompt.prompt?.kind, 'chooseResource');
	assert.equal(prompt.pick?.rows.length, 3);
	for (const [row, resource] of /** @type {const} */ ([
		[0, 'food'],
		[1, 'food'],
		[2, 'coin'],
	])) {
		prompt.pickRow(row, resource);
	}
	assert.equal(prompt.controls?.warn, true);
	assert.equal(
		prompt.controls?.status,
		'You gain 1 coin and 2 food. You can hold 8 of each: 1 food would be lost.'
	);
});
