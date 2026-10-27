// The decision to give a territory tile to an opponent for 3 VP before exploring, or to decline (Age of Sail).
import { PlayerError } from '../errors.js';
import { emit } from '../events.js';
import { playerSeat } from '../state.js';
import { opponents } from '../abilities.js';
import { vp } from '../effects/vp.js';

/** VP for a gift (02 §3). */
const GIFT_VP = 3;

/** @type {import('../state.js').DecisionKind} */
export const chooseGift = {
	hidden: [],
	answers(state, decision) {
		const player = /** @type {number} */ (decision.player);
		const others = opponents(state, player);
		return [
			{ tile: null },
			...playerSeat(state, player).territoryTiles.flatMap((tile) =>
				others.map((other) => ({ tile, player: other }))
			),
		];
	},
	check(state, decision, answer) {
		const offered = chooseGift
			.answers(state, decision)
			.some(
				(a) =>
					a.tile === answer.tile &&
					(a.tile === null || a.player === answer.player)
			);
		if (!offered) {
			throw new PlayerError(
				'Give a territory tile from your supply to an opponent, or decline.'
			);
		}
	},
	resolve(ctx, decision, answer) {
		if (answer.tile === null) {
			return;
		}
		const player = /** @type {number} */ (decision.player);
		const from = playerSeat(ctx.state, player).territoryTiles;
		from.splice(from.indexOf(answer.tile), 1);
		playerSeat(ctx.state, answer.player).territoryTiles.push(answer.tile);
		emit(ctx.state, {
			type: 'tileGiven',
			player,
			to: answer.player,
			tile: answer.tile,
		});
		vp(ctx, player, GIFT_VP, decision);
	},
};
