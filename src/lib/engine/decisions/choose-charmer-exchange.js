// Charmers: optionally swap a freshly gained tapestry for a public face-up charm (R93).
import { PlayerError } from '../errors.js';
import { playerSeat } from '../state.js';
import { emit } from '../events.js';
import { triggered } from '../abilities.js';
import {
	exchangeCharmerCard,
	hasFfAutomaCivilization,
} from '../automa-expansion-ff.js';

/** The exchange is offered once for each card gained on the human's own turn.
 * The newly gained card remains private until it is discarded.
 * @param {import('../state.js').State} state
 * @param {number} player
 * @param {readonly string[]} cards
 * @returns {import('../state.js').NewOperation[]}
 */
export function charmerExchangeOps(state, player, cards) {
	if (state.phase !== 'play' || state.current !== player) return [];
	const bot = /** @type {any} */ (
		state.seats.find(
			(seat) =>
				seat.kind === 'automa' &&
				hasFfAutomaCivilization(seat, 'charmers')
		)
	);
	if (!bot?.faceUpCharms?.length || playerSeat(state, player).finished)
		return [];
	return cards.map((card) => ({
		player,
		kind: 'chooseCharmerExchange',
		bot: bot.seat,
		gained: card,
	}));
}

/** @type {import('../state.js').DecisionKind} */
export const chooseCharmerExchange = {
	hidden: ['gained'],
	answers(state, decision) {
		const player = /** @type {number} */ (decision.player);
		const bot = /** @type {any} */ (
			state.seats.find(
				(seat) => seat.seat === decision.bot && seat.kind === 'automa'
			)
		);
		if (!bot || !playerSeat(state, player).hand.includes(decision.gained))
			return [{ card: null }];
		return [
			{ card: null },
			...(bot.faceUpCharms ?? []).map((/** @type {string} */ charm) => ({
				card: charm,
			})),
		];
	},
	check(state, decision, answer) {
		if (
			!chooseCharmerExchange
				.answers(state, decision)
				.some((a) => a.card === answer.card)
		)
			throw new PlayerError(
				'Choose a face-up charm, or keep the tapestry card.'
			);
	},
	resolve(ctx, decision, answer) {
		if (answer.card === null) return;
		const player = /** @type {number} */ (decision.player);
		const bot = /** @type {any} */ (
			ctx.state.seats.find(
				(seat) => seat.seat === decision.bot && seat.kind === 'automa'
			)
		);
		if (
			!bot ||
			!exchangeCharmerCard(
				playerSeat(ctx.state, player).hand,
				ctx.state.supply.tapestry.discard,
				bot.faceUpCharms,
				decision.gained,
				answer.card
			)
		)
			throw new PlayerError(
				'That tapestry exchange is no longer available.'
			);
		emit(ctx.state, {
			type: 'cardsDiscarded',
			player,
			deck: 'tapestry',
			cards: [decision.gained],
		});
		emit(ctx.state, {
			type: 'cardsDrawn',
			player,
			count: 1,
			secret: { cards: [answer.card] },
		});
		emit(ctx.state, {
			type: 'automaCharmTaken',
			player,
			bot: bot.seat,
			card: answer.card,
		});
		ctx.push(
			triggered(ctx.state, 'tapestryGained', {
				player,
				cards: [answer.card],
				skipCharmerExchange: true,
			})
		);
	},
};
