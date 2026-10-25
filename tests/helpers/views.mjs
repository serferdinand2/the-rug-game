// The view checker: what no viewer may see of a game, shared by the view tests and the simulation (#21 design §6).
import assert from 'node:assert/strict';
import { view } from '../../src/lib/engine/game.js';
import { DECISIONS } from '../../src/lib/engine/kinds.js';
import { openDecisions } from '../../src/lib/engine/stack.js';

/** @typedef {import('../../src/lib/engine/state.js').State} State */
/** @typedef {import('../../src/lib/engine/state.js').PlayerSeat} PlayerSeat */
/** @typedef {(state: State, seat: number | null) => Record<string, any>} ViewOf */
/**
 * What a new game shows before any pick, which every later view before the reveal must still show.
 * @typedef {{ capitals: number[] }} SetupFacts
 */

/**
 * Every operation on the main stack and in every lane.
 * @param {{ pending: any[] }} state - A state or a view
 * @returns {any[]}
 */
export function allOps(state) {
	return state.pending.flatMap((op) =>
		op.kind === 'group' ? op.lanes.flatMap((lane) => lane.stack) : [op]
	);
}

/**
 * The facts of a new game that the views must keep until the reveal.
 * @param {State} state - Straight from createGame()
 * @returns {SetupFacts}
 */
export function setupFacts(state) {
	return { capitals: [...state.supply.capitals] };
}

/**
 * Every quoted string in a JSON text, keys included, so an id can be looked up once instead of searched for.
 * @param {string} text
 * @returns {Set<string>}
 */
function stringsOf(text) {
	return new Set(text.match(/"(?:[^"\\]|\\.)*"/g));
}

/**
 * The card ids that lie in places every player sees: the tech display and rows, the discards, the income mats'
 * face-up cards, the civilizations in play, and the landmarks (a tech card and a landmark can share an id).
 * @param {State} state
 * @returns {Set<string>}
 */
function publicIds(state) {
	const { supply } = state;
	const players = /** @type {PlayerSeat[]} */ (
		state.seats.filter((s) => s.kind === 'player')
	);
	const revealed = isRevealed(state);
	const pieces = Object.values(state.hexes).flatMap((hex) =>
		hex.outposts.flatMap((o) =>
			o.piece && 'landmark' in o.piece ? [o.piece.landmark] : []
		)
	);
	return new Set([
		...supply.tech.faceUp,
		...supply.tech.discard,
		...supply.tapestry.discard,
		...supply.civDiscard,
		...state.landmarks,
		...pieces,
		...players.flatMap((seat) => [
			...seat.tech.bottom,
			...seat.tech.middle,
			...seat.tech.top,
			...seat.incomeMat.tapestry
				.flat()
				.filter((card) => !seat.incomeMat.faceDown.includes(card)),
			...seat.capital.landmarks.map((piece) => piece.landmark),
			...seat.besideMat,
			...(revealed ? seat.civs : []),
		]),
	]);
}

/**
 * Whether the setup picks have been revealed. Events are trimmed to the newest few, so after setup the phase says it.
 * @param {State} state
 */
function isRevealed(state) {
	return (
		state.phase !== 'setup' ||
		state.events.some((e) => e.type === 'setupRevealed')
	);
}

/**
 * Checks every viewer's view of `state` (each player seat, and null for the public view) against what the state
 * holds privately, and throws an AssertionError naming the first leak.
 *
 * A secret id may appear only where it is public anyway: in a public place now or before the action (a discard just
 * shuffled into a deck), or in an event older than the action, which was checked when it was new.
 * @param {State} state
 * @param {SetupFacts} facts - From setupFacts() of the same game
 * @param {{ before?: State | null, viewOf?: ViewOf }} [options] - `before`: the state the action started from
 */
