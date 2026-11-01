// Another player's tabs in the player area (#145, owner 2026-10-30): which seat shows, and nothing private is drawn.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { render } from 'svelte/server';
import { view } from '../src/lib/engine/game.js';
import {
	areaWords,
	handCount,
	nextInspected,
	publicSeat,
	shownSeat,
} from '../src/lib/area/inspect.js';
import { eraSlots } from '../src/lib/area/income.js';
import { tapestryName } from '../src/lib/game-names.js';
import PlayerTabs from '../src/screens/game/PlayerTabs.svelte';
import { startedGame } from './helpers/engine.mjs';

/**
 * A started two-player game in which seat 2 holds two cards, has a face-up card on era I and a face-down one on era II.
 * @returns {import('../src/lib/engine/state.js').State}
 */
function dealt() {
	const { state } = startedGame(2);
	const seat = /** @type {any} */ (state.seats[1]);
	seat.hand = ['capitalism', 'empiricism'];
	seat.incomeMat.tapestry = [['academia'], ['alliance'], [], []];
	seat.incomeMat.faceDown = ['alliance'];
	return state;
}

test("a chip opens that player's tabs, and the same chip or your own goes back", () => {
	assert.equal(nextInspected(null, 2, 1), 2);
	assert.equal(nextInspected(2, 3, 1), 3);
	assert.equal(nextInspected(2, 2, 1), null);
	assert.equal(nextInspected(2, 1, 1), null);
	assert.equal(nextInspected(null, 1, 1), null);
	// The public view has no own area: a chip shows that seat, and the same chip closes it.
	assert.equal(nextInspected(null, 2, null), 2);
	assert.equal(nextInspected(2, 2, null), null);
});

test("the area shows the inspected seat, or the viewer's own", () => {
	assert.equal(shownSeat(null, 1), 1);
	assert.equal(shownSeat(2, 1), 2);
	// A hot-seat screen passed to the inspected seat shows it as its own.
	assert.equal(shownSeat(2, 2), 2);
	assert.equal(shownSeat(null, null), null);
	assert.equal(shownSeat(3, null), 3);
});

test("another seat's private parts never reach the tabs, even if a view held them", () => {
	const state = dealt();
	const leaked = /** @type {any} */ (structuredClone(state.seats[1]));
	leaked.handCount = 2;
	const shown = publicSeat(leaked, 1);
	assert.equal('hand' in shown, false);
	assert.equal('picks' in shown, false);
	assert.equal(handCount(shown), 2);
	assert.ok(!JSON.stringify(shown).includes('capitalism'));
	// The given seat is left as it was.
	assert.deepEqual(leaked.hand, ['capitalism', 'empiricism']);
	// The viewer's own seat keeps its hand.
	const own = publicSeat(leaked, 2);
	assert.deepEqual(own.hand, ['capitalism', 'empiricism']);
	assert.equal(handCount(own), 2);
});

test("an opponent's eras show the face-up card and a back for the face-down one", () => {
	const game = view(dealt(), 1);
	const seat = publicSeat(game.seats[1], 1);
	const slots = eraSlots(seat);
	assert.equal(slots[0].id, 'academia');
	assert.equal(slots[1].faceDown, true);
	assert.equal(slots[1].id, null);
	assert.ok(!JSON.stringify(slots).includes('alliance'));
	assert.equal(handCount(seat), 2);
});

test("the area's words name whose it is", () => {
	const game = view(dealt(), 1);
	const name = game.seats[1].name;
	const theirs = areaWords(game, 2, 1);
	assert.equal(theirs.own, false);
	assert.equal(theirs.viewing, `Viewing ${name}'s area`);
	assert.equal(theirs.eras, `${name}'s eras`);
	assert.equal(theirs.tech, `${name}'s technology`);
	assert.equal(theirs.tabs, `${name}'s city and cards`);
	assert.equal(
		theirs.hand(2),
		`${name} holds 2 tapestry cards. A hand stays private.`
	);
	assert.equal(
		theirs.hand(1),
		`${name} holds 1 tapestry card. A hand stays private.`
	);
	assert.equal(theirs.hand(0), `${name} holds no tapestry cards.`);
	assert.equal(
		theirs.capitalSoon,
		`${name}'s capital mat is dealt as the game starts.`
	);
	assert.equal(
		theirs.civSoon,
		`${name} chooses a civilization as the game starts.`
	);
	const mine = areaWords(game, 1, 1);
	assert.equal(mine.own, true);
	assert.equal(mine.eras, 'Your eras');
	assert.equal(mine.tech, 'Your technology');
	assert.equal(mine.tabs, 'Your city and cards');
	assert.equal(mine.hand(0), 'No tapestry cards in hand.');
});

/**
 * PlayerTabs' server-rendered HTML.
 * @param {Record<string, unknown>} props
 * @returns {string}
 */
function tabs(props) {
	return render(PlayerTabs, { props: { code: 'ABCD', ...props } }).body;
}

test("another player's Hand tab draws card backs without revealing faces (#156)", () => {
	const state = dealt();
	const game = view(state, 1);
	// Even a view that leaked their hand draws none of it.
	/** @type {any} */ (game.seats[1]).hand = ['capitalism', 'empiricism'];
	const html = tabs({ game, seat: 2, viewer: 1, tab: 'hand' });
	assert.ok(!html.includes(tapestryName('capitalism')));
	assert.ok(!html.includes(tapestryName('empiricism')));
	assert.equal(
		(html.match(/class="rg-tapestry-card-back(?:\s|")/g) ?? []).length,
		2
	);
	assert.match(html, /Bo's hand, card 1/);
	assert.match(html, /rg-player-tabs--inspecting/);
	assert.match(html, /Back to your area/);
});

test("another player's Eras tab draws their face-up card, and the face-down one only as a back (#143)", () => {
	const game = view(dealt(), 1);
	const html = tabs({ game, seat: 2, viewer: 1, tab: 'eras' });
	assert.ok(html.includes(tapestryName('academia')));
	assert.ok(!html.includes(tapestryName('alliance')));
	assert.match(html, /rg-tapestry-card-back/);
	assert.match(html, /Face down/);
	assert.doesNotMatch(html, /Face-down card/);
});

test("another player's Terrain tab draws the tiles they hold, none of them pickable (#143)", () => {
	const state = dealt();
	/** @type {any} */ (state.seats[1]).territoryTiles = [3, 7];
	const game = view(state, 1);
	const html = tabs({
		game,
		seat: 2,
		viewer: 1,
		tab: 'terrain',
		tilePick: { tiles: [3, 7], selected: null },
	});
	assert.match(html, /Territory tile 3:/);
	assert.match(html, /Territory tile 7:/);
	assert.doesNotMatch(html, /data-id="terrain-tile-/);
});

test('your own tabs draw your hand, without the border or the way back', () => {
	const state = dealt();
	const game = view(state, 2);
	const html = tabs({ game, seat: 2, viewer: 2, tab: 'hand' });
	assert.ok(html.includes(tapestryName('capitalism')));
	assert.doesNotMatch(html, /rg-player-tabs--inspecting/);
	assert.doesNotMatch(html, /Back to your area/);
});
