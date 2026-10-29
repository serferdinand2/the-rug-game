// The prompt model (#28 design §2): what the decision panel draws for the viewer's open decision, its words, art and places.
import { INCOME_STEPS, INCOME_STEP_KINDS } from './engine/game.js';
import { TRACK_RESOURCE } from './engine/data/tracks.js';
import { RED_DIE, BLACK_DIE } from './engine/data/dice.js';
import { BUILDING_IDS, TRACK_IDS } from './engine/data/ids.js';
import { RESOURCE_ORDER } from './ui.js';
import { decisionTitle, describeAnswer } from './decision-words.js';
import { matchIndex, pickModel, pickStatus, tradeOffers } from './picks.js';
import { cardSpot, spotWords } from './civ-card.js';

/** @typedef {import('./ui.js').TrackId} TrackId */
/** @typedef {import('./ui.js').CostSymbol} CostSymbol */
/** @typedef {import('./engine/data/ids.js').BuildingId} BuildingId */

/**
 * One thing drawn with an option: a resource with its count, a track symbol, a piece, a card, a tile or VP in words.
 * @typedef {{ kind: 'resource', id: CostSymbol, count: number }
 *   | { kind: 'track', id: TrackId }
 *   | { kind: 'building', id: BuildingId }
 *   | { kind: 'landmark', id: string }
 *   | { kind: 'terrain', id: string }
 *   | { kind: 'civ', id: string }
 *   | { kind: 'tapestry', id: string }
 *   | { kind: 'tech', id: string }
 *   | { kind: 'deck', id: 'tech', count: number }
 *   | { kind: 'space-tile', id: number }
 *   | { kind: 'territory', id: number, orient: number }
 *   | { kind: 'mat', id: number }
 *   | { kind: 'vp', count: number }} Art
 */

/**
 * One answer of the decision, as the prompt offers it.
 * @typedef {Object} PromptOption
 * @property {number} index - The answer's index in decision.answers
 * @property {'panel' | 'shelf' | 'map' | 'capital' | 'card'} place - Where it is chosen: 'card' on the player's civilization card in the Civ tab (#78)
 * @property {string} label - describeAnswer(decision, answer, game)
 * @property {Art[]} art - Drawn before or above the label; may be empty
 * @property {string} [hex] - For place 'map': the hex it is chosen on
 * @property {string} [spot] - For place 'card': the spot on the card it is chosen on (civ-card.js)
 * @property {{ row: number, col: number, rotation: number | null }} [plot] - For place 'capital'; rotation null for a building
 */

/**
 * The viewer's income turn: its steps and the one running now.
 * @typedef {Object} IncomeView
 * @property {number} turn - 1–5
 * @property {{ id: string, label: string }[]} steps - The turn's visible steps in order
 * @property {string | null} current - The id of the step running now
 */

/**
 * What the decision panel draws for one open decision.
 * @typedef {Object} Prompt
 * @property {string} kind - The decision kind
 * @property {string} title - decisionTitle(decision, game)
 * @property {string} instruction - One sentence on how to answer
 * @property {'options' | 'cards' | 'map' | 'capital' | 'card'} layout - Where the decision is mainly made; the capital leads, then the map, then the civilization card
 * @property {'tapestry' | 'tech' | 'civ' | 'mat' | null} shelf - What the shelf holds, whenever an option is on it
 * @property {string[]} mapHexes - The hexes lit on the map, whenever an option is on it, in answer order
 * @property {TrackId | null} track - The track that tints the panel
 * @property {CostSymbol[] | null} cost - A price shown above the options
 * @property {IncomeView | null} income - Set during the viewer's own income turn
 * @property {string} confirmLabel
 * @property {PromptOption[]} options - One per answer, in answer order
 * @property {import('./picks.js').PickModel | null} picks - Several resources, cards or tiles chosen one by one (#75)
 * @property {ReturnType<typeof tradeOffers>} trade - A trade's offers, its first step (#75)
 */

