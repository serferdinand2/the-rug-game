// Playing tapestry cards: the slot they go on, the abilities they run, and the THIS ERA abilities they start and end (design §5, §7).
import { emit } from './events.js';
import { playerSeat } from './state.js';
import { tapestryCard } from './data/tapestry-cards.js';

/**
 * Puts a card on top of one of a player's era slots. Covering the card of the active THIS ERA ability ends it,
 * since only the top card of a slot is active (01 §9.2). A card face up then has its ability; face down it has none.
 * The caller takes the card from wherever it was (the hand, or the deck for a face-down card).
 * @param {import('./state.js').Context} ctx
 * @param {number} player
 * @param {string} card
 * @param {number} era - 1 to 4
 * @param {boolean} [faceDown]
 */
export function playTapestry(ctx, player, card, era, faceDown = false) {
	const seat = playerSeat(ctx.state, player);
	const slot = seat.incomeMat.tapestry[era - 1];
	const covered = slot.at(-1);
	slot.push(card);
	if (faceDown) {
		seat.incomeMat.faceDown.push(card);
	}
	emit(ctx.state, {
		type: 'tapestryPlayed',
		player,
		era,
		card: faceDown ? null : card,
		faceDown,
	});
	if (covered !== undefined && seat.era?.card === covered) {
		endEra(ctx, player);
	}
	if (!faceDown) {
		ctx.push([{ player, kind: 'tapestryAbility', card, era }]);
	}
}

/**
 * The era a card played "on top of your current tapestry" goes onto, which is the player's income turn (R25):
 * none in era 1, the era's own slot in eras 2 to 4 (still empty during step 1), and in income turn 5
 * the era-4 slot under current rules or none under the original ones.
 * @param {import('./state.js').State} state
 * @param {number} player
 * @returns {number | null}
 */
export function currentEra(state, player) {
	const turns = playerSeat(state, player).incomeTurns;
	if (turns >= 2 && turns <= 4) {
		return turns;
	}
	if (turns >= 5 && state.version === 'current') {
		return 4;
	}
	return null;
}

/**
 * The tapestry cards anyone can see: each player seat's top card of each slot, in seat and era order.
 * A face-down top card shows nothing, and covered cards are out of sight.
 * @param {import('./state.js').State} state
 * @returns {{ player: number, card: string, era: number }[]}
 */
export function visibleCards(state) {
	/** @type {{ player: number, card: string, era: number }[]} */
	const cards = [];
	for (const seat of state.seats) {
		if (seat.kind !== 'player') {
			continue;
		}
		const { tapestry, faceDown } = playerSeat(state, seat.seat).incomeMat;
		tapestry.forEach((slot, i) => {
			const top = slot.at(-1);
			if (top !== undefined && !faceDown.includes(top)) {
				cards.push({ player: seat.seat, card: top, era: i + 1 });
			}
		});
	}
	return cards;
}

/**
 * Makes a THIS ERA ability the player's active one. Only one is active at a time, so one still active ends first.
 * @param {import('./state.js').Context} ctx
 * @param {number} player
 * @param {string | null} card - The card on the income mat whose covering ends it
 * @param {string} ability - The card whose rules apply
 */
export function startEra(ctx, player, card, ability) {
	endEra(ctx, player);
	playerSeat(ctx.state, player).era = { card, ability };
	emit(ctx.state, { type: 'eraStarted', player, card, ability });
}

/**
 * Ends the player's active THIS ERA ability, if there is one.
 * @param {import('./state.js').Context} ctx
 * @param {number} player
 */
export function endEra(ctx, player) {
	const seat = playerSeat(ctx.state, player);
	if (!seat.era) {
		return;
	}
	const { card, ability } = seat.era;
	seat.era = null;
	emit(ctx.state, { type: 'eraEnded', player, card, ability });
}

/**
 * A card's ability, once it is played face up (design §7): a THIS ERA card becomes the active ability,
 * then the card's `played` effects run. `ability` names the card whose rules apply when it isn't `card` (Espionage).
 * @type {import('./state.js').AutomaticKind}
 */
export function tapestryAbility(ctx, op) {
	const player = /** @type {number} */ (op.player);
	/** @type {string | null} */
	const card = op.card;
	const ability = /** @type {string} */ (op.ability ?? card);
	const data = tapestryCard(ability);
	if (data.timing === 'era') {
		startEra(ctx, player, card, ability);
	}
	if (data.played.length > 0) {
		ctx.push([
			{
				player,
				kind: 'effects',
				effects: structuredClone(data.played),
				ordered: data.ordered,
				source: { tapestry: card ?? ability },
			},
		]);
	}
}
