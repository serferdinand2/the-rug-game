// The long poll that keeps a tab's table up to date (#25 design §7.3): one request at a time, backing off on failures.
import { ApiError } from './api.js';

/**
 * How long to wait after a run of failures: 1, 2, 4 and 8 seconds, then every 10.
 * @param {number} failures - 1 or more
 * @returns {number} Milliseconds
 */
export function backoff(failures) {
	return Math.min(1000 * 2 ** (failures - 1), 10_000);
}

/**
 * Asks for the table again and again, each time after the newest version, until `stopped()` or the seat is gone.
 * The server answers as soon as the table changes, or unchanged after about 25 seconds. With one request at a time
 * the answers arrive in order.
 * @param {Object} options
 * @param {(endpoint: string) => Promise<any>} options.request - An Api's request
 * @param {() => number} options.version - The version on screen
 * @param {() => number | null} [options.seat] - The seat on show at a hot-seat table (#26); null or absent online
 * @param {(room: any) => void} options.accept - Takes each answer
 * @param {(error: ApiError) => void} options.lost - The person lost their seat (400) or their session (401); the
 *   poll has ended
 * @param {(failures: number) => void} options.trouble - A request failed, the n-th in a row
 * @param {() => boolean} options.stopped - The tab left the table
 * @param {(ms: number) => Promise<void>} options.wait
 * @returns {Promise<void>}
 */
export async function pollTable({
	request,
	version,
	seat = () => null,
	accept,
	lost,
	trouble,
	stopped,
	wait,
}) {
	let failures = 0;
	while (!stopped()) {
		try {
			const shown = seat();
			const room = await request(
				`state?since=${version()}${shown === null ? '' : `&seat=${shown}`}`
			);
			if (stopped()) {
				return;
			}
			failures = 0;
			accept(room);
		} catch (error) {
			if (stopped()) {
				return;
			}
			if (
				error instanceof ApiError &&
				(error.status === 400 || error.status === 401)
			) {
				lost(error);
				return;
			}
			failures += 1;
			trouble(failures);
			await wait(backoff(failures));
		}
	}
}
