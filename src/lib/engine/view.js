// view(): the only way game state leaves the server. A copy with every private part removed.
import { DECISIONS } from './registry.js';
import { openDecisions } from './stack.js';
import { isPlayerSeat } from './state.js';

/** @typedef {import('./state.js').Operation & { answers?: import('./state.js').Answer[] }} ViewOperation - A decision may lack its hidden fields */
/** @typedef {{ id: number, batch: number, player: null, kind: 'group', lanes: { player: number, stack: ViewOperation[] }[] }} ViewGroup */
/** @typedef {import('./state.js').Seat & Partial<Omit<import('./state.js').PlayerFields, 'hand' | 'picks'>> & { handCount?: number, hand?: string[], picks?: import('./state.js').PlayerFields['picks'] }} ViewSeat - `handCount` on every player seat; `hand` and `picks` only on the viewer's own */
/**
 * The supply decks view() turns into counts, as paths inside `state.supply`.
 * revealed() (table.js) compares exactly these, so a new hidden deck is added here and nowhere else.
 * @type {readonly (readonly string[])[]}
 */
export const HIDDEN_DECKS = [
	['tech', 'deck'],
	['tapestry', 'deck'],
	['territory'],
	['space'],
	['civs'],
	['landmarkCards'],
	// Only with the arts track (#35); a game without it has no masterpiece supply.
	['masterpieces', 'deck'],
];

/**
 * The events whose `secret` a second seat shares with the event's player, by type: the field naming that seat. A card
 * the Advisors give is known to them and to the neighbour who gets it, and to nobody else (#33).
 * @type {Readonly<Record<string, string>>}
 */
export const SHARED_SECRETS = Object.freeze({ tapestryGiven: 'to' });

/**
 * What one seat may see of a game: the state with its hidden parts removed.
 * Decks become counts; other seats keep a `handCount` instead of `hand` and `picks`;
 * decisions lose their kind's hidden fields and events lose `secret` unless they belong to the viewer, or the viewer
 * shares it (SHARED_SECRETS); the viewer's own open decisions carry `answers`.
 * @typedef {Omit<import('./state.js').State, 'supply' | 'seats' | 'pending'> & {
 *   supply: Omit<import('./state.js').Supply, 'tech' | 'tapestry' | 'territory' | 'space' | 'civs' | 'masterpieces'> & { tech: { deck: number, faceUp: string[], discard: string[] }, tapestry: { deck: number, discard: string[] }, territory: number, space: number, civs: number, masterpieces?: { deck: number, faceUp: string[], discard: string[] } },
 *   seats: ViewSeat[],
 *   pending: (ViewOperation | ViewGroup)[]
 * }} View
 */

/**
 * A copy of the state for one seat. A seat that is not a player of the game gets the public view.
 * @param {import('./state.js').State} state - Left unchanged
 * @param {unknown} seat - 1 to n; anything else (null, 0, a string) gives the public view
 * @returns {View}
 */
export function view(state, seat) {
	const viewer = viewerOf(state, seat);
	// Nothing belongs to the public view: a decision or event of no player is private to nobody.
	const owns = (/** @type {unknown} */ player) =>
		viewer !== null && player === viewer;
	// The viewer's open decisions, read from the untouched state so `answers()` sees every field.
	const answers = new Map(
		openDecisions(state)
			.filter((op) => owns(op.player))
			.map((op) => [op.id, DECISIONS[op.kind].answers(state, op)])
	);
	const copy = /** @type {Record<string, any>} */ (structuredClone(state));
	for (const path of HIDDEN_DECKS) {
		const last = path[path.length - 1];
		const holder = path
			.slice(0, -1)
			.reduce((o, key) => o?.[key], copy.supply);
		if (holder?.[last] === undefined) {
			continue;
		}
		holder[last] = holder[last].length;
	}

	for (const entry of copy.seats) {
		if (entry.kind !== 'player') {
			continue;
		}
		// A face-down tapestry card is hidden from everyone, its owner included (01 §4.2).
		const faceDown = entry.incomeMat.faceDown;
		entry.incomeMat.tapestry = entry.incomeMat.tapestry.map(
			(/** @type {string[]} */ slot) =>
				slot.map((card) => (faceDown.includes(card) ? null : card))
		);
		delete entry.incomeMat.faceDown;
		entry.handCount = entry.hand.length;
		if (entry.seat !== viewer) {
			delete entry.hand;
			delete entry.picks;
			// The Collectors' cards and tile lie face down: the others see only that one is there (#37).
			const items = entry.civData?.collectors?.items;
			for (const type of ['tapestry', 'territory', 'tech']) {
				if (items?.[type] !== undefined) {
					items[type] = true;
				}
			}
		}
	}

	/** @param {Record<string, any>} op */
	const clean = (op) => {
		if (!Object.hasOwn(DECISIONS, op.kind)) {
			return;
		}
		if (!owns(op.player)) {
			for (const field of DECISIONS[op.kind].hidden) {
				delete op[field];
			}
		} else if (answers.has(op.id)) {
			op.answers = answers.get(op.id);
		}
	};
	for (const op of copy.pending) {
		if (op.kind === 'group') {
			for (const lane of op.lanes) {
				lane.stack.forEach(clean);
			}
		} else {
			clean(op);
		}
	}

	for (const event of copy.events) {
		const sharer = Object.hasOwn(SHARED_SECRETS, event.type)
			? event[SHARED_SECRETS[event.type]]
			: undefined;
		if (!owns(event.player) && !owns(sharer)) {
			delete event.secret;
		}
	}
	return /** @type {View} */ (copy);
}

/**
 * The viewer's seat number, or null when `seat` names no player seat of the game.
 * @param {import('./state.js').State} state
 * @param {unknown} seat
 * @returns {number | null}
 */
function viewerOf(state, seat) {
	return isPlayerSeat(state, seat) ? /** @type {number} */ (seat) : null;
}
