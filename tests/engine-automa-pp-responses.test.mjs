// P&P responses used automatically when a human conquers Automa (#34).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { createGame } from '../src/lib/engine/setup.js';
import { seededRandom } from '../src/lib/engine/random.js';
import { contextFor } from '../src/lib/engine/loop.js';
import { conquerHex } from '../src/lib/engine/effects/conquer.js';
import { AUTOMA_CARDS } from '../src/lib/engine/data/automa-cards.js';
import { hexesByPattern } from '../src/lib/engine/automa-map.js';

const SOLO = [
	{ kind: 'player', name: 'Ana' },
	{ kind: 'automa', name: 'Automa', level: 2 },
	{ kind: 'shadow', name: 'Shadow' },
];
const attacked = '0_0';
const destinations = ['0_1', '1_0'];

function response(cards, { retreatPlaces = true, lead = false } = {}) {
	const random = () => 0;
	const state = createGame({
		participants: SOLO,
		version: 'current',
		random: seededRandom(43),
	});
	state.expansions = ['pp'];
	state.pending = [];
	state.events = [];
	state.supply.tapestry.discard = [];
	const [human, automa] = state.seats;
	automa.trapCards = [...cards];
	automa.currentPair = { trackCard: 1, tiebreakerCard: 2 };
	automa.tracks.military = [lead ? 3 : 1];
	human.tracks.military = [2];
	state.hexes[attacked].tile = 1;
	state.hexes[attacked].outposts = [{ seat: automa.seat, toppled: false }];
	state.hexes[attacked].tokens = [];
	for (const hex of destinations) {
		state.hexes[hex].tile = 2;
		state.hexes[hex].outposts = retreatPlaces
			? [{ seat: automa.seat, toppled: false }]
			: [];
		state.hexes[hex].tokens = [];
	}
	const ctx = contextFor(state, random, state.pending);
	conquerHex(ctx, human.seat, attacked, undefined);
	return { state, human, automa };
}

test('Automa Retreat moves its outpost to the first legal hex in the active card pattern', () => {
	const { state, automa } = response(['retreat']);
	const pattern = AUTOMA_CARDS.find((card) => card.id === 2).hexPattern;
	const expected = hexesByPattern(pattern).find((hex) =>
		destinations.includes(hex)
	);
	assert.ok(expected);
	assert.equal(
		state.hexes[attacked].outposts.some(
			(piece) => piece.seat === automa.seat
		),
		false
	);
	assert.equal(
		state.hexes[expected].outposts.filter(
			(piece) => piece.seat === automa.seat
		).length,
		2
	);
	assert.ok(
		state.events.some(
			(event) => event.type === 'retreated' && event.to === expected
		)
	);
	assert.deepEqual(state.supply.tapestry.discard, ['retreat']);
	assert.equal(
		state.pending.some((op) => op.kind === 'conquerDice'),
		true
	);
});

test('an unusable Retreat is discarded and Automa continues looking for a usable response', () => {
	const { state, human, automa } = response(['retreat', 'surprise-party'], {
		retreatPlaces: false,
		lead: true,
	});
	assert.deepEqual(state.supply.tapestry.discard, [
		'retreat',
		'surprise-party',
	]);
	assert.equal(automa.vp, 15);
	assert.equal(
		state.hexes[attacked].outposts.find(
			(piece) => piece.seat === human.seat
		).toppled,
		true
	);
	assert.equal(
		state.hexes[attacked].outposts.find(
			(piece) => piece.seat === automa.seat
		).toppled,
		false
	);
});

test('Surprise Party requires a strict military lead, and does not reveal unused cards', () => {
	const { state, human, automa } = response(['surprise-party', 'trap'], {
		lead: false,
	});
	assert.deepEqual(state.supply.tapestry.discard, ['surprise-party', 'trap']);
	assert.equal(automa.vp, 0);
	assert.equal(
		state.hexes[attacked].outposts.find(
			(piece) => piece.seat === human.seat
		).toppled,
		true
	);
	assert.equal(
		state.events.some((event) => event.type === 'surprisePartyThrown'),
		false
	);
});

test('a valid Surprise Party reports raising the defender and toppling the attacker', () => {
	const { state, human, automa } = response(['surprise-party', 'trap'], {
		lead: true,
	});
	assert.deepEqual(automa.trapCards, ['trap']);
	assert.equal(automa.vp, 15);
	assert.ok(
		state.events.some(
			(event) =>
				event.type === 'outpostRaised' && event.player === automa.seat
		)
	);
	assert.ok(
		state.events.some(
			(event) =>
				event.type === 'outpostToppled' &&
				event.player === human.seat &&
				event.by === automa.seat
		)
	);
});
