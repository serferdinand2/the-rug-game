// Plays 200 random legal games to the end and checks every action (#21). SIM_SEED=n replays game n; SIM_GAMES=n plays n.
import test from 'node:test';
import { availableParallelism } from 'node:os';
import { Worker } from 'node:worker_threads';
import { GAMES, gameOf, simulate } from './helpers/simulation.mjs';

/** @typedef {import('./helpers/simulation-worker.mjs').GameResult} GameResult */

/** At most this many worker threads, leaving one core for the rest of the suite. */
const MAX_WORKERS = 8;

/**
 * A game's test name.
 * @param {number} index
 */
function nameOf(index) {
	const { seed, players, version, policy } = gameOf(index);
	return `game ${seed}: ${players} players, ${version}, ${policy} play`;
}

/**
 * Plays games 0 to `total` - 1 on worker threads, dealt round-robin. Each game's promise settles when its worker
 * reports it; a worker that crashes rejects every game it still owed.
 * @param {number} total
 * @returns {Promise<GameResult>[]}
 */
function playOnWorkers(total) {
	const workers = Math.max(
		1,
		Math.min(MAX_WORKERS, availableParallelism() - 1, total)
	);
	/** @type {{ resolve: (r: GameResult) => void, reject: (e: Error) => void }[]} */
	const settle = [];
	const results = Array.from({ length: total }, (_, index) => {
		/** @type {Promise<GameResult>} */
		const promise = new Promise((resolve, reject) => {
			settle[index] = { resolve, reject };
		});
		// Its test awaits it later; until then a crash must not count as an unhandled rejection.
		promise.catch(() => {});
		return promise;
	});
	for (let w = 0; w < workers; w++) {
		const indexes = results
			.map((_, index) => index)
			.filter((index) => index % workers === w);
		const owed = new Set(indexes);
		const worker = new Worker(
			new URL('./helpers/simulation-worker.mjs', import.meta.url),
			{ workerData: { indexes } }
		);
		/** @param {Error} error */
		const fail = (error) => {
			for (const index of owed) {
				settle[index].reject(error);
			}
			owed.clear();
		};
		worker.on('message', (/** @type {GameResult} */ result) => {
			owed.delete(result.index);
			settle[result.index].resolve(result);
		});
		worker.on('error', fail);
		worker.on('exit', (code) => {
			fail(
				new Error(`A simulation worker stopped with exit code ${code}.`)
			);
		});
	}
	return results;
}

if (process.env.SIM_SEED !== undefined) {
	// One game on the main thread, so a debugger and the full stack trace work.
	const index = Number(process.env.SIM_SEED) - 1;
	test(nameOf(index), () => {
		simulate(index);
	});
} else {
	const results = playOnWorkers(Number(process.env.SIM_GAMES ?? GAMES));
	results.forEach((result, index) => {
		test(nameOf(index), async () => {
			const played = await result;
			if (!played.ok) {
				const failure = new Error(played.message);
				failure.stack = `${played.message}\n${played.stack}`;
				throw failure;
			}
		});
	});
}
