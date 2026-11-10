// The questions of Fantasies & Futures' cards that ask other players, look, or guess (#40): High Council's reveal,
// Superpower Regulators' picks, Soothsaying's recipient, Dream Monitors' plot and Good Omens' guess.
import { PlayerError } from '../errors.js';
import { emit } from '../events.js';
import { playerSeat } from '../state.js';
import {
	councilCards,
	gainBothCharms,
	giveRevealed,
	guessOptions,
	houseBeside,
	placeCapitalToken,
} from '../effects/ff-looks.js';
import { askPlot } from '../civs/weefolk.js';

/**
 * Checks an answer against a decision kind's answers, by every field the answer gives.
 * @param {import('../state.js').DecisionKind} kind
 * @param {import('../state.js').State} state
 * @param {import('../state.js').Operation} decision
 * @param {Record<string, any>} answer
 * @param {string} message
 */
function offered(kind, state, decision, answer, message) {
	const ok = kind
		.answers(state, decision)
		.some((a) => Object.keys(a).every((key) => a[key] === answer[key]));
	if (!ok) {
		throw new PlayerError(message);
	}
}

/** High Council: reveal a response card for 1 resource of your choice, or decline (asked whenever you hold any card). */
/** @type {import('../state.js').DecisionKind} */
export const chooseCouncil = {
	hidden: [],
	answers(state, decision) {
		return [
			{ card: null },
			...councilCards(state, /** @type {number} */ (decision.player)).map(
				(card) => ({ card })
			),
		];
	},
	check(state, decision, answer) {
		offered(
			chooseCouncil,
			state,
			decision,
			answer,
			'Reveal a response card, or decline.'
		);
	},
	resolve(ctx, decision, answer) {
		const player = /** @type {number} */ (decision.player);
		const then = { ...decision.then };
		if (answer.card !== null) {
			emit(ctx.state, {
				type: 'councilRevealed',
				player,
				card: answer.card,
			});
			if (player !== decision.owner) {
				then.revealed += 1;
			}
		}
		ctx.push([
			then,
			...(answer.card !== null
				? [{ player, kind: 'effects', effects: [{ gain: { any: 1 } }] }]
				: []),
		]);
	},
};

/** Superpower Regulators: a revealed card's two charms (up to 2 cards), 9 VP instead, or stop after the first. */
/** @type {import('../state.js').DecisionKind} */
export const chooseRegulated = {
	hidden: [],
	answers(state, decision) {
		return [
			...(decision.picked === 0 ? [{ vp: true }] : [{ done: true }]),
			...[...new Set(/** @type {string[]} */ (decision.options))].map(
				(card) => ({ card })
			),
		];
	},
	check(state, decision, answer) {
		offered(
			chooseRegulated,
			state,
			decision,
			answer,
			'Choose a revealed card, or 9 VP.'
		);
	},
	resolve(ctx, decision, answer) {
		const player = /** @type {number} */ (decision.player);
		if (answer.vp === true) {
			ctx.push([
				{
					player,
					kind: 'effects',
					effects: [{ vp: 9 }],
					source: decision.source,
				},
			]);
			return;
		}
		if (answer.done === true) {
			return;
		}
		const left = [...decision.options];
		left.splice(left.indexOf(answer.card), 1);
		if (decision.picked + 1 < 2 && left.length > 0) {
			ctx.push([
				{
					...decision,
					id: undefined,
					batch: undefined,
					options: left,
					picked: decision.picked + 1,
				},
			]);
		}
		gainBothCharms(ctx, player, answer.card);
	},
};

/** Soothsaying: which opponent takes a charmed card revealed; with one opponent it is theirs, with none it is discarded. */
/** @type {import('../state.js').DecisionKind} */
export const chooseRecipient = {
	hidden: [],
	answers(state, decision) {
		const options = /** @type {number[]} */ (decision.options);
		return options.length > 0
			? options.map((to) => ({ to }))
			: [{ to: null }];
	},
	check(state, decision, answer) {
		offered(
			chooseRecipient,
			state,
			decision,
			answer,
			'Choose an opponent to take the card.'
		);
	},
	resolve(ctx, decision, answer) {
		giveRevealed(
			ctx,
			/** @type {number} */ (decision.player),
			decision.card,
			answer.to
		);
	},
};

/** Dream Monitors: the open plot of your capital your token fills. */
/** @type {import('../state.js').DecisionKind} */
export const choosePlot = {
	hidden: [],
	answers(state, decision) {
		return decision.options.map(
			(/** @type {{ row: number, col: number }} */ o) => ({
				row: o.row,
				col: o.col,
			})
		);
	},
	check(state, decision, answer) {
		offered(
			choosePlot,
			state,
			decision,
			answer,
			'Choose an open plot of your capital city.'
		);
	},
	resolve(ctx, decision, answer) {
		const player = /** @type {number} */ (decision.player);
		const plot = { row: answer.row, col: answer.col };
		if (decision.purpose === 'weefolk') {
			// A full city: the token replaces an income building, set aside (DQ 22).
			const seat = playerSeat(ctx.state, player);
			const at = seat.capital.buildings.findIndex(
				(b) => b.row === plot.row && b.col === plot.col
			);
			if (at !== -1) {
				const [replaced] = seat.capital.buildings.splice(at, 1);
				seat.besideMat.push(replaced.building);
				emit(ctx.state, {
					type: 'placedBesideMat',
					player,
					building: replaced.building,
				});
			}
			ctx.push(placeCapitalToken(ctx, player, decision.token, plot));
			return;
		}
		const ops = placeCapitalToken(ctx, player, player, plot);
		if (houseBeside(playerSeat(ctx.state, player), plot)) {
			ops.push({
				player,
				kind: 'effects',
				effects: [{ gain: { any: 2 } }],
				source: decision.source,
			});
		}
		ctx.push(ops);
	},
};

/** Good Omens: the face you guess before rolling the science die. */
/** @type {import('../state.js').DecisionKind} */
export const chooseGuess = {
	hidden: [],
	answers(state) {
		return guessOptions(state).map((track) => ({ track }));
	},
	check(state, decision, answer) {
		offered(
			chooseGuess,
			state,
			decision,
			answer,
			'Guess a face of the science die.'
		);
	},
	resolve(ctx, decision, answer) {
		const player = /** @type {number} */ (decision.player);
		const omens = (ctx.state.omens ??= []);
		let omen = omens.find((o) => o.player === player);
		if (!omen) {
			omen = { player };
			omens.push(omen);
		}
		omen.guess = answer.track;
		emit(ctx.state, { type: 'omenGuessed', player, track: answer.track });
	},
};

/** The Weefolk: which opponent takes their token. */
/** @type {import('../state.js').DecisionKind} */
export const chooseHost = {
	hidden: [],
	answers(state, decision) {
		return decision.options.map((/** @type {number} */ to) => ({ to }));
	},
	check(state, decision, answer) {
		offered(
			chooseHost,
			state,
			decision,
			answer,
			'Choose an opponent to take your token.'
		);
	},
	resolve(ctx, decision, answer) {
		askPlot(ctx, answer.to, /** @type {number} */ (decision.player));
	},
};
