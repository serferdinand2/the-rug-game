// The viewer's part in the turn (#26 design §5.1, §6): which open decision is theirs, the advances they can pay
// for, from the engine run on their own view, the words for income turns (#77), and the footer that shows (#86).
import { DECISIONS, askedSeats, openDecisions } from './engine/game.js';
import { TRACKS } from './engine/data/tracks.js';
import { spaceWords, tierSymbols } from './board.js';
import { describeCost } from './describe.js';
import { roman, seatName, spaceName, trackName } from './game-names.js';
import { TRACK_KEYS } from './hotkeys.js';
import { incomeView } from './prompts.js';
import { playerColor } from './ui.js';

/** @typedef {import('./engine/data/ids.js').TrackId} TrackId */

/**
 * One token the viewer can advance, with every legal way to pay for it.
 * @typedef {Object} AdvanceOption
 * @property {import('./engine/data/ids.js').TrackId} track
 * @property {number} from - The token's space
 * @property {number} to - The space it reaches
 * @property {import('./engine/payment.js').Payment[]} payments - The engine's answers' payments, default first
 */

/**
 * The viewer's open decision: the first open one that is theirs and carries its answers. That is a trap response on
 * someone else's turn too, and a seat's own pick in setup's simultaneous lanes.
 * @param {any} view - The game as view() gives it to the viewer
 * @param {number | null} seat - The viewer's seat, or null for the public view
 * @returns {any | null}
 */
export function myDecision(view, seat) {
	if (seat === null || !view) {
		return null;
	}
	return (
		openDecisions(view).find(
			(op) => op.player === seat && Array.isArray(op.answers)
		) ?? null
	);
}

/**
 * The advances the viewer can pay for now: while their turn choice offers an advance, before anything is sent, or
 * while their advance is open. The engine reads only what the viewer can see, so its preview on the view equals the
 * server's answers (tests/client-turn.test.mjs).
 * @param {any} view
 * @param {number | null} seat
 * @returns {AdvanceOption[]}
 */
export function advanceOptions(view, seat) {
	const decision = myDecision(view, seat);
	if (!decision) {
		return [];
	}
	/** @type {any[]} */
	let answers = [];
	if (decision.kind === 'chooseAdvance') {
		answers = decision.answers;
	} else if (
		decision.kind === 'chooseTurn' &&
		decision.options.includes('advance')
	) {
		// The advance that answering the turn choice would open, previewed before anything is sent.
		const preview = /** @type {any} */ ({
			player: seat,
			kind: 'chooseAdvance',
		});
		answers = DECISIONS.chooseAdvance.answers(view, preview);
	}
	/** @type {Map<string, AdvanceOption>} */
	const byToken = new Map();
	for (const { track, from, pay } of answers) {
		const key = `${track}:${from}`;
		if (!byToken.has(key)) {
			byToken.set(key, { track, from, to: from + 1, payments: [] });
		}
		/** @type {AdvanceOption} */ (byToken.get(key)).payments.push(pay);
	}
	return [...byToken.values()];
}

/**
 * Gives the footer the turn's context while the decision panel asks the actual question. Until effects carry exact
 * causes (#60), the latest advance in this turn is the most specific context the public view can name.
 * @param {any} view - The viewer's game view
 * @param {number | null} seat - The viewer's seat
 * @returns {string}
 */
export function decisionTurnHeading(view, seat) {
	if (view.phase === 'setup') {
		return 'Your setup choice';
	}
	const current = view.current;
	if (!Number.isInteger(current)) {
		return 'Your turn is in progress';
	}
	const prefix =
		current === seat ? 'Your turn' : `${seatName(view, current)}’s turn`;
	const events = Array.isArray(view.events) ? view.events : [];
	const started = events.findLast(
		(/** @type {any} */ event) => event.type === 'turnStarted'
	);
	const moved = events.findLast(
		(/** @type {any} */ event) =>
			event.type === 'tokenMoved' &&
			event.player === current &&
			event.seq > (started?.seq ?? -1) &&
			event.to > event.from &&
			TRACKS[/** @type {TrackId} */ (event.track)]?.[event.to]
	);
	return moved
		? `${prefix} · Advance to ${spaceName(moved.track, moved.to)}`
		: `${prefix} is in progress`;
}

/**
 * What taking an income turn does, for the footer (#77): income turns 2 to 4 end an era, gain income and begin the
 * next; income turn 5 has no income (01 §4.3).
 * @param {number} turn - The income turn it would start, 2 to 5; income turn 1 is never a choice
 * @returns {string}
 * @throws {RangeError} For any other turn
 */
export function incomeWords(turn) {
	if (!Number.isInteger(turn) || turn < 2 || turn > 5) {
		throw new RangeError(`An income turn to choose is 2 to 5, not ${turn}`);
	}
	if (turn === 5) {
		return 'End era IV, score it and finish playing.';
	}
	return `End era ${roman(turn - 1)}, gain income and begin era ${roman(turn)}.`;
}

