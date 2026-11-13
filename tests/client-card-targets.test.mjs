// A&A's places on cards as lit targets in the Capital tab (#184): the prompt's places and the cards' model.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { view } from '../src/lib/engine/game.js';
import { push } from '../src/lib/engine/stack.js';
import { promptFor } from '../src/lib/prompts.js';
import { myDecision } from '../src/lib/turn.js';
import {
	capitalPlacement,
	cardTargets,
	heldPlotCard,
	plotLanding,
} from '../src/lib/area/placement-targets.js';
import { startedGame } from './helpers/engine.mjs';

/**
 * An A&A game whose current player has Monuments on era I, holding a Market, Commercial Center on era II, Astrolabe in
 * the bottom tech row and Space Race as this era's card, and is asked where a gained piece goes.
 * @param {{ building?: string, landmark?: string }} piece
 * @param {(seat: any, state: any) => void} [fill]
 */
function placing(piece, fill = () => {}) {
	const { state } = startedGame(2, { expansions: ['aa'] });
	const player = /** @type {number} */ (state.current);
	const seat = /** @type {any} */ (state.seats[player - 1]);
	seat.incomeMat.tapestry = [['monuments'], ['commercial-center'], [], []];
	seat.onCards = { monuments: [{ building: 'market', row: 2, col: 0 }] };
	seat.tech.bottom = ['astrolabe'];
	fill(seat, state);
	state.pending.length = 0;
	push(state, state.pending, [{ player, kind: 'choosePlacement', ...piece }]);
	const game = view(state, player);
	const prompt = promptFor(myDecision(game, player), game, player);
	assert.ok(prompt);
	return { prompt, game, player };
}

/**
 * The Capital tab's placement model, as prompt-state builds it.
 * @param {any} prompt
 * @param {any} game
 * @param {number} player
 * @param {{ building?: string, landmark?: string }} piece
 * @param {number | null} [picked]
 */
function placementOf(prompt, game, player, piece, picked = null) {
	return {
		piece,
		options: prompt.options.filter((/** @type {any} */ o) =>
			['capital', 'plot', 'held'].includes(o.place)
		),
		picked,
		onCards: game.seats[player - 1].onCards ?? {},
	};
}

test("a building's squares on a plot card are 'plot' places, and the capital still leads the layout (#184)", () => {
	const { prompt } = placing({ building: 'farm' });
	assert.equal(prompt.layout, 'capital');
	const plots = prompt.options.filter((o) => o.place === 'plot');
	// Monuments' 5 open squares and Commercial Center's 4.
	assert.equal(plots.length, 9);
	assert.deepEqual(plots[0].square, {
		card: 'monuments',
		row: 0,
		col: 2,
		rotation: null,
	});
	assert.ok(prompt.options.some((o) => o.place === 'capital'));
	assert.ok(!prompt.options.some((o) => o.place === 'panel'));
	assert.match(prompt.instruction, /lit square under it/);
});

test("Space Race, a landmark tech card and the civilizations' mats are 'held' places (#184)", () => {
	const { prompt } = placing({ landmark: 'forge' }, (seat) => {
		seat.era = { card: 'space-race', ability: 'space-race' };
		seat.incomeMat.tapestry[2] = ['space-race'];
		seat.civs = ['urban-planners'];
		seat.civData = { 'urban-planners': { stored: [] } };
	});
	const held = prompt.options.filter((o) => o.place === 'held');
	assert.deepEqual(
		held.map((o) => o.holder),
		[
			{ kind: 'tech', id: 'astrolabe' },
			{ kind: 'tapestry', id: 'space-race' },
			{ kind: 'civ', id: 'urban-planners' },
		]
	);
	assert.equal(prompt.layout, 'capital');
	assert.match(prompt.instruction, /lit square or card under it/);
});

