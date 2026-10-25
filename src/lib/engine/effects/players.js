// The others effect (Coal Baron, Diplomacy, Steam Tycoon) and the trading cards, Guilds and Olympic Host (design §4, §8).
import { opponents } from '../abilities.js';
import { neighbours } from '../income.js';
import { canPay } from '../payment.js';
import { emit } from '../events.js';
import { playerSeat } from '../state.js';
import { BUILDING_IDS } from '../data/ids.js';

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
 * Offers the player the trades they can pay for, one of which they must take unless `optional` (Guilds, Olympic Host).
 * Nothing affordable says so.
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
	ctx.push([
		{
			player,
			kind: 'chooseTrade',
			offers: structuredClone(value.offers),
			optional: value.optional ?? false,
			...(value.host !== undefined && { host: value.host }),
			source: op.source,
		},
	]);
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
