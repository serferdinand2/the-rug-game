// The viewer's part in the turn (#26 design §5.1, §6): which open decision is theirs, and the advances they can pay
// for, from the engine run on their own view.
import { DECISIONS, openDecisions } from './engine/game.js';
import { TRACKS } from './engine/data/tracks.js';

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
