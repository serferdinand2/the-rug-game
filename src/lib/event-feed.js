// The game's events as the table screens use them (#29 design §4): the fresh ones since the last view, never replayed after a refresh, and the live ones after an undo.

/** @typedef {{ seq: number, type: string } & Record<string, any>} GameEvent */

/**
 * The parts of a room view this module reads.
 * @typedef {{ code: string, deal?: number, game: { events: GameEvent[] } | null } | null | undefined} FeedRoom
 */

/**
 * The events that arrived since the previous view of the same table and deal, oldest first. None on the first view
 * (a refresh or a reconnect), at another table, at a new deal, or after a gap, so nothing is ever replayed, as Bird
 * Table's changedEvents.
 * @param {FeedRoom} previous - The room view shown before, or null
 * @param {FeedRoom} next - The room view arriving
 * @returns {GameEvent[]}
 */
export function freshEvents(previous, next) {
	if (
		!previous?.game ||
		!next?.game ||
		previous.code !== next.code ||
		(previous.deal ?? 0) !== (next.deal ?? 0)
	) {
		return [];
	}
	const last = previous.game.events.at(-1)?.seq ?? 0;
	const fresh = next.game.events.filter((event) => event.seq > last);
	return fresh.length > 0 && fresh[0].seq === last + 1 ? fresh : [];
}

/**
 * The events still standing: an `undone` event takes back the events from its `from` up to it (#24). The undone
 * event itself stays, so the log can say a choice was taken back.
 * @param {GameEvent[]} events - Oldest first
 * @returns {GameEvent[]}
 */
export function liveEvents(events) {
	/** @type {[number, number][]} */
	const takenBack = events
		.filter((event) => event.type === 'undone')
		.map((event) => [event.from, event.seq]);
	if (takenBack.length === 0) {
		return events;
	}
	return events.filter(
		(event) =>
			!takenBack.some(
				([from, until]) => event.seq >= from && event.seq < until
			)
	);
}
