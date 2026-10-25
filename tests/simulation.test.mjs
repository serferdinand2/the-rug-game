// Plays 200 random legal games to the end and checks every action (#21). SIM_SEED=n replays game n; SIM_GAMES=n plays n.
import test from 'node:test';
import { availableParallelism } from 'node:os';
import { Worker } from 'node:worker_threads';
import { GAMES, gameOf, simulate } from './helpers/simulation.mjs';

/** @typedef {import('./helpers/simulation-worker.mjs').GameResult} GameResult */
/** @typedef {import('./helpers/simulation-worker.mjs').GameStarted} GameStarted */

/** At most this many worker threads, leaving one core for the rest of the suite. */
const MAX_WORKERS = 8;

/** A worker silent this long is stuck: no game takes a tenth of it, even on a slow runner. */
const STUCK_MS = 60_000;

/**
 * A whole number of at least 1 from the environment, or `fallback` when the variable isn't set.
 * @template T
 * @param {string} name
 * @param {T} fallback
 * @returns {number | T}
 */
function setting(name, fallback) {
	const text = process.env[name];
	if (text === undefined) {
		return fallback;
	}
	const value = Number(text);
	if (!Number.isInteger(value) || value < 1) {
		throw new Error(
			`${name} must be a whole number from 1, not "${text}".`
		);
	}
	return value;
}

/**
 * A game's test name.
 * @param {number} index
 */
function nameOf(index) {
	const { seed, players, version, policy } = gameOf(index);
	return `game ${seed}: ${players} players, ${version}, ${policy} play`;
}

/**
 * How to replay a game alone.
 * @param {number} index
 */
const replay = (index) =>
	`Replay: SIM_SEED=${gameOf(index).seed} node --test tests/simulation.test.mjs`;

/**
 * Plays games 0 to `total` - 1 on worker threads, dealt round-robin. Each game's promise settles when its worker
 * reports it. A worker that crashes, or goes quiet for STUCK_MS, fails the game it was playing by name and every
 * game it still owed.
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
		/** @type {number | null} */
		let playing = null;
		const worker = new Worker(
			new URL('./helpers/simulation-worker.mjs', import.meta.url),
			{ workerData: { indexes } }
		);
		/**
		 * Fails the game being played with `why`, then every other game still owed.
		 * @param {string} why
		 */
		const fail = (why) => {
			if (playing !== null && owed.has(playing)) {
				settle[playing].reject(
					new Error(`${nameOf(playing)}: ${why}\n${replay(playing)}`)
				);
				owed.delete(playing);
			}
			for (const index of owed) {
				settle[index].reject(
					new Error(
						`A simulation worker stopped before this game: ${why}`
					)
				);
			}
			owed.clear();
		};
		/** @type {ReturnType<typeof setTimeout> | undefined} */
		let watchdog;
		const watch = () => {
			clearTimeout(watchdog);
			watchdog = setTimeout(() => {
				fail(
					`no word from its worker for ${STUCK_MS / 1000} seconds, so it is stuck, probably in an endless loop.`
				);
				worker.terminate();
			}, STUCK_MS);
		};
		watch();
		worker.on(
			'message',
			(/** @type {GameResult | GameStarted} */ message) => {
				watch();
				if ('started' in message) {
					playing = message.index;
					return;
				}
				playing = null;
				owed.delete(message.index);
				settle[message.index].resolve(message);
			}
		);
		worker.on('error', (error) =>
			fail(`its worker failed: ${error.stack}`)
		);
		worker.on('exit', (code) => {
			clearTimeout(watchdog);
			fail(`its worker stopped with exit code ${code}.`);
		});
	}
	return results;
}

const only = setting('SIM_SEED', null);
const total = setting('SIM_GAMES', GAMES);

if (only !== null) {
	// One game on the main thread, so a debugger and the full stack trace work.
	test(nameOf(only - 1), () => {
		simulate(only - 1);
	});
} else {
	// The workers start with the first game's test, so a run filtered to other tests plays nothing.
	/** @type {Promise<GameResult>[] | undefined} */
	let results;
	for (let index = 0; index < total; index++) {
		test(nameOf(index), async () => {
			results ??= playOnWorkers(total);
			const played = await results[index];
			if (!played.ok) {
				const failure = new Error(played.message);
				failure.stack = `${played.message}\n${played.stack}`;
				throw failure;
			}
		});
	}
}