/** @typedef {Record<string, any>} Decision - An open decision as the viewer's view shows it, with its `answers` */
/** @typedef {Record<string, any>} Answer - One of a decision's answers */

/** The steps the income strip shows, in the mockup's words; the engine's other steps run unseen. */
const STEP_LABELS = /** @type {Readonly<Record<string, string>>} */ ({
	civAbilities: 'Ability',
	tapestry: 'Tapestry',
	upgrade: 'Upgrade',
	score: 'Score',
	income: 'Income',
});

/** The resources, in the order the screens list them, then a resource of any type. */
const SYMBOL_ORDER = /** @type {readonly CostSymbol[]} */ ([
	...RESOURCE_ORDER,
	'any',
]);

/** The resources a payment can hold. @type {readonly string[]} */
const PAID_RESOURCES = RESOURCE_ORDER;

/** Which shelf each card decision fills. */
const SHELVES = /** @type {Readonly<Record<string, Prompt['shelf']>>} */ ({
	chooseTapestry: 'tapestry',
	chooseKeep: 'tapestry',
	chooseDiscard: 'tapestry',
	chooseResponse: 'tapestry',
	chooseCopy: 'tapestry',
	chooseInvent: 'tech',
	chooseUpgrade: 'tech',
	chooseTechBenefit: 'tech',
	chooseCiv: 'civ',
	chooseCapital: 'mat',
});

/** The confirm button's words for each decision kind that has its own. */
const CONFIRM_LABELS = /** @type {Readonly<Record<string, string>>} */ ({
	chooseTapestry: 'Play card',
	chooseKeep: 'Keep card',
	chooseCiv: 'Keep civilization',
	chooseCapital: 'Take this capital',
	chooseInvent: 'Invent',
	chooseUpgrade: 'Upgrade',
	chooseExplore: 'Explore',
	chooseConquer: 'Conquer',
	choosePlacement: 'Place',
});

/** The decision kinds whose answer may name a track. */
const TRACK_ANSWERS = [
	'chooseTrack',
	'chooseRoll',
	'chooseRestart',
	'chooseMove',
	'chooseRepeat',
	'chooseSpace',
	'choosePartner',
];

/**
 * Whether a value is a plain object.
 * @param {unknown} value
 * @returns {value is Record<string, any>}
 */
