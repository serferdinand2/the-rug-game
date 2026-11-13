// Fantasies & Futures Automa civilization rules (03 FF.7 §4.3; R93–R97).
// These helpers leave operation ordering, events and player decisions to their caller.
import { tapestryCard } from './data/tapestry-cards.js';
import { techCard } from './data/tech-cards.js';
import { shuffle } from './random.js';
import { spacesAdvanced } from './movement.js';
import { emit } from './events.js';
import { pay } from './payment.js';
import { drawTech } from './tech.js';
import { vp } from './effects/vp.js';
import { triggered } from './abilities.js';
import { playerSeat } from './state.js';

/** @param {any} bot @param {string} civ @returns {boolean} */
export function hasFfAutomaCivilization(bot, civ) {
	return bot?.civilization === civ || bot?.secondCivilization === civ;
}

/**
 * The Charmers take every charmed card from the tapestry deck at setup, before
 * any player's hand is dealt. Keep the separate deck private (R93).
 * @param {string[]} deck
 * @param {import('./random.js').Random} random
 * @returns {{ tapestryDeck: string[], charmDeck: string[], faceUpCharms: string[] }}
 */
export function dealCharmerDeck(deck, random) {
	/** @type {string[]} */ const charmDeck = [];
	/** @type {string[]} */ const tapestryDeck = [];
	for (const id of deck) {
		(tapestryCard(id).charms ? charmDeck : tapestryDeck).push(id);
	}
	return {
		tapestryDeck,
		charmDeck: shuffle(charmDeck, random),
		faceUpCharms: [],
	};
}

/** Reveal two and return the VP owed for all face-up charms, not just new ones.
 * @param {{charmDeck: string[], faceUpCharms: string[]}} charms
 * @returns {{revealed: string[], vp: number}}
 */
export function revealCharmerIncome(charms) {
	const revealed = charms.charmDeck.splice(0, 2);
	charms.faceUpCharms.push(...revealed);
	return { revealed, vp: charms.faceUpCharms.length };
}

/** Apply an accepted Charmers exchange, returning false for a stale choice.
 * The caller emits events and opens this choice only after a card is gained.
 * @param {string[]} hand
 * @param {string[]} discard
 * @param {string[]} faceUpCharms
 * @param {string} gained
 * @param {string} chosen
 * @returns {boolean}
 */
export function exchangeCharmerCard(
	hand,
	discard,
	faceUpCharms,
	gained,
	chosen
) {
	const handIndex = hand.indexOf(gained);
	const charmIndex = faceUpCharms.indexOf(chosen);
	if (handIndex < 0 || charmIndex < 0) return false;
	discard.push(...hand.splice(handIndex, 1));
	hand.push(...faceUpCharms.splice(charmIndex, 1));
	return true;
}

/** Time Travelers' alphabetically first title across all three rows (R95).
 * Return the location so the caller can discard it and draw in the same row,
 * using the existing tech cleanup and draw machinery without a benefit.
 * @param {{bottom: string[], middle: string[], top: string[]}} tech
 * @returns {{row: 'bottom'|'middle'|'top', index: number, card: string} | null}
 */
export function timeTravelersDiscard(tech) {
	/** @type {{row: 'bottom'|'middle'|'top', index: number, card: string}[]} */
	const cards = [];
	for (const row of /** @type {const} */ (['bottom', 'middle', 'top']))
		tech[row].forEach((card, index) => cards.push({ row, index, card }));
	cards.sort((a, b) =>
		techCard(a.card).name.localeCompare(techCard(b.card).name, 'en')
	);
	return cards[0] ?? null;
}

/** Eligible non-track 2×2 landmarks still in the shared supply (R96).
 * @param {readonly string[]} landmarks
 * @param {readonly string[]} expansions
 * @returns {string[]}
 */
export function timeTravelersLandmarks(landmarks, expansions) {
	const options = ['bakery', 'stock-market', 'treasury'];
	if (expansions.includes('pp')) options.push('monolith');
	return options.filter((id) => landmarks.includes(id));
}

/** Whether the selected track's next Erratics pair advance is skipped (R94).
 * Re-evaluate after every individual advance; it does not affect track selection
 * or advances coming from other effects such as science dice.
 * @param {any} bot
 * @param {any} human
 * @param {import('./data/ids.js').BoardTrackId} track
 * @returns {{skip: boolean, vp: number}}
 */
export function erraticsAdvance(bot, human, track) {
	const skip =
		track !== bot.favouriteTrack &&
		spacesAdvanced(bot, track) + 1 > spacesAdvanced(human, track) + 2;
	return { skip, vp: skip ? 3 : 0 };
}

/** Both Erratics and Time Travelers take one extra decision-pair advance.
 * @param {any} bot
 * @returns {number}
 */
export function ffDecisionPairAdvances(bot) {
	return (
		1 +
		Number(hasFfAutomaCivilization(bot, 'erratics')) +
		Number(hasFfAutomaCivilization(bot, 'time-travelers'))
	);
}

/** Set up the Charmers before dealing the human's first hand.
 * `view` must redact charmDeck, while faceUpCharms is public.
 * @param {import('./state.js').Context} ctx
 * @param {any} bot
 */
export function setupCharmers(ctx, bot) {
	const cards = dealCharmerDeck(ctx.state.supply.tapestry.deck, ctx.random);
	ctx.state.supply.tapestry.deck = cards.tapestryDeck;
	bot.charmDeck = cards.charmDeck;
	bot.faceUpCharms = cards.faceUpCharms;
	return gainCharmerIncome(ctx, bot);
}

/** Reveal and score the Charmers' accumulating face-up charms.
 * @param {import('./state.js').Context} ctx
 * @param {any} bot
 */
export function gainCharmerIncome(ctx, bot) {
	const result = revealCharmerIncome(bot);
	emit(ctx.state, {
		type: 'automaCharmsRevealed',
		player: bot.seat,
		cards: result.revealed,
		total: bot.faceUpCharms.length,
	});
	if (result.vp)
		vp(ctx, bot.seat, result.vp, /** @type {any} */ ({ origin: 'civ' }));
	return result;
}

/** Discard the human's first-named tech and replace it in the same row.
 * Payment cleans up flipped status and landmarks on tech cards; replacement
 * is not an invention or an upgrade and grants no benefit.
 * @param {import('./state.js').Context} ctx
 * @param {number} player
 * @returns {{ discarded: string, replacement: string | null, row: string } | null}
 */
export function resolveTimeTravelersIncome(ctx, player) {
	const seat = playerSeat(ctx.state, player);
	const first = timeTravelersDiscard(seat.tech);
	if (!first) return null;
	pay(ctx, player, { tech: [first.card] });
	const replacement = drawTech(ctx);
	if (replacement !== null)
		seat.tech[first.row].splice(first.index, 0, replacement);
	emit(ctx.state, {
		type: 'automaTechReplaced',
		player,
		discarded: first.card,
		replacement,
		row: first.row,
	});
	ctx.push(triggered(ctx.state, 'countsChanged', { player }));
	return { discarded: first.card, replacement, row: first.row };
}
