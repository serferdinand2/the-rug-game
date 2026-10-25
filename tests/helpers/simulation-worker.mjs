// A worker thread of the simulation: plays its share of the games and reports each one as it ends (#21 design §7).
import { parentPort, workerData } from 'node:worker_threads';
import { simulate } from './simulation.mjs';

/**
 * What a worker reports for one game.
 * @typedef {{ index: number, ok: true, actions: number } | { index: number, ok: false, message: string, stack: string }} GameResult
 */
/**
 * What a worker says when it starts a game, so a game that never ends, or crashes the worker, can be named.
 * @typedef {{ index: number, started: true }} GameStarted
 */

for (const index of /** @type {number[]} */ (workerData.indexes)) {
	parentPort?.postMessage(
		/** @type {GameStarted} */ ({ index, started: true })
	);
	/** @type {GameResult} */
	let result;
	try {
		result = { index, ok: true, actions: simulate(index).actions };
	} catch (error) {
		const failure = /** @type {Error & { cause?: Error }} */ (error);
		result = {
			index,
			ok: false,
			message: failure.message,
			stack: failure.cause?.stack ?? failure.stack ?? '',
		};
	}
	parentPort?.postMessage(result);
}
