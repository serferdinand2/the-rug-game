// view(): the only way game state leaves the server. A copy with every private part removed.
import { DECISIONS } from './kinds.js';
import { openDecisions } from './stack.js';

/**
 * What one seat may see of a game: the state with its hidden parts removed.
 * Decks become counts; other seats keep a `handCount` instead of `hand` and `picks`;
 * decisions lose their kind's hidden fields and events lose `secret` unless they belong to the viewer;
 * the viewer's own open decisions carry `answers`.
 * @typedef {Omit<import('./state.js').State, 'supply'> & { supply: Omit<import('./state.js').Supply, 'tech' | 'tapestry' | 'territory' | 'space' | 'civs'> & { tech: { deck: number, faceUp: string[], discard: string[] }, tapestry: { deck: number, discard: string[] }, territory: number, space: number, civs: number } }} View
 */

/**
 * A copy of the state for one seat. A seat that is not a player of the game gets the public view.
 * @param {import('./state.js').State} state - Left unchanged
 * @param {number | null} seat - 1 to n, or null for the public view
 * @returns {View}
 */
export function view(state, seat) {
	const viewer = viewerOf(state, seat);
	// The viewer's open decisions, read from the untouched state so `answers()` sees every field.
	const answers = new Map(
		openDecisions(state)
			.filter((op) => op.player === viewer)
			.map((op) => [op.id, DECISIONS[op.kind].answers(state, op)])
	);
	const copy = /** @type {Record<string, any>} */ (structuredClone(state));
	const { supply } = copy;
	supply.tech.deck = supply.tech.deck.length;
	supply.tapestry.deck = supply.tapestry.deck.length;
	supply.territory = supply.territory.length;
	supply.space = supply.space.length;
	supply.civs = supply.civs.length;

	for (const entry of copy.seats) {
		if (entry.kind !== 'player') {
			continue;
		}
		entry.handCount = entry.hand.length;
		if (entry.seat !== viewer) {
			delete entry.hand;
			delete entry.picks;
		}
	}

	/** @param {Record<string, any>} op */
	const clean = (op) => {
		if (!(op.kind in DECISIONS)) {
			return;
		}
		if (op.player !== viewer) {
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
		if (event.player !== viewer) {
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
	if (typeof seat !== 'number' || !Number.isInteger(seat)) {
		return null;
	}
	const found = state.seats.find((s) => s.seat === seat);
	return found && found.kind === 'player' ? seat : null;
}
