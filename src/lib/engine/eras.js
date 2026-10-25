// The THIS ERA cards' triggers: what a card's ability does when something happens to a player (design §6).
import { playerSeat } from './state.js';
import { techCard } from './data/tech-cards.js';

/**
 * A trigger handler. It changes nothing itself: whatever it does happens in the operations it returns.
 * @typedef {(state: import('./state.js').State, owner: number, payload: Record<string, any>) => import('./state.js').NewOperation[]} Hook
 */

/**
 * An `effects` operation for a player.
 * @param {number} player
 * @param {import('./data/effects.js').Effect[]} list
 * @returns {import('./state.js').NewOperation}
 */
function effects(player, list) {
	return { player, kind: 'effects', effects: list };
}

/**
 * An `effects` operation that scores VP.
 * @param {number} player
 * @param {number} amount
 * @returns {import('./state.js').NewOperation}
 */
function vp(player, amount) {
	return effects(player, [{ vp: amount }]);
}

/**
 * The trigger handlers of each THIS ERA card, by card id and then by hook, such as `invented` or `advanced`.
 * @type {Record<string, Record<string, Hook>>}
 */
export const ERA_HOOKS = {
	academia: {
		invented: (_state, owner, { player }) =>
			owner === player ? [vp(owner, 3)] : [],
		tapestryGained: (_state, owner, { player, cards }) =>
			owner === player ? [vp(owner, 3 * cards.length)] : [],
	},
	industrialism: {
		// The card stays in the bottom row; Steam Tycoon's and Technocracy's upgrade then gives the circle again.
		invented(_state, owner, { player, card }) {
			if (owner !== player) {
				return [];
			}
			return [
				{
					player: owner,
					kind: 'effects',
					effects: structuredClone(techCard(card).circle),
					source: { tech: card, icon: 'circle' },
				},
			];
		},
	},
	'golden-age': {
		upgraded: (_state, owner, { player }) =>
			owner === player ? [vp(owner, 3)] : [],
	},
	'broker-of-peace': {
		advanced: (_state, owner, { player, track }) =>
			player !== owner && track === 'military' ? [vp(owner, 3)] : [],
	},
	empiricism: {
		advanced: (_state, owner, { player, track }) =>
			player === owner && track === 'science' ? [vp(owner, 2)] : [],
	},
	theocracy: {
		// R9's reading of "entering a tier": each first space (1, 4, 7, 10) reached or passed counts.
		advanced(_state, owner, { player, from, to }) {
			if (player !== owner) {
				return [];
			}
			const tiers = [1, 4, 7, 10].filter(
				(s) => s > from && s <= to
			).length;
			return tiers > 0 ? [vp(owner, 4 * tiers)] : [];
		},
	},
	revisionism: {
		landmarkGained: (_state, owner, { player, fromTrack }) =>
			player === owner && fromTrack
				? [effects(owner, [{ gain: { any: 1 } }])]
				: [],
		advanced: (_state, owner, { player, claimedPassed }) =>
			player === owner && claimedPassed > 0
				? [
						effects(
							owner,
							Array.from({ length: claimedPassed }, () => ({
								building: 'armory',
							}))
						),
					]
				: [],
	},
	alliance: {
		// The holder gains the benefit of the named opponent's upgrade after them. It isn't an upgrade of the holder's,
		// so nothing that answers upgrades (Golden Age) runs for it.
		upgraded(state, owner, { player, card, icon }) {
			if (
				owner === player ||
				playerSeat(state, owner).era?.opponent !== player
			) {
				return [];
			}
			const benefit =
				techCard(card)[/** @type {'circle' | 'square'} */ (icon)];
			return [
				{
					player: owner,
					kind: 'effects',
					effects: structuredClone(benefit),
					source: { tech: card, icon },
				},
			];
		},
	},
};
