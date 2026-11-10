// The Psionics' pick of the 2 drawn (F&F, #40; R74): one kept, the other shuffled back into its stack. Tiles go to the
// supply, or on to the card or civilization that drew them (`then.use`); a tech card or masterpiece goes on to the
// invent, the reservation or the creation that drew it.
import { PlayerError } from '../errors.js';
import { emit } from '../events.js';
import { playerSeat } from '../state.js';
import { shuffle } from '../random.js';
import { triggered } from '../abilities.js';
import { inventCard } from '../effects/tech.js';
import { reserveTech } from '../effects/reserved.js';
import { takeMasterpiece } from '../masterpieces.js';
import { useTile } from '../effects/tile-uses.js';

/** @type {import('../state.js').DecisionKind} */
export const chooseSample = {
	// What was drawn is its player's to see; the other goes back unseen.
	hidden: ['options'],
	answers(state, decision) {
		return decision.options.map((/** @type {number | string} */ item) => ({
			item,
		}));
	},
	check(state, decision, answer) {
		if (!decision.options.includes(answer.item)) {
			throw new PlayerError('Keep one of the two you drew.');
		}
	},
	resolve(ctx, decision, answer) {
		const player = /** @type {number} */ (decision.player);
		const { supply } = ctx.state;
		const others = decision.options.filter(
			(/** @type {number | string} */ t) => t !== answer.item
		);
		if (decision.stack === 'tech') {
			supply.tech.deck = shuffle(
				[...supply.tech.deck, ...others],
				ctx.random
			);
			if (decision.then?.reserve) {
				reserveTech(
					ctx,
					player,
					decision.then.reserve,
					'deck',
					answer.item
				);
				return;
			}
			const { left, options } = decision.then.invent;
			inventCard(
				ctx,
				player,
				{ card: 'deck' },
				left,
				options,
				answer.item
			);
			return;
		}
		if (decision.stack === 'masterpieces') {
			const pile =
				/** @type {NonNullable<typeof supply.masterpieces>} */ (
					supply.masterpieces
				);
			pile.deck = shuffle([...pile.deck, ...others], ctx.random);
			takeMasterpiece(ctx, player, 'deck', answer.item);
			return;
		}
		/** @type {'territory' | 'space'} */
		const stack = decision.stack;
		const seat = playerSeat(ctx.state, player);
		seat[stack === 'territory' ? 'territoryTiles' : 'spaceTiles'].push(
			answer.item
		);
		supply[stack] = shuffle([...supply[stack], ...others], ctx.random);
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
		// Pushed after what answers the gain, so the card or civilization that drew the tile uses it first.
		if (decision.then?.use) {
			useTile(
				ctx,
				player,
				decision.then.use,
				answer.item,
				decision.then.source
			);
		}
	},
};
