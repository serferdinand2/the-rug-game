// The tiles a card or civilization draws to use at once (Coal Baron, Astronomy, Cartography, Alien Disclosure, the
// Werefolk): drawn here, so the Psionics draw 2 and keep 1 first (F&F, #40; R74).
import { gainTiles } from './gain.js';
import { psionic } from '../civs/psionics.js';
import { coalBaronWith } from './cards.js';
import { astronomyWith, cartographyWith } from './pp-cards.js';
import { alienDisclosureWith } from './ff-cards.js';
import { werefolkFlip } from '../civs/werefolk.js';

/** @typedef {'coalBaron' | 'astronomy' | 'cartography' | 'alienDisclosure' | 'werefolk'} TileUse */

/**
 * Draws one tile for `use`, which then takes it, or none when the stack is empty. The Psionics are first asked which of
 * 2 to keep (`chooseSample`), and the use waits for their answer.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {'territory' | 'space'} stack
 * @param {TileUse} use
 * @param {any} [source] - The effect's source, which the use's own effects keep
 */
export function drawTileFor(ctx, player, stack, use, source) {
	if (psionic(ctx.state, player)) {
		const drawn = ctx.state.supply[stack].splice(0, 2);
		if (drawn.length === 2) {
			ctx.push([
				{
					player,
					kind: 'chooseSample',
					stack,
					options: drawn,
					then: { use, ...(source !== undefined && { source }) },
				},
			]);
			return;
		}
		ctx.state.supply[stack].unshift(...drawn);
	}
	const [tile] = gainTiles(ctx, player, stack, 1);
	useTile(ctx, player, use, tile, source);
}

/**
 * What a drawn tile goes on to.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {TileUse} use
 * @param {number | undefined} tile - Undefined when none was left
 * @param {any} [source]
 */
export function useTile(ctx, player, use, tile, source) {
	switch (use) {
		case 'coalBaron':
			coalBaronWith(ctx, player, tile, source);
			return;
		case 'astronomy':
			astronomyWith(ctx, player, tile, source);
			return;
		case 'cartography':
			cartographyWith(ctx, player, tile, source);
			return;
		case 'alienDisclosure':
			alienDisclosureWith(ctx, player, tile, source);
			return;
		case 'werefolk':
			werefolkFlip(ctx, player, tile);
			return;
		default:
			throw new Error(`There is no tile use ${use}.`);
	}
}
