// The income turn: its steps by income turn number, and the spaces the income mat shows (01 §4.2, §5).
import { emit } from './events.js';
import { playerSeat, seatOf } from './state.js';
import { hasEra } from './abilities.js';
import { takeTapestryCard } from './effects/gain.js';
import { endEra, playTapestry } from './tapestry.js';
import { INCOME_MAT, TAPESTRY_SLOTS } from './data/income-mat.js';
import { BUILDING_IDS } from './data/ids.js';

/** @typedef {import('./data/ids.js').BuildingId} BuildingId */

/**
 * One income step: the income turns it applies to, and what it does.
 * @typedef {{ turns: number[], run: (ctx: import('./state.js').Context, player: number, turn: number) => void }} IncomeStep
 */

/** The spaces of a building row, so a row with `left` buildings shows spaces 1 to 6 − `left` (01 §5). */
const ROW_SPACES = 6;

/**
 * The spaces of a row that no building covers: space 1 always, and one more for each building taken.
 * @param {import('./state.js').PlayerSeat} seat
 * @param {BuildingId} row
 * @returns {readonly import('./data/income-mat.js').IncomeSpace[]}
 */
export function exposedSpaces(seat, row) {
	return INCOME_MAT[row].slice(0, ROW_SPACES - seat.incomeMat.buildings[row]);
}

/**
 * The income or score effects of every exposed space, row by row.
 * @param {import('./state.js').State} state
 * @param {number} player
 * @param {'income' | 'score'} part
 * @returns {import('./data/effects.js').Effect[]}
 */
function exposedEffects(state, player, part) {
	const seat = playerSeat(state, player);
	return BUILDING_IDS.flatMap((row) =>
		exposedSpaces(seat, row).flatMap((space) => space[part])
	);
}

/**
 * The operation that runs exposed effects as one ordered list, or none for an empty list.
 * @param {number} player
 * @param {import('./data/effects.js').Effect[]} effects
 * @returns {import('./state.js').NewOperation[]}
 */
function orderedOps(player, effects) {
	if (effects.length === 0) {
		return [];
	}
	return [
		{
			player,
			kind: 'effects',
			effects: structuredClone(effects),
			ordered: true,
		},
	];
}

/**
 * Step 4: the exposed income icons, then what the active THIS ERA ability makes of them (design §8):
 * Capitalism's 2 VP per coin icon, or Mercantilism's choice to convert up to 1 food per food icon.
 * @type {IncomeStep['run']}
 */
function incomeStep(ctx, player) {
	const { state } = ctx;
	const effects = exposedEffects(state, player, 'income');
	const ops = orderedOps(player, effects);
	const icons = (/** @type {'coin' | 'food'} */ id) =>
		effects.reduce(
			(sum, effect) =>
				sum + ('gain' in effect ? (effect.gain[id] ?? 0) : 0),
			0
		);
	const coins = icons('coin');
	if (hasEra(state, player, 'capitalism') && coins > 0) {
		ops.push({ player, kind: 'effects', effects: [{ vp: 2 * coins }] });
	}
	const food = icons('food');
	if (hasEra(state, player, 'mercantilism') && food > 0) {
		ops.push({ player, kind: 'chooseConversion', max: food });
	}
	ctx.push(ops);
}

/**
 * A seat's neighbours: the seats directly before and after it in seat order, each once (01 §4.2).
 * In a 2-player game the one opponent is both; alone, a seat has none until #31 adds the bots.
 * @param {import('./state.js').State} state
 * @param {number} player
 * @returns {number[]}
 */
export function neighbours(state, player) {
	const { seats } = state;
	const at = seats.findIndex((s) => s.seat === player);
	const around = [
		seats[(at - 1 + seats.length) % seats.length].seat,
		seats[(at + 1) % seats.length].seat,
	];
	return [...new Set(around)].filter((seat) => seat !== player);
}

/**
 * Step 2: the first-of-neighbours bonus, then the era's tapestry card from the hand, or face down from the deck.
 * @type {IncomeStep['run']}
 */
function tapestryStep(ctx, player, turn) {
	const { state } = ctx;
	const seat = playerSeat(state, player);
	/** @type {import('./state.js').NewOperation[]} */
	const ops = [];
	const bonus = TAPESTRY_SLOTS[turn - 1].firstBonus;
	const first = neighbours(state, player).every(
		(n) => seatOf(state, n).incomeTurns < turn
	);
	if (bonus && first) {
		emit(state, { type: 'firstBonus', player, era: turn });
		ops.push({
			player,
			kind: 'effects',
			effects: [{ gain: structuredClone(bonus) }],
			ordered: true,
		});
	}
	if (seat.hand.length > 0) {
		ops.push({
			player,
			kind: 'chooseTapestry',
			options: [...seat.hand],
			era: turn,
		});
	} else {
		ops.push({ player, kind: 'faceDownTapestry', era: turn });
	}
	ctx.push(ops);
}

