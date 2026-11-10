// The Genies (F&F, #40; 03 FF.3): an opponent's token drawn each era to make a wish, which both of them score.
import { emit } from '../events.js';
import { playerSeat, seatOf } from '../state.js';

/** @typedef {{ tokens: number[] }} GeniesData - The opponents whose token the Genies hold */
/** @typedef {'landmark' | 'territoryTile' | 'territory' | 'techCard'} Circle */

/** The ring's circles, clockwise from the top: 1 VP per landmark, territory tile, territory and tech card. */
export const CIRCLES = /** @type {readonly Circle[]} */ (
	Object.freeze(['landmark', 'territoryTile', 'territory', 'techCard'])
);

/** The squares beside each circle (03 FF.3's adjacency table). */
const SQUARES =
	/** @type {Record<Circle, import('../data/effects.js').Effect[][]>} */ ({
		landmark: [[{ research: { noBenefit: true } }], [{ invent: {} }]],
		territoryTile: [[{ invent: {} }], [{ gain: { culture: 1 } }]],
		territory: [[{ gain: { culture: 1 } }], [{ explore: {} }]],
		techCard: [[{ explore: {} }], [{ research: { noBenefit: true } }]],
	});

/** @type {import('./civ.js').Civ} */
export const genies = {
	id: 'genies',
	solo: false,
	incomeTurns: [2, 3, 4, 5],
	// A token from each opponent, at setup or when gained.
	setup(ctx, player) {
		playerSeat(ctx.state, player).civData.genies =
			/** @type {GeniesData} */ ({
				tokens: ctx.state.seats
					.filter((s) => s.kind === 'player' && s.seat !== player)
					.map((s) => s.seat),
			});
	},
	income(ctx, player, turn) {
		const { state } = ctx;
		if (turn === 5) {
			ctx.push([
				{
					player,
					kind: 'chooseWish',
					genie: player,
					options: [...CIRCLES],
					left: 2,
				},
			]);
			return;
		}
		/** @type {GeniesData} */
		const { tokens } = playerSeat(state, player).civData.genies;
		if (tokens.length === 0) {
			return;
		}
		const drawn = tokens[ctx.random(tokens.length)];
		emit(state, { type: 'genieTokenDrawn', player, opponent: drawn });
		// A finished opponent gains nothing, so the Genies pick for them (DQ 11; R147, as BGA does).
		const chooser = seatOf(state, drawn).finished ? player : drawn;
		ctx.push([
			{
				player: chooser,
				kind: 'chooseWish',
				genie: player,
				wisher: drawn,
				options: [...CIRCLES],
			},
		]);
	},
};

/**
 * A wish picked: the wisher scores the circle (a finished one nothing), then the Genies score it and gain a square
 * beside it, in either order; on income turn 5 the Genies' own circles, 2 different ones.
 * @param {import('../state.js').Context} ctx
 * @param {import('../state.js').Operation} decision
 * @param {Circle} circle
 */
export function grantWish(ctx, decision, circle) {
	const { state } = ctx;
	const genie = /** @type {number} */ (decision.genie);
	emit(state, {
		type: 'wishGranted',
		player: genie,
		circle,
		wisher: decision.wisher ?? null,
	});
	/** @type {import('../state.js').NewOperation[]} */
	const ops = [];
	if (decision.left !== undefined) {
		ops.push({
			player: genie,
			kind: 'effects',
			effects: [{ vp: { per: circle } }],
			origin: 'civ',
		});
		const options = decision.options.filter(
			(/** @type {Circle} */ c) => c !== circle
		);
		if (decision.left > 1 && options.length > 0) {
			ops.push({
				player: genie,
				kind: 'chooseWish',
				genie,
				options,
				left: decision.left - 1,
			});
		}
		ctx.push(ops);
		return;
	}
	const wisher = /** @type {number} */ (decision.wisher);
	if (!seatOf(state, wisher).finished) {
		ops.push({
			player: wisher,
			kind: 'effects',
			effects: [{ vp: { per: circle } }],
			origin: 'civ',
		});
	}
	ops.push({
		player: genie,
		kind: 'effects',
		effects: [
			{ vp: { per: circle } },
			{ choice: structuredClone(SQUARES[circle]) },
		],
		ordered: false,
		origin: 'civ',
	});
	ctx.push(ops);
}