/**
 * Whether the viewer's turn offers only income, because no advance can be paid for (#77).
 * @param {any} view
 * @param {number | null} seat
 * @returns {boolean}
 */
export function forcedIncome(view, seat) {
	const decision = myDecision(view, seat);
	return (
		decision?.kind === 'chooseTurn' &&
		decision.options.length === 1 &&
		decision.options[0] === 'income'
	);
}

/**
 * The waiting footer's words for the player whose turn it is, naming the income turn they are in (#77).
 * @param {any} view - The viewer's game view
 * @param {number} player - The player taking the turn
 * @param {string} name - Their name
 * @returns {string}
 */
export function takingTurnWords(view, player, name) {
	const turn = incomeView(view, player)?.turn;
	if (turn === 1) {
		return `${name} is taking their first income turn.`;
	}
	return turn
		? `${name} is taking income turn ${turn}.`
		: `${name} is taking their turn.`;
}

/**
 * What the one-time notice after income turn 1 shows (#77).
 * @typedef {Object} FirstIncomeNotice
 * @property {{ coin: number, worker: number, food: number, culture: number }} resources
 * @property {number} territoryTiles - Territory tiles in the viewer's supply
 * @property {number} tapestryCards - Tapestry cards in their hand
 * @property {string} holdings - The words after "You start with", such as "1 coin, 1 food and 1 tapestry card"
 */

/**
 * The notice that tells the viewer the game took their income turn 1 for them (#77), or null when it shouldn't open:
 * only in play, while the viewer is in era I with their income turn 1 over, and never over a question of theirs.
 * @param {any} view - The viewer's game view
 * @param {number | null} seat - The viewer's seat, or null for the public view
 * @returns {FirstIncomeNotice | null}
 */
export function firstIncomeNotice(view, seat) {
	const player = seat === null ? null : view?.seats?.[seat - 1];
	if (
		view?.phase !== 'play' ||
		!player ||
		player.kind !== 'player' ||
		player.incomeTurns !== 1 ||
		incomeView(view, seat) !== null
	) {
		return null;
	}
	const open = myDecision(view, seat);
	if (open && open.kind !== 'chooseTurn') {
		return null;
	}
	const { coin, worker, food, culture } = player.resources;
	const territoryTiles = player.territoryTiles.length;
	const tapestryCards = player.handCount ?? player.hand?.length ?? 0;
	const words = describeCost({
		coin,
		worker,
		food,
		culture,
		territory: territoryTiles,
		tapestry: tapestryCards,
	});
	return {
		resources: { coin, worker, food, culture },
		territoryTiles,
		tapestryCards,
		holdings: words === 'Nothing' ? 'nothing' : words,
	};
}

/**
 * What only the game screen knows about its footer (#86).
 * @typedef {Object} FooterInputs
 * @property {boolean} overviewOpen - The players overview is open
 * @property {boolean} noticeOpen - The first-income notice is open (#77), which takes income's place
 * @property {boolean} incomeAsk - The footer asks "Take an income turn?" (#83)
 * @property {boolean} trackAsk - The footer asks "Advance on which track?" (#83)
 * @property {{ track: TrackId, space: number } | null} selected - The space picked on the tracks
 * @property {readonly { track: TrackId, to: number }[]} options - The advances the viewer can pay for (advanceOptions)
 * @property {boolean} [paying] - The selected advance's payment is picked in the panel (#75)
 * @property {{ turn: number } | null} [income] - The viewer's own income turn, as the prompt has it
 * @property {string | null} [incomeStep] - The income turn's step running now, such as 'Gain income'
 */

/**
 * The footer to show, with every word in it, as TurnBar takes them (#86).
 * @typedef {Object} FooterView
 * @property {'none' | 'overview' | 'over' | 'incomeAsk' | 'trackAsk' | 'forcedIncome' | 'selected' | 'turn' | 'income' | 'decision' | 'setup' | 'waiting'} kind
 * @property {import('./components/prompts/TurnBar.svelte').TurnBarTone} [tone]
 * @property {string} [label] - Left out for TurnBar's own 'Your turn'
 * @property {string} [labelColor] - Another player's colour, for their turn
 * @property {string} [heading]
 * @property {string} [properName] - The selected space's name
 * @property {TrackId} [track] - The selected space's track
 * @property {string} [detail]
 * @property {import('./ui.js').CostSymbol[] | null} [cost] - The selected space's tier price
 * @property {{ description: string, label: string } | null} [income] - The income choice beside the turn label
 * @property {{ track: TrackId, label: string, enabled: boolean }[]} [tracks] - The track question's choices, by key
 * @property {{ enabled: boolean, title: string | undefined }} [advance] - The selected space's Advance button
 * @property {boolean} [takeIncome] - Forced income's Take income button shows
 */

