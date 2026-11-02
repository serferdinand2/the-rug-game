// The Spies (03 §1.3, §1.8): on income turns 2-5 a token on one of four options, each once, gains a benefit from a neighbour of their choice, and they may then look at that neighbour's hand.
import { emit } from '../events.js';
import { playerSeat } from '../state.js';
import { neighbours } from '../income.js';
import { askSlot } from '../decisions/choose-slot.js';
import { visibleCards } from '../tapestry.js';
import { copyAbility } from '../effects/tapestry.js';
import { useTechBenefit } from '../effects/tech.js';
import { benefitOps, isActivated } from '../movement.js';
import { tapestryCard } from '../data/tapestry-cards.js';
import { TERRITORY_TILES } from '../data/territory-tiles.js';
import { spaceTile } from '../data/space-tiles.js';
import { techCard } from '../data/tech-cards.js';
import { TRACK_IDS } from '../data/ids.js';

/** @typedef {import('../data/ids.js').TrackId} TrackId */

/**
 * One option, as the card numbers it: 1 a WHEN PLAYED card, 2 a tile, 3 a track space, 4 a tech card (03 §1.3).
 * @typedef {1 | 2 | 3 | 4} SpiesOption
 */

/**
 * An ongoing space tile option 2 took, and the neighbour whose supply holds it.
 * @typedef {{ tile: number, from: number }} Watched
 */

/**
 * The Spies' own state.
 * @typedef {Object} SpiesData
 * @property {SpiesOption[]} used - The options a token covers, in the order used; each is used once a game
 * @property {Watched[]} watching - The ongoing space tiles option 2 took; abilities.js gives the Spies each one's VP while it stays in that neighbour's supply (03 §1.5)
 */

/**
 * What an option takes, and from which neighbour (`player`): a card on their mat (1), a tile in their supply (2), the
 * space of one of their tokens (3), or one of their tech cards with the icon its row gives (4).
 * @typedef {{ player: number, card: string }
 *   | { player: number, stack: 'territory' | 'space', tile: number }
 *   | { player: number, track: TrackId, space: number }
 *   | { player: number, card: string, icon: 'circle' | 'square' }} Target
 */

/**
 * The options in the card's order.
 * @type {readonly SpiesOption[]}
 */
export const SPIES_OPTIONS = Object.freeze(
	/** @type {SpiesOption[]} */ ([1, 2, 3, 4])
);

/** The purpose of each option's question of what to take, for the panel. */
const TARGET_PURPOSES = /** @type {Readonly<Record<number, string>>} */ (
	Object.freeze({
		1: 'spiesCard',
		2: 'spiesTile',
		3: 'spiesSpace',
		4: 'spiesTech',
	})
);

/**
 * The Spies' state of a player.
 * @param {import('../state.js').State} state
 * @param {number} player
 * @returns {SpiesData}
 */
function dataOf(state, player) {
	return playerSeat(state, player).civData.spies;
}

/**
 * What one neighbour offers an option, in the order shown: (1) their face-up WHEN PLAYED cards, as visibleCards()
 * gives them; (2) their territory tiles, then their space tiles; (3) each of their tokens past the start, in track
 * order and then from the lowest, except a space the Spies already activated this turn (R19, as Trade Economy);
 * (4) their middle-row cards for the circle, then their top-row cards for the square, leaving out a landmark card,
 * whose square gives nothing (03 §1.3).
 * @param {import('../state.js').State} state
 * @param {number} player - The Spies
 * @param {SpiesOption} option
 * @param {number} from - The neighbour
 * @returns {Target[]}
 */
function targetsFrom(state, player, option, from) {
	const seat = playerSeat(state, from);
	if (option === 1) {
		return visibleCards(state)
			.filter(
				({ player: owner, card }) =>
					owner === from && tapestryCard(card).timing === 'played'
			)
			.map(({ card }) => ({ player: from, card }));
	}
	if (option === 2) {
		return [
			...seat.territoryTiles.map((tile) => ({
				player: from,
				stack: /** @type {const} */ ('territory'),
				tile,
			})),
			...seat.spaceTiles.map((tile) => ({
				player: from,
				stack: /** @type {const} */ ('space'),
				tile,
			})),
		];
	}
	if (option === 3) {
		return TRACK_IDS.flatMap((track) =>
			[...new Set(seat.tracks[track])]
				.sort((a, b) => a - b)
				.filter(
					(space) =>
						space > 0 && !isActivated(state, player, track, space)
				)
				.map((space) => ({ player: from, track, space }))
		);
	}
	return [
		...seat.tech.middle.map((card) => ({
			player: from,
			card,
			icon: /** @type {const} */ ('circle'),
		})),
		...seat.tech.top
			.filter((card) => techCard(card).landmark === undefined)
			.map((card) => ({
				player: from,
				card,
				icon: /** @type {const} */ ('square'),
			})),
	];
}

/**
 * What an option can take now, from each neighbour in seat order. Only player seats count until #31 adds the bots.
 * @param {import('../state.js').State} state
 * @param {number} player
 * @param {SpiesOption} option
 * @returns {Target[]}
 */
function targets(state, player, option) {
	const near = neighbours(state, player);
	return state.seats
		.filter((seat) => seat.kind === 'player' && near.includes(seat.seat))
		.flatMap(({ seat }) => targetsFrom(state, player, option, seat));
}

