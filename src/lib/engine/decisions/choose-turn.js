// The decision a player faces at the start of their turn: an income turn or an advance turn.
import { PlayerError } from '../errors.js';
import { emit } from '../events.js';
import { advances } from './choose-advance.js';
import { startIncomeTurn } from '../income.js';
import { triggered } from '../abilities.js';
import { civsOf } from '../civs/registry.js';

/**
 * Whether a player could pay for some advance holding other resources, for the civilizations whose turn-start offer
 * might open one (`opensAdvance`). The state isn't changed: only a copy of the seat holds the resources.
 * @param {import('../state.js').State} state
 * @param {number} player
 * @returns {import('../civs/civ.js').Affordable}
 */
function affordableWith(state, player) {
	return (resources) =>
		advances(
			{
				...state,
				seats: state.seats.map((seat) =>
					seat.seat === player ? { ...seat, resources } : seat
				),
			},
			player
		).length > 0;
}

/**
 * The turns a seat may choose. There is no pass: advancing is offered only when some advance can be paid for
 * (01 §4.1), or when a civilization's offer at the start of an advance turn would make one affordable (the
 * Utilitarians' Lighthouse, #33). The first turn is never a choice, since startTurn() takes income turn 1 itself (#77).
 * @param {import('../state.js').State} state
 * @param {number} player
 * @returns {('income' | 'advance')[]}
 */
export function turnOptions(state, player) {
	if (advances(state, player).length > 0) {
		return ['income', 'advance'];
	}
	const affordable = affordableWith(state, player);
	return civsOf(state, player).some(
		(civ) => civ.opensAdvance?.(state, player, affordable) === true
	)
		? ['income', 'advance']
		: ['income'];
}

/** @type {import('../state.js').DecisionKind} */
export const chooseTurn = {
	hidden: [],
	answers(state, decision) {
		return decision.options.map((/** @type {string} */ turn) => ({ turn }));
	},
	check(state, decision, answer) {
		if (
			answer.turn === 'advance' &&
			!decision.options.includes('advance')
		) {
			throw new PlayerError(
				"You can't pay for any advance, so take an income turn."
			);
		}
		if (!decision.options.includes(answer.turn)) {
			throw new PlayerError('Choose an income turn or an advance turn.');
		}
	},
	resolve(ctx, decision, answer) {
		const { state } = ctx;
		const player = /** @type {number} */ (decision.player);
		// What the turn is, for the abilities that work on one kind only (the Advisors, #33).
		state.turnKind = answer.turn;
		emit(state, { type: 'turnChosen', player, turn: answer.turn });
		if (answer.turn === 'income') {
			startIncomeTurn(ctx, player);
			return;
		}
		// What an advance turn offers comes before its advance, told whether some advance is affordable, and after the
		// advance and all it gave (the Utilitarians' Lighthouse, #33). Nothing in a base game answers either.
		ctx.push([
			...triggered(state, 'advanceTurnStarted', {
				player,
				// A function: hooks call it now and never spread the payload into an operation, so state stays plain data.
				affordable: affordableWith(state, player),
			}),
			{ player, kind: 'chooseAdvance' },
			...triggered(state, 'afterAdvance', { player }),
		]);
	},
};
