// What other players just did (#153 design): their fresh events as display items, in the log's words, and the queue that plays them one after another.
import { eventText } from './log.js';
import {
	civilizationName,
	hexName,
	seatName,
	spaceName,
	tapestryCardOf,
	tapestryName,
	techName,
	trackName,
} from './game-names.js';
import { playerColor } from './ui.js';
import { countWords } from './words.js';

/** The most lines under one headline; the rest are counted, and stay in the log. */
export const MAX_LINES = 6;

/** @typedef {'tapestry' | 'advance' | 'invent' | 'upgrade' | 'explore' | 'conquer' | 'income'} PlayerActionKind */

/**
 * A piece of the headline: the player's name in their colour, a game thing's name in Cinzel gold, or plain words.
 * @typedef {Object} HeadlinePart
 * @property {string} text
 * @property {'who' | 'name' | 'plain'} role
 */

/**
 * What one display shows beside its words, by kind: a tapestry card (null: face down, shown as its back); the track,
 * space and landmark of an advance; a tech card and the rows of an upgrade; the tile of an explore; the hex, its tile
 * and the dice of a conquer; the number of an income turn.
 * @typedef {{ card: string | null }
 *   | { track: string, space: number, landmark: string | null }
 *   | { card: string, from?: string, to?: string }
 *   | { hex: string, tile: number, orient: number }
 *   | { hex: string, tile: number | null, orient: number, dice: { red: number, black: number } | null, trapped: boolean }
 *   | { turn: number }} PlayerActionPicture
 */

/**
 * One thing another player just did, as the panel shows it.
 * @typedef {Object} PlayerActionItem
 * @property {string} id - The seq of the event it starts at, unique within a game
 * @property {number} player - Who did it
 * @property {string} name - Their name
 * @property {string} color - Their colour, as a token reference such as 'var(--player-1)'
 * @property {PlayerActionKind} kind
 * @property {string} context - Their civilization and the income turn, such as 'Leaders · Income turn 4'
 * @property {HeadlinePart[]} headline - The log's sentence without its full stop
 * @property {string} text - The headline as a sentence, as the footer's "Just now" says it
 * @property {string[]} lines - What followed, in the log's words
 * @property {number} more - Lines left out after MAX_LINES
 * @property {any} picture - The PlayerActionPicture for its kind
 */

/**
 * The queue of displays: the run's items and the one on show.
 * @typedef {Object} ActionQueue
 * @property {PlayerActionItem[]} items - Everything in this run, played or not, so the count reads "2 of 3"
 * @property {number} at - The item on show, by index
 */

/** Nothing queued. @type {Readonly<ActionQueue>} */
export const EMPTY_QUEUE = Object.freeze({
	items: /** @type {PlayerActionItem[]} */ ([]),
	at: 0,
});

/** The events that begin a display of their own. */
const MAIN = new Set([
	'tapestryPlayed',
	'techInvented',
	'techUpgraded',
	'explored',
	'conquered',
]);

/** Events that may come between a conquest's outpost and its `conquered`: the defender's answer. */
const CONQUEST_STEPS = new Set([
	'outpostToppled',
	'responsePlayed',
	'responseDeclined',
	'cardsDiscarded',
]);

/**
 * @param {unknown} value
 * @returns {value is Record<string, any>}
 */
