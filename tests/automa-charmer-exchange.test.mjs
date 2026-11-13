import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
	charmerExchangeOps,
	chooseCharmerExchange,
} from '../src/lib/engine/decisions/choose-charmer-exchange.js';

function sample() {
	return {
		phase: 'play',
		current: 1,
		seq: 0,
		events: [],
		seats: [
			{
				kind: 'player',
				seat: 1,
				finished: false,
				hand: ['monarchy'],
				civs: [],
				civData: {},
				exploredSpace: [],
			},
			{
				kind: 'automa',
				seat: 2,
				civilization: 'charmers',
				faceUpCharms: ['ghost-towns', 'astral-expeditions'],
			},
		],
		supply: { tapestry: { discard: [] } },
	};
}

test('Charmers offer one optional choice only when the human gains a card on their own turn', () => {
	const state = sample();
	const [op] = charmerExchangeOps(state, 1, ['monarchy']);
	assert.equal(op.kind, 'chooseCharmerExchange');
	assert.deepEqual(chooseCharmerExchange.answers(state, op), [
		{ card: null },
		{ card: 'ghost-towns' },
		{ card: 'astral-expeditions' },
	]);
	assert.ok(chooseCharmerExchange.hidden.includes('gained'));
	state.current = 2;
	assert.deepEqual(charmerExchangeOps(state, 1, ['monarchy']), []);
});

test('accepting swaps only the freshly gained card, declining leaves it alone', () => {
	const state = sample();
	const [op] = charmerExchangeOps(state, 1, ['monarchy']);
	chooseCharmerExchange.resolve({ state, push: () => {} }, op, {
		card: null,
	});
	assert.deepEqual(state.seats[0].hand, ['monarchy']);
	chooseCharmerExchange.check(state, op, { card: 'ghost-towns' });
	chooseCharmerExchange.resolve({ state, push: () => {} }, op, {
		card: 'ghost-towns',
	});
	assert.deepEqual(state.seats[0].hand, ['ghost-towns']);
	assert.deepEqual(state.supply.tapestry.discard, ['monarchy']);
	assert.deepEqual(state.seats[1].faceUpCharms, ['astral-expeditions']);
	assert.deepEqual(chooseCharmerExchange.answers(state, op), [
		{ card: null },
	]);
});
