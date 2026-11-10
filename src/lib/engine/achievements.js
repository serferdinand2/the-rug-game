// The three achievements: claiming the next free VP box when a player first meets a condition (R23, R24; design §9).
import { emit } from './events.js';
import { seatOf } from './state.js';
import { vp } from './effects/vp.js';
import { ACHIEVEMENTS } from './data/achievements.js';

/**
 * Gives a player an achievement and the VP of the next free box on the map side, at once (R23, R24).
 * Nothing happens if they already have it, every box is taken, or they have finished.
 * Shadow only occupies the complete-track box and receives no VP (02 §8).
 * @param {import('./state.js').Context} ctx
 * @param {number} player
 * @param {'complete-track' | 'topple-two' | 'middle-island'} id
 */
export function claimAchievement(ctx, player, id) {
	const { state } = ctx;
	const seat = seatOf(state, player);
	// Shadow can block a track-completion box but never earns its VP or the other achievements (02 §8, §9.9).
	if (seat.kind === 'shadow' && id !== 'complete-track') {
		return;
	}
	const claimed = state.achievements[id];
	const boxes = /** @type {import('./data/achievements.js').Achievement} */ (
		ACHIEVEMENTS.find((a) => a.id === id)
	).vp[state.map];
	if (
		claimed.includes(player) ||
		claimed.length >= boxes.length ||
		seat.finished
	) {
		return;
	}
	const amount = seat.kind === 'shadow' ? 0 : boxes[claimed.length];
	claimed.push(player);
	emit(state, {
		type: 'achievementClaimed',
		player,
		achievement: id,
		vp: amount,
	});
	if (seat.kind !== 'shadow') {
		vp(
			ctx,
			player,
			amount,
			/** @type {any} */ ({ origin: 'achievements' })
		);
	}
}

/**
 * How many outposts a player has toppled that are still toppled. A toppled Nomads piece is no outpost (#20 design §8).
 * For Automa, only personally toppled human outposts count (02 §8); Shadow outposts do not.
 * @param {import('./state.js').State} state
 * @param {number} player
 * @returns {number}
 */
export function toppledBy(state, player) {
	const automa = seatOf(state, player).kind === 'automa';
	let count = 0;
	for (const hex of Object.values(state.hexes)) {
		for (const outpost of hex.outposts) {
			if (
				outpost.toppled &&
				outpost.toppledBy === player &&
				!outpost.piece &&
				(!automa || seatOf(state, outpost.seat).kind === 'player')
			) {
				count += 1;
			}
		}
	}
	return count;
}

/**
 * Claims "topple two opponent outposts" for a player who has toppled two that are still toppled.
 * @param {import('./state.js').Context} ctx
 * @param {number} player
 */
export function checkToppleTwo(ctx, player) {
	if (toppledBy(ctx.state, player) >= 2) {
		claimAchievement(ctx, player, 'topple-two');
	}
}
