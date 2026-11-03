// The last decision of a turn: the player ends it, after seeing what their last choice did and with undo still open (#146).

/** @type {import('../state.js').DecisionKind} */
export const confirmEndTurn = {
	hidden: [],
	answers() {
		return [{}];
	},
	check() {},
	resolve() {},
};
