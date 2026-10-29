// A prompt state's source for tests (#79): its fields are runes, so a test can change the decision or the board, and a fake move records what is sent.

/**
 * A source a test can change, with a move that records each action and answers true.
 * @param {{ game: any, seat?: number | null, decision?: any, board?: 'tracks' | 'map', advance?: any, held?: Record<string, number> }} fields
 */
export function promptSource(fields) {
	let game = $state.raw(fields.game);
	let seat = $state.raw(fields.seat ?? 1);
	let decision = $state.raw(fields.decision ?? null);
	let board = $state.raw(fields.board ?? 'tracks');
	let advance = $state.raw(fields.advance ?? null);
	let held = $state.raw(
		fields.held ?? { coin: 0, food: 0, worker: 0, culture: 0 }
	);
	let busy = $state(false);
	/** @type {Record<string, unknown>[]} */
	const sent = [];
	return {
		sent,
		get game() {
			return game;
		},
		set game(value) {
			game = value;
		},
		get seat() {
			return seat;
		},
		get decision() {
			return decision;
		},
		set decision(value) {
			decision = value;
		},
		get board() {
			return board;
		},
		set board(value) {
			board = value;
		},
		get advance() {
			return advance;
		},
		set advance(value) {
			advance = value;
		},
		get held() {
			return held;
		},
		get busy() {
			return busy;
		},
		set busy(value) {
			busy = value;
		},
		/** @param {Record<string, unknown>} action */
		move: async (action) => {
			sent.push(action);
			return true;
		},
	};
}
