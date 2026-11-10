// The Inventors (02 §1.2): a token on any tech card not in a top row upgrades it at once and waives its prerequisite for good; when an opponent's card carrying one reaches the top row, the Inventors take the card.
import { emit } from '../events.js';
import { playerSeat, seatOf } from '../state.js';
import { triggered } from '../abilities.js';
import { askSlot } from '../decisions/choose-slot.js';
import { upgradeCard } from '../effects/tech.js';
import { techCard } from '../data/tech-cards.js';
import { offer } from './civ.js';
import { isFlipped, isLocked } from '../tech.js';

/**
 * The Inventors' own state.
 * @typedef {Object} InventorsData
 * @property {number} tokens - The tokens still on the mat
 * @property {string[]} cards - The tech cards carrying an Inventors token, in the order marked; a token stays on its card when the Inventors take it
 */

/**
 * Puts an Inventors token on the card picked (`slot`, `{ player, card }`), which its owner upgrades at once. The
 * `upgraded` payload names the Inventors seat, so Golden Age gives nothing for it (BGA).
 * @type {import('../state.js').AutomaticKind}
 */
export function inventorsToken(ctx, op) {
	const player = /** @type {number} */ (op.player);
	const { player: owner, card } = op.slot;
	/** @type {InventorsData} */
	const data = playerSeat(ctx.state, player).civData.inventors;
	data.tokens -= 1;
	data.cards.push(card);
	emit(ctx.state, { type: 'inventorsMarked', player, owner, card });
	upgradeCard(ctx, owner, card, player);
}

/**
 * Takes a marked card that reached an opponent's top row (`from`) into the player's bottom row, token and all. Counts
 * change for both seats, and one round of `countsChanged` triggers follows, as after a conquest: each hook re-counts its
 * own owner whoever's change it was (Mystics). A card that has left that top row meanwhile stays where it is.
 * @type {import('../state.js').AutomaticKind}
 */
export function inventorsTake(ctx, op) {
	const { state } = ctx;
	const player = /** @type {number} */ (op.player);
	const { top } = playerSeat(state, op.from).tech;
	if (!top.includes(op.card)) {
		return;
	}
	top.splice(top.indexOf(op.card), 1);
	const taker = playerSeat(state, player);
	taker.tech.bottom.push(op.card);
	// A flipped card stays flipped: it is never upgraded again (03 FF.2.3, Inventors FAQ p29).
	const giver = playerSeat(state, op.from);
	if (giver.flippedTech?.includes(op.card)) {
		giver.flippedTech = giver.flippedTech.filter((c) => c !== op.card);
		taker.flippedTech ??= [];
		taker.flippedTech.push(op.card);
	}
	emit(state, {
		type: 'inventorsTook',
		player,
		from: op.from,
		card: op.card,
	});
	ctx.push(triggered(state, 'countsChanged', { player }));
}

/**
 * The cards the Inventors may mark: any in a bottom or middle row, theirs or an opponent's, except one Ceramics
 * upgraded this turn (#35) and an opponent's single-use card in the middle row, which the token would send to the
 * top row (03 FF.2.3: others may never upgrade a player's single-use card to the top row).
 * @param {import('../state.js').State} state
 * @param {number} player - The Inventors
 * @returns {{ player: number, card: string }[]}
 */
export function inventorsOptions(state, player) {
	return state.seats
		.filter((s) => s.kind === 'player')
		.flatMap(({ seat }) => {
			const { bottom, middle } = playerSeat(state, seat).tech;
			return (
				[
					...bottom,
					...middle.filter(
						(card) => seat === player || !techCard(card).singleUse
					),
				]
					.filter((card) => !isLocked(state, seat, card))
					// R134: nor a flipped card, which never upgrades again.
					.filter((card) => !isFlipped(state, seat, card))
					.map((card) => ({ player: seat, card }))
			);
		});
}

/** The tokens the Inventors start with, for the engine and the card (#107). */
export const INVENTORS_TOKENS = 4;

/** @type {import('./civ.js').Civ} */
export const inventors = {
	id: 'inventors',
	incomeTurns: [2, 3, 4, 5],
	setup(ctx, player) {
		playerSeat(ctx.state, player).civData.inventors =
			/** @type {InventorsData} */ ({
				tokens: INVENTORS_TOKENS,
				cards: [],
			});
	},
	// You may put a token on any tech card in a bottom or middle row, yours or an opponent's.
	income(ctx, player) {
		const { state } = ctx;
		/** @type {InventorsData} */
		const data = playerSeat(state, player).civData.inventors;
		if (data.tokens === 0) {
			return;
		}
		askSlot(ctx, player, {
			options: inventorsOptions(state, player),
			optional: true,
			purpose: 'inventors',
			then: { kind: 'inventorsToken' },
		});
	},
	hooks: {
		// An opponent's card carrying the owner's token was upgraded, after its owner's benefit. Reaching the top row, by
		// anyone: the owner takes the card, and may first gain its square once when the owner's token moved it. Under the
		// original rules the owner may gain it whoever moved it, as the 2019 text says; the current rules follow the F&F
		// rulebook r10-1, which gives it only to the card's owner (03 FF.8.2). Reaching the middle row through the
		// owner's token: the owner may gain its circle. A finished owner gets only the VP and takes no card (01 §4.3).
		upgraded(state, owner, { player, card, icon, inventors }) {
			/** @type {InventorsData | undefined} */
			const data = playerSeat(state, owner).civData.inventors;
			if (player === owner || !data?.cards.includes(card)) {
				return [];
			}
			const source = { tech: card, icon };
			if (icon === 'square') {
				/** @type {import('../state.js').NewOperation[]} */
				const ops = [];
				// R134: a single-use card's square is gained once, by its owner.
				if (
					(inventors === owner || state.version === 'original') &&
					!techCard(card).singleUse
				) {
					ops.push({
						...offer(
							state,
							owner,
							techCard(card).square,
							'civOffer',
							{ civ: 'inventors', from: player }
						),
						source,
					});
				}
				if (!seatOf(state, owner).finished) {
					ops.push({
						player: owner,
						kind: 'inventorsTake',
						from: player,
						card,
					});
				}
				return ops;
			}
			if (inventors !== owner) {
				return [];
			}
			return [
				{
					...offer(state, owner, techCard(card).circle, 'civOffer', {
						civ: 'inventors',
						from: player,
					}),
					source,
				},
			];
		},
	},
};
