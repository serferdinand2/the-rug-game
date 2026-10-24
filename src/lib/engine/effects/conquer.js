// The conquer effect, the conquer dice and the black die's "?": take a territory, then roll for its reward (R8, R16, R17, R107).
import { emit } from '../events.js';
import { playerSeat } from '../state.js';
import { TERRITORY_TILES } from '../data/territory-tiles.js';
import { RED_DIE, BLACK_DIE } from '../data/dice.js';
import { conquerTargets, loneOpponent } from '../map.js';

/**
 * Conquers a hex: an outpost goes on it, and an opponent's lone outpost topples. The dice follow (the defender's
 * response question will wait between the two).
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
	ctx.push([{ player, kind: 'conquerDice', hex, both }]);
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
 * The automatic operation after a conquest: roll both dice, then give both faces or let the player pick one (01 §7.3).
 * The dice always roll, even after a trap.
 * @type {import('../state.js').AutomaticKind}
 */
export function conquerDice(ctx, op) {
	const player = /** @type {number} */ (op.player);
	const hex = /** @type {string} */ (op.hex);
	const trapped = ctx.state.hexes[hex].outposts.some(
		(o) => o.seat === player && o.toppled
	);
	emit(ctx.state, { type: 'conquered', player, hex, trapped });
	const red = ctx.random(6);
	const black = ctx.random(6);
	emit(ctx.state, { type: 'conquerDiceRolled', player, red, black });
	if (op.both) {
		// Red then black: neither face can change the other's, so there is nothing to order.
		ctx.push([
			{
				player,
				kind: 'effects',
				effects: [
					structuredClone(RED_DIE[red]),
					structuredClone(BLACK_DIE[black]),
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
