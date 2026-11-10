// Fantasies & Futures' charms (03 FF.2.1, #39): what placing a tapestry card triggers, and the charm and ability effects.
import { emit } from './events.js';
import { playerSeat } from './state.js';
import { tapestryCard } from './data/tapestry-cards.js';

/** @typedef {{ card: string, side: 'left' | 'right' }} Charm */

/**
 * The charms a card placed on a player's era slot triggers (03 FF.2.1): its own left charm, face up and with a card in
 * the slot to its left (era 1 has none: Maker of Fire is printed, not a card); and the right charm of each face-up card
 * in that slot, covered or not, that hasn't triggered yet (R67), whether the new card is face up or down. A card face
 * down has no charms (R131). None without F&F.
 * @param {import('./state.js').State} state
 * @param {number} player
 * @param {string} card - Already on top of the slot
 * @param {number} era - 1 to 4
 * @param {boolean} faceDown
 * @returns {Charm[]}
 */
export function placementCharms(state, player, card, era, faceDown) {
	const seat = playerSeat(state, player);
	if (!seat.charmsUsed || era < 2) {
		return [];
	}
	const { tapestry, faceDown: hidden } = seat.incomeMat;
	const left = tapestry[era - 2];
	/** @type {Charm[]} */
	const charms = [];
	if (!faceDown && left.length > 0 && tapestryCard(card).charms?.left) {
		charms.push({ card, side: 'left' });
	}
	for (const neighbour of left) {
		if (
			!hidden.includes(neighbour) &&
			tapestryCard(neighbour).charms?.right &&
			!seat.charmsUsed.includes(neighbour)
		) {
			charms.push({ card: neighbour, side: 'right' });
		}
	}
	return charms;
}

/**
 * What placing a card triggers, as effects for one unordered operation: the charms, then the card's own ability when it
 * is face up. Each right charm is marked used at once, so a later placement never triggers it again; a face-up charmed
 * card marks the player as having played one (R68).
 * @param {import('./state.js').State} state
 * @param {number} player
 * @param {string} card
 * @param {number} era
 * @param {boolean} faceDown
 * @returns {import('./data/effects.js').Effect[]}
 */
export function placementEffects(state, player, card, era, faceDown) {
	const seat = playerSeat(state, player);
	const charms = placementCharms(state, player, card, era, faceDown);
	for (const charm of charms) {
		if (charm.side === 'right') {
			/** @type {string[]} */ (seat.charmsUsed).push(charm.card);
		}
	}
	if (!faceDown && seat.charmsUsed && tapestryCard(card).charms) {
		seat.playedCharmed = true;
	}
	return [
		...charms.map((charm) => ({ charm })),
		...(faceDown ? [] : [{ ability: { card, era } }]),
	];
}

/**
 * The charm effect: one card's left or right charm bonus, mandatory where possible (03 FF.2.1). Its VP is the tapestry
 * cards'.
 * @type {import('./state.js').EffectHandler}
 */
export function charm(ctx, player, value) {
	const { card, side } = /** @type {Charm} */ (value);
	const effects = tapestryCard(card).charms?.[side] ?? [];
	emit(ctx.state, { type: 'charmGained', player, card, side });
	ctx.push([
		{
			player,
			kind: 'effects',
			effects: structuredClone(effects),
			ordered: true,
			source: { tapestry: card, card, charm: side },
		},
	]);
}

/**
 * Whether a charm effect only gains, so running it before the other parts never costs the player anything.
 * @param {Charm} value
 * @param {(effect: object) => boolean} isGain - The effect runner's test for a plain gain
 * @returns {boolean}
 */
export function charmOnlyGains(value, isGain) {
	const effects = tapestryCard(value.card).charms?.[value.side] ?? [];
	return effects.length > 0 && effects.every(isGain);
}

/**
 * The ability effect: a placed card's own ability, which may come before or after its charms (03 FF.2.1).
 * @type {import('./state.js').EffectHandler}
 */
export function ability(ctx, player, value) {
	ctx.push([
		{ player, kind: 'tapestryAbility', card: value.card, era: value.era },
	]);
}
