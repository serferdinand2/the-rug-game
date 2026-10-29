// Runs the library page's drawing one task per slice, giving the browser back its time between slices, so drawing never freezes the page (#82).

/** The tasks waiting for a slice, first come first served. @type {(() => void)[]} */
const queue = [];

/** A slice is booked: the queue is draining. */
let draining = false;

/**
 * Waits for the browser to have time: an idle period where it can tell, else the next macrotask.
 * @param {() => void} run
 */
function nextSlice(run) {
	if (typeof requestIdleCallback === 'function') {
		requestIdleCallback(run);
	} else {
		setTimeout(run, 0);
	}
}

/** Runs the first waiting task, then books the next slice while any task waits. */
function runSlice() {
	queue.shift()?.();
	if (queue.length > 0) {
		nextSlice(runSlice);
	} else {
		draining = false;
	}
}

/**
 * Runs a task in a slice of its own, after the tasks queued before it.
 * @template T
 * @param {() => T} task - Synchronous work, such as drawing one picture
 * @returns {Promise<T>} What the task returns; rejects with what it throws, and the next task still runs
 */
export function inSlice(task) {
	return new Promise((resolve, reject) => {
		queue.push(() => {
			try {
				resolve(task());
			} catch (error) {
				reject(error);
			}
		});
		if (!draining) {
			draining = true;
			nextSlice(runSlice);
		}
	});
}