/**
 * Covers the option picked (`slot`) with a token, then asks what to take, from which neighbour, a lone target taken
 * without asking.
 * @type {import('../state.js').AutomaticKind}
 */
export function spiesOption(ctx, op) {
	const player = /** @type {number} */ (op.player);
	/** @type {SpiesOption} */
	const option = op.slot;
	dataOf(ctx.state, player).used.push(option);
	askSlot(ctx, player, {
		options: targets(ctx.state, player, option),
		purpose: TARGET_PURPOSES[option],
		then: { kind: 'spiesTake', option },
	});
}

/**
 * Gains what the option takes (`slot`, a Target) as the Spies' own, the neighbour keeping it: (1) the card's ability, copied as the Heralds copy one, with no card of the Spies behind it, so a THIS ERA card
 * copied through Espionage lasts until their next income turn (03 §1.8); (2) the tile's benefit, the tile staying in
 * the neighbour's supply, where an ongoing one is watched; (3) the space's benefit with no bonus for anyone, which
 * activates it for the Spies (R19); (4) the card's benefit for its row. Then the look at that neighbour's hand.
 * @type {import('../state.js').AutomaticKind}
 */
export function spiesTake(ctx, op) {
	const { state } = ctx;
	const player = /** @type {number} */ (op.player);
	/** @type {SpiesOption} */
	const option = op.option;
	const { player: from, ...target } = op.slot;
	emit(state, { type: 'spiesUsed', player, option, from, ...target });
	// Pushed first, so the benefit pushed on top of it resolves before the look.
	ctx.push([{ player, kind: 'spiesLookOffer', from }]);
	if (option === 1) {
		copyAbility(ctx, player, null, target.card);
		return;
	}
	if (option === 2) {
		gainTile(ctx, player, from, target.stack, target.tile);
		return;
	}
	if (option === 3) {
		const { track, space } = target;
		state.activated.push({ player, track, space });
		emit(state, { type: 'spaceActivated', player, track, space });
		ctx.push(benefitOps(state, player, track, space));
		return;
	}
	useTechBenefit(ctx, player, target.card, target.icon);
}

/**
 * Option 2's benefit: a territory tile's, or a space tile's as exploring it gives (its VP the map's); an ongoing space
 * tile has none at once, and is watched instead.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {number} from - The neighbour whose supply holds the tile
 * @param {'territory' | 'space'} stack
 * @param {number} tile
 */
function gainTile(ctx, player, from, stack, tile) {
	if (stack === 'territory') {
		ctx.push([
			{
				player,
				kind: 'effects',
				effects: structuredClone(TERRITORY_TILES[tile - 1].benefit),
			},
		]);
		return;
	}
	const { benefit, ordered, ongoing } = spaceTile(tile);
	if (ongoing) {
		dataOf(ctx.state, player).watching.push({ tile, from });
	}
	if (benefit.length > 0) {
		ctx.push([
			{
				player,
				kind: 'effects',
				effects: structuredClone(benefit),
				ordered,
				source: { spaceTile: tile },
			},
		]);
	}
}

/**
 * After the benefit, the Spies may look at the hand of the neighbour they took from. Hand sizes are public, so an
 * empty hand asks nothing.
 * @type {import('../state.js').AutomaticKind}
 */
export function spiesLookOffer(ctx, op) {
	/** @type {number} */
	const from = op.from;
	if (playerSeat(ctx.state, from).hand.length === 0) {
		return;
	}
	askSlot(ctx, /** @type {number} */ (op.player), {
		options: [from],
		optional: true,
		purpose: 'spiesLook',
		then: { kind: 'spiesLook' },
	});
}

/**
 * The look at the neighbour's hand (`slot`, their seat): the cards go to the Spies alone, as the event's secret, so
 * undo closes after it (#24).
 * @type {import('../state.js').AutomaticKind}
 */
export function spiesLook(ctx, op) {
	/** @type {number} */
	const from = op.slot;
	emit(ctx.state, {
		type: 'handSeen',
		player: op.player,
		from,
		secret: { cards: [...playerSeat(ctx.state, from).hand] },
	});
}

/** @type {import('./civ.js').Civ} */
export const spies = {
	id: 'spies',
	// Solo play leaves them out (03 §1.7); #31 reads this.
	solo: false,
	incomeTurns: [2, 3, 4, 5],
	setup(ctx, player) {
		playerSeat(ctx.state, player).civData.spies =
			/** @type {SpiesData} */ ({
				used: [],
				watching: [],
			});
	},
	// You may put a token on an option not yet used, among those with something to take from a neighbour.
	income(ctx, player) {
		const { state } = ctx;
		const { used } = dataOf(state, player);
		askSlot(ctx, player, {
			options: SPIES_OPTIONS.filter(
				(option) =>
					!used.includes(option) &&
					targets(state, player, option).length > 0
			),
			optional: true,
			purpose: 'spies',
			then: { kind: 'spiesOption' },
		});
	},
	// The current rules: lose any 1 resource at the end of income turn 1 (03 FF.8.3, R34).
	adjustment: {
		firstTurnEnd(ctx, player) {
			ctx.push([
				{ player, kind: 'effects', effects: [{ lose: { any: 1 } }] },
			]);
		},
	},
};
