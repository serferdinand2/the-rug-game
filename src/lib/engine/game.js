// The engine's public entry: what the server and the app import.
export {
	createGame,
	checkOptions,
	EXPANSIONS_BUILT,
	VARIANTS,
} from './setup.js';
export { VERSIONS } from './data/ids.js';
export { play } from './play.js';
export { PlayerError } from './errors.js';
export { view } from './view.js';
export { bonusOf } from './decisions/choose-bonus.js';
// What the app runs on the viewer's own view to preview a turn (#26): legal advances and every decision's answers.
export { advances } from './decisions/choose-advance.js';
export { DECISIONS } from './kinds.js';
export { openDecisions } from './stack.js';
export { controlledTerritories } from './control.js';
export { turned } from './terrain.js';
export { cityPlots, completeLines, completeDistricts } from './city.js';
export {
	askedSeats,
	defaultAction,
	declineOnly,
	revealed,
	timedOut,
	restore,
} from './table.js';