/**
 * With an empty hand, the top card of the deck goes onto the era's slot face down, with no ability (01 §4.2).
 * Its id stays in the state, listed in `faceDown`, and view() hides it from everyone.
 * @type {import('./state.js').AutomaticKind}
 */
export function playFaceDown(ctx, op) {
	const player = /** @type {number} */ (op.player);
	const card = takeTapestryCard(ctx);
	if (card === undefined) {
		return;
	}
	playTapestry(ctx, player, card, op.era, true);
}

/**
 * The income steps in order. Later issues insert theirs before 'finish', which must stay last,
 * such as A&A's masterpieces before civilization abilities.
 */
export const INCOME_STEPS = [
	'eraEnd',
	'civAbilities',
	'tapestry',
	'upgrade',
	'score',
	'income',
	'finish',
];

/** @type {Record<string, IncomeStep>} */
export const INCOME_STEP_KINDS = {
	// Before step 1: the THIS ERA ability of the last era ends (01 §9.2).
	eraEnd: {
		turns: [2, 3, 4, 5],
		run(ctx, player) {
			endEra(ctx, player);
		},
	},
	// Step 1: the civilization abilities, which #20 builds.
	civAbilities: {
		turns: [2, 3, 4, 5],
		run(ctx, player, turn) {
			ctx.push([{ player, kind: 'civAbilities', turn }]);
		},
	},
	// Step 2: the first-of-neighbours bonus and the era's tapestry card.
	tapestry: {
		turns: [2, 3, 4],
		run: tapestryStep,
	},
	// Step 3: an optional upgrade (#18), then the exposed VP icons.
	upgrade: {
		turns: [2, 3, 4, 5],
		run(ctx, player) {
			ctx.push([
				{
					player,
					kind: 'effects',
					effects: [{ upgrade: { optional: true } }],
					ordered: true,
				},
			]);
		},
	},
	score: {
		turns: [2, 3, 4, 5],
		run(ctx, player) {
			ctx.push(
				orderedOps(player, exposedEffects(ctx.state, player, 'score'))
			);
		},
	},
	// Step 4: the exposed income icons, then Capitalism and Mercantilism.
	income: {
		turns: [1, 2, 3, 4],
		run: incomeStep,
	},
	// After income turn 5 the player takes no more turns (01 §4.3). A THIS ERA ability played during it ends here,
	// so it never outlives its player.
	finish: {
		turns: [5],
		run(ctx, player) {
			endEra(ctx, player);
			playerSeat(ctx.state, player).finished = true;
			emit(ctx.state, { type: 'playerFinished', player });
		},
	},
};

/**
 * Starts a player's next income turn: its number goes up, and the steps for that number follow.
 * @param {import('./state.js').Context} ctx
 * @param {number} player
 */
export function startIncomeTurn(ctx, player) {
	const seat = playerSeat(ctx.state, player);
	seat.incomeTurns += 1;
	const turn = seat.incomeTurns;
	emit(ctx.state, { type: 'incomeTurnStarted', player, turn });
	const steps = INCOME_STEPS.filter((id) =>
		INCOME_STEP_KINDS[id].turns.includes(turn)
	);
	ctx.push([{ player, kind: 'incomeSteps', turn, steps }]);
}

/**
 * Runs the first step of an `incomeSteps` operation; the rest wait under whatever it pushes.
 * @type {import('./state.js').AutomaticKind}
 */
export function runIncomeSteps(ctx, op) {
	const [step, ...rest] = op.steps;
	if (!step) {
		return;
	}
	if (rest.length) {
		const { id: _id, batch: _batch, ...kept } = op;
		ctx.push([{ ...kept, steps: rest }]);
	}
	const kind = INCOME_STEP_KINDS[step];
	if (!kind) {
		throw new Error(`There is no income step ${step}.`);
	}
	// A step after 'finish' would run for a finished player, whose effects are all skipped.
	if (step === 'finish' && rest.length > 0) {
		throw new Error(
			`The income step 'finish' must come last, not before ${rest.join(', ')}.`
		);
	}
	kind.run(ctx, /** @type {number} */ (op.player), op.turn);
}
