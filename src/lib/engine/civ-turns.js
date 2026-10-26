// Civilizations in play: their setup and adjustments, step 1 of income turns, the end of income turn 1, and gaining one (design §5, §6).
import { emit } from './events.js';
import { shuffle } from './random.js';
import { playerSeat } from './state.js';
import { civsOf, findCiv } from './civs/index.js';

/**
 * The after-setup step: a group with one lane per player, so they decide at the same time. Each lane runs the setup of
 * every civilization its player holds, then the current version's adjustment (R34). It comes after the reveal,
 * because what it does shows on the board.
 * @param {import('./state.js').Context} ctx
 */
export function setupCivs(ctx) {
	const { state } = ctx;
	ctx.pushGroup(
		state.seats
			.filter((s) => s.kind === 'player')
			.map(({ seat: player }) => ({
				player,
				ops: [
					...playerSeat(state, player).civs.map((civ) => ({
						player,
						kind: 'civSetup',
						civ,
						midGame: false,
					})),
					{ player, kind: 'civAdjust', phase: 'setup' },
				],
			}))
	);
}

/**
 * One civilization's setup, at the start or when gained mid-game.
 * @type {import('./state.js').AutomaticKind}
 */
export function civSetup(ctx, op) {
	findCiv(op.civ).setup?.(ctx, /** @type {number} */ (op.player), op.midGame);
}

/**
 * The current version's adjustment of the civilization chosen at setup, for one phase: 'setup' or 'firstTurnEnd' (R34).
 * The original 2019 printing has none, and a civilization gained later never gets one.
 * @type {import('./state.js').AutomaticKind}
 */
export function civAdjust(ctx, op) {
	const { state } = ctx;
	if (state.version !== 'current') {
		return;
	}
	const player = /** @type {number} */ (op.player);
	const [first] = civsOf(state, player);
	first?.adjustment?.[/** @type {'setup' | 'firstTurnEnd'} */ (op.phase)]?.(
		ctx,
		player
	);
}

/**
 * The income step after income: each civilization's end of income turn 1, in the order held, then the adjustment.
 * @param {import('./state.js').Context} ctx
 * @param {number} player
 */
export function endFirstIncomeTurn(ctx, player) {
	ctx.push([
		...civsOf(ctx.state, player)
			.filter((civ) => civ.firstTurnEnd)
			.map((civ) => ({ player, kind: 'civFirstTurnEnd', civ: civ.id })),
		{ player, kind: 'civAdjust', phase: 'firstTurnEnd' },
	]);
}

/**
 * One civilization's end of income turn 1, such as the Heralds' Maker of Fire play.
 * @type {import('./state.js').AutomaticKind}
 */
export function civFirstTurnEnd(ctx, op) {
	findCiv(op.civ).firstTurnEnd?.(ctx, /** @type {number} */ (op.player));
}

/**
 * Step 1 of an income turn: the abilities of the civilizations that fire on this turn and haven't yet (`done`).
 * With several, the player chooses which comes next (01 §4.2). Each comes back here after it, so a civilization
 * gained during step 1 still fires that turn.
 * @type {import('./state.js').AutomaticKind}
 */
export function civAbilities(ctx, op) {
	const player = /** @type {number} */ (op.player);
	/** @type {string[]} */
	const done = op.done ?? [];
	const ready = civsOf(ctx.state, player)
		.filter(
			(civ) =>
				civ.incomeTurns?.includes(op.turn) && !done.includes(civ.id)
		)
		.map((civ) => civ.id);
	if (ready.length === 1) {
		useCivAbility(ctx, player, ready[0], op.turn, done);
	} else if (ready.length > 1) {
		ctx.push([
			{
				player,
				kind: 'chooseCivAbility',
				options: ready,
				turn: op.turn,
				done: [...done],
			},
		]);
	}
}

/**
 * Runs one civilization's step-1 ability, then comes back to the others.
 * @param {import('./state.js').Context} ctx
 * @param {number} player
 * @param {string} civ
 * @param {number} turn
 * @param {string[]} done - The civilizations already used this step
 */
export function useCivAbility(ctx, player, civ, turn, done) {
	ctx.push([
		{ player, kind: 'civIncome', civ, turn },
		{ player, kind: 'civAbilities', turn, done: [...done, civ] },
	]);
}

/**
 * One civilization's step-1 ability.
 * @type {import('./state.js').AutomaticKind}
 */
export function civIncome(ctx, op) {
	const player = /** @type {number} */ (op.player);
	emit(ctx.state, { type: 'civAbilityUsed', player, civ: op.civ });
	findCiv(op.civ).income?.(ctx, player, op.turn);
}

/**
 * Takes the top civilization of the deck. An empty deck is first rebuilt from the discards, shuffled, except the one
 * discarded last: a civilization that discards itself when gained (Mystics) is never drawn again at once.
 * @param {import('./state.js').Context} ctx
 * @returns {string | undefined} Undefined when nothing is left to draw
 */
function drawCiv(ctx) {
	const { state } = ctx;
	const { supply } = state;
	if (supply.civs.length === 0 && supply.civDiscard.length > 1) {
		supply.civs = shuffle(supply.civDiscard.slice(0, -1), ctx.random);
		supply.civDiscard = supply.civDiscard.slice(-1);
		emit(state, {
			type: 'deckShuffled',
			deck: 'civs',
			count: supply.civs.length,
		});
	}
	return supply.civs.shift();
}

/**
 * The gainCiv effect: a random civilization from the deck joins the player's, to the left of the others (02 §1),
 * and its mid-game setup runs. With nothing left to draw, nothing is gained.
 * With the civ-draft variant the player draws 2 and keeps 1 (`chooseCiv` with `midGame`); with only 1 to draw, it is
 * gained without a question (#53 design §4.2).
 * @type {import('./state.js').EffectHandler}
 */
export function gainCiv(ctx, player) {
	const { state } = ctx;
	const count = state.variants.includes('civ-draft') ? 2 : 1;
	/** @type {string[]} */
	const drawn = [];
	while (drawn.length < count) {
		const civ = drawCiv(ctx);
		if (civ === undefined) {
			break;
		}
		drawn.push(civ);
	}
	if (drawn.length === 0) {
		emit(state, { type: 'noCivLeft', player });
		return;
	}
	if (drawn.length === 1) {
		gainDrawnCiv(ctx, player, drawn[0]);
		return;
	}
	emit(state, {
		type: 'civsDrawn',
		player,
		count: drawn.length,
		secret: { civs: drawn },
	});
	ctx.push([{ player, kind: 'chooseCiv', options: drawn, midGame: true }]);
}

/**
 * A drawn civilization joins the player's, and its mid-game setup runs.
 * @param {import('./state.js').Context} ctx
 * @param {number} player
 * @param {string} civ
 */
export function gainDrawnCiv(ctx, player, civ) {
	playerSeat(ctx.state, player).civs.push(civ);
	emit(ctx.state, { type: 'civGained', player, civ });
	ctx.push([{ player, kind: 'civSetup', civ, midGame: true }]);
}
