// The prompt for a copied tech benefit (#144): Assembly Line, Electronics and Nanotechnology offer the cards of the
// required row on the tech shelf, from the viewer's own view, and the answer sent from it resolves that card's benefit.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { play, view } from '../src/lib/engine/game.js';
import { push } from '../src/lib/engine/stack.js';
import { run } from '../src/lib/engine/loop.js';
import { promptFor } from '../src/lib/prompts.js';
import { myDecision } from '../src/lib/turn.js';
import { tabFor } from '../src/lib/area/tabs.js';
import { eventText } from '../src/lib/log.js';
import { startedGame } from './helpers/engine.mjs';

/**
 * A started 2-player game where the current seat upgrades Assembly Line with the given rows, viewed from that seat.
 * @param {Record<string, string[]>} rows
 * @param {number} exploration - The seat's exploration space; tier III lets Assembly Line reach the top row
 */
function upgradeAssemblyLine(rows, exploration) {
	const { state, random } = startedGame(2);
	const player = /** @type {number} */ (state.current);
	const seat = state.seats[player - 1];
	Object.assign(seat.tech, rows);
	seat.tracks.exploration = [exploration];
	push(state, state.pending, [
		{ player, kind: 'effects', effects: [{ upgrade: {} }] },
	]);
	run(state, random);
	const game = view(state, player);
	return { state, random, player, game, decision: myDecision(game, player) };
}

/**
 * The log line of the latest copied tech benefit, as the seat reads it.
 * @param {any} state
 * @param {number} player
 */
function usedLine(state, player) {
	const used = state.events.findLast(
		(/** @type {any} */ e) => e.type === 'techBenefitUsed'
	);
	return eventText(used, view(state, player));
}

test("Assembly Line's circle offers the top-row cards on the tech shelf, each with its square benefit", () => {
	const { state, random, player, game, decision } = upgradeAssemblyLine(
		{
			bottom: ['assembly-line'],
			middle: ['ammonia'],
			top: ['the-nail', 'irrigation'],
		},
		0
	);
	assert.equal(decision?.kind, 'chooseTechBenefit');
	assert.equal(tabFor(decision), 'tech');
	const prompt = promptFor(decision, game, player);
	assert.ok(prompt);
	assert.equal(
		prompt.title,
		'Choose a tech card in your top row for its square benefit'
	);
	assert.equal(prompt.layout, 'cards');
	assert.equal(prompt.shelf, 'tech');
	// Only the top row's cards, never Ammonia in the middle row.
	assert.deepEqual(
		prompt.options.map((o) => [o.place, o.art, o.label]),
		[
			[
				'shelf',
				[{ kind: 'tech', id: 'the-nail' }],
				'The Nail: gain a Market, a House or a Farm',
			],
			[
				'shelf',
				[{ kind: 'tech', id: 'irrigation' }],
				'Irrigation: gain a Farm',
			],
		]
	);
	// The answer the shelf sends resolves The Nail's square, which asks its own choice next, and the log names it.
	const chosen = decision.answers[prompt.options[0].index];
	const next = play(
		state,
		player,
		{ decision: decision.id, ...chosen },
		random
	);
	assert.equal(myDecision(view(next, player), player)?.kind, 'chooseOption');
	assert.equal(
		usedLine(next, player),
		`${next.seats[player - 1].name} took the square benefit of The Nail, which stays in the top row.`
	);
});

test("Assembly Line's square offers the other middle-row cards on the tech shelf, each with its circle benefit", () => {
	const { game, decision, player } = upgradeAssemblyLine(
		{ middle: ['assembly-line', 'ammonia', 'irrigation'] },
		7
	);
	assert.equal(decision?.kind, 'chooseTechBenefit');
	const prompt = promptFor(decision, game, player);
	assert.ok(prompt);
	assert.equal(
		prompt.title,
		'Choose a tech card in your middle row for its circle benefit'
	);
	assert.deepEqual(
		prompt.options.map((o) => [o.place, o.label]),
		[
			['shelf', 'Ammonia: gain a Farm'],
			['shelf', 'Irrigation: gain 1 food'],
		]
	);
});

test('with one card in the required row nothing is asked, and the log says whose benefit follows', () => {
	const { state, player, decision } = upgradeAssemblyLine(
		{ bottom: ['assembly-line'], top: ['the-nail'] },
		0
	);
	// The Nail's own choice is the next thing asked.
	assert.equal(decision?.kind, 'chooseOption');
	assert.equal(
		usedLine(state, player),
		`${state.seats[player - 1].name} took the square benefit of The Nail, which stays in the top row.`
	);
});
