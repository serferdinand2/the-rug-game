// The Psionics' pick of each conquer die's two rolls (F&F, #40; R74): one value of the red die and one of the black, for
// a conquest, Surrender's roll or National Parks' one die.
import { PlayerError } from '../errors.js';
import { afterConquerRoll } from '../effects/conquer.js';
import { BLACK_DIE, RED_DIE } from '../data/dice.js';

/** @type {import('../state.js').DecisionKind} */
export const chooseRolls = {
	hidden: [],
	answers(state, decision) {
		/** @type {{ red?: number, black?: number }[]} */
		const answers = [];
		/** @type {(number | undefined)[]} */
		const reds = decision.reds ? [...new Set(decision.reds)] : [undefined];
		/** @type {(number | undefined)[]} */
		const blacks = decision.blacks
			? [...new Set(decision.blacks)]
			: [undefined];
		for (const red of reds) {
			for (const black of blacks) {
				answers.push({
					...(red !== undefined && { red }),
					...(black !== undefined && { black }),
				});
			}
		}
		return answers;
	},
	check(state, decision, answer) {
		const kept = (
			/** @type {number[] | undefined} */ rolls,
			/** @type {number | undefined} */ value
		) =>
			rolls
				? value !== undefined && rolls.includes(value)
				: value === undefined;
		if (
			!kept(decision.reds, answer.red) ||
			!kept(decision.blacks, answer.black)
		) {
			throw new PlayerError('Keep one roll of each die.');
		}
	},
	resolve(ctx, decision, answer) {
		if (decision.conquest) {
			afterConquerRoll(
				ctx,
				{ player: decision.player, ...decision.conquest },
				answer.red,
				answer.black
			);
			return;
		}
		// Surrender's dice or National Parks' die: the results, black first as a conquest's both dice are.
		ctx.push([
			{
				player: decision.player,
				kind: 'effects',
				effects: [
					...(answer.black === undefined
						? []
						: [structuredClone(BLACK_DIE[answer.black])]),
					...(answer.red === undefined
						? []
						: [structuredClone(RED_DIE[answer.red])]),
				],
				ordered: true,
				source: { hex: decision.hex },
			},
		]);
	},
};