function isRecord(value) {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * @param {unknown} value
 * @returns {value is number}
 */
function isCount(value) {
	return Number.isInteger(value) && /** @type {number} */ (value) >= 0;
}

/**
 * Whether an event moves a token forward: an advance, not a step back.
 * @param {Record<string, any>} event
 * @returns {boolean}
 */
function isAdvance(event) {
	return (
		event.type === 'tokenMoved' &&
		isCount(event.to) &&
		event.to > 0 &&
		(!isCount(event.from) || event.to > event.from)
	);
}

/**
 * Whether an outpost placed at `index` is the start of a conquest: the next event that is not the defender's answer is
 * that player's `conquered` on the same hex.
 * @param {Record<string, any>[]} events
 * @param {number} index
 * @returns {boolean}
 */
function startsConquest(events, index) {
	const placed = events[index];
	if (placed.militarism === true) {
		return false;
	}
	for (const next of events.slice(index + 1)) {
		if (!isRecord(next)) {
			continue;
		}
		if (next.type === 'conquered') {
			return next.player === placed.player && next.hex === placed.hex;
		}
		if (!CONQUEST_STEPS.has(next.type)) {
			return false;
		}
	}
	return false;
}

/**
 * The kind of display an event begins, or null for a line.
 * @param {Record<string, any>[]} events
 * @param {number} index
 * @returns {PlayerActionKind | null}
 */
function kindOf(events, index) {
	const event = events[index];
	if (isAdvance(event)) {
		return 'advance';
	}
	if (event.type === 'outpostPlaced') {
		return startsConquest(events, index) ? 'conquer' : null;
	}
	if (!MAIN.has(event.type)) {
		return null;
	}
	switch (event.type) {
		case 'tapestryPlayed':
			return 'tapestry';
		case 'techInvented':
			return 'invent';
		case 'techUpgraded':
			return 'upgrade';
		case 'explored':
			return 'explore';
		default:
			return 'conquer';
	}
}

/**
 * @param {string} text
 * @returns {HeadlinePart}
 */
const plain = (text) => ({ text, role: 'plain' });
/**
 * @param {string} text
 * @returns {HeadlinePart}
 */
const named = (text) => ({ text, role: 'name' });

/**
 * The headline after the player's name, from the event a display begins at, as the log words it.
 * @param {PlayerActionKind} kind
 * @param {Record<string, any>} event
 * @returns {HeadlinePart[]}
 */
function headlineOf(kind, event) {
	switch (kind) {
		case 'tapestry': {
			if (event.faceDown === true || typeof event.card !== 'string') {
				return [plain(' played a tapestry card face down')];
			}
			if (tapestryCardOf(event.card)?.id === 'trap') {
				return [plain(' played a trap as a tapestry card')];
			}
			return [plain(' played '), named(tapestryName(event.card))];
		}
		case 'advance':
			return [
				plain(' advanced to '),
				named(spaceName(event.track, event.to)),
				plain(' on '),
				named(trackName(event.track)),
			];
		case 'invent':
			return [
				plain(' invented '),
				named(techName(event.card)),
				...(event.from === 'deck' ? [plain(' from the deck')] : []),
			];
		case 'upgrade':
			return [
				plain(' upgraded '),
				named(techName(event.card)),
				...(event.to === 'middle' || event.to === 'top'
					? [plain(` to the ${event.to} row`)]
					: []),
			];
		case 'explore':
			return [
				plain(
					` explored ${hexName(event.hex)}${
						isCount(event.vp) && event.vp > 0
							? `, matching ${countWords(event.vp, 'side', 'sides')}`
							: ''
					}`
				),
			];
		case 'conquer':
			return event.trapped === true
				? [plain(`'s conquest of ${hexName(event.hex)} failed`)]
				: [plain(` conquered ${hexName(event.hex)}`)];
		case 'income':
			return [plain(` took income turn ${event.turn}`)];
	}
}

/**
 * The picture of a display, from the event it begins at; never more than the viewer's view holds.
 * @param {PlayerActionKind} kind
 * @param {Record<string, any>} event
 * @param {any} game
 * @returns {any}
 */
function pictureOf(kind, event, game) {
	switch (kind) {
		case 'tapestry':
			return {
				card:
					event.faceDown === true || typeof event.card !== 'string'
						? null
						: event.card,
			};
		case 'advance':
			return { track: event.track, space: event.to, landmark: null };
		case 'invent':
			return { card: event.card };
		case 'upgrade':
			return { card: event.card, from: event.from, to: event.to };
		case 'explore':
			return { hex: event.hex, tile: event.tile, orient: event.orient };
		case 'conquer': {
			const hex = game?.hexes?.[event.hex];
			return {
				hex: event.hex,
				tile: isCount(hex?.tile) ? hex.tile : null,
				orient: isCount(hex?.orient) ? hex.orient : 0,
				dice: null,
				trapped: event.type === 'conquered' && event.trapped === true,
			};
		}
		case 'income':
			return { turn: event.turn };
	}
}

/**
 * A new display item for a player.
 * @param {PlayerActionKind} kind
 * @param {Record<string, any>} event - The event it begins at
 * @param {any} game
 * @param {number | null} income - The income turn the player is taking, or null
 * @returns {PlayerActionItem}
 */
function itemOf(kind, event, game, income) {
	const player = Number(event.player);
	const name = seatName(game, player);
	const civs = game?.seats?.[player - 1]?.civs;
	const context = [
		...(Array.isArray(civs) && civs.length > 0
			? [civilizationName(civs[0])]
			: []),
		...(income !== null ? [`Income turn ${income}`] : []),
	].join(' · ');
	const headline = [
		{ text: name, role: /** @type {const} */ ('who') },
		...headlineOf(kind, event),
	];
	return {
		id: String(event.seq),
		player,
		name,
		color: playerColor(/** @type {any} */ (player)),
		kind,
		context,
		headline,
		text: `${headline.map((part) => part.text).join('')}.`,
		lines: [],
		more: 0,
		picture: pictureOf(kind, event, game),
	};
}

/**
 * Adds a line under an item's headline, or counts it once the item has MAX_LINES.
 * @param {PlayerActionItem} item
 * @param {string} line
 */
function addLine(item, line) {
	if (item.lines.length < MAX_LINES) {
		item.lines.push(line);
	} else {
		item.more += 1;
	}
}

/**
 * The income turn a player is taking when a batch begins, read from the events before it: the last turn marker.
 * @param {any[]} history - The game's events
 * @param {number} first - The seq of the batch's first event
 * @returns {{ player: number, turn: number } | null}
 */
function incomeBefore(history, first) {
	for (let i = history.length - 1; i >= 0; i--) {
		const event = history[i];
		if (!isRecord(event) || !(event.seq < first)) {
			continue;
		}
		if (event.type === 'turnStarted') {
			return null;
		}
		if (event.type === 'incomeTurnStarted') {
			return { player: Number(event.player), turn: Number(event.turn) };
		}
	}
	return null;
}

/**
 * The displays for a batch of fresh events, in the order they happened: one for each main action of a player other
 * than the viewer, with the lines that follow it. An income turn's tapestry card has its own display, and the rest of
 * the turn is one summary after it; income turn 1, which everyone takes in setup, shows nothing.
 * @param {any[]} events - Fresh events, oldest first (#29)
 * @param {any} game - The viewer's view, for names and the map
 * @param {number | null} viewer - The seat on show; their own actions show nothing. Null shows everyone's
 * @param {any[]} [history] - The game's events, for an income turn that began before the batch
 * @returns {PlayerActionItem[]}
 */
export function actionsOf(events, game, viewer, history = []) {
	if (!Array.isArray(events)) {
		return [];
	}
	const list = events.filter(isRecord);
	/** @type {PlayerActionItem[]} */
	const out = [];
	/** The display taking lines, or null; `skip` drops the lines of an action that shows nothing, such as the viewer's own. */
	/** @type {{ item: PlayerActionItem | null, skip: boolean }} */
	let current = { item: null, skip: false };
	/** @type {{ player: number, turn: number, item: PlayerActionItem | null, event: Record<string, any> } | null} */
	let income = null;
	const before = list.length > 0 ? incomeBefore(history, list[0].seq) : null;
	if (before) {
		income = {
			...before,
			item: null,
			event: { seq: list[0].seq, ...before },
		};
	}

	const shows = (/** @type {number} */ player) => player !== viewer;
	const closeIncome = () => {
		if (income?.item && income.item.lines.length > 0) {
			out.push(income.item);
		}
		income = null;
	};
	/** The income turn's summary, made when it first takes a line. */
	const incomeItem = () => {
		if (!income || income.turn <= 1 || !shows(income.player)) {
			return null;
		}
		if (!income.item) {
			income.item = itemOf('income', income.event, game, income.turn);
			// A turn summed up over several batches has one summary per batch, each with an id of its own.
			income.item.id = `${income.event.seq}-income`;
		}
		return income.item;
	};

	list.forEach((event, index) => {
		const player = Number(event.player);
		if (event.type === 'turnStarted') {
			current = { item: null, skip: false };
			closeIncome();
			return;
		}
		if (event.type === 'incomeTurnStarted') {
			current = { item: null, skip: false };
			closeIncome();
			income = { player, turn: Number(event.turn), item: null, event };
			return;
		}
		const conquest = current.item?.kind === 'conquer' ? current.item : null;
		if (
			event.type === 'conquered' &&
			conquest &&
			conquest.player === player &&
			conquest.picture.hex === event.hex &&
			conquest.id !== String(event.seq)
		) {
			// The conquest that began at its outpost: its outcome is now known.
			conquest.picture.trapped = event.trapped === true;
			conquest.headline = [
				conquest.headline[0],
				...headlineOf('conquer', event),
			];
			conquest.text = `${conquest.headline.map((part) => part.text).join('')}.`;
			return;
		}
		if (event.type === 'conquerDiceRolled' && conquest?.player === player) {
			conquest.picture.dice = {
				red: Number(event.red) || 0,
				black: Number(event.black) || 0,
			};
		}
		if (
			event.type === 'landmarkGained' &&
			current.item?.kind === 'advance' &&
			current.item.player === player &&
			current.item.picture.landmark === null &&
			typeof event.landmark === 'string'
		) {
			current.item.picture.landmark = event.landmark;
		}
		const kind = kindOf(list, index);
		const turn =
			income !== null && income.player === player ? income.turn : null;
		if (kind !== null && turn !== null && kind !== 'tapestry') {
			// The rest of an income turn is a line of its summary.
			const summary = incomeItem();
			current = { item: summary, skip: summary === null };
		} else if (kind !== null) {
			// A tapestry card shows even in income turn 1, as on the Heralds' Maker of Fire.
			if (shows(player)) {
				const item = itemOf(kind, event, game, turn);
				out.push(item);
				current = { item, skip: false };
				return;
			}
			current = { item: null, skip: true };
			return;
		}
		if (
			turn !== null &&
			current.item?.kind === 'tapestry' &&
			(event.type === 'capitalScored' ||
				(event.type === 'vpGained' && event.source !== 'tapestry'))
		) {
			// The income turn's score step has begun: the card's own lines are over, and the rest is the summary's.
			const summary = incomeItem();
			current = { item: summary, skip: summary === null };
		}
		const text = eventText(event, game);
		if (text === null || current.skip) {
			return;
		}
		// A line belongs to the display before it; with none, to the income turn being taken.
		const target = current.item ?? incomeItem();
		if (target) {
			addLine(target, text);
		}
	});
	closeIncome();
	return out;
}

/**
 * The queue with a batch's items added at its end; nothing added leaves it as it was.
 * @param {ActionQueue} queue
 * @param {PlayerActionItem[]} items
 * @returns {ActionQueue}
 */
export function queueAdd(queue, items) {
	if (items.length === 0) {
		return queue;
	}
	return { items: [...queue.items, ...items], at: queue.at };
}

/**
 * The item on show, or null when the queue is empty.
 * @param {ActionQueue} queue
 * @returns {PlayerActionItem | null}
 */
export function queueCurrent(queue) {
	return queue.items[queue.at] ?? null;
}

/**
 * The queue moved on to its next item; past the last, the empty queue.
 * @param {ActionQueue} queue
 * @returns {ActionQueue}
 */
export function queueNext(queue) {
	const at = queue.at + 1;
	return at < queue.items.length ? { items: queue.items, at } : EMPTY_QUEUE;
}

/**
 * Where the queue stands, for "1 of N".
 * @param {ActionQueue} queue
 * @returns {{ index: number, count: number }}
 */
export function queuePosition(queue) {
	return { index: queue.at + 1, count: queue.items.length };
}
