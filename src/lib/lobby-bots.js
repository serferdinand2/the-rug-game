// Host bot-seat changes, preserving the room's consecutive occupied seat positions.
import { botSeatSelection } from './lobby.js';

/** Historical names assigned to official bot seats, independent of their difficulty. */
export const BOT_NAMES = Object.freeze([
	'Egypt',
	'Mesopotamia',
	'Indus Valley',
	'Shang',
	'Sumer',
]);

/** @typedef {{ name: string, kind?: 'automa' | 'shadow', level?: number }} BotLobbySeat */

/**
 * The complete bot list for a room configuration, including its existing names.
 * @param {BotLobbySeat[]} seats
 * @returns {{ seat: number, kind: 'automa' | 'shadow', name: string, level?: number }[]}
 */
export function botSelections(seats) {
	return seats.flatMap((entry, i) =>
		entry.kind
			? [
					{
						...botSeatSelection(i + 1, entry.kind, entry.level),
						name: entry.name,
					},
				]
			: []
	);
}

/**
 * The kind available for the next bot seat; an official type is added at most once.
 * @param {BotLobbySeat[]} seats
 * @returns {'automa' | 'shadow' | null}
 */
export function nextBotKind(seats) {
	const humans = seats.filter((seat) => !seat.kind).length;
	if (humans === 1 && !seats.some((seat) => seat.kind === 'automa')) {
		return 'automa';
	}
	return humans <= 2 && !seats.some((seat) => seat.kind === 'shadow')
		? 'shadow'
		: null;
}

/**
 * The first unused historical name for an added bot.
 * @param {BotLobbySeat[]} seats
 * @returns {string}
 */
export function nextBotName(seats) {
	return (
		BOT_NAMES.find((name) => !seats.some((seat) => seat.name === name)) ??
		BOT_NAMES[0]
	);
}

/**
 * Bot types already used by other seats, so the host cannot duplicate one.
 * @param {BotLobbySeat[]} seats
 * @param {number} selected
 * @returns {('automa' | 'shadow')[]}
 */
export function otherBotKinds(seats, selected) {
	const kinds = seats.flatMap((seat, i) =>
		i + 1 !== selected && seat.kind ? [seat.kind] : []
	);
	if (
		seats.filter((seat) => !seat.kind).length > 1 &&
		!kinds.includes('automa')
	) {
		kinds.push('automa');
	}
	return kinds;
}

/**
 * Remove a bot while compacting the following occupied seats as the room does.
 * @param {BotLobbySeat[]} seats
 * @param {number} removed
 * @returns {ReturnType<typeof botSelections>}
 */
export function withoutBot(seats, removed) {
	return botSelections(seats.filter((_, i) => i + 1 !== removed));
}
