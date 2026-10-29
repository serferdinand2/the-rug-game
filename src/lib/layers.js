// What is open over the game screen (#88): How to play, Table settings, the players overview, the log and the footer's question, the rules for opening each, and the one layer Escape closes.

/**
 * The layers open over the game screen. The first-income notice isn't one: the game decides when it shows.
 * @typedef {Object} Layers
 * @property {boolean} rules - How to play, over the whole screen
 * @property {boolean} settings - The host's Table settings, over the board
 * @property {boolean} overview - The players overview
 * @property {number | null} player - The player the overview opened on, 1 to 5; null when opened from the header
 * @property {boolean} log - The log and scores panel
 * @property {'income' | 'track' | null} question - The footer's question: "Take an income turn?" or "Advance on which track?"
 */

/** @typedef {'rules' | 'settings' | 'overview' | 'log' | 'income' | 'track'} Layer */

/** Nothing open. @type {Readonly<Layers>} */
export const NO_LAYERS = Object.freeze({
	rules: false,
	settings: false,
	overview: false,
	player: null,
	log: false,
	question: null,
});

/**
 * The layers with one more open. How to play, Table settings and the overview open alone; the log closes only the
 * overview and leaves the question under it; a question closes the overview, whose close bar would hide it.
 * @param {Layers} layers
 * @param {Layer} layer
 * @param {{ player?: number | null }} [options] - The overview's player
 * @returns {Layers}
 */
export function openLayer(layers, layer, { player = null } = {}) {
	switch (layer) {
		case 'rules':
			return { ...NO_LAYERS, rules: true };
		case 'settings':
			return { ...NO_LAYERS, settings: true };
		case 'overview':
			return { ...NO_LAYERS, overview: true, player };
		case 'log':
			return { ...layers, overview: false, player: null, log: true };
		case 'income':
		case 'track':
			return {
				...layers,
				overview: false,
				player: null,
				question: layer,
			};
	}
}

/**
 * The layers with one closed, and the rest as they were.
 * @param {Layers} layers
 * @param {Layer} layer
 * @returns {Layers}
 */
export function closeLayer(layers, layer) {
	switch (layer) {
		case 'rules':
		case 'settings':
		case 'log':
			return { ...layers, [layer]: false };
		case 'overview':
			return { ...layers, overview: false, player: null };
		case 'income':
		case 'track':
			return layers.question === layer
				? { ...layers, question: null }
				: layers;
	}
}

/**
 * The one thing Escape closes, from the top: How to play, the settings, the overview, the log, the footer's question,
 * then the first-income notice, which closes only when nothing else is open (#77); null when nothing is.
 * @param {Layers} layers
 * @param {boolean} notice - The first-income notice is showing
 * @returns {Layer | 'notice' | null}
 */
export function escapeLayer(layers, notice) {
	if (layers.rules) {
		return 'rules';
	}
	if (layers.settings) {
		return 'settings';
	}
	if (layers.overview) {
		return 'overview';
	}
	if (layers.log) {
		return 'log';
	}
	if (layers.question !== null) {
		return layers.question;
	}
	return notice ? 'notice' : null;
}
