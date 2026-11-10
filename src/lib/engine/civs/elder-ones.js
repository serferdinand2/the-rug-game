// The Elder Ones (F&F, #40; 03 FF.3, DQ 7, 8): long-lived, they play on with advance turns after income turn 5. The
// shared "playing on" rules for them and the Merfolk live here too.
import { playerSeat } from '../state.js';
import { turnOptions } from '../decisions/choose-turn.js';

/**
 * Whether a seat plays on after its income turn 5: it holds the Elder Ones or the Merfolk (03 FF.3).
 * @param {import('../state.js').PlayerSeat} seat
 * @returns {boolean}
 */
export function playsOn(seat) {
	return seat.civs.includes('elder-ones') || seat.civs.includes('merfolk');
}

/**
 * The turns a seat playing on may take: an advance turn with the Elder Ones while one is possible (DQ 8), a Merfolk
 * turn with the Merfolk while they hold a card; none means their game is over. With both, the player picks each turn.
 * @param {import('../state.js').State} state
 * @param {number} player
 * @returns {('advance' | 'merfolk')[]}
 */
export function playOnOptions(state, player) {
	const seat = playerSeat(state, player);
	return [
		...(seat.civs.includes('elder-ones') &&
		turnOptions(state, player).includes('advance')
			? /** @type {const} */ (['advance'])
			: []),
		...(seat.civs.includes('merfolk') && seat.hand.length > 0
			? /** @type {const} */ (['merfolk'])
			: []),
	];
}

/**
 * Whether a seat may play response cards: not the Elder Ones after their income turn 5, unless they hold the Merfolk too
 * (03 FF.3, FF.4).
 * @param {import('../state.js').PlayerSeat} seat
 * @returns {boolean}
 */
export function mayRespond(seat) {
	return !seat.playingOn || seat.civs.includes('merfolk');
}

/** @type {import('./civ.js').Civ} */
export const elderOnes = {
	id: 'elder-ones',
	incomeTurns: [2, 3, 4, 5],
	// Income turns 2–4: 1 resource or 2 tapestry cards; 5: up to 6 cards discarded for 2 resources each.
	income(ctx, player, turn) {
		ctx.push([
			{
				player,
				kind: 'effects',
				effects:
					turn === 5
						? [{ elderDiscard: { left: 6 } }]
						: [
								{
									choice: [
										[{ gain: { any: 1 } }],
										[{ gain: { tapestry: 2 } }],
									],
								},
							],
				origin: 'civ',
			},
		]);
	},
	hooks: {
		// After income turn 5, each landmark gained scores 10 VP.
		landmarkGained(state, owner, { player }) {
			return owner === player && playerSeat(state, owner).playingOn
				? [
						{
							player: owner,
							kind: 'effects',
							effects: [{ vp: 10 }],
							origin: 'civ',
						},
					]
				: [];
		},
	},
};

/**
 * The Elder Ones' income turn 5: you may discard a tapestry card for 2 resources of your choice, one at a time, up to
 * 6 times.
 * @type {import('../state.js').EffectHandler}
 */
export function elderDiscard(ctx, player, value) {
	const left = value?.left ?? 6;
	if (left <= 0 || playerSeat(ctx.state, player).hand.length === 0) {
		return;
	}
	ctx.push([
		{
			player,
			kind: 'effects',
			effects: [
				{
					trade: {
						offers: [
							{
								pay: { tapestry: 1 },
								gain: [
									{ gain: { any: 2 } },
									{ elderDiscard: { left: left - 1 } },
								],
							},
						],
						optional: true,
					},
				},
			],
			origin: 'civ',
		},
	]);
}