export function checkViews(
	state,
	facts,
	{ before = null, viewOf = view } = {}
) {
	const players = /** @type {PlayerSeat[]} */ (
		state.seats.filter((s) => s.kind === 'player')
	);
	const revealed = isRevealed(state);
	/** @type {Map<number | undefined, string[]>} */
	const dealt = new Map();
	if (!revealed) {
		for (const event of state.events) {
			if (event.type === 'civsDealt') {
				dealt.set(event.player, event.secret?.civs ?? []);
			}
		}
	}
	const known = publicIds(state);
	if (before) {
		for (const id of publicIds(before)) {
			known.add(id);
		}
	}
	const oldSeq = before ? before.seq : 0;
	const decks = [
		...state.supply.tech.deck,
		...state.supply.tapestry.deck,
		...state.supply.civs,
	];
	const faceDown = players.flatMap((seat) => seat.incomeMat.faceDown);
	/** The public view (null) owns nothing, not even what belongs to no player. */
	const owns = (
		/** @type {unknown} */ player,
		/** @type {number | null} */ viewer
	) => viewer !== null && player === viewer;
	const open = new Map(openDecisions(state).map((op) => [op.id, op]));

	for (const viewer of [null, ...players.map((s) => s.seat)]) {
		const v = viewOf(state, viewer);
		const { events, ...rest } = v;
		const fresh = events.filter((/** @type {any} */ e) => e.seq > oldSeq);
		const seen = stringsOf(JSON.stringify([rest, fresh]));
		/** @type {Set<string> | undefined} */
		let history;
		/**
		 * Fails when a secret id shows in this view, unless it is public anyway.
		 * @param {string} id
		 * @param {string} what
		 */
		const hidden = (id, what) => {
			if (!seen.has(`"${id}"`) || known.has(id)) {
				return;
			}
			history ??= stringsOf(
				JSON.stringify(
					events.filter((/** @type {any} */ e) => e.seq <= oldSeq)
				)
			);
			assert.ok(history.has(`"${id}"`), `${what} shown to ${viewer}`);
		};
		for (const id of decks) {
			hidden(id, `deck card ${id}`);
		}
		for (const id of faceDown) {
			hidden(id, `face-down card ${id}`);
		}
		for (const seat of players) {
			if (seat.seat === viewer) {
				continue;
			}
			for (const card of seat.hand) {
				hidden(card, `seat ${seat.seat}'s card ${card}`);
			}
			for (const civ of dealt.get(seat.seat) ?? []) {
				hidden(civ, `seat ${seat.seat}'s dealt civilization ${civ}`);
			}
			const shown = v.seats[seat.seat - 1];
			assert.ok(
				!('hand' in shown) && !('picks' in shown),
				`seat ${seat.seat}'s hand or picks shown to ${viewer}`
			);
			assert.equal(typeof shown.handCount, 'number');
			// Mat numbers are digits, so the string lookup can't see them: check the field itself.
			if (!revealed && state.map === 'small') {
				assert.equal(
					shown.capital.mat,
					null,
					`seat ${seat.seat}'s mat shown to ${viewer}`
				);
			}
		}
		if (!revealed) {
			assert.deepEqual(v.supply.capitals, facts.capitals);
		}
		for (const key of ['territory', 'space', 'civs']) {
			assert.equal(typeof v.supply[key], 'number', `the ${key} stack`);
		}
		assert.equal(typeof v.supply.tech.deck, 'number');
		assert.equal(typeof v.supply.tapestry.deck, 'number');
		for (const op of allOps(v)) {
			if (!owns(op.player, viewer)) {
				assert.ok(!('answers' in op), 'answers shown to a stranger');
				for (const field of DECISIONS[op.kind]?.hidden ?? []) {
					assert.ok(!(field in op), `${field} shown to a stranger`);
				}
			} else if (open.has(op.id)) {
				assert.ok(
					op.answers?.length > 0,
					`seat ${viewer}'s open ${op.kind} has no answers`
				);
			}
		}
		for (const event of events) {
			if (!owns(event.player, viewer)) {
				assert.ok(!('secret' in event), 'secret shown to a stranger');
			}
		}
	}
}
