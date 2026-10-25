// The conquer effect, the conquer dice and the black die's "?": take a territory, then roll for its reward (R8, R16, R17, R107).
import { emit } from '../events.js';
import { playerSeat, isPlayerSeat } from '../state.js';
import { TERRITORY_TILES } from '../data/territory-tiles.js';
import { RED_DIE, BLACK_DIE } from '../data/dice.js';
import { claimAchievement, checkToppleTwo } from '../achievements.js';
import { MAPS } from '../data/maps.js';
import { conquerTargets, loneOpponent } from '../map.js';

/**
 * Conquers a hex: an outpost goes on it, and an opponent's lone outpost topples. The dice follow (a defender who qualifies is asked for a response between the two).
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {string} hex
 * @param {'always' | 'ifOpponent' | undefined} bothDice
 */
export function conquerHex(ctx, player, hex, bothDice) {
	const state = ctx.state;
	// R17: "if an opponent controlled it" is judged now, before any trap.
	const opponent = loneOpponent(state, hex, player);
	const both =
		bothDice === 'always' ||
		(bothDice === 'ifOpponent' && opponent !== null);
	playerSeat(state, player).outposts -= 1;
	state.hexes[hex].outposts.push({ seat: player, toppled: false });
	emit(state, { type: 'outpostPlaced', player, hex });
	if (opponent !== null) {
		const lone = state.hexes[hex].outposts[0];
		lone.toppled = true;
		lone.toppledBy = player;
		emit(state, {
			type: 'outpostToppled',
			player: opponent,
			hex,
			by: player,
		});
	}
	const dice = { player, kind: 'conquerDice', hex, both };
	if (opponent !== null && asksResponse(state, opponent)) {
		// The question goes on top of the dice, which wait for the answer. It is asked whatever the defender holds, so
		// the table learns nothing about their hand.
		ctx.push([
			{ player: opponent, kind: 'chooseResponse', attacker: player, hex },
			dice,
		]);
		return;
	}
	ctx.push([dice]);
}

/**
 * Whether the defender is asked for a response: a player seat with at least 1 tapestry card that is still playing, or
 * under the Original rules, finished (R108). Hand sizes are public, so skipping an empty hand reveals nothing.
 * @param {import('../state.js').State} state
 * @param {number} defender
 * @returns {boolean}
 */
function asksResponse(state, defender) {
	if (!isPlayerSeat(state, defender)) {
		return false;
	}
	const seat = playerSeat(state, defender);
	return (
		seat.hand.length > 0 && (!seat.finished || state.version === 'original')
	);
}

/**
 * The response cards in a player's hand, in hand order. In the base game these are the traps.
 * @param {import('../state.js').State} state
 * @param {number} defender
 * @returns {string[]}
 */
export function responseCards(state, defender) {
	return playerSeat(state, defender).hand.filter((card) =>
		card.startsWith('trap-')
	);
}

/**
 * The conquer effect. With no outpost left or no target it does nothing; with one target it conquers at once;
 * otherwise its player chooses.
 * @type {import('../state.js').EffectHandler}
 */
export function conquer(ctx, player, value) {
	const anywhere = value?.anywhere === true;
	const bothDice = value?.bothDice;
	const targets =
		playerSeat(ctx.state, player).outposts > 0
			? conquerTargets(ctx.state, player, anywhere)
			: [];
	if (targets.length === 0) {
		emit(ctx.state, { type: 'noConquer', player });
		return;
	}
	if (targets.length === 1) {
		conquerHex(ctx, player, targets[0], bothDice);
		return;
	}
	ctx.push([{ player, kind: 'chooseConquer', anywhere, bothDice }]);
}

/**
 * The automatic operation after a conquest: roll both dice, then give both faces (black first) or let the player pick one (01 §7.3).
 * The dice always roll, even after a trap.
 * @type {import('../state.js').AutomaticKind}
 */
export function conquerDice(ctx, op) {
	const player = /** @type {number} */ (op.player);
	const hex = /** @type {string} */ (op.hex);
	// The outpost just placed is the player's last one on the hex (outposts are appended), so an older toppled one
	// of theirs there is not a trap.
	const placed = ctx.state.hexes[hex].outposts.findLast(
		(o) => o.seat === player
	);
	const trapped = placed !== undefined && placed.toppled;
	emit(ctx.state, { type: 'conquered', player, hex, trapped });
	// The conquest is over, so a topple a trap undid no longer counts (design §9).
	if (hex === MAPS[ctx.state.map].middle && !trapped) {
		claimAchievement(ctx, player, 'middle-island');
	}
	// The attacker first, then the others with an outpost here in seat order.
	const others = new Set(
		ctx.state.hexes[hex].outposts
			.map((o) => o.seat)
			.filter((seat) => seat !== player)
			.sort((a, b) => a - b)
	);
	for (const seat of [player, ...others]) {
		checkToppleTwo(ctx, seat);
	}
	const red = ctx.random(6);
	const black = ctx.random(6);
	emit(ctx.state, { type: 'conquerDiceRolled', player, red, black });
	if (op.both) {
		// Black then red: black's "?" can lead to a conquer that adds a territory, which red's "1 VP per territory"
		// should count. Nothing in black's chain can reduce what red counts, so black first is never worse. The list is
		// ordered, so nothing asks.
		ctx.push([
			{
				player,
				kind: 'effects',
				effects: [
					structuredClone(BLACK_DIE[black]),
					structuredClone(RED_DIE[red]),
				],
				ordered: true,
				source: { hex },
			},
		]);
		return;
	}
	ctx.push([{ player, kind: 'chooseDie', hex, red, black }]);
}

/**
 * The black die's "?": the benefit printed on the conquered territory tile. A printed territory gives nothing (R8);
 * after a trap the tile's benefit still comes (R107, as on BGA).
 * @type {import('../state.js').EffectHandler}
 */
export function tileBenefit(ctx, player, value, op) {
	const hex = /** @type {{ hex: string }} */ (op.source).hex;
	const number = ctx.state.hexes[hex].tile;
	const tile = number !== null && number <= 48 ? number : null;
	emit(ctx.state, { type: 'tileBenefit', player, hex, tile });
	if (tile !== null) {
		ctx.push([
			{
				player,
				kind: 'effects',
				effects: structuredClone(TERRITORY_TILES[tile - 1].benefit),
				source: { hex },
			},
		]);
	}
}
