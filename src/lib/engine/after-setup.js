// The steps that run once every setup pick is made: reveal, civilization deck, and the first turn.
import { emit } from './events.js';
import { shuffle } from './random.js';
import { playerSeat } from './state.js';
import { SMALL_MAP_PAIRS } from './data/capitals.js';
import { startTurn } from './turn.js';

/**
 * The after-setup steps in order. Later issues insert theirs before 'start', which begins play:
 * turns then follow each other on top of the stack, so a step after it would never run.
 */
export const AFTER_SETUP = ['reveal', 'civDeck', 'start'];

/** @type {Record<string, (ctx: import('./state.js').Context) => void>} */
export const AFTER_SETUP_STEPS = {
	// Every pick becomes public at once; a small-map player's unchosen mat joins the supply now.
	reveal({ state }) {
		const picks = [];
		for (const seat of state.seats) {
			if (seat.kind !== 'player') {
				continue;
			}
			const player = playerSeat(state, seat.seat);
			const { capital, civ } = player.picks;
			if (state.map === 'small' && capital !== undefined) {
				const pair = SMALL_MAP_PAIRS.find((p) => p.includes(capital));
				player.capital.mat = capital;
				for (const mat of pair ?? []) {
					if (mat !== capital) {
						state.supply.capitals.push(mat);
					}
				}
			}
			if (civ !== undefined) {
				player.civs = [civ];
			}
			picks.push({
				seat: seat.seat,
				capital: player.capital.mat,
				civ: civ ?? null,
			});
			player.picks = {};
		}
		emit(state, { type: 'setupRevealed', picks });
	},
	civDeck({ state, random }) {
		state.supply.civs = shuffle(state.supply.civs, random);
		emit(state, {
			type: 'deckShuffled',
			deck: 'civs',
			count: state.supply.civs.length,
		});
	},
	start(ctx) {
		const { state } = ctx;
		state.phase = 'play';
		emit(state, { type: 'setupDone' });
		startTurn(ctx, state.first);
	},
};

/**
 * Runs the first step of a `setupSteps` operation; the rest wait under whatever it pushes.
 * @type {import('./state.js').AutomaticKind}
 */
export function runSetupSteps(ctx, op) {
	const [step, ...rest] = op.steps;
	if (!step) {
		return;
	}
	if (rest.length) {
		ctx.push([{ player: null, kind: 'setupSteps', steps: rest }]);
	}
	const handler = AFTER_SETUP_STEPS[step];
	if (!handler) {
		throw new Error(`There is no setup step ${step}.`);
	}
	if (step === 'start' && rest.length > 0) {
		throw new Error(
			`The after-setup step 'start' must come last, not before ${rest.join(', ')}.`
		);
	}
	handler(ctx);
}
