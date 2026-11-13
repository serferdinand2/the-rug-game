// Arts & Architecture's Influencers Automa civilization (#38, R59).
// Its Trendy track is independent of the Automa's favourite track.
import { askTrack } from './decisions/choose-track.js';
import { spacesAdvanced } from './movement.js';
import { tracksOf } from './tracks-in-play.js';
import { seatOf } from './state.js';
import { emit } from './events.js';
import { vp } from './effects/vp.js';

/**
 * Ask the human to mark the initial Trendy track or choose a different one.
 * The returned operation records the track on the Automa, not the human.
 * @param {import('./state.js').Context} ctx
 * @param {number} bot - The Influencers Automa seat
 * @param {boolean} [initial]
 */
export function askInfluencersTrendy(ctx, bot, initial = false) {
	const human = ctx.state.seats.find((seat) => seat.kind === 'player');
	if (!human) return;
	const automa = /** @type {any} */ (seatOf(ctx.state, bot));
	const options = tracksOf(ctx.state).filter(
		(track) => initial || track !== automa.trendyTrack
	);
	askTrack(ctx, human.seat, options, 'influencersTrendy', {
		kind: 'botInfluencersSetTrendy',
		bot,
	});
}

/** @type {import('./state.js').AutomaticKind} */
export function botInfluencersSetTrendy(ctx, op) {
	const automa = /** @type {any} */ (seatOf(ctx.state, op.bot));
	automa.trendyTrack = op.track;
	emit(ctx.state, {
		type: 'botTrendyChanged',
		player: automa.seat,
		track: op.track,
	});
}

/** The first roll settles before the condition is evaluated. @type {import('./state.js').AutomaticKind} */
export function botInfluencersIncome(ctx, op) {
	const automa = /** @type {any} */ (seatOf(ctx.state, Number(op.player)));
	ctx.push([
		{
			player: automa.seat,
			kind: 'botResearch',
			benefit: false,
			pair: automa.incomePair,
		},
		{ player: automa.seat, kind: 'botInfluencersConditional' },
		{ player: automa.seat, kind: 'botInfluencersChoose' },
	]);
}

/** @type {import('./state.js').AutomaticKind} */
export function botInfluencersConditional(ctx, op) {
	const automa = /** @type {any} */ (seatOf(ctx.state, Number(op.player)));
	const human = ctx.state.seats.find((seat) => seat.kind === 'player');
	if (!human || !automa.trendyTrack) return;
	const otherTracks = tracksOf(ctx.state).filter(
		(track) => track !== automa.trendyTrack
	);
	const trendy = spacesAdvanced(human, automa.trendyTrack);
	// Ties count: the trendy token must not be strictly ahead of every other token.
	if (!otherTracks.some((track) => spacesAdvanced(human, track) >= trendy))
		return;
	const shadow = ctx.state.seats.find((seat) => seat.kind === 'shadow');
	ctx.push([
		{
			player: automa.seat,
			kind: 'botResearch',
			benefit: true,
			pair: automa.incomePair,
		},
		...(shadow
			? [{ player: shadow.seat, kind: 'botResearch', benefit: false }]
			: []),
	]);
}

/** @type {import('./state.js').AutomaticKind} */
export function botInfluencersChoose(ctx, op) {
	askInfluencersTrendy(ctx, Number(op.player));
}

/** Muses resolve their movements before comparing the player's masterpiece count.
 * @type {import('./state.js').AutomaticKind}
 */
export function botMusesIncome(ctx, op) {
	const bot = /** @type {any} */ (seatOf(ctx.state, Number(op.player)));
	const human = ctx.state.seats.find((seat) => seat.kind === 'player');
	if (!human) return;
	const move = {
		player: bot.seat,
		kind: 'botAdvance',
		track: 'arts',
		benefit: true,
		pair: bot.incomePair,
	};
	ctx.push([
		move,
		...(bot.favouriteTrack === 'arts'
			? [
					{
						player: bot.seat,
						kind: 'botResearch',
						benefit: false,
						pair: bot.incomePair,
					},
				]
			: [{ ...move }]),
		{
			player: human.seat,
			kind: 'effects',
			effects: [{ advance: { tracks: ['arts'], noBenefit: true } }],
		},
		{ player: bot.seat, kind: 'botMusesScore' },
	]);
}

/** @type {import('./state.js').AutomaticKind} */
export function botMusesScore(ctx, op) {
	const bot = /** @type {any} */ (seatOf(ctx.state, Number(op.player)));
	const human = /** @type {import('./state.js').PlayerSeat | undefined} */ (
		ctx.state.seats.find((seat) => seat.kind === 'player')
	);
	if (
		human &&
		bot.incomeTurns >= 3 &&
		(human.masterpieces?.length ?? 0) < bot.incomeTurns - 2
	)
		vp(
			ctx,
			bot.seat,
			spacesAdvanced(bot, 'arts'),
			/** @type {any} */ ({ origin: 'civ' })
		);
}
