// A human chooses a face-up Hucksters tile instead of drawing one on an advance turn (#34).
import { huckstersOffers, takeHuckstersOffer } from '../automa-expansion-pp.js';
import { triggered } from '../abilities.js';
import { psionic } from '../civs/psionics.js';
import { gainTiles, sampleTiles } from '../effects/gain.js';
import { drawTileFor, useTile } from '../effects/tile-uses.js';
import { PlayerError } from '../errors.js';
import { emit } from '../events.js';
import { playerSeat } from '../state.js';

/** @typedef {'territory' | 'space'} TileStack */

/** Queue the next tile of an ordered sequence, preserving its following effects. */
/** @param {import('../state.js').Context} ctx @param {import('../state.js').Operation} op */
function continueTiles(ctx, op) {
	const [first, ...rest] = op.steps;
	const steps =
		first.count > 1
			? [{ ...first, count: first.count - 1 }, ...rest]
			: rest;
	if (steps.length)
		ctx.push([{ player: op.player, kind: 'huckstersTileGain', steps }]);
}

/** Resolves a tile gain or opens a choice before any tile is drawn. */
/** @type {import('../state.js').AutomaticKind} */
export function huckstersTileGain(ctx, op) {
	const player = /** @type {number} */ (op.player);
	const first = op.steps[0];
	if (!first) return;
	/** @type {TileStack} */
	const stack = first.stack;
	if (huckstersOffers(ctx.state, player, stack).length) {
		ctx.push([
			{ player, kind: 'chooseHuckstersTile', steps: op.steps, stack },
		]);
		return;
	}
	// Keep existing aggregate gains and Psionics behaviour when no pool tile is offered.
	if (op.steps.length > 1)
		ctx.push([
			{ player, kind: 'huckstersTileGain', steps: op.steps.slice(1) },
		]);
	if (psionic(ctx.state, player))
		sampleTiles(ctx, player, stack, first.count);
	else gainTiles(ctx, player, stack, first.count);
}

/** @type {import('../state.js').DecisionKind} */
export const chooseHuckstersTile = {
	hidden: [],
	answers(state, op) {
		const player = /** @type {number} */ (op.player);
		/** @type {TileStack} */
		const stack = op.stack;
		return [
			// A player can decline even when the supply is empty.
			{ pile: 'supply' },
			...huckstersOffers(state, player, stack).map(
				({ player: owner, item }) => ({
					pile: 'hucksters',
					owner,
					item,
				})
			),
		];
	},
	check(state, op, answer) {
		const valid = chooseHuckstersTile
			.answers(state, op)
			.some(
				(a) =>
					a.pile === answer.pile &&
					a.owner === answer.owner &&
					a.item === answer.item
			);
		if (!valid)
			throw new PlayerError(
				'Choose the supply stack or an available Hucksters tile.'
			);
	},
	resolve(ctx, op, answer) {
		const player = /** @type {number} */ (op.player);
		/** @type {TileStack} */
		const stack = op.stack;
		continueTiles(ctx, op);
		if (answer.pile === 'supply') {
			if (op.then) {
				drawTileFor(
					ctx,
					player,
					stack,
					op.then.use,
					op.then.source,
					true
				);
				return;
			}
			if (psionic(ctx.state, player)) sampleTiles(ctx, player, stack, 1);
			else gainTiles(ctx, player, stack, 1);
			return;
		}
		if (
			typeof answer.item !== 'number' ||
			typeof answer.owner !== 'number' ||
			!takeHuckstersOffer(
				ctx.state,
				player,
				answer.owner,
				stack,
				answer.item
			)
		)
			throw new PlayerError(
				'That Hucksters tile is no longer available.'
			);
		const seat = playerSeat(ctx.state, player);
		seat[stack === 'territory' ? 'territoryTiles' : 'spaceTiles'].push(
			answer.item
		);
		emit(ctx.state, {
			type: 'tilesGained',
			player,
			stack,
			tiles: [answer.item],
		});
		ctx.push(
			triggered(ctx.state, 'tilesGained', {
				player,
				stack,
				tiles: [answer.item],
			})
		);
		if (op.then)
			useTile(ctx, player, op.then.use, answer.item, op.then.source);
	},
};
