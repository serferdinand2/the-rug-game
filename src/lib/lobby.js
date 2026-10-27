// What the lobby screen shows and allows (#25 design §6): the seat slots, who may change what, and the labels of the choices.

/**
 * One of the lobby's five places, as a SeatCard shows it.
 * @typedef {Object} Slot
 * @property {number} seat - 1 to 5
 * @property {'player' | 'empty'} state
 * @property {string} name - Empty for an empty slot
 * @property {boolean} you - The viewer's own seat, online only: at a hot-seat table every seat is the host's
 * @property {boolean} host
 * @property {boolean | undefined} ready - Online only; undefined shows no readiness
 * @property {boolean} removable - The viewer hosts and may clear it with the ×
 */

/**
 * The short row titles of the variants (#53), in the lobby's settings; the full names are their tooltips.
 * @type {Readonly<Record<string, string>>}
 */
export const VARIANT_LABELS = Object.freeze({
	'tapestry-draft': 'Tapestry draft',
	'civ-draft': 'Civilization draft',
	'neoprene-nanotechnology': 'Neoprene Nanotechnology',
	'no-radio-battery': 'No Radio or Battery',
	'closest-island': 'Closest island',
});

/** The rules versions as the mockups name them: the open tables in full, the settings row short. */
const RULES = Object.freeze({
	current: { full: 'Current rules', short: 'Current rules' },
	original: { full: 'Original 2019 rules', short: 'Original 2019' },
});

/**
 * Whether the viewer hosts the table.
 * @param {{ host: number, you: number[] }} room - A room view
 * @returns {boolean}
 */
export function isHost(room) {
	return room.you.includes(room.host);
}

/**
 * Whether the viewer may switch between Online and Local mode: the host, before any deal, while alone at the table
 * (#22's rule).
 * @param {{ host: number, you: number[], seats: unknown[], game: unknown }} room - A room view
 * @returns {boolean}
 */
export function canChangeMode(room) {
	return isHost(room) && room.game === null && room.seats.length === 1;
}

/**
 * The lobby's places, filled seats first, always `maxSeats` of them.
 * @param {{ mode: string, host: number, you: number[], game: unknown, seats: { name: string, ready: boolean }[] }} room
 *   A room view
 * @param {number} maxSeats
 * @returns {Slot[]}
 */
export function seatSlots(room, maxSeats) {
	const online = room.mode === 'online';
	const hosting = isHost(room);
	return Array.from({ length: maxSeats }, (_, i) => {
		const seat = i + 1;
		const filled = room.seats[i];
		if (!filled) {
			return {
				seat,
				state: 'empty',
				name: '',
				you: false,
				host: false,
				ready: undefined,
				removable: false,
			};
		}
		return {
			seat,
			state: 'player',
			name: filled.name,
			you: online && room.you.includes(seat),
			host: seat === room.host,
			ready: online ? filled.ready : undefined,
			// The server keeps the host's own online seat and the table's last player.
			removable:
				hosting &&
				room.game === null &&
				!(online && seat === room.host) &&
				room.seats.length > 1,
		};
	});
}

/**
 * Whether a typed table code can be one: 8 letters or digits once trimmed.
 * @param {string} text
 * @returns {boolean}
 */
export function validCode(text) {
	return /^[a-z0-9]{8}$/i.test(text.trim());
}

/**
 * A rules version's label.
 * @param {string} id - 'current' or 'original'
 * @param {{ short?: boolean }} [options] - short: the settings row's 'Original 2019'
 * @returns {string}
 */
export function rulesLabel(id, { short = false } = {}) {
	const label = RULES[/** @type {keyof typeof RULES} */ (id)];
	if (!label) {
		return id;
	}
	return short ? label.short : label.full;
}

/**
 * The turn timer's choices for a Segmented, from the server's list of minutes.
 * @param {number[]} timers - Minutes; 0 is off
 * @returns {{ value: string, label: string }[]}
 */
export function timerChoices(timers) {
	return timers.map((minutes) => ({
		value: String(minutes),
		label: minutes === 0 ? 'Off' : `${minutes} min`,
	}));
}