/**
 * Which footer the game screen shows, and what it says (#86): the first that applies of the players overview's
 * close bar, game over, the income question, the track question, forced income, a selected space, the turn choice,
 * the viewer's income turn, their other decisions, setup and waiting for another player; or none.
 * @param {any} game - The viewer's game view
 * @param {number | null} seat - The viewer's seat, or null for the public view
 * @param {FooterInputs} inputs
 * @returns {FooterView}
 */
export function footerView(game, seat, inputs) {
	const { selected, options } = inputs;
	const mine = myDecision(game, seat);
	const turn =
		mine?.kind === 'chooseTurn' || mine?.kind === 'chooseAdvance'
			? mine
			: null;
	const choosing = turn?.kind === 'chooseTurn';
	const incomeDescription = choosing
		? incomeWords(game.seats[turn.player - 1].incomeTurns + 1)
		: '';
	const income =
		choosing && !inputs.noticeOpen
			? { description: incomeDescription, label: 'Take income' }
			: null;
	if (inputs.overviewOpen) {
		return { kind: 'overview' };
	}
	if (game.phase === 'over') {
		return {
			kind: 'over',
			tone: 'neutral',
			label: 'Game complete',
			heading: 'The game is complete.',
			detail: 'The board as the game ended.',
		};
	}
	if (choosing && inputs.incomeAsk) {
		return {
			kind: 'incomeAsk',
			tone: 'neutral',
			heading: 'Take an income turn?',
			detail: incomeDescription,
		};
	}
	if (turn && inputs.trackAsk) {
		const open = new Set(options.map((o) => o.track));
		return {
			kind: 'trackAsk',
			tone: 'neutral',
			heading: 'Advance on which track?',
			detail: 'Press its number, or Esc to go back.',
			tracks: TRACK_KEYS.map((track, at) => ({
				track,
				label: `${at + 1} · ${trackName(track)}`,
				enabled: open.has(track),
			})),
		};
	}
	if (turn && forcedIncome(game, seat)) {
		return {
			kind: 'forcedIncome',
			tone: 'neutral',
			heading: "You can't pay for any advance, so take an income turn.",
			detail: incomeDescription,
			takeIncome: !inputs.noticeOpen,
		};
	}
	if (turn && selected) {
		const reachable = options.some(
			(o) => o.track === selected.track && o.to === selected.space
		);
		return {
			kind: 'selected',
			tone: 'selected',
			heading: 'Advance to',
			properName: spaceName(selected.track, selected.space),
			track: selected.track,
			detail: spaceWords(game, selected.track, selected.space),
			cost: tierSymbols(
				selected.track,
				/** @type {1 | 2 | 3 | 4} */ (Math.ceil(selected.space / 3))
			),
			income,
			advance: {
				enabled: reachable && !inputs.paying,
				title: !reachable
					? "You can't advance there now."
					: inputs.paying
						? 'Pick the payment in the panel.'
						: undefined,
			},
		};
	}
	if (turn) {
		return {
			kind: 'turn',
			tone: 'neutral',
			heading: options.length
				? 'Choose a space to advance to, or take income.'
				: 'Take an income turn.',
			detail: options.length
				? 'The spaces you can pay for are outlined in green.'
				: undefined,
			income,
		};
	}
	if (mine && inputs.income) {
		const { turn: number } = inputs.income;
		return {
			kind: 'income',
			tone: 'income',
			label: 'Your income turn',
			heading: `Income turn ${number}${inputs.incomeStep ? ` · ${inputs.incomeStep}` : ''}`,
			detail:
				number === 1
					? 'Every player’s first turn is an income turn.'
					: undefined,
		};
	}
	if (mine) {
		return {
			kind: 'decision',
			tone: 'neutral',
			label: 'Your decision',
			heading: decisionTurnHeading(game, seat),
		};
	}
	if (game.phase === 'setup') {
		return {
			kind: 'setup',
			tone: 'waiting',
			label: 'Setting up',
			heading: 'Waiting for the others to choose.',
		};
	}
	const current = game.current === null ? null : game.seats[game.current - 1];
	if (!current) {
		return { kind: 'none' };
	}
	const asked = askedSeats(game);
	const other = asked.length > 0 && !asked.includes(current.seat);
	const name = (/** @type {number} */ player) => seatName(game, player);
	return {
		kind: 'waiting',
		tone: 'waiting',
		label: other
			? `Waiting for ${name(asked[0])}`
			: `${current.name}’s turn`,
		labelColor: playerColor(other ? asked[0] : current.seat),
		heading: other
			? `${name(asked[0])} is deciding.`
			: takingTurnWords(game, current.seat, current.name),
	};
}
