// The defender's response question after a conquest: spring a trap, or decline (01 §7.4; R21, R108).
import { PlayerError } from '../errors.js';
import { emit } from '../events.js';
import { playerSeat } from '../state.js';
import { triggered } from '../abilities.js';
import { responseCards } from '../effects/conquer.js';

/** @type {import('../state.js').DecisionKind} */
export const chooseResponse = {
	hidden: [],
	answers(state, decision) {
		const defender = playerSeat(
			state,
			/** @type {number} */ (decision.player)
		);
		return [
			{ card: null },
			...responseCards(state, defender.seat).map((card) => ({ card })),
		];
	},
	check(state, decision, answer) {
		if (
			!chooseResponse
				.answers(state, decision)
				.some((a) => a.card === answer.card)
		) {
			throw new PlayerError("You can't play that card as a response.");
		}
	},
	resolve(ctx, decision, answer) {
		const state = ctx.state;
		const player = /** @type {number} */ (decision.player);
		const attacker = /** @type {number} */ (decision.attacker);
		const hex = /** @type {string} */ (decision.hex);
		if (answer.card === null) {
			emit(state, { type: 'responseDeclined', player, hex });
			return;
		}
		const seat = playerSeat(state, player);
		seat.hand.splice(seat.hand.indexOf(answer.card), 1);
		state.supply.tapestry.discard.push(answer.card);
		emit(state, {
			type: 'responsePlayed',
			player,
			hex,
			card: answer.card,
			attacker,
		});
		// The defender's outpost stands up again, and the attacker's topples in its place.
		for (const outpost of state.hexes[hex].outposts) {
			if (outpost.seat === player && outpost.toppled) {
				outpost.toppled = false;
				delete outpost.toppledBy;
				emit(state, { type: 'outpostRaised', player, hex });
			} else if (outpost.seat === attacker && !outpost.toppled) {
				outpost.toppled = true;
				outpost.toppledBy = player;
				emit(state, {
					type: 'outpostToppled',
					player: attacker,
					hex,
					by: player,
				});
			}
		}
		// R21: the trapper gains 1 resource of their choice. The trap changed who controls the territory, so the
		// trapper's `countsChanged` triggers follow (#20 design §7, Mystics).
		ctx.push([
			{ player, kind: 'effects', effects: [{ gain: { any: 1 } }] },
			...triggered(state, 'countsChanged', { player }),
		]);
	},
};
