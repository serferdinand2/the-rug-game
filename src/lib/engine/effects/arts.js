// Arts & Architecture's masterpieces and inspiration tiles (03 §2.2–2.8): named by the arts track's spaces now, built in #35 part 2.

/**
 * An effect whose rules come in #35 part 2. No table plays the arts track before then: the branch merges whole.
 * @param {string} kind
 * @returns {import('../state.js').EffectHandler}
 */
function partTwo(kind) {
	return () => {
		throw new Error(`${kind} is built in #35 part 2.`);
	};
}

/** Create: gain a masterpiece, face up or from the deck (03 §2.7). */
export const create = partTwo('create');

/** Inspire: place an inspiration tile on its income row (03 §2.8). */
export const inspire = partTwo('inspire');

/** Broadcast: gain the benefit of one of your masterpieces (03 §2.7). */
export const broadcast = partTwo('broadcast');

/** Refresh the three face-up masterpieces (Rock Opera, 03 §2.3). */
export const refreshMasterpieces = partTwo('refreshMasterpieces');

/** Streaming Implants: up to 3 different masterpieces, yours or your neighbours' (03 §2.3). */
export const streamingImplants = partTwo('streamingImplants');
