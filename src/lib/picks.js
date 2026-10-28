// The pick model (#75 design §4–5): a choice of several resources, cards or tiles made one by one, then matched to one of the decision's own answers.
import { advanceCost, TRACK_RESOURCE } from './engine/data/tracks.js';
import { RESOURCE_CAP } from './engine/effects/gain.js';
import { RESOURCES } from './ui.js';
import { describeAnswer, describePayment } from './describe.js';

/** @typedef {'coin' | 'food' | 'worker' | 'culture'} ResourceId */

/**
 * One resource to choose: set by the cost, or filled by the player from what it offers.
 * @typedef {Object} PickRow
 * @property {ResourceId | null} fixed - Set by the cost, or null for a row the player fills
 * @property {ResourceId[]} offers - What a free row offers, in RESOURCES order; empty for a fixed row
 */

/**
 * Cards or tiles to choose several of.
 * @typedef {Object} PickItems
 * @property {'territory' | 'tapestry' | 'tech'} kind
 * @property {(number | string)[]} ids - The ones some answer pays, in the order the answers first name them
 * @property {number} count - How many to choose
 */

/**
 * One answer a complete selection may match.
 * @typedef {Object} Candidate
 * @property {number} index - The answer's index in the decision's answers, or the payment's in the advance's payments
 * @property {Partial<Record<ResourceId, number>>} resources - What the rows must hold; for a conversion, what food becomes
 * @property {(number | string)[]} items - The cards or tiles it pays
 * @property {string} label - The answer in words
 */

/**
 * What a prompt asks for and the answers it may send.
 * @typedef {Object} PickModel
 * @property {'gain' | 'pay' | 'convert'} mode - Gained, paid, or food turned into other resources
 * @property {PickRow[]} rows - Fixed rows first
 * @property {PickItems | null} items
 * @property {Candidate[]} candidates
 * @property {number | null} decline - The index of the answer that declines, if the decision may be declined
 * @property {string} lead - The panel's lead line
 * @property {'chooseResource' | null} then - A VP trade: after its answer, the chooseResource it opens takes the same rows
 */

/**
 * What the player has chosen so far.
 * @typedef {Object} Selection
 * @property {(ResourceId | null)[]} rows - One per model row; a fixed row holds its resource
 * @property {(number | string)[]} items - The cards or tiles chosen, in the order chosen
 */

/** @typedef {Record<string, any>} Decision */

/** The resources in the order every row lists them. @type {readonly ResourceId[]} */
const RESOURCE_IDS = RESOURCES.map((r) => /** @type {ResourceId} */ (r.id));

const ROMAN = ['I', 'II', 'III', 'IV'];

/**
 * @param {unknown} value
 * @returns {value is Record<string, any>}
 */
