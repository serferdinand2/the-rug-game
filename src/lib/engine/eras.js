// The THIS ERA cards' triggers: what a card's ability does when something happens to a player (design §6).
import { playerSeat } from './state.js';
import { techCard } from './data/tech-cards.js';

/**
 * A trigger handler. It changes nothing itself: whatever it does happens in the operations it returns.
 * @typedef {(state: import('./state.js').State, owner: number, payload: Record<string, any>) => import('./state.js').NewOperation[]} Hook
 */

/**
 * The trigger handlers of each THIS ERA card, by card id and then by hook, such as `invented` or `advanced`.
 * @type {Record<string, Record<string, Hook>>}
 */
export const ERA_HOOKS = {
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
