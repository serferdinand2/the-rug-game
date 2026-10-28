// What the lobby screen shows and allows (#25 design §6): the seat slots, who may change what, and the choices' lists and labels.
import { EXPANSIONS } from './art/catalog.js';

/**
 * One of the lobby's five places, as a SeatCard shows it.
 * @typedef {Object} Slot
 * @property {import('./ui.js').Seat} seat - 1 to 5
 * @property {'player' | 'empty' | 'closed'} state - closed: an empty seat the viewer can't open (#98)
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

/**
 * One choice of a lobby setting, as a Segmented takes it.
 * @typedef {Object} Choice
 * @property {string} value
 * @property {string} label
 * @property {string} color - A token reference, such as 'var(--science)'
 */

/**
 * One variant's row in the lobby's settings.
 * @typedef {Object} VariantRow
 * @property {string} id
 * @property {string} label - The row's short title
 * @property {string} name - The full name: the row's tooltip and its choices' group name
 * @property {'yes' | 'no'} value - Whether the table plays it, as YES_NO_CHOICES names it
 */

/** The rules versions as the mockups name them: the open tables in full, the settings row short. */
const RULES = Object.freeze({
	current: { full: 'Current rules', short: 'Current rules' },
	original: { full: 'Original 2019 rules', short: 'Original 2019' },
});

/** The settings row's order, the current rules first as in the mockup, and each version's colour. */
const RULES_ORDER = Object.freeze(['current', 'original']);
/** @type {Readonly<Record<string, string>>} */
const RULES_COLORS = Object.freeze({
	current: 'var(--science)',
	original: 'var(--technology)',
});

/** @type {Readonly<Record<string, string>>} */
const MODE_LABELS = Object.freeze({
	online: 'Online mode',
	hotseat: 'Local mode',
});

/** Each expansion's colour token, as the library's Expansions row shows them. @type {Readonly<Record<string, string>>} */
const EXPANSION_COLORS = Object.freeze({
	pp: 'var(--plans-ploys)',
	aa: 'var(--arts-architecture)',
	ff: 'var(--fantasies-futures)',
});

/** Undo's two choices, in the lobby and in Table settings. @type {readonly Choice[]} */
export const UNDO_CHOICES = Object.freeze([
	{ value: 'on', label: 'Allow undo', color: 'var(--exploration)' },
	{ value: 'off', label: 'No undo', color: 'var(--military)' },
]);

/** A variant's two choices. @type {readonly Choice[]} */
export const YES_NO_CHOICES = Object.freeze([
	{ value: 'yes', label: 'Yes', color: 'var(--science)' },
	{ value: 'no', label: 'No', color: 'var(--text)' },
]);

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
 * Why the viewer can't switch between Online and Local mode, or null when they can.
 * @param {{ host: number, you: number[], seats: unknown[], game: unknown }} room - A room view
 * @returns {string | null}
 */
export function modeLock(room) {
	if (canChangeMode(room)) {
		return null;
	}
	return isHost(room)
		? 'The mode changes only while you are alone at the table.'
		: 'Only the host changes the mode.';
}

/**
 * Why the viewer can't change the table's settings, or null when they can: only the host does.
 * @param {{ host: number, you: number[] }} room - A room view
 * @returns {string | null}
 */
export function settingsLock(room) {
	return isHost(room) ? null : 'Only the host changes the table.';
}

/**
 * The lobby's places, filled seats first, always `maxSeats` of them. An empty one is closed to a viewer who can't
 * open it: online anyone shares the code, but at a hot-seat table only the host adds a player.
 * @param {{ mode: string, host: number, you: number[], game: unknown, seats: { name: string, ready: boolean }[] }} room
 *   A room view
 * @param {number} maxSeats
 * @returns {Slot[]}
 */
export function seatSlots(room, maxSeats) {
	const online = room.mode === 'online';
	const hosting = isHost(room);
	return Array.from({ length: maxSeats }, (_, i) => {
		const seat = /** @type {import('./ui.js').Seat} */ (i + 1);
		const filled = room.seats[i];
		if (!filled) {
			return {
				seat,
				state: online || hosting ? 'empty' : 'closed',
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
 * The mode's choices, from the server's `config.modes`, in its order.
 * @param {readonly string[]} modes - Such as ['online', 'hotseat']
 * @returns {Choice[]}
 */
export function modeChoices(modes) {
	return modes.map((mode) => ({
		value: mode,
		label:
			MODE_LABELS[mode] ??
			`${mode.charAt(0).toUpperCase()}${mode.slice(1)} mode`,
		color: 'var(--exploration)',
	}));
}

/**
 * The rules versions' choices, the current rules first, with the settings row's short labels.
 * @param {readonly { id: string }[] | undefined} versions - The server's `config.versions`
 * @returns {Choice[]}
 */
export function rulesChoices(versions) {
	/** @param {string} id */
	const rank = (id) =>
		RULES_ORDER.includes(id) ? RULES_ORDER.indexOf(id) : RULES_ORDER.length;
	return [...(versions ?? [])]
		.sort((a, b) => rank(a.id) - rank(b.id))
		.map(({ id }) => ({
			value: id,
			label: rulesLabel(id, { short: true }),
			color: RULES_COLORS[id] ?? 'var(--gold)',
		}));
}

/**
 * The expansions' choices, named as the art catalog names them.
 * @param {readonly string[] | undefined} codes - The server's `config.expansions`, such as ['aa']
 * @returns {Choice[]}
 */
export function expansionChoices(codes) {
	return (codes ?? []).map((code) => ({
		value: code,
		label:
			EXPANSIONS.find((expansion) => expansion.code === code)?.name ??
			code,
		color: EXPANSION_COLORS[code] ?? 'var(--gold)',
	}));
}

/**
 * The variants' rows, in the server's order, each with whether the table plays it.
 * @param {{ variants?: readonly { id: string, name: string }[] } | null | undefined} config - The server's config
 * @param {{ options: { variants: readonly string[] } }} room - A room view
 * @returns {VariantRow[]}
 */
export function variantRows(config, room) {
	return (config?.variants ?? []).map(({ id, name }) => ({
		id,
		label:
			/** @type {Record<string, string>} */ (VARIANT_LABELS)[id] ?? name,
		name,
		value: room.options.variants.includes(id) ? 'yes' : 'no',
	}));
}

/**
 * A table's variants with one switched on or off; one switched on goes last.
 * @param {readonly string[]} variants - The table's variants now
 * @param {string} id
 * @param {boolean} on
 * @returns {string[]}
 */
export function toggleVariant(variants, id, on) {
	const others = variants.filter((variant) => variant !== id);
	return on ? [...others, id] : others;
}

/**
 * The turn timer's choices for a Segmented, from the server's list of minutes.
 * @param {readonly number[]} timers - Minutes; 0 is off
 * @returns {Choice[]}
 */
export function timerChoices(timers) {
	return timers.map((minutes) => ({
		value: String(minutes),
		label: minutes === 0 ? 'Off' : `${minutes} min`,
		color: 'var(--exploration)',
	}));
}
