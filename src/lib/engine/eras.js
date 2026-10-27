// The THIS ERA cards' triggers: what a card's ability does when something happens to a player (design §6).
import { emit } from './events.js';
import { playerSeat } from './state.js';
import { currentEra } from './tapestry.js';
import { techCard } from './data/tech-cards.js';
import { TRACKS } from './data/tracks.js';

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
		// An Inventors token's upgrade isn't the holder's own (BGA, #20 design §7).
		upgraded: (_state, owner, { player, inventors }) =>
			owner === player && inventors === undefined ? [vp(owner, 3)] : [],
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
		// so nothing that answers upgrades (Golden Age) runs for it. An Inventors token's upgrade isn't the opponent's
		// own, as for Golden Age (03 §1.8's Recyclers ruling reads the same way).
		upgraded(state, owner, { player, card, icon, inventors }) {
			if (
				owner === player ||
				inventors !== undefined ||
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
	'marriage-of-state': {
		benefitGained(state, owner, { player, track, space }) {
			const era = playerSeat(state, owner).era;
			if (
				owner === player ||
				!era ||
				era.opponent !== player ||
				era.track !== track
			) {
				return [];
			}
			return [
				{
					player: owner,
					kind: 'copyBenefit',
					track,
					space,
					from: player,
				},
			];
		},
	},
	capitalism: {
		buildingGained: (_state, owner, { player, building }) =>
			owner === player && building === 'market'
				? [effects(owner, [{ gain: { coin: 1 } }])]
				: [],
	},
	// placePiece and placeInColumn alone fire piecePlaced, so a building beside the mat or on the map scores nothing (R13's reading).
	monarchy: {
		piecePlaced: (_state, owner, { player, building }) =>
			owner === player && building !== undefined ? [vp(owner, 3)] : [],
	},
	terraforming: {
		piecePlaced: (_state, owner, { player, impassable }) =>
			owner === player && impassable > 0 ? [vp(owner, 5)] : [],
	},
	tyranny: {
		// Playing a card covers Tyranny, which ends it; a copy with no card behind it (the Heralds on Espionage) ends
		// when the offer is taken (endsEra), so this happens at most once either way.
		tapestryGained(state, owner, { player, cards }) {
			const era = currentEra(state, owner);
			if (owner !== player || era === null) {
				return [];
			}
			return [
				{
					player: owner,
					kind: 'chooseTapestry',
					options: [...cards],
					era,
					optional: true,
					afterPlay: [{ vp: 5 }],
					endsEra: true,
				},
			];
		},
	},
};

/**
 * Marriage of State: the holder gains the benefit of a track space the named opponent just gained, without its bonus.
 * It goes through no `benefitOps`, so no `benefitGained` fires and no copy sets off another (design §8).
 * @type {import('./state.js').AutomaticKind}
 */
export function copyBenefit(ctx, op) {
	const player = /** @type {number} */ (op.player);
	const { track, space, from } = op;
	const entry =
		TRACKS[/** @type {import('./data/ids.js').TrackId} */ (track)][space];
	emit(ctx.state, { type: 'benefitCopied', player, track, space, from });
	ctx.push([
		{
			player,
			kind: 'effects',
			effects: structuredClone(entry.benefit),
			ordered: entry.ordered,
			source: { track, space },
		},
	]);
}
