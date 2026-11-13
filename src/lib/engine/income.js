// The income turn: its steps by income turn number, and the spaces the income mat shows (01 §4.2, §5).
import { emit } from './events.js';
import { neighbours, playerSeat, seatOf } from './state.js';
import { hasEra } from './abilities.js';
import { takeTapestryCard } from './effects/gain.js';
import { endEra, playTapestry } from './tapestry.js';
import { playsOn } from './civs/elder-ones.js';
import { askPutAway } from './civs/merfolk.js';
import { endFirstIncomeTurn } from './civ-turns.js';
import { INCOME_MAT, INSPIRED_MAT, TAPESTRY_SLOTS } from './data/income-mat.js';
import { BUILDING_IDS } from './data/ids.js';
import { artsInPlay } from './tracks-in-play.js';
import { cityPlots, seatMat } from './city.js';
import { askCloudMove } from './decisions/choose-cloud-move.js';
import { reedsVp, savannaIncome } from './ff-mats.js';

/** @typedef {import('./data/ids.js').BuildingId} BuildingId */

/**
 * One income step: the income turns it applies to, whether a game has it (`when`, all games without one), and what it
 * does.
 * @typedef {{ turns: number[], when?: (state: import('./state.js').State) => boolean, run: (ctx: import('./state.js').Context, player: number, turn: number) => void }} IncomeStep
 */

/**
 * How many income buildings a seat's mat lets it move at the start of an income turn: Cloud City's 2 (R121), else 0.
 * @param {import('./state.js').PlayerSeat} seat
 * @returns {number}
 */
function cloudMovesOf(seat) {
	return seat.capital.mat === null ? 0 : (seatMat(seat).cloudMoves ?? 0);
}

/** The spaces of a building row, so a row with `left` buildings shows spaces 1 to 6 − `left` (01 §5). */
const ROW_SPACES = 6;

/**
 * The spaces of a row that no building covers: space 1 always, and one more for each building taken. A row with the
 * player's inspiration tile shows its improved spaces (#35).
 * @param {import('./state.js').PlayerSeat} seat
 * @param {BuildingId} row
 * @returns {readonly import('./data/income-mat.js').IncomeSpace[]}
 */