function isRecord(value) {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Whether a value is a positive whole number.
 * @param {unknown} value
 * @returns {value is number}
 */
function isCount(value) {
	return Number.isInteger(value) && /** @type {number} */ (value) > 0;
}

/**
 * Whether a value is a track id.
 * @param {unknown} value
 * @returns {value is TrackId}
 */
function isTrack(value) {
	return TRACK_IDS.includes(/** @type {TrackId} */ (value));
}

/**
 * Resource art for each resource of a set of counts, in label order.
 * @param {Record<string, any>} counts
 * @returns {Art[]}
 */
function resourceArt(counts) {
	return SYMBOL_ORDER.filter((id) => isCount(counts[id])).map((id) => ({
		kind: 'resource',
		id,
		count: counts[id],
	}));
}

/**
 * The resources of a payment, or nothing when it also discards cards or tiles or pays VP: those read only as words.
 * @param {unknown} payment
 * @returns {Art[]}
 */
function paymentArt(payment) {
	if (!isRecord(payment)) {
		return [];
	}
	const other = Object.entries(payment).some(
		([key, value]) =>
			!PAID_RESOURCES.includes(key) &&
			(Array.isArray(value) ? value.length > 0 : Boolean(value))
	);
	return other ? [] : resourceArt(payment);
}

/**
 * Art for one effect: resources, buildings, tracks and plain VP; nothing for any other kind.
 * @param {unknown} effect
 * @returns {Art[]}
 */
function oneEffectArt(effect) {
	if (!isRecord(effect)) {
		return [];
	}
	const [kind] = Object.keys(effect);
	const value = effect[kind];
	switch (kind) {
		case 'gain': {
			if (!isRecord(value)) {
				return [];
			}
			/** @type {Art[]} */
			const buildings = BUILDING_IDS.filter((id) =>
				isCount(value[id])
			).flatMap((id) =>
				Array.from({ length: value[id] }, () => ({
					kind: /** @type {const} */ ('building'),
					id,
				}))
			);
			return [...resourceArt(value), ...buildings];
		}
		case 'building':
			return BUILDING_IDS.includes(value)
				? [{ kind: 'building', id: value }]
				: [];
		case 'advance':
		case 'regress': {
			if (!isRecord(value)) {
				return [];
			}
			const tracks = isTrack(value.track)
				? [value.track]
				: Array.isArray(value.tracks)
					? value.tracks.filter(isTrack)
					: [];
			return tracks.map((id) => ({ kind: 'track', id }));
		}
		case 'track':
			return isTrack(value) ? [{ kind: 'track', id: value }] : [];
		case 'vp':
			return typeof value === 'number'
				? [{ kind: 'vp', count: value }]
				: [];
		default:
			return [];
	}
}

/**
 * The art for a list of one-key effects: resources with their counts, buildings, tracks and plain VP, in order.
 * Any other effect has no art; its words say what it does.
 * @param {unknown} effects - A list of effects, such as `[{ gain: { coin: 2 } }, { advance: { tracks: ['science'] } }]`
 * @returns {Art[]}
 */
export function effectArt(effects) {
	return Array.isArray(effects) ? effects.flatMap(oneEffectArt) : [];
}

/**
 * The size of the tech deck in a view (a count) or a state (a list).
 * @param {any} game
 * @returns {number}
 */
function techDeckCount(game) {
	const deck = game?.supply?.tech?.deck;
	if (Array.isArray(deck)) {
		return deck.length;
	}
	return typeof deck === 'number' ? deck : 0;
}

/**
 * Where an answer is chosen: on the civilization card, the map, the capital, the card shelf or the panel.
 * @param {Decision} decision
 * @param {Answer} answer
 * @param {any} game - The game view, which says where a civilization's token climbs to
 * @returns {PromptOption['place']}
 */
function placeOf(decision, answer, game) {
	// The civilizations' own choices are made on their card (#78).
	if (cardSpot(decision, answer, game) !== null) {
		return 'card';
	}
	if (typeof answer.hex === 'string') {
		return 'map';
	}
	if (decision.kind === 'choosePlacement' && typeof answer.row === 'number') {
		return 'capital';
	}
	switch (decision.kind) {
		case 'chooseTapestry':
		case 'chooseKeep':
		case 'chooseDiscard':
		case 'chooseResponse':
		case 'chooseCopy':
		case 'chooseInvent':
		case 'chooseUpgrade':
		case 'chooseTechBenefit':
			return typeof answer.card === 'string' ? 'shelf' : 'panel';
		case 'chooseCiv':
			return typeof answer.civ === 'string' ? 'shelf' : 'panel';
		case 'chooseCapital':
			return 'shelf';
		default:
			return 'panel';
	}
}

/**
 * A slot pick's art: a track or a resource; nothing for a slot of another shape.
 * @param {unknown} slot
 * @returns {Art[]}
 */
function slotArt(slot) {
	if (isTrack(slot)) {
		return [{ kind: 'track', id: slot }];
	}
	if (typeof slot === 'string' && PAID_RESOURCES.includes(slot)) {
		return [
			{
				kind: 'resource',
				id: /** @type {CostSymbol} */ (slot),
				count: 1,
			},
		];
	}
	return [];
}

/**
 * What an answer shows beside its words.
 * @param {Decision} decision
 * @param {Answer} answer
 * @param {PromptOption['place']} place
 * @param {any} game
 * @returns {Art[]}
 */
function artOf(decision, answer, place, game) {
	const { kind } = decision;
	if (TRACK_ANSWERS.includes(kind)) {
		return isTrack(answer.track)
			? [{ kind: 'track', id: answer.track }]
			: [];
	}
	if (place === 'shelf') {
		const shelf = SHELVES[kind];
		if (shelf === 'tapestry') {
			return [{ kind: 'tapestry', id: answer.card }];
		}
		if (shelf === 'tech') {
			return answer.card === 'deck'
				? [{ kind: 'deck', id: 'tech', count: techDeckCount(game) }]
				: [{ kind: 'tech', id: answer.card }];
		}
		if (shelf === 'civ') {
			return [{ kind: 'civ', id: answer.civ }];
		}
		return isCount(answer.capital)
			? [{ kind: 'mat', id: answer.capital }]
			: [];
	}
	switch (kind) {
		case 'chooseResource':
		case 'chooseConversion':
			return isRecord(answer.resources)
				? resourceArt(answer.resources)
				: [];
		case 'chooseBonus':
		case 'chooseTrade':
			return paymentArt(answer.pay);
		case 'chooseDie': {
			const faces = answer.die === 'red' ? RED_DIE : BLACK_DIE;
			const face = Number.isInteger(decision[answer.die])
				? faces[decision[answer.die]]
				: undefined;
			return face ? effectArt([face]) : [];
		}
		case 'chooseLandmark':
			return typeof answer.landmark === 'string'
				? [{ kind: 'landmark', id: answer.landmark }]
				: [];
		case 'chooseSpaceTile':
			return isCount(answer.tile)
				? [{ kind: 'space-tile', id: answer.tile }]
				: [];
		case 'chooseGift':
			return isCount(answer.tile)
				? [{ kind: 'territory', id: answer.tile, orient: 0 }]
				: [];
		case 'chooseExplore':
			return isCount(answer.tile)
				? [
						{
							kind: 'territory',
							id: answer.tile,
							orient: Number.isInteger(answer.orient)
								? answer.orient
								: 0,
						},
					]
				: [];
		case 'chooseCivAbility':
			return typeof answer.civ === 'string'
				? [{ kind: 'civ', id: answer.civ }]
				: [];
		case 'choosePlacement':
			if (place !== 'panel') {
				return [];
			}
			if (typeof decision.landmark === 'string') {
				return [{ kind: 'landmark', id: decision.landmark }];
			}
			return BUILDING_IDS.includes(decision.building)
				? [{ kind: 'building', id: decision.building }]
				: [];
		case 'chooseOption':
			return Array.isArray(decision.options)
				? effectArt(decision.options[answer.option])
				: [];
		case 'chooseOrder':
			return Array.isArray(decision.effects) &&
				Number.isInteger(answer.effect)
				? effectArt([decision.effects[answer.effect]])
				: [];
		case 'chooseSlot':
			return slotArt(answer.slot);
		default:
			return [];
	}
}

/**
 * One option of the prompt for one answer.
 * @param {Decision} decision
 * @param {Answer} answer
 * @param {number} index
 * @param {any} game
 * @returns {PromptOption}
 */
function optionOf(decision, answer, index, game) {
	const place = placeOf(decision, answer, game);
	/** @type {PromptOption} */
	const option = {
		index,
		place,
		label:
			(place === 'card' ? spotWords(decision, answer, game) : null) ??
			describeAnswer(decision, answer, game),
		art: artOf(decision, answer, place, game),
	};
	if (place === 'card') {
		option.spot = /** @type {string} */ (cardSpot(decision, answer, game));
	}
	if (place === 'map') {
		option.hex = answer.hex;
	}
	if (place === 'capital') {
		option.plot = {
			row: answer.row,
			col: answer.col,
			rotation: Number.isInteger(answer.rotation)
				? answer.rotation
				: null,
		};
	}
	return option;
}

/**
 * The layout the options' places call for: the capital wins, then the map, then the shelf. A Nomads player places a
 * piece in the capital or on a territory (#28 review), so the capital leads and the map's hexes stay lit beside it.
 * @param {PromptOption[]} options
 * @returns {Prompt['layout']}
 */
function layoutOf(options) {
	const places = new Set(options.map((o) => o.place));
	if (places.has('capital')) {
		return 'capital';
	}
	if (places.has('map')) {
		return 'map';
	}
	if (places.has('card')) {
		return 'card';
	}
	return places.has('shelf') ? 'cards' : 'options';
}

/**
 * The track that tints the panel: a bonus's track, or the one track every move offered is on.
 * @param {Decision} decision
 * @returns {TrackId | null}
 */
function trackOf(decision) {
	if (decision.kind === 'chooseBonus') {
		return isTrack(decision.track) ? decision.track : null;
	}
	if (decision.kind === 'chooseMove' && Array.isArray(decision.options)) {
		const tracks = new Set(
			decision.options.map((/** @type {any} */ o) => o?.track)
		);
		const [track] = tracks;
		return tracks.size === 1 && isTrack(track) ? track : null;
	}
	return null;
}

/**
 * A bonus's price as symbols, one per unit: `any` as 'any', and the track's own resource for `track`. Cards, tiles
 * and VP have no symbol, so a price of only those (or a free bonus) shows none.
 * @param {Decision} decision
 * @returns {CostSymbol[] | null}
 */
function costOf(decision) {
	if (decision.kind !== 'chooseBonus' || !isRecord(decision.cost)) {
		return null;
	}
	/** @type {CostSymbol[]} */
	const symbols = [];
	for (const [key, n] of Object.entries(decision.cost)) {
		/** @type {CostSymbol | undefined} */
		let symbol;
		if (SYMBOL_ORDER.includes(/** @type {CostSymbol} */ (key))) {
			symbol = /** @type {CostSymbol} */ (key);
		} else if (key === 'track' && isTrack(decision.track)) {
			symbol = /** @type {CostSymbol} */ (TRACK_RESOURCE[decision.track]);
		}
		if (symbol && isCount(n)) {
			symbols.push(
				...Array.from(
					{ length: n },
					() => /** @type {CostSymbol} */ (symbol)
				)
			);
		}
	}
	return symbols.length > 0 ? symbols : null;
}

/**
 * How to answer, in one sentence, for the layout.
 * @param {Decision} decision
 * @param {Prompt['layout']} layout
 * @param {boolean} onMap - Some options are on the map too
 * @returns {string}
 */
function instructionOf(decision, layout, onMap) {
	switch (layout) {
		case 'map':
			return 'Choose a lit territory on the map.';
		case 'capital':
			if (typeof decision.landmark === 'string') {
				return onMap
					? 'Place the landmark in your capital (drag it, turn it with the . and , keys, then confirm), or choose a lit territory on the map.'
					: 'Place the landmark in your capital: drag it, turn it with the . and , keys, then confirm.';
			}
			return onMap
				? 'Choose a lit plot in your capital, or a lit territory on the map.'
				: 'Choose a lit plot in your capital.';
		case 'cards':
			return 'Choose a card above, then confirm it here.';
		case 'card':
			return 'Choose a lit spot on your civilization card, then confirm it here.';
		default:
			return 'Choose one.';
	}
}

/**
 * Every operation of a stack, and of the lanes of any group on it.
 * @param {any[]} stack
 * @returns {any[]}
 */
function allOps(stack) {
	return stack.flatMap((op) =>
		op?.kind === 'group' && Array.isArray(op.lanes)
			? op.lanes.flatMap((/** @type {any} */ lane) =>
					allOps(lane.stack ?? [])
				)
			: [op]
	);
}

/**
 * The viewer's own income turn, when they are in one: its number, the steps it shows and the step running now.
 * They are in one when their latest `incomeTurnStarted` is newer than the latest `turnStarted`. The step running is
 * the one before the first step their pending `incomeSteps` still waits to run; with none waiting, the last one.
 * @param {any} game - The game as view() gives it to the viewer
 * @param {number | null} seat - The viewer's seat, or null for the public view
 * @returns {IncomeView | null}
 */
export function incomeView(game, seat) {
	if (seat === null || !Array.isArray(game?.events)) {
		return null;
	}
	/** @type {any[]} */
	const events = game.events;
	const started = events.findLast(
		(e) => e.type === 'incomeTurnStarted' && e.player === seat
	);
	const turnSeq =
		events.findLast((e) => e.type === 'turnStarted')?.seq ?? -Infinity;
	if (!started || started.seq < turnSeq) {
		return null;
	}
	const turn = /** @type {number} */ (started.turn);
	const shown = INCOME_STEPS.filter(
		(id) =>
			INCOME_STEP_KINDS[id].turns.includes(turn) &&
			Object.hasOwn(STEP_LABELS, id)
	);
	const waiting = allOps(
		Array.isArray(game.pending) ? game.pending : []
	).find((op) => op?.kind === 'incomeSteps' && op.player === seat);
	/** @type {string | null} */
	let current = shown.at(-1) ?? null;
	if (waiting && Array.isArray(waiting.steps)) {
		// The step running is the last shown one before the next waiting step; an unlabelled step (the era's end,
		// income turn 1's civilization rules) counts as the shown step before it, or none.
		const next = INCOME_STEPS.indexOf(waiting.steps[0]);
		current =
			next < 0
				? null
				: (INCOME_STEPS.slice(0, next).findLast((id) =>
						shown.includes(id)
					) ?? null);
	}
	return {
		turn,
		steps: shown.map((id) => ({ id, label: STEP_LABELS[id] })),
		current,
	};
}

/**
 * The prompt for the viewer's open decision: its title, how to answer, the layout and one option per answer.
 * @param {Decision | null | undefined} decision - The viewer's own open decision, with its `answers` (turn.js myDecision)
 * @param {any} game - The game as view() gives it to the viewer
 * @param {number | null} seat - The viewer's seat
 * @returns {Prompt | null} Null for a decision without answers, such as another seat's
 */
export function promptFor(decision, game, seat) {
	if (!isRecord(decision) || !Array.isArray(decision.answers)) {
		return null;
	}
	const options = decision.answers.map(
		(/** @type {Answer} */ answer, /** @type {number} */ i) =>
			optionOf(decision, answer, i, game)
	);
	const layout = layoutOf(options);
	const mapHexes = [
		...new Set(options.flatMap((o) => (o.hex ? [o.hex] : []))),
	];
	return {
		kind: decision.kind,
		title: decisionTitle(decision, game),
		instruction: instructionOf(decision, layout, mapHexes.length > 0),
		layout,
		shelf: options.some((o) => o.place === 'shelf')
			? (SHELVES[decision.kind] ?? null)
			: null,
		mapHexes,
		track: trackOf(decision),
		cost: costOf(decision),
		income:
			seat !== null && decision.player === seat
				? incomeView(game, seat)
				: null,
		confirmLabel: CONFIRM_LABELS[decision.kind] ?? 'Confirm choice',
		options,
		picks: pickModel(decision, game, seat),
		trade: tradeOffers(decision, game, seat),
	};
}

/**
 * What the viewer has chosen so far in the open decision's panel (#79), as the prompt state derives it.
 * @typedef {Object} PanelChoice
 * @property {number | null} picked - The answer chosen in the panel, on the shelf, on the map or on the capital
 * @property {import('./picks.js').PickModel | null} pick - The pick on show (#75): the prompt's own, or a chosen trade offer's
 * @property {{ text: string, warn: boolean } | null} pickStatus - What the picks so far say (picks.js pickStatus)
 * @property {number} pickIndex - The answer the picks so far match, or -1
 * @property {boolean} offering - A trade's offers are on show, none chosen yet: its first step
 * @property {boolean} offered - A trade's offer is chosen: its second step
 * @property {number} tradeAnswer - A chosen offer with nothing to pick: its one answer, or -1
 * @property {number} decline - The answer that declines the pick or the trade, or -1
 * @property {boolean} exploring - The decision is an explore (#74), whose chosen line is pinned instead
 * @property {boolean} docked - The panel is docked beside the map
 * @property {string | null} hex - The hex chosen on the map
 * @property {boolean} options - The panel lists options of its own
 * @property {boolean} sending - A move is being sent
 */

/**
 * The decision panel's words and buttons.
 * @typedef {Object} PanelControls
 * @property {string} status - The line beside the buttons: what is chosen, or what is missing
 * @property {boolean} warn - The status line is a warning, such as resources lost to the cap
 * @property {string} confirmLabel
 * @property {boolean} confirmDisabled
 * @property {string | undefined} cancelLabel - Left out, there is no cancel button
 * @property {'back' | 'decline' | 'clear' | null} cancel - What cancel does: a trade's offers again, decline, or another territory
 * @property {'pick' | 'answer'} confirm - What Confirm sends: the answer the picks match, or the picked answer
 * @property {boolean} content - The panel has a content area; without one its status line carries the instruction (#57)
 */

/**
 * The open decision's panel (#79): its status line, its buttons and what they do, for what the viewer has chosen.
 * @param {Pick<Prompt, 'instruction' | 'confirmLabel' | 'options' | 'cost'>} prompt
 * @param {PanelChoice} choice
 * @returns {PanelControls}
 */
export function panelControls(prompt, choice) {
	const { pick, picked, tradeAnswer, sending } = choice;
	const label = (/** @type {number} */ index) =>
		prompt.options[index]?.label ?? '';
	/** @type {string} */
	let status = prompt.instruction;
	if (choice.pickStatus) {
		status = choice.pickStatus.text;
	} else if (choice.offering) {
		status = 'Choose a trade.';
	} else if (tradeAnswer !== -1) {
		status = label(tradeAnswer);
	} else if (choice.exploring) {
		status = '';
	} else if (picked !== null) {
		status = label(picked);
	}
	/** @type {string} */
	let confirmLabel = prompt.confirmLabel;
	if (pick?.items) {
		const { count, kind } = pick.items;
		const noun = kind === 'territory' ? 'tile' : 'card';
		confirmLabel = `Pay ${count} ${noun}${count > 1 ? 's' : ''}`;
	} else if (pick || tradeAnswer !== -1) {
		confirmLabel = 'Confirm';
	}
	/** @type {boolean} */
	let confirmDisabled = picked === null || sending;
	if (pick) {
		confirmDisabled = choice.pickIndex === -1 || sending;
	} else if (choice.offering) {
		confirmDisabled = true;
	} else if (tradeAnswer !== -1) {
		confirmDisabled = sending;
	}
	/** @type {PanelControls['cancel']} */
	let cancel = null;
	if (choice.offered) {
		cancel = 'back';
	} else if ((pick || choice.offering) && choice.decline >= 0) {
		cancel = 'decline';
	} else if (choice.docked && choice.hex && !choice.exploring) {
		cancel = 'clear';
	}
	return {
		status,
		warn: choice.pickStatus?.warn ?? false,
		confirmLabel,
		confirmDisabled,
		cancelLabel: cancel ? CANCEL_LABELS[cancel] : undefined,
		cancel,
		confirm: pick || tradeAnswer !== -1 ? 'pick' : 'answer',
		content:
			choice.exploring ||
			Boolean(pick) ||
			choice.offering ||
			tradeAnswer !== -1 ||
			Boolean(prompt.cost) ||
			choice.options,
	};
}

/** The cancel button's words for what it does. */
const CANCEL_LABELS = Object.freeze({
	back: 'Back',
	decline: 'Decline',
	clear: 'Choose another territory',
});

/**
 * The panel for an advance's payment when it has a choice (#75): what is still missing, and Advance once the
 * resources picked match one of the payments.
 * @param {import('./picks.js').PickModel} model - advanceModel() of the selected advance
 * @param {import('./picks.js').Selection} selection
 * @param {Partial<Record<import('./picks.js').ResourceId, number>>} held
 * @param {boolean} sending
 * @returns {Omit<PanelControls, 'cancel' | 'confirm' | 'content'>}
 */
export function paymentControls(model, selection, held, sending) {
	const { text, warn } = pickStatus(model, selection, held);
	return {
		status: text,
		warn,
		confirmLabel: 'Advance',
		confirmDisabled: matchIndex(model, selection) === -1 || sending,
		cancelLabel: 'Cancel',
	};
}
