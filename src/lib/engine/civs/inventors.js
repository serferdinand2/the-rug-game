// The Inventors (02 §1.2): a token on any tech card not in a top row upgrades it at once and waives its prerequisite for good; when an opponent's card carrying one reaches the top row, the Inventors may gain its square and take the card.
import { emit } from '../events.js';
import { playerSeat, seatOf } from '../state.js';
import { triggered } from '../abilities.js';
import { askSlot } from '../decisions/choose-slot.js';
import { upgradeCard } from '../effects/tech.js';
import { techCard } from '../data/tech-cards.js';
import { offer } from './civ.js';

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
 * change for both, so the `countsChanged` triggers follow. A card that has left that top row meanwhile stays where it is.
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
	playerSeat(state, player).tech.bottom.push(op.card);
	emit(state, {
		type: 'inventorsTook',
		player,
		from: op.from,
		card: op.card,
	});
	ctx.push(triggered(state, 'countsChanged', { player }));
}

/** @type {import('./civ.js').Civ} */
export const inventors = {
	id: 'inventors',
	incomeTurns: [2, 3, 4, 5],
	setup(ctx, player) {
		playerSeat(ctx.state, player).civData.inventors =
			/** @type {InventorsData} */ ({ tokens: 4, cards: [] });
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
			options: state.seats
				.filter((s) => s.kind === 'player')
				.flatMap(({ seat }) => {
					const { bottom, middle } = playerSeat(state, seat).tech;
					return [...bottom, ...middle].map((card) => ({
						player: seat,
						card,
					}));
				}),
			optional: true,
			purpose: 'inventors',
			then: { kind: 'inventorsToken' },
		});
	},
	hooks: {
		// An opponent's card carrying the owner's token was upgraded, after its owner's benefit. Reaching the top row, by
		// anyone: the owner may gain its square once, then takes the card. Reaching the middle row through the owner's
		// token: the owner may gain its circle. A finished owner gets only the VP and takes no card (01 §4.3).
		upgraded(state, owner, { player, card, icon, inventors }) {
			/** @type {InventorsData | undefined} */
			const data = playerSeat(state, owner).civData.inventors;
			if (player === owner || !data?.cards.includes(card)) {
				return [];
			}
			const source = { tech: card, icon };
			if (icon === 'square') {
				const gain = {
					...offer(state, owner, techCard(card).square),
					source,
				};
				if (seatOf(state, owner).finished) {
					return [gain];
				}
				return [
					gain,
					{
						player: owner,
						kind: 'inventorsTake',
						from: player,
						card,
					},
				];
			}
			if (inventors !== owner) {
				return [];
			}
			return [{ ...offer(state, owner, techCard(card).circle), source }];
		},
	},
};