export function exposedSpaces(seat, row) {
	const mat = seat.inspired?.includes(row) ? INSPIRED_MAT : INCOME_MAT;
	const left = seat.incomeMat.buildings[row];
	// The Artificers (F&F, #40): a row slid flush left covers its first spaces; a slid leftmost building covers the
	// space it moved onto and shows the one it left. The rest stay together at the row's right end.
	if (left > 0 && seat.incomeMat.flush?.[row]) {
		return mat[row].slice(left);
	}
	const slid = seat.incomeMat.slid?.[row] ?? 0;
	if (left > 0 && slid > 0) {
		const lead = ROW_SPACES - left - slid;
		return mat[row].filter(
			(_, i) => i !== lead && i < ROW_SPACES - left + 1
		);
	}
	return mat[row].slice(0, ROW_SPACES - left);
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
 * The tapestry-draft variant on income turn 1: a gain of n tapestry cards draws n + 1 and keeps n (#53 design §4.1).
 * @param {import('./data/effects.js').Effect} effect
 * @returns {import('./data/effects.js').Effect}
 */
function draftTapestry(effect) {
	if (!('gain' in effect) || !effect.gain.tapestry) {
		return effect;
	}
	const { tapestry } = effect.gain;
	return { gain: { ...effect.gain, tapestry: tapestry + 1, keep: tapestry } };
}

/**
 * Step 4: the exposed income icons, then what the active THIS ERA ability makes of them (design §8):
 * Capitalism's 2 VP per coin icon, or Mercantilism's choice to convert up to 1 food per food icon.
 * @type {IncomeStep['run']}
 */
function incomeStep(ctx, player, turn) {
	const { state } = ctx;
	const exposed = exposedEffects(state, player, 'income');
	const effects =
		turn === 1 && state.variants.includes('tapestry-draft')
			? exposed.map(draftTapestry)
			: exposed;
	const ops = orderedOps(player, effects);
	const icons = (/** @type {'coin' | 'food'} */ id) =>
		effects.reduce(
			(sum, effect) =>
				sum + ('gain' in effect ? (effect.gain[id] ?? 0) : 0),
			0
		);
	const coins = icons('coin');
	if (hasEra(state, player, 'capitalism') && coins > 0) {
		// Capitalism's VP is the tapestry card's, though it comes with the income (#29).
		ops.push({
			player,
			kind: 'effects',
			effects: [{ vp: 2 * coins }],
			origin: 'tapestry',
		});
	}
	// The Savanna: 1 resource of your choice per filled district, on income turns 2–4 (FF.6 2.5, #40).
	const savanna = turn >= 2 ? savannaIncome(playerSeat(state, player)) : 0;
	if (savanna > 0) {
		emit(state, { type: 'savannaIncome', player, districts: savanna });
		ops.push({
			player,
			kind: 'effects',
			effects: [{ gain: { any: savanna } }],
			cause: {
				incomeReason: 'From completed districts on your Savanna mat',
			},
			origin: 'capital',
		});
	}
	const food = icons('food');
	if (hasEra(state, player, 'mercantilism') && food > 0) {
		ops.push({
			player,
			kind: 'chooseConversion',
			cause: { tapestry: 'mercantilism', player },
			max: food,
			origin: 'tapestry',
		});
	}
	ctx.push(ops);
}

// A seat's neighbours, which moved to state.js (#33); importers of income.js keep finding them here.
export { neighbours };

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
			cause: {
				incomeReason:
					'From being first among your neighbours to reach this income turn',
			},
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
	'cloudMoves',
	'masterpieces',
	'lilyPads',
	'civAbilities',
	'tapestry',
	'reserved',
	'upgrade',
	'score',
	'income',
	'civFirstTurnEnd',
	'reeds',
	'finish',
];

/** @type {Record<string, IncomeStep>} */
export const INCOME_STEP_KINDS = {
	// Before step 1: the THIS ERA ability of the last era ends (01 §9.2).
	eraEnd: {
		turns: [2, 3, 4, 5],
		run(ctx, player, turn) {
			// The Elder Ones' and the Merfolk's era-4 card stays in effect through income turn 5 and after (DQ 7, #40).
			if (turn === 5 && playsOn(playerSeat(ctx.state, player))) {
				return;
			}
			endEra(ctx, player);
		},
	},
	// Step 1, first: every masterpiece held fires, in the player's order, before the civilizations; one gained meanwhile
	// fires too (03 §2.2, "step 0"). Nobody holds one at income turn 1. Only with the arts track (#35).
	// Cloud City's moves are one more item in their order (R121, #36 design §5).
	masterpieces: {
		turns: [2, 3, 4, 5],
		when: artsInPlay,
		run(ctx, player) {
			const cloud = cloudMovesOf(playerSeat(ctx.state, player));
			ctx.push([
				{
					player,
					kind: 'askMasterpiece',
					purpose: 'income',
					chosen: [],
					...(cloud && { cloud }),
				},
			]);
		},
	},
	// Cloud City: at the start of income turns 2–5, up to 2 income buildings move between clouds (R121). With the arts
	// track the masterpieces' step asks for them instead, as one more item in the masterpieces' order (#36 design §5).
	cloudMoves: {
		turns: [2, 3, 4, 5],
		when: (state) => !artsInPlay(state),
		run(ctx, player) {
			const moves = cloudMovesOf(playerSeat(ctx.state, player));
			if (moves) {
				askCloudMove(ctx, player, moves);
			}
		},
	},
	// The Swamp: at the start of the final income turn, 2 VP lost for each lily pad still showing (R52). With #35's
	// masterpieces it comes after them, as the FAQ allows either and after is never worse (#36 design §3.4).
	lilyPads: {
		turns: [5],
		run(ctx, player) {
			const seat = playerSeat(ctx.state, player);
			const penalty =
				seat.capital.mat === null
					? undefined
					: seatMat(seat).lilyPenalty;
			if (!penalty) {
				return;
			}
			const pads = cityPlots(seat).filter(
				(kind) => kind === 'lily'
			).length;
			emit(ctx.state, {
				type: 'lilyPadsCounted',
				player,
				pads,
				vp: penalty * pads,
			});
			if (pads > 0) {
				ctx.push([
					{
						player,
						kind: 'effects',
						effects: [{ vp: -penalty * pads }],
						origin: 'capital',
					},
				]);
			}
		},
	},
	// Step 1: the civilization abilities (civ-turns.js).
	civAbilities: {
		turns: [2, 3, 4, 5],
		run(ctx, player, turn) {
			ctx.push([{ player, kind: 'civAbilities', turn, origin: 'civ' }]);
		},
	},
	// Step 2: the first-of-neighbours bonus and the era's tapestry card.
	tapestry: {
		turns: [2, 3, 4],
		run: tapestryStep,
	},
	// F&F: on income turn 5, where the tapestry step would be, every item on the overlay, in the player's order (03
	// FF.2.2, R132, #39).
	reserved: {
		turns: [5],
		when: (state) => state.expansions.includes('ff'),
		run(ctx, player) {
			ctx.push([
				{
					player,
					kind: 'effects',
					effects: [{ useAllReserved: {} }],
					ordered: true,
				},
			]);
		},
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
	// After the income of income turn 1: civilizations' end-of-turn rules and the current version's losses (#20 design §5).
	civFirstTurnEnd: {
		turns: [1],
		run: endFirstIncomeTurn,
	},
	// The Quagmire: at the end of income turn 5, −5 VP per landmark on reeds and +3 per other landmark of the city
	// (FF.6 2.4, R88, R89, #40).
	reeds: {
		turns: [5],
		// Only with F&F, so a game without it schedules nothing more (final review).
		when: (state) => state.expansions.includes('ff'),
		run(ctx, player) {
			const seat = playerSeat(ctx.state, player);
			if (seat.capital.mat === null || !seatMat(seat).reeds) {
				return;
			}
			const vp = reedsVp(seat);
			emit(ctx.state, { type: 'reedsScored', player, vp });
			if (vp !== 0) {
				ctx.push([
					{
						player,
						kind: 'effects',
						effects: [{ vp }],
						origin: 'capital',
					},
				]);
			}
		},
	},
	// After income turn 5 the player takes no more turns (01 §4.3). A THIS ERA ability played during it ends here,
	// so it never outlives its player.
	// R150: the Elder Ones and the Merfolk play on instead, their era-4 card still in effect (03 FF.3, DQ 7); the Merfolk first
	// keep up to 5 cards (#40).
	finish: {
		turns: [5],
		run(ctx, player) {
			const seat = playerSeat(ctx.state, player);
			if (playsOn(seat)) {
				seat.playingOn = true;
				emit(ctx.state, { type: 'playingOn', player });
				if (seat.civs.includes('merfolk')) {
					askPutAway(ctx, player, 5, 'discard');
				}
				return;
			}
			endEra(ctx, player);
			seat.finished = true;
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
	const steps = INCOME_STEPS.filter((id) => {
		const kind = INCOME_STEP_KINDS[id];
		return kind.turns.includes(turn) && (kind.when?.(ctx.state) ?? true);
	});
	// Whatever an income turn scores counts as the income turn's, unless it names its own source (#29).
	ctx.push([{ player, kind: 'incomeSteps', turn, steps, origin: 'income' }]);
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
	// Decisions caused by the income mat should say which step opened them.
	op.cause = { incomeTurn: op.turn, step };
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