test("National Parks' territories stay map places, lit beside the capital (#184)", () => {
	const { prompt } = placing({ building: 'farm' }, (seat, state) => {
		seat.era = { card: 'national-parks', ability: 'national-parks' };
		// A territory holding only the player's 1 outpost: their start, with one of its 2 outposts gone.
		const home = Object.keys(state.hexes).find((key) =>
			state.hexes[key].outposts.some(
				(/** @type {any} */ o) => o.seat === seat.seat
			)
		);
		state.hexes[home].outposts = [{ seat: seat.seat, toppled: false }];
	});
	const parks = prompt.options.filter((o) => o.place === 'map');
	assert.ok(parks.length > 0);
	assert.equal(prompt.layout, 'capital');
	assert.deepEqual(
		prompt.mapHexes,
		parks.map((o) => o.hex)
	);
});

test("the Capital tab's cards: a plot card's squares, its pieces, the lit ones and Commercial Center's printed benefits (#184)", () => {
	const piece = { building: 'farm' };
	const { prompt, game, player } = placing(piece);
	const placement = placementOf(prompt, game, player, piece);
	const { plots, holders } = cardTargets(placement);
	assert.deepEqual(
		plots.map((p) => p.card),
		['monuments', 'commercial-center']
	);
	const [monuments, centre] = plots;
	assert.equal(monuments.name, 'Monuments');
	assert.deepEqual(monuments.grid, ['..X', '.XX', 'XXX']);
	const market = monuments.squares.find((s) => s.row === 2 && s.col === 0);
	assert.equal(market?.building, 'market');
	assert.equal(market?.index, null);
	assert.equal(monuments.squares.filter((s) => s.index !== null).length, 5);
	assert.deepEqual(
		centre.squares.map((s) => s.printed),
		[
			'resource-24/coin',
			'symbol/tapestry-card',
			'symbol/invent',
			'symbol/science-die',
		]
	);
	assert.deepEqual(holders, []);
	assert.equal(monuments.preview, null);
});

test('a building picked on a square previews there, and the capital previews nothing (#184)', () => {
	const piece = { building: 'farm' };
	const { prompt, game, player } = placing(piece);
	const square = prompt.options.find(
		(o) =>
			o.place === 'plot' &&
			o.square?.card === 'monuments' &&
			o.square.row === 1 &&
			o.square.col === 2
	);
	assert.ok(square);
	const placement = placementOf(prompt, game, player, piece, square.index);
	const [monuments] = cardTargets(placement).plots;
	assert.deepEqual(monuments.preview, { row: 1, col: 2, building: 'farm' });
	assert.equal(
		monuments.squares.find((s) => s.row === 1 && s.col === 2)?.chosen,
		true
	);
	const capital = capitalPlacement(null, placement, {
		plots: [],
		landmarks: [],
	});
	assert.equal(capital.preview, null);
	assert.ok(capital.targets.length > 0);
});

test('a landmark lights every square some place covers, and a picked place draws it hanging off; the tray empties (#184)', () => {
	const piece = { landmark: 'forge' };
	const { prompt, game, player } = placing(piece);
	const placement = placementOf(prompt, game, player, piece);
	const [monuments] = cardTargets(placement).plots;
	assert.deepEqual(
		monuments.squares
			.filter((s) => s.index !== null)
			.map((s) => `${s.row},${s.col}`),
		['0,2', '1,1', '1,2', '2,1', '2,2']
	);
	const index = plotLanding(
		placement.options,
		'monuments',
		{ row: 2, col: 2 },
		0,
		null,
		'forge'
	);
	assert.ok(index !== null);
	const picked = placementOf(prompt, game, player, piece, index);
	const [drawn] = cardTargets(picked).plots;
	assert.equal(drawn.placed?.id, 'forge');
	const covered = [0, 1].flatMap((dr) =>
		[0, 1].map(
			(dc) =>
				`${(drawn.placed?.row ?? 0) + dr},${(drawn.placed?.col ?? 0) + dc}`
		)
	);
	assert.ok(covered.includes('2,2'));
	const capital = capitalPlacement(null, picked, {
		plots: [],
		landmarks: [],
	});
	assert.deepEqual(capital.tray, []);
	assert.equal(capital.placed, null);
	assert.equal(capital.landmark?.id, 'forge');
});

