// Cross-seat effects use the same bot icon exceptions as track benefits (02 §9.4).
import { seatOf } from '../state.js';
import { refreshDisplay } from '../tech.js';
import { takeTapestryCard } from './gain.js';
import { emit } from '../events.js';

/** @type {import('../state.js').AutomaticKind} */
export function botEffects(ctx, op) {
	const bot =
		/** @type {import('../state.js').BotSeat & Record<string, any>} */ (
			seatOf(ctx.state, Number(op.player))
		);
	if (bot.finished) {
		return;
	}
	/** @type {import('../state.js').NewOperation[]} */
	const ops = [];
	const [effect, ...rest] = op.effects;
	if (!effect) {
		return;
	}
	if (rest.length) {
		const { id: _id, batch: _batch, ...kept } = op;
		ctx.push([{ ...kept, effects: rest }]);
	}
	{
		// Shared no-benefit advances still move the Shadow Empire; it gains no effects of its own.
		const move = effect.advance ?? effect.regress;
		if (move) {
			const tracks = move.tracks ?? Object.keys(bot.tracks);
			if (tracks.length === 1) {
				ops.push({
					player: bot.seat,
					kind: 'botAdvance',
					track: tracks[0],
					regress: !!effect.regress,
					benefit: !move.noBenefit,
				});
			} else {
				ops.push({
					player: bot.seat,
					kind: 'botResearch',
					tracks,
					regress: !!effect.regress,
					benefit: !move.noBenefit,
				});
			}
			ctx.push(ops);
			return;
		}
		if (bot.kind === 'shadow') {
			return;
		}
		if (effect.invent) {
			refreshDisplay(ctx);
			emit(ctx.state, { type: 'techRefreshed', player: bot.seat });
		}
		if (effect.research) {
			ops.push({
				player: bot.seat,
				kind: 'botResearch',
				benefit: !effect.research.noBenefit,
			});
		}
		if (effect.conquer) {
			ops.push({
				player: bot.seat,
				kind: 'botMap',
				action: 'conquer',
				anywhere: !!effect.conquer.anywhere,
			});
		}
		if (effect.explore) {
			ops.push({
				player: bot.seat,
				kind: 'botMap',
				action: 'explore',
				anywhere: !!effect.explore.anywhere,
			});
		}
		if (effect.gain?.tapestry) {
			const card = takeTapestryCard(ctx);
			if (card) {
				bot.trapCards.push(card);
				emit(ctx.state, {
					type: 'botTapestryGained',
					player: bot.seat,
					pile: 'trapCards',
				});
			}
		}
	}
	ctx.push(ops);
}