function isRecord(value) {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * A whole number of a record, or 0.
 * @param {unknown} record
 * @param {string} id
 * @returns {number}
 */
function amount(record, id) {
	const n = isRecord(record) ? record[id] : 0;
	return Number.isInteger(n) && n > 0 ? n : 0;
}

/**
 * The resource counts a gain, a payment or a conversion holds.
 * @param {unknown} record
 * @returns {Partial<Record<ResourceId, number>>}
 */
function resourcesOf(record) {
	/** @type {Partial<Record<ResourceId, number>>} */
	const counts = {};
	for (const id of RESOURCE_IDS) {
		if (amount(record, id)) {
			counts[id] = amount(record, id);
		}
	}
	return counts;
}

/**
 * Words joined as a list: "a", "a and b", "a, b and c".
 * @param {string[]} parts
 * @returns {string}
 */
function listWords(parts) {
	return parts.length < 2
		? parts.join('')
		: `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`;
}

/**
 * Resource counts in words, such as "1 coin and 2 food".
 * @param {Partial<Record<ResourceId, number>>} counts
 * @returns {string}
 */
function resourceWords(counts) {
	return listWords(
		RESOURCE_IDS.filter((id) => amount(counts, id)).map(
			(id) => `${counts[id]} ${id}`
		)
	);
}

/**
 * A cost's named resources, the track's own counted as its resource.
 * @param {Record<string, any>} cost
 * @param {string | undefined} track
 * @returns {Record<ResourceId, number>}
 */
function namedOf(cost, track) {
	const own = track
		? TRACK_RESOURCE[/** @type {keyof typeof TRACK_RESOURCE} */ (track)]
		: undefined;
	return /** @type {Record<ResourceId, number>} */ (
		Object.fromEntries(
			RESOURCE_IDS.map((id) => [
				id,
				amount(cost, id) + (id === own ? amount(cost, 'track') : 0),
			])
		)
	);
}

/**
 * The rows a cost asks for: each named resource a fixed row, in RESOURCES order, then a free row for each `any`.
 * @param {Record<string, any>} cost
 * @param {string} [track] - For a cost naming the track's own resource
 * @returns {PickRow[]}
 */
function rowsOfCost(cost, track) {
	const named = namedOf(cost, track);
	/** @type {PickRow[]} */
	const rows = RESOURCE_IDS.flatMap((id) =>
		Array.from({ length: named[id] }, () => ({ fixed: id, offers: [] }))
	);
	for (let i = 0; i < amount(cost, 'any'); i++) {
		rows.push({ fixed: null, offers: [...RESOURCE_IDS] });
	}
	return rows;
}

/**
 * A cost's resources in words, such as "1 culture and 2 resources of your choice".
 * @param {Record<string, any>} cost
 * @param {string} [track]
 * @returns {string}
 */
function costWords(cost, track) {
	const named = namedOf(cost, track);
	const parts = RESOURCE_IDS.filter((id) => named[id]).map(
		(id) => `${named[id]} ${id}`
	);
	const any = amount(cost, 'any');
	if (any) {
		parts.push(`${any} resource${any > 1 ? 's' : ''} of your choice`);
	}
	return listWords(parts);
}

/**
 * The viewer's resources in a game or view.
 * @param {any} game
 * @param {number | null} seat
 * @returns {Record<ResourceId, number>}
 */
function heldOf(game, seat) {
	const resources = seat === null ? null : game?.seats?.[seat - 1]?.resources;
	return /** @type {Record<ResourceId, number>} */ (
		Object.fromEntries(
			RESOURCE_IDS.map((id) => [id, amount(resources, id)])
		)
	);
}

/**
 * Keeps a model only when it has something to choose between: at most one answer that picks anything keeps today's
 * prompt (the issue's "a single legal answer stays as it is today").
 * @param {PickModel} model
 * @returns {PickModel | null}
 */
function worthPicking(model) {
	const free = model.rows.some((row) => row.fixed === null);
	return model.candidates.length > 1 && (free || model.items) ? model : null;
}

/**
 * The pick model for a decision of several resources, cards or tiles, or null when its prompt stays as it is.
 * @param {Decision | null | undefined} decision - The viewer's open decision, with its `answers`
 * @param {any} game - The game as view() gives it to the viewer
 * @param {number | null} seat - The viewer's seat
 * @returns {PickModel | null}
 */
export function pickModel(decision, game, seat) {
	if (!isRecord(decision) || !Array.isArray(decision.answers)) {
		return null;
	}
	/** @type {Record<string, any>[]} */
	const answers = decision.answers;
	/**
	 * @param {Record<string, any>} answer
	 * @param {number} index
	 * @param {unknown} resources
	 * @returns {Candidate}
	 */
	const candidate = (answer, index, resources) => ({
		index,
		resources: resourcesOf(resources),
		items: [],
		label: describeAnswer(decision, answer, game),
	});
	switch (decision.kind) {
		case 'chooseResource': {
			const count = amount(decision, 'count');
			const offers =
				decision.from === 'any'
					? [...RESOURCE_IDS]
					: RESOURCE_IDS.filter(
							(id) =>
								Array.isArray(decision.from) &&
								decision.from.includes(id)
						);
			return worthPicking({
				mode: 'gain',
				rows: Array.from({ length: count }, () => ({
					fixed: null,
					offers: [...offers],
				})),
				items: null,
				candidates: answers.map((a, i) => candidate(a, i, a.resources)),
				decline: null,
				lead:
					count > 1
						? 'Pick one resource in each row.'
						: 'Pick a resource.',
				then: null,
			});
		}
		case 'chooseConversion': {
			const count = Math.min(
				amount(decision, 'max'),
				heldOf(game, seat).food
			);
			const none = answers.findIndex(
				(a) => Object.keys(resourcesOf(a.resources)).length === 0
			);
			return worthPicking({
				mode: 'convert',
				rows: Array.from({ length: count }, () => ({
					fixed: null,
					offers: [...RESOURCE_IDS],
				})),
				items: null,
				candidates: answers.map((a, i) => candidate(a, i, a.resources)),
				decline: none === -1 ? null : none,
				lead: 'Pick what each food becomes; food keeps it.',
				then: null,
			});
		}
		case 'chooseBonus': {
			if (!isRecord(decision.cost)) {
				return null;
			}
			const decline = answers.findIndex((a) => a.pay === null);
			return worthPicking({
				mode: 'pay',
				rows: rowsOfCost(decision.cost, decision.track),
				items: null,
				candidates: answers.flatMap((a, i) =>
					isRecord(a.pay) ? [candidate(a, i, a.pay)] : []
				),
				decline: decline === -1 ? null : decline,
				lead: `Pay ${costWords(decision.cost, decision.track)}. Pick one in each empty row.`,
				then: null,
			});
		}
		default:
			return null;
	}
}

/**
 * The pick model for an advance's payment, or null when it has a single legal payment.
 * @param {import('./turn.js').AdvanceOption | null | undefined} option
 * @param {any} _game - The game as view() gives it to the viewer
 * @returns {PickModel | null}
 */
export function advanceModel(option, _game) {
	if (!option || option.payments.length <= 1) {
		return null;
	}
	const cost = advanceCost(option.track, option.to);
	const tier = Math.ceil(option.to / 3);
	return worthPicking({
		mode: 'pay',
		rows: rowsOfCost(cost),
		items: null,
		candidates: option.payments.map((payment, index) => ({
			index,
			resources: resourcesOf(payment),
			items: [],
			label: describePayment(payment),
		})),
		decline: null,
		lead: `Tier ${ROMAN[tier - 1]} costs ${costWords(cost)}. Pick one in each empty row.`,
		then: null,
	});
}

/**
 * Nothing chosen yet: the fixed rows hold their resource.
 * @param {PickModel} model
 * @returns {Selection}
 */
export function emptySelection(model) {
	return { rows: model.rows.map((row) => row.fixed), items: [] };
}

/**
 * Chooses a resource in a free row; the chosen one again clears the row. A fixed row never changes.
 * @param {PickModel} model
 * @param {Selection} selection
 * @param {number} row
 * @param {ResourceId} resource
 * @returns {Selection}
 */
export function togglePick(model, selection, row, resource) {
	if (!model.rows[row] || model.rows[row].fixed !== null) {
		return selection;
	}
	const rows = [...selection.rows];
	rows[row] = rows[row] === resource ? null : resource;
	return { ...selection, rows };
}

/**
 * How many of each resource the rows hold; a conversion's food keeps its food and counts as nothing.
 * @param {PickModel} model
 * @param {(ResourceId | null)[]} rows
 * @returns {Record<ResourceId, number>}
 */
function countsOf(model, rows) {
	const counts = /** @type {Record<ResourceId, number>} */ (
		Object.fromEntries(RESOURCE_IDS.map((id) => [id, 0]))
	);
	for (const pick of rows) {
		if (pick && !(model.mode === 'convert' && pick === 'food')) {
			counts[pick]++;
		}
	}
	return counts;
}

/**
 * Whether a candidate holds at least the counts and the items.
 * @param {Candidate} candidate
 * @param {Record<ResourceId, number>} counts
 * @param {(number | string)[]} items
 * @returns {boolean}
 */
function covers(candidate, counts, items) {
	return (
		RESOURCE_IDS.every(
			(id) => counts[id] <= amount(candidate.resources, id)
		) && items.every((item) => candidate.items.includes(item))
	);
}

/**
 * Whether a resource can be chosen in a row now: some answer holds everything chosen so far with it (design §4.1).
 * @param {PickModel} model
 * @param {Selection} selection
 * @param {number} row
 * @param {ResourceId} resource
 * @returns {boolean}
 */
export function canPick(model, selection, row, resource) {
	const target = model.rows[row];
	if (
		!target ||
		target.fixed !== null ||
		!target.offers.includes(resource) ||
		selection.rows.length !== model.rows.length
	) {
		return false;
	}
	const rows = [...selection.rows];
	rows[row] = resource;
	const counts = countsOf(model, rows);
	return model.candidates.some((c) => covers(c, counts, selection.items));
}

/**
 * The answer a complete selection matches, or -1 while it is incomplete, matches nothing, or was made for another model.
 * @param {PickModel} model
 * @param {Selection} selection
 * @returns {number}
 */
export function matchIndex(model, selection) {
	if (
		selection.rows.length !== model.rows.length ||
		selection.rows.some((pick) => pick === null) ||
		selection.items.length !== (model.items?.count ?? 0)
	) {
		return -1;
	}
	const counts = countsOf(model, selection.rows);
	const found = model.candidates.find(
		(c) =>
			RESOURCE_IDS.every(
				(id) => counts[id] === amount(c.resources, id)
			) &&
			c.items.length === selection.items.length &&
			selection.items.every((item) => c.items.includes(item))
	);
	return found ? found.index : -1;
}

/**
 * What the viewer would hold once the rows are taken: gains added, payments taken, food turned into the rest.
 * @param {PickModel} model
 * @param {Selection} selection
 * @param {Partial<Record<ResourceId, number>>} held
 * @returns {Record<ResourceId, number>}
 */
export function pendingCounts(model, selection, held) {
	const counts = /** @type {Record<ResourceId, number>} */ (
		Object.fromEntries(RESOURCE_IDS.map((id) => [id, amount(held, id)]))
	);
	for (const pick of selection.rows) {
		if (!pick) {
			continue;
		}
		if (model.mode === 'gain') {
			counts[pick]++;
		} else if (model.mode === 'pay') {
			counts[pick]--;
		} else if (pick !== 'food') {
			counts.food--;
			counts[pick]++;
		}
	}
	return counts;
}

/**
 * The status line: what is still missing, or what Confirm will do, with a warning when a gain goes past the cap.
 * @param {PickModel} model
 * @param {Selection} selection
 * @param {Partial<Record<ResourceId, number>>} held
 * @returns {{ text: string, warn: boolean }}
 */
export function pickStatus(model, selection, held) {
	const free = model.rows.filter((row) => row.fixed === null).length;
	const empty = selection.rows.filter((pick) => pick === null).length;
	if (free > 0 && empty === free) {
		const where = model.rows.some((row) => row.fixed !== null)
			? 'each empty row'
			: 'each row';
		return {
			text:
				free > 1 ? `Pick a resource in ${where}.` : 'Pick a resource.',
			warn: false,
		};
	}
	if (empty > 0) {
		return { text: `Choose ${empty} more.`, warn: false };
	}
	const index = matchIndex(model, selection);
	if (index === -1) {
		return {
			text: 'That is not one of the choices: change a pick.',
			warn: true,
		};
	}
	const text =
		model.mode === 'gain'
			? `You gain ${resourceWords(countsOf(model, selection.rows))}.`
			: (model.candidates.find((c) => c.index === index)?.label ?? '');
	if (model.mode === 'pay') {
		return { text, warn: false };
	}
	const after = pendingCounts(model, selection, held);
	const lost = RESOURCE_IDS.filter((id) => after[id] > RESOURCE_CAP).map(
		(id) => `${after[id] - RESOURCE_CAP} ${id}`
	);
	return lost.length
		? {
				text: `${text} You can hold ${RESOURCE_CAP} of each: ${listWords(lost)} would be lost.`,
				warn: true,
			}
		: { text, warn: false };
}
