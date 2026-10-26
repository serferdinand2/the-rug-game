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
