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
export {
	capitalScore,
	cityPlots,
	completeLines,
	completeDistricts,
	uniformLines,
} from './city.js';
// What the player cards and the scoreboard show (#128): the tiebreak values, and the income spaces left uncovered.
export { tiebreakValues } from './ranking.js';
export {
	askedSeats,
	defaultAction,
	declineOnly,
	revealed,
	timedOut,
	restore,
} from './table.js';
// What the prompts read (#28): an explore's matching sides, a tile's turned corners and the income turn's steps.
export { matchingSides } from './map.js';
export { turned } from './terrain.js';
export { INCOME_STEPS, INCOME_STEP_KINDS, exposedSpaces } from './income.js';
