// The viewer's part in the turn (#26 design §5.1, §6): which open decision is theirs, the advances they can pay
// for, from the engine run on their own view, and the words for income turns (#77).
import { DECISIONS, openDecisions } from './engine/game.js';
import { TRACKS } from './engine/data/tracks.js';
import { describeCost } from './describe.js';
import { incomeView } from './prompts.js';
import { roman } from './ui.js';

/** @typedef {import('./engine/data/ids.js').TrackId} TrackId */

/**
 * One token the viewer can advance, with every legal way to pay for it.
 * @typedef {Object} AdvanceOption
 * @property {import('./engine/data/ids.js').TrackId} track
 * @property {number} from - The token's space
 * @property {number} to - The space it reaches
 * @property {import('./engine/payment.js').Payment[]} payments - The engine's answers' payments, default first
 */

/**
 * The viewer's open decision: the first open one that is theirs and carries its answers. That is a trap response on
 * someone else's turn too, and a seat's own pick in setup's simultaneous lanes.
 * @param {any} view - The game as view() gives it to the viewer
 * @param {number | null} seat - The viewer's seat, or null for the public view
 * @returns {any | null}
 */
export function myDecision(view, seat) {
	if (seat === null || !view) {
		return null;
	}
	return (
		openDecisions(view).find(
			(op) => op.player === seat && Array.isArray(op.answers)
		) ?? null
	);
}

/**
 * The advances the viewer can pay for now: while their turn choice offers an advance, before anything is sent, or
 * while their advance is open. The engine reads only what the viewer can see, so its preview on the view equals the
 * server's answers (tests/client-turn.test.mjs).
 * @param {any} view
 * @param {number | null} seat
 * @returns {AdvanceOption[]}
 */
export function advanceOptions(view, seat) {
	const decision = myDecision(view, seat);
	if (!decision) {
		return [];
	}
	/** @type {any[]} */
	let answers = [];
	if (decision.kind === 'chooseAdvance') {
		answers = decision.answers;
	} else if (
		decision.kind === 'chooseTurn' &&
		decision.options.includes('advance')
	) {
		// The advance that answering the turn choice would open, previewed before anything is sent.
		const preview = /** @type {any} */ ({
			player: seat,
			kind: 'chooseAdvance',
		});
		answers = DECISIONS.chooseAdvance.answers(view, preview);
	}
	/** @type {Map<string, AdvanceOption>} */
	const byToken = new Map();
	for (const { track, from, pay } of answers) {
		const key = `${track}:${from}`;
		if (!byToken.has(key)) {
			byToken.set(key, { track, from, to: from + 1, payments: [] });
		}
		/** @type {AdvanceOption} */ (byToken.get(key)).payments.push(pay);
	}
	return [...byToken.values()];
}

/**
 * Gives the footer the turn's context while the decision panel asks the actual question. Until effects carry exact
 * causes (#60), the latest advance in this turn is the most specific context the public view can name.
 * @param {any} view - The viewer's game view
 * @param {number | null} seat - The viewer's seat
 * @returns {string}
 */
export function decisionTurnHeading(view, seat) {
	if (view.phase === 'setup') {
		return 'Your setup choice';
	}
	const current = view.current;
	if (!Number.isInteger(current)) {
		return 'Your turn is in progress';
	}
	const actor = view.seats?.find(
		(/** @type {any} */ s) => s.seat === current
	);
	const prefix =
		current === seat
			? 'Your turn'
			: `${actor?.name ?? 'Another player'}’s turn`;
	const events = Array.isArray(view.events) ? view.events : [];
	const started = events.findLast(
		(/** @type {any} */ event) => event.type === 'turnStarted'
	);
	const moved = events.findLast(
		(/** @type {any} */ event) =>
			event.type === 'tokenMoved' &&
			event.player === current &&
			event.seq > (started?.seq ?? -1) &&
			event.to > event.from &&
			TRACKS[/** @type {TrackId} */ (event.track)]?.[event.to]
	);
	return moved
		? `${prefix} · Advance to ${TRACKS[/** @type {TrackId} */ (moved.track)][moved.to].name}`
		: `${prefix} is in progress`;
}

/**
 * What taking an income turn does, for the footer (#77): income turns 2 to 4 end an era, gain income and begin the
 * next; income turn 5 has no income (01 §4.3).
 * @param {number} turn - The income turn it would start, 2 to 5; income turn 1 is never a choice
 * @returns {string}
 * @throws {RangeError} For any other turn
 */
export function incomeWords(turn) {
	if (!Number.isInteger(turn) || turn < 2 || turn > 5) {
		throw new RangeError(`An income turn to choose is 2 to 5, not ${turn}`);
	}
	if (turn === 5) {
		return 'End era IV, score it and finish playing.';
	}
	return `End era ${roman(turn - 1)}, gain income and begin era ${roman(turn)}.`;
}

/**
 * Whether the viewer's turn offers only income, because no advance can be paid for (#77).
 * @param {any} view
 * @param {number | null} seat
 * @returns {boolean}
 */
export function forcedIncome(view, seat) {
	const decision = myDecision(view, seat);
	return (
		decision?.kind === 'chooseTurn' &&
		decision.options.length === 1 &&
		decision.options[0] === 'income'
	);
}

/**
 * The waiting footer's words for the player whose turn it is, naming the income turn they are in (#77).
 * @param {any} view - The viewer's game view
 * @param {number} player - The player taking the turn
 * @param {string} name - Their name
 * @returns {string}
 */
export function takingTurnWords(view, player, name) {
	const turn = incomeView(view, player)?.turn;
	if (turn === 1) {
		return `${name} is taking their first income turn.`;
	}
	return turn
		? `${name} is taking income turn ${turn}.`
		: `${name} is taking their turn.`;
}

/**
 * What the one-time notice after income turn 1 shows (#77).
 * @typedef {Object} FirstIncomeNotice
 * @property {{ coin: number, worker: number, food: number, culture: number }} resources
 * @property {number} territoryTiles - Territory tiles in the viewer's supply
 * @property {number} tapestryCards - Tapestry cards in their hand
 * @property {string} holdings - The words after "You start with", such as "1 coin, 1 food and 1 tapestry card"
 */

/**
 * The notice that tells the viewer the game took their income turn 1 for them (#77), or null when it shouldn't open:
 * only in play, while the viewer is in era I with their income turn 1 over, and never over a question of theirs.
 * @param {any} view - The viewer's game view
 * @param {number | null} seat - The viewer's seat, or null for the public view
 * @returns {FirstIncomeNotice | null}
 */
export function firstIncomeNotice(view, seat) {
	const player = seat === null ? null : view?.seats?.[seat - 1];
	if (
		view?.phase !== 'play' ||
		!player ||
		player.kind !== 'player' ||
		player.incomeTurns !== 1 ||
		incomeView(view, seat) !== null
	) {
		return null;
	}
	const open = myDecision(view, seat);
	if (open && open.kind !== 'chooseTurn') {
		return null;
	}
	const { coin, worker, food, culture } = player.resources;
	const territoryTiles = player.territoryTiles.length;
	const tapestryCards = player.handCount ?? player.hand?.length ?? 0;
	const words = describeCost({
		coin,
		worker,
		food,
		culture,
		territory: territoryTiles,
		tapestry: tapestryCards,
	});
	return {
		resources: { coin, worker, food, culture },
		territoryTiles,
		tapestryCards,
		holdings: words === 'Nothing' ? 'nothing' : words,
	};
}
