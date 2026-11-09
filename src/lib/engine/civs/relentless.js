// The Relentless (A&A, #37; 03 §2.4): a token for each turn on which they gained a building or landmark, cashed in at the end of an advance turn on which they gained none.
import { emit } from '../events.js';
import { playerSeat } from '../state.js';

/** @typedef {{ tokens: number }} RelentlessData */

/** The extras the chart offers from 3 tokens up, one to choose; R62: the teal icon is explore. */
const EXTRAS = [
	[{ gain: { tapestry: 1 } }],
	[{ gain: { any: 1 } }],
	[{ explore: {} }],
	[{ invent: {} }],
];

/**
 * What a number of tokens cashes in for (03 §2.4): 1 → 1 VP; 2 → 3 VP and a tapestry card; 3 → 6 VP and a tapestry
 * card or a resource; 4 → 10 VP and one of those or an explore; 5 or more → 15 VP and one of those or an invent.
 * @param {number} tokens - 1 or more
 * @returns {import('../data/effects.js').Effect[]}
 */
export function relentlessReward(tokens) {
	if (tokens === 1) {
		return [{ vp: 1 }];
	}
	if (tokens === 2) {
		return [{ vp: 3 }, { gain: { tapestry: 1 } }];
	}
	const [vp, extras] =
		tokens === 3 ? [6, 2] : tokens === 4 ? [10, 3] : [15, 4];
	return [{ vp }, { choice: structuredClone(EXTRAS.slice(0, extras)) }];
}

/**
 * Whether a player gained an income building or a landmark since their turn started.
 * @param {import('../state.js').State} state
 * @param {number} player
 * @returns {boolean}
 */
function gainedBuilding(state, player) {
	const start = state.events.findLastIndex(
		(e) => e.type === 'turnStarted' && e.player === player
	);
	return state.events
		.slice(start + 1)
		.some(
			(e) =>
				e.player === player &&
				(e.type === 'buildingGained' || e.type === 'landmarkGained')
		);
}

/**
 * The end of a Relentless player's turn: a token if they gained a building or landmark, else on an advance turn the
 * tokens come off for the chart's reward.
 * @type {import('../state.js').AutomaticKind}
 */
export function relentlessEnd(ctx, op) {
	const { state } = ctx;
	const player = /** @type {number} */ (op.player);
	/** @type {RelentlessData} */
	const data = playerSeat(state, player).civData.relentless;
	if (gainedBuilding(state, player)) {
		data.tokens += 1;
		emit(state, { type: 'relentlessToken', player, tokens: data.tokens });
		return;
	}
	if (state.turnKind !== 'advance' || data.tokens === 0) {
		return;
	}
	const tokens = data.tokens;
	data.tokens = 0;
	emit(state, { type: 'relentlessCashed', player, tokens });
	ctx.push([
		{
			player,
			kind: 'effects',
			effects: relentlessReward(tokens),
			ordered: true,
			...(op.passive && { passive: true }),
			origin: 'civ',
		},
	]);
}

/** @type {import('./civ.js').Civ} */
export const relentless = {
	id: 'relentless',
	setup(ctx, player) {
		playerSeat(ctx.state, player).civData.relentless =
			/** @type {RelentlessData} */ ({ tokens: 0 });
	},
	hooks: {
		turnEnding: (_state, owner, { player }) =>
			owner === player ? [{ player: owner, kind: 'relentlessEnd' }] : [],
	},
};