test('plotLanding keeps the tray turn when a place covering the square has it, and stays near the landmark (#184)', () => {
	/** @type {any[]} */
	const options = [
		{
			index: 0,
			place: 'plot',
			square: { card: 'monuments', row: 1, col: 1, rotation: 0 },
		},
		{
			index: 1,
			place: 'plot',
			square: { card: 'monuments', row: 1, col: 2, rotation: 1 },
		},
		{
			index: 2,
			place: 'plot',
			square: { card: 'monuments', row: 0, col: 2, rotation: 0 },
		},
		{
			index: 3,
			place: 'plot',
			square: { card: 'commercial-center', row: 0, col: 0, rotation: 0 },
		},
	];
	// The Forge is 2×2: (1,2) is covered by the places at (1,1), (1,2) and (0,2).
	assert.equal(
		plotLanding(options, 'monuments', { row: 1, col: 2 }, 1, null, 'forge'),
		1
	);
	assert.equal(
		plotLanding(
			options,
			'monuments',
			{ row: 1, col: 2 },
			0,
			{ row: 0, col: 2 },
			'forge'
		),
		2
	);
	assert.equal(
		plotLanding(
			options,
			'star-chamber',
			{ row: 1, col: 1 },
			0,
			null,
			'forge'
		),
		null
	);
});

test('the held places are targets with their names, and the picked one is marked (#184)', () => {
	const piece = { landmark: 'forge' };
	const { prompt, game, player } = placing(piece, (seat) => {
		seat.era = { card: 'space-race', ability: 'space-race' };
		seat.incomeMat.tapestry[2] = ['space-race'];
		seat.civs = ['urban-planners'];
		seat.civData = { 'urban-planners': { stored: [] } };
	});
	const tech = prompt.options.find((o) => o.holder?.kind === 'tech');
	assert.ok(tech);
	const { holders } = cardTargets(
		placementOf(prompt, game, player, piece, tech.index)
	);
	assert.deepEqual(
		holders.map((h) => [h.kind, h.id, h.name, h.picked]),
		[
			['tech', 'astrolabe', 'Astrolabe', true],
			['tapestry', 'space-race', 'Space Race', false],
			['civ', 'urban-planners', 'Urban Planners', false],
		]
	);
	assert.ok(
		holders.every((h) => typeof h.label === 'string' && h.label.length > 0)
	);
});

test("a plot card keeps room for the furthest any offered landmark place hangs off, so the grid doesn't move (#184)", () => {
	const piece = { landmark: 'forge' };
	const { prompt, game, player } = placing(piece);
	const [monuments] = cardTargets(
		placementOf(prompt, game, player, piece)
	).plots;
	// The 2×2 Forge may hang 1 plot off Monuments' top, right and bottom; its left column's only square holds the Market.
	assert.deepEqual(monuments.room, { top: 1, right: 1, bottom: 1, left: 0 });
	const farm = placing({ building: 'farm' });
	const [still] = cardTargets(
		placementOf(farm.prompt, farm.game, farm.player, { building: 'farm' })
	).plots;
	assert.deepEqual(still.room, { top: 0, right: 0, bottom: 0, left: 0 });
});

test("an era slot's plot card draws what it holds, a landmark hanging off included, with nothing lit (#184)", () => {
	const card = heldPlotCard('monuments', [
		{ building: 'market', row: 2, col: 0 },
		{ landmark: 'forge', row: 1, col: 2, rotation: 0 },
	]);
	assert.equal(card.name, 'Monuments');
	assert.equal(
		card.squares.find((s) => s.row === 2 && s.col === 0)?.building,
		'market'
	);
	assert.ok(card.squares.every((s) => s.index === null && !s.chosen));
	assert.deepEqual(
		card.landmarks.map((l) => [l.id, l.row, l.col, l.rotation]),
		[['forge', 1, 2, 0]]
	);
	assert.deepEqual(card.room, { top: 0, right: 1, bottom: 0, left: 0 });
	assert.equal(heldPlotCard('space-race', [{ landmark: 'forge' }]), null);
});
