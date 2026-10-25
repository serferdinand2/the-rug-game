// The tapestry effects: tapestryOnTop (design §7, R25, FAQ #10), eraPartner (Alliance, Marriage of State) and discardTapestry (Democracy).
import { emit } from '../events.js';
import { playerSeat } from '../state.js';
import { eraOf, opponents } from '../abilities.js';
import { currentEra, playTapestry, visibleCards } from '../tapestry.js';
import { tapestryCard } from '../data/tapestry-cards.js';
import { TRACK_IDS } from '../data/ids.js';

/** @typedef {import('../data/ids.js').TrackId} TrackId */
/** @typedef {{ player: number, track?: TrackId }} Partner - The opponent, and for Marriage of State the track */

/**
 * Plays a card from the hand on top of the current era's slot (Nuclear Bomb, Printing Press). Nothing is played
 * with an empty hand (FAQ #10) or with no current era (R25); the only card in hand is played without asking.
 * @type {import('../state.js').EffectHandler}
 */
export function tapestryOnTop(ctx, player) {
	const era = currentEra(ctx.state, player);
	const { hand } = playerSeat(ctx.state, player);
	if (era === null || hand.length === 0) {
		emit(ctx.state, { type: 'noTapestryOnTop', player });
		return;
	}
	if (hand.length === 1) {
		playTapestry(ctx, player, hand.splice(0, 1)[0], era);
		return;
	}
	ctx.push([{ player, kind: 'chooseTapestry', options: [...hand], era }]);
}

/**
 * Chooses the opponent, and with `track` the track, that the player's active THIS ERA ability names (design §7).
 * A track another active Marriage of State already names is left out (02 §3's ruling on a copied Marriage of State).
 * One option is taken without asking; with none, nothing happens.
 * @type {import('../state.js').EffectHandler}
 */
export function eraPartner(ctx, player, value) {
	const { state } = ctx;
	const named = new Set(
		state.seats
			.filter((seat) => seat.seat !== player)
			.map((seat) => eraOf(state, seat.seat))
			.filter((era) => era?.ability === 'marriage-of-state')
			.map((era) => era?.track)
	);
	/** @type {Partner[]} */
	const options = opponents(state, player).flatMap((opponent) =>
		value?.track === true
			? TRACK_IDS.filter((track) => !named.has(track)).map((track) => ({
					player: opponent,
					track,
				}))
			: [{ player: opponent }]
	);
	if (options.length === 1) {
		setPartner(ctx, player, options[0]);
		return;
	}
	if (options.length > 1) {
		ctx.push([{ player, kind: 'choosePartner', options }]);
	}
}

/**
 * Writes the chosen partner into the player's active THIS ERA ability.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {Partner} partner
 */
export function setPartner(ctx, player, { player: opponent, track }) {
	const era = /** @type {import('../state.js').Era} */ (
		playerSeat(ctx.state, player).era
	);
	era.opponent = opponent;
	if (track !== undefined) {
		era.track = track;
	}
	emit(ctx.state, {
		type: 'partnerChosen',
		player,
		opponent,
		...(track !== undefined && { track }),
	});
}

/**
 * Asks for a hand card to discard for `vpEach` VP, again after each, until the player stops or the hand is empty (Democracy).
 * @type {import('../state.js').EffectHandler}
 */
export function discardTapestry(ctx, player, value) {
	if (playerSeat(ctx.state, player).hand.length === 0) {
		return;
	}
	ctx.push([{ player, kind: 'chooseDiscard', vpEach: value.vpEach }]);
}

/**
 * Copies the ability of a visible tapestry card, the Espionage card's own included but never an Espionage (design §7).
 * One option is taken without asking; with none, nothing happens.
 * @type {import('../state.js').EffectHandler}
 */
export function copyTapestry(ctx, player, value, op) {
	const options = visibleCards(ctx.state)
		.filter(({ card }) => card !== 'espionage')
		.map(({ player: owner, card }) => ({ player: owner, card }));
	const espionage = op.source.tapestry;
	if (options.length === 0) {
		emit(ctx.state, { type: 'noCopy', player });
	} else if (options.length === 1) {
		copyAbility(ctx, player, espionage, options[0].card);
	} else {
		ctx.push([{ player, kind: 'chooseCopy', options, espionage }]);
	}
}

/**
 * Runs the copied card's ability as the player's own, on the Espionage card on their mat, or on no card (Heralds).
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {string | null} espionage - The Espionage card on the mat, whose covering ends a copied THIS ERA ability; null for a copy with no card behind it
 * @param {string} copied - The card whose ability is copied
 */
export function copyAbility(ctx, player, espionage, copied) {
	ctx.push([
		{
			player,
			kind: 'tapestryAbility',
			card: espionage,
			ability: tapestryCard(copied).id,
			// Outside the eras a card can be played in, the era only labels the copy; the last slot stands in.
			era: currentEra(ctx.state, player) ?? 4,
		},
	]);
}
