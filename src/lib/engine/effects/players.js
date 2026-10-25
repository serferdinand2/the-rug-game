// The effects that reach other players: others (Coal Baron, Diplomacy, Steam Tycoon), sharedAdvance (Age of Discovery,
// Oil Magnate) and the trading cards, Guilds and Olympic Host (design §4, §8).
import { opponents } from '../abilities.js';
import { neighbours } from '../income.js';
import { canPay } from '../payment.js';
import { emit } from '../events.js';
import { chooseTrade } from '../decisions/choose-trade.js';
import { askTrack } from '../decisions/choose-track.js';
import { playerSeat, seatOf } from '../state.js';
import { rollScience } from './research.js';
import { BUILDING_IDS, TRACK_IDS } from '../data/ids.js';

/**
 * Pushes one `effects` operation per target, so a finished player is skipped by `runEffects`.
 * Neighbours go right, then left; `all` goes from the player clockwise, the player first.
 * @type {import('../state.js').EffectHandler}
 */
export function others(ctx, player, value, op) {
	const targets =
		value.who === 'neighbours'
			? neighbours(ctx.state, player)
			: [player, ...opponents(ctx.state, player)];
	ctx.push(
		targets.map((target) => ({
			player: target,
			kind: 'effects',
			effects: structuredClone(value.effects),
			ordered: true,
			source: op.source,
		}))
	);
}

/**
 * You advance with the benefit, then the others advance on the same track without it (Age of Discovery, Oil Magnate).
 * The track is rolled on the science die, or chosen among the tracks where the player has a token.
 * @type {import('../state.js').EffectHandler}
 */
export function sharedAdvance(ctx, player, value) {
	const next = {
		kind: 'sharedAdvanceOn',
		others: value.others,
		optional: value.optional ?? false,
	};
	if (value.track === 'roll') {
		rollScience(ctx, player, next);
		return;
	}
	const seat = seatOf(ctx.state, player);
	const options = TRACK_IDS.filter((track) => seat.tracks[track].length > 0);
	askTrack(ctx, player, options, 'sharedAdvance', next);
}

/**
 * The advances of a shared advance on its track: the player's with the benefit and bonus, then each opponent's
 * clockwise or each neighbour's, right then left, without either. Each is its player's own `effects` operation,
 * so a finished player is skipped, and a blocked one has nothing to move (02 §3).
 * @type {import('../state.js').AutomaticKind}
 */
export function sharedAdvanceOn(ctx, op) {
	const player = /** @type {number} */ (op.player);
	const { track, optional } = op;
	const targets =
		op.others === 'neighbours'
			? neighbours(ctx.state, player)
			: opponents(ctx.state, player);
	ctx.push([
		{
			player,
			kind: 'effects',
			effects: [{ advance: { tracks: [track], optional } }],
			ordered: true,
		},
		...targets.map((target) => ({
			player: target,
			kind: 'effects',
			effects: [
				{ advance: { tracks: [track], noBenefit: true, optional } },
			],
			ordered: true,
		})),
	]);
}

/**
 * Offers the player the trades they can pay for, one of which they must take unless `optional` (Guilds, Olympic Host).
 * Nothing affordable says so; a mandatory trade with one way to pay is made at once.
 * @type {import('../state.js').EffectHandler}
 */
export function trade(ctx, player, value, op) {
	const affordable = value.offers.some((/** @type {any} */ offer) =>
		canPay(ctx.state, player, offer.pay)
	);
	if (!affordable) {
		emit(ctx.state, { type: 'noTrade', player });
		return;
	}
	const decision = /** @type {any} */ ({
		player,
		kind: 'chooseTrade',
		offers: structuredClone(value.offers),
		optional: value.optional ?? false,
		...(value.host !== undefined && { host: value.host }),
		source: op.source,
	});
	// A mandatory trade with one way to pay is made without asking.
	const answers = chooseTrade.answers(ctx.state, decision);
	if (!decision.optional && answers.length === 1) {
		chooseTrade.resolve(ctx, decision, answers[0]);
		return;
	}
	ctx.push([decision]);
}

/**
 * Olympic Host: the host, then each opponent clockwise, may pay a worker for 10 VP; then the host's reward.
 * @type {import('../state.js').EffectHandler}
 */
export function olympicHost(ctx, player, value, op) {
	const offer = { pay: { worker: 1 }, gain: [{ vp: 10 }] };
	ctx.push([
		...[player, ...opponents(ctx.state, player)].map((target) => ({
			player: target,
			kind: 'effects',
			effects: [
				{
					trade: {
						offers: [structuredClone(offer)],
						optional: true,
						host: player,
					},
				},
			],
			ordered: true,
			source: op.source,
		})),
		{ player, kind: 'olympicHostEnd', since: ctx.state.seq },
	]);
}

/**
 * Olympic Host's reward: a building if an opponent paid, and a coin if none did or no building type is left.
 * @type {import('../state.js').AutomaticKind}
 */
export function olympicHostEnd(ctx, op) {
	const player = /** @type {number} */ (op.player);
	const paid = ctx.state.events.some(
		(event) =>
			event.type === 'tradeMade' &&
			event.seq > op.since &&
			event.host === player &&
			event.player !== player
	);
	const { buildings } = playerSeat(ctx.state, player).incomeMat;
	const left = BUILDING_IDS.some((type) => buildings[type] > 0);
	ctx.push([
		{
			player,
			kind: 'effects',
			effects:
				paid && left ? [{ anyBuilding: {} }] : [{ gain: { coin: 1 } }],
			ordered: true,
			source: op.source,
		},
	]);
}
