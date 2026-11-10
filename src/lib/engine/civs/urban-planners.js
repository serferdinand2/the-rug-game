// The Urban Planners (A&A, #37; 03 §2.4): one more landmark card, landmarks kept on the mat to place later (R130), and VP for the largest group of connected landmarks in the capital at the end.
import { emit } from '../events.js';
import { playerSeat } from '../state.js';
import { landmarkCells, landmarkSpots } from '../city.js';
import { askSlot } from '../decisions/choose-slot.js';
import { infrastructureUpgrade } from '../landmark-cards.js';
import { offer } from './civ.js';

/** @typedef {{ stored: string[] }} PlannersData - The landmarks kept on the mat, in the order stored */

/**
 * The Urban Planners' extra landmark card, after the draft or when gained (03 §2.4): a card of the landmark deck,
 * chosen; with none left, they may discard this civilization and gain another.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 */
export function plannersCard(ctx, player) {
	if (ctx.state.supply.landmarkCards.length > 0) {
		infrastructureUpgrade(
			ctx,
			player,
			{ purpose: 'urbanPlanners' },
			/** @type {any} */ ({})
		);
		return;
	}
	ctx.push([
		offer(
			ctx.state,
			player,
			[{ discardCiv: { civ: 'urban-planners' } }, { gainCiv: {} }],
			'plannersSwap'
		),
	]);
}

/**
 * The after-setup step of A&A games: each player who starts with the Urban Planners picks their extra card, once the
 * draft is done.
 * @param {import('../state.js').Context} ctx
 */
export function plannersCards(ctx) {
	for (const seat of [...ctx.state.seats].reverse()) {
		if (
			seat.kind === 'player' &&
			playerSeat(ctx.state, seat.seat).civs.includes('urban-planners')
		) {
			plannersCard(ctx, seat.seat);
		}
	}
}

/**
 * Keeps a gained landmark on the Urban Planners' mat, to place in the capital later (03 §2.4).
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {string} landmark
 */
export function storeLandmark(ctx, player, landmark) {
	/** @type {PlannersData} */
	const data = playerSeat(ctx.state, player).civData['urban-planners'];
	data.stored.push(landmark);
	emit(ctx.state, { type: 'landmarkStored', player, landmark });
}

/**
 * Whether the Urban Planners' mat may take a gained landmark.
 * @param {import('../state.js').State} state
 * @param {number} player
 * @returns {boolean}
 */
export function plannersStore(state, player) {
	const seat = playerSeat(state, player);
	return (
		seat.civs.includes('urban-planners') &&
		seat.civData['urban-planners'] !== undefined
	);
}

/**
 * Offers the stored landmarks that fit the capital, one at a time, any number (R130: at the start of a turn of theirs
 * and before they end it). The player may stop.
 * @type {import('../state.js').AutomaticKind}
 */
export function plannersOffer(ctx, op) {
	const player = /** @type {number} */ (op.player);
	const seat = playerSeat(ctx.state, player);
	/** @type {PlannersData | undefined} */
	const data = seat.civData['urban-planners'];
	if (!data || seat.finished) {
		return;
	}
	const fits = data.stored.filter(
		(landmark) => landmarkSpots(seat, landmark).length > 0
	);
	askSlot(ctx, player, {
		options: [...new Set(fits)],
		optional: true,
		purpose: 'plannersPlace',
		then: { kind: 'plannersPlaced' },
	});
}

/**
 * Takes a stored landmark off the mat to place it in the capital, then offers the others again.
 * @type {import('../state.js').AutomaticKind}
 */
export function plannersPlaced(ctx, op) {
	const player = /** @type {number} */ (op.player);
	/** @type {PlannersData} */
	const data = playerSeat(ctx.state, player).civData['urban-planners'];
	data.stored.splice(data.stored.indexOf(op.slot), 1);
	emit(ctx.state, { type: 'landmarkUnstored', player, landmark: op.slot });
	ctx.push([
		{ player, kind: 'placeLandmark', landmark: op.slot, capitalOnly: true },
		{ player, kind: 'plannersOffer' },
	]);
}

/**
 * The number of landmarks in the largest orthogonally connected group in a seat's capital (03 §2.4).
 * @param {import('../state.js').PlayerSeat} seat
 * @returns {number}
 */
export function plannersGroup(seat) {
	const pieces = seat.capital.landmarks;
	const cells = pieces.map(
		(piece) => new Set(landmarkCells(piece).map((c) => `${c.row},${c.col}`))
	);
	const touches = (/** @type {number} */ a, /** @type {number} */ b) =>
		[...cells[a]].some((key) => {
			const [row, col] = key.split(',').map(Number);
			return [
				[row - 1, col],
				[row + 1, col],
				[row, col - 1],
				[row, col + 1],
			].some(([r, c]) => cells[b].has(`${r},${c}`));
		});
	/** @type {Set<number>} */
	const seen = new Set();
	let largest = 0;
	for (let start = 0; start < pieces.length; start++) {
		if (seen.has(start)) {
			continue;
		}
		const group = [start];
		seen.add(start);
		for (let i = 0; i < group.length; i++) {
			for (let other = 0; other < pieces.length; other++) {
				if (!seen.has(other) && touches(group[i], other)) {
					seen.add(other);
					group.push(other);
				}
			}
		}
		largest = Math.max(largest, group.length);
	}
	return largest;
}

/** @type {import('./civ.js').Civ} */
export const urbanPlanners = {
	id: 'urban-planners',
	setup(ctx, player, midGame) {
		playerSeat(ctx.state, player).civData['urban-planners'] =
			/** @type {PlannersData} */ ({ stored: [] });
		// At the start, the after-setup step picks the card once the draft is done.
		if (midGame) {
			plannersCard(ctx, player);
		}
	},
	hooks: {
		// R130: before the turn ends, then, at the end of the final income turn, the largest group's VP.
		turnEnding(state, owner, { player }) {
			if (owner !== player) {
				return [];
			}
			const seat = playerSeat(state, owner);
			/** @type {import('../state.js').NewOperation[]} */
			const ops = [{ player: owner, kind: 'plannersOffer' }];
			const group = plannersGroup(seat);
			if (
				state.turnKind === 'income' &&
				seat.incomeTurns === 5 &&
				group > 0
			) {
				ops.push({
					player: owner,
					kind: 'effects',
					effects: [{ vp: group * group }],
				});
			}
			return ops;
		},
	},
	adjustment: {
		// Current rules (F&F p.32): 1 resource of your choice with 1-3 players, 2 with 4-5.
		setup(ctx, player) {
			ctx.push([
				{
					player,
					kind: 'effects',
					effects: [
						{ gain: { any: ctx.state.seats.length >= 4 ? 2 : 1 } },
					],
				},
			]);
		},
	},
};
