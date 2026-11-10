// Regression games for the two official bot compositions: in particular, a neighbour's invention must not crash Shadow Empire.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { createGame, play, openDecisions, view } from '../src/lib/engine/game.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { seededRandom } from '../src/lib/engine/random.js';

const human = (name) => ({ kind: 'player', name });
const shadow = { kind: 'shadow', name: 'Mesopotamia' };
const modes = [
	{ name: 'solo', participants: [human('Lazar'), { kind: 'automa', name: 'Egypt', level: 2 }, shadow] },
	{ name: 'two humans and Shadow Empire', participants: [human('Lazar'), human('Ogi'), shadow] },
];

for (const mode of modes) {
	test(`the seeded ${mode.name} game finishes without a bot-owned human prompt`, () => {
		const random = seededRandom(3109);
		let state = createGame({ participants: mode.participants, version: 'current', random });
		let actions = 0;
		while (state.phase !== 'over' && actions < 2500) {
			const [op] = openDecisions(state);
			assert.ok(op, 'an unfinished game must offer a human decision');
			assert.equal(state.seats[op.player - 1].kind, 'player', op.kind);
			const answers = DECISIONS[op.kind].answers(state, op);
			assert.ok(answers.length, `${op.kind} must have a legal answer`);
			let answer = answers[random(answers.length)];
			if (op.kind === 'chooseTurn') {
				const advance = answers.find((option) => option.turn === 'advance');
				if (advance && random(100) < 85) answer = advance;
			}
			state = play(state, op.player, { decision: op.id, ...answer }, random);
			actions++;
		}
		assert.equal(state.phase, 'over', `stalled after ${actions} human choices`);
		assert.ok(state.events.some((event) => event.type === 'botDecisionCards'));
		for (const seat of state.seats.filter((seat) => seat.kind !== 'shadow')) assert.equal(seat.incomeTurns, 5);
		assert.ok(state.result.ranking.every((entry) => state.seats[entry.seat - 1].kind !== 'shadow'));
		for (const seat of view(state, null).seats.filter((seat) => seat.kind !== 'player')) {
			for (const hidden of ['decisionDeck', 'progressDeck', 'trapCards', 'multiplierCards', 'incomePair']) assert.ok(!(hidden in seat), hidden);
		}
	});
}
