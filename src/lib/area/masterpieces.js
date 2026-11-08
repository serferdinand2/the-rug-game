// A&A's masterpieces and inspiration tiles as the screen shows them (#35 part 4): the masterpiece row on the arts
// track's line, from a game view.

/**
 * The masterpiece row beside the arts track's name: the face-up cards and how many the deck holds.
 * @typedef {Object} MasterpieceRowView
 * @property {string[]} faceUp - The face-up masterpieces, up to 3, in the supply's order
 * @property {number} deck - The cards left in the face-down deck
 */

/**
 * The masterpiece row, or null for a game without the arts track, which has no masterpieces.
 * @param {any} game - The game view
 * @returns {MasterpieceRowView | null}
 */
export function masterpieceRow(game) {
	const supply = game?.supply?.masterpieces;
	if (!supply) {
		return null;
	}
	return {
		faceUp: [...supply.faceUp],
		deck: typeof supply.deck === 'number' ? supply.deck : 0,
	};
}
