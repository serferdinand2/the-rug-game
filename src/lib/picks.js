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

/** The cards and tiles a payment may discard. */
const ITEM_KINDS = /** @type {const} */ (['territory', 'tapestry', 'tech']);

/** Each kind's name, and where its pictures are picked. */
const ITEM_WORDS = {
	territory: {
		noun: 'tile',
		name: 'territory tile',
		where: 'here or on your Terrain tab',
	},
	tapestry: { noun: 'card', name: 'tapestry card', where: 'above' },
	tech: { noun: 'card', name: 'tech card', where: 'above' },
};

/**
 * The cards or tiles a payment discards.
 * @param {unknown} pay
 * @returns {(number | string)[]}
 */
function itemsOf(pay) {
	const kind = ITEM_KINDS.find((k) => isRecord(pay) && Array.isArray(pay[k]));
	return kind && isRecord(pay) ? [...pay[kind]] : [];
}

/**
 * The cards or tiles a cost asks for, with every one some answer pays, in the order the answers first name them.
 * @param {Record<string, any>} cost
 * @param {Record<string, any>[]} answers
 * @returns {PickItems | null}
 */
function itemsOfCost(cost, answers) {
	const kind = ITEM_KINDS.find((k) => amount(cost, k));
	if (!kind) {
		return null;
	}
	/** @type {(number | string)[]} */
	const ids = [];
	for (const answer of answers) {
		for (const id of isRecord(answer.pay) && Array.isArray(answer.pay[kind])
			? answer.pay[kind]
			: []) {
			if (!ids.includes(id)) {
				ids.push(id);
			}
		}
	}
	return { kind, ids, count: amount(cost, kind) };
}

/**
 * The lead line for a payment of resources, cards or tiles.
 * @param {Record<string, any>} cost
 * @param {string | undefined} track
 * @param {PickItems | null} items
 * @returns {string}
 */
function payLead(cost, track, items) {
	const words = costWords(cost, track);
	const parts = words ? [words] : [];
	/** @type {string[]} */
	const how = [];
	if (rowsOfCost(cost, track).some((row) => row.fixed === null)) {
		how.push('Pick one in each empty row.');
	}
	if (items) {
		const { name, noun, where } = ITEM_WORDS[items.kind];
		parts.push(`${items.count} ${name}${items.count > 1 ? 's' : ''}`);
		how.push(
			how.length ? `Pick the ${noun}s ${where}.` : `Pick them ${where}.`
		);
	}
	return `Pay ${listWords(parts)}. ${how.join(' ')}`.trim();
}

/**
 * What a trade's offer gains: VP and resources of the player's choice.
 * @param {Record<string, any>} offer
 * @returns {{ vp?: number, any?: number }}
 */
function gainOf(offer) {
	/** @type {{ vp?: number, any?: number }} */
	const gain = {};
	for (const effect of Array.isArray(offer.gain) ? offer.gain : []) {
		if (amount(effect, 'vp')) {
			gain.vp = (gain.vp ?? 0) + amount(effect, 'vp');
		}
		if (amount(effect?.gain, 'any')) {
			gain.any = (gain.any ?? 0) + amount(effect.gain, 'any');
		}
	}
	return gain;
}

/**
 * One side of a trade in words: VP, then resources, such as "10 VP" or "2 resources of your choice".
 * @param {Record<string, any>} side
 * @returns {string}
 */
function sideWords(side) {
	const parts = amount(side, 'vp') ? [`${amount(side, 'vp')} VP`] : [];
	const words = costWords(side);
	return listWords(words ? [...parts, words] : parts);
}

/**
 * One side of a trade, short, for its button: "10 VP", "2 resources", "1 worker".
 * @param {Record<string, any>} side
 * @returns {string}
 */
function shortWords(side) {
	const parts = amount(side, 'vp') ? [`${amount(side, 'vp')} VP`] : [];
	const named = namedOf(side, undefined);
	for (const id of RESOURCE_IDS) {
		if (named[id]) {
			parts.push(`${named[id]} ${id}`);
		}
	}
	const any = amount(side, 'any');
	if (any) {
		parts.push(`${any} resource${any > 1 ? 's' : ''}`);
	}
	return listWords(parts);
}

/**
 * A trade offer's pictures, as its button draws them: what it pays, then what it gains.
 * @param {{ pay: Record<string, number>, gain: { vp?: number, any?: number } }} offer
 * @returns {import('./prompts.js').Art[]}
 */
export function offerArt(offer) {
	/** @param {Record<string, number | undefined>} side */
	const art = (side) =>
		/** @type {import('./prompts.js').Art[]} */ ([
			...(side.vp ? [{ kind: 'vp', count: side.vp }] : []),
			...[...RESOURCE_IDS, 'any'].flatMap((id) =>
				side[id] ? [{ kind: 'resource', id, count: side[id] }] : []
			),
		]);
	return [...art(offer.pay), ...art(offer.gain)];
}

/**
 * Every mix of `count` resources, as counts.
 * @param {number} count
 * @returns {Partial<Record<ResourceId, number>>[]}
 */
function mixes(count) {
	/** @type {Partial<Record<ResourceId, number>>[]} */
	const found = [];
	/**
	 * @param {number} from
	 * @param {number} left
	 * @param {Partial<Record<ResourceId, number>>} chosen
	 */
	const build = (from, left, chosen) => {
		if (left === 0) {
			found.push(chosen);
			return;
		}
		for (let i = from; i < RESOURCE_IDS.length; i++) {
			const id = RESOURCE_IDS[i];
			build(i, left - 1, { ...chosen, [id]: (chosen[id] ?? 0) + 1 });
		}
	};
	build(0, count, {});
	return found;
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
		items: itemsOf(resources),
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
			const items = itemsOfCost(decision.cost, answers);
			return worthPicking({
				mode: 'pay',
				rows: rowsOfCost(decision.cost, decision.track),
				items,
				candidates: answers.flatMap((a, i) =>
					isRecord(a.pay) ? [candidate(a, i, a.pay)] : []
				),
				decline: decline === -1 ? null : decline,
				lead: payLead(decision.cost, decision.track, items),
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
 * The offers of a trade, for its first step, or null when it has at most one answer that pays anything.
 * @param {Decision | null | undefined} decision
 * @param {any} _game
 * @param {number | null} _seat
 * @returns {{ offer: number, pay: Record<string, number>, gain: { vp?: number, any?: number }, enabled: boolean, label: string }[] | null}
 */
export function tradeOffers(decision, _game, _seat) {
	if (
		!isRecord(decision) ||
		decision.kind !== 'chooseTrade' ||
		!Array.isArray(decision.answers) ||
		!Array.isArray(decision.offers)
	) {
		return null;
	}
	/** @type {Record<string, any>[]} */
	const paying = decision.answers.filter((a) => Number.isInteger(a.offer));
	if (paying.length <= 1) {
		return null;
	}
	return decision.offers.map(
		(/** @type {any} */ offer, /** @type {number} */ i) => {
			const pay = isRecord(offer.pay) ? { ...offer.pay } : {};
			const gain = gainOf(offer);
			return {
				offer: i,
				pay,
				gain,
				enabled: paying.some((a) => a.offer === i),
				label: `${shortWords(pay)} → ${shortWords(gain)}`,
			};
		}
	);
}

/**
 * The second step of a trade: the rows of the resources an offer pays, or of those a VP offer gains (answered after
 * the trade by the chooseResource it opens). Null when the offer has nothing to pick.
 * @param {Decision} decision
 * @param {number} offer
 * @param {any} game
 * @param {number | null} _seat
 * @returns {PickModel | null}
 */
export function offerModel(decision, offer, game, _seat) {
	const chosen = Array.isArray(decision?.offers)
		? decision.offers[offer]
		: undefined;
	/** @type {Record<string, any>[]} */
	const answers = Array.isArray(decision?.answers) ? decision.answers : [];
	const indexes = answers.flatMap((a, i) => (a.offer === offer ? [i] : []));
	if (!isRecord(chosen) || indexes.length === 0) {
		return null;
	}
	const pay = isRecord(chosen.pay) ? chosen.pay : {};
	const gain = gainOf(chosen);
	const rows = rowsOfCost(pay);
	if (rows.length === 0) {
		const count = gain.any ?? 0;
		return worthPicking({
			mode: 'gain',
			rows: Array.from({ length: count }, () => ({
				fixed: null,
				offers: [...RESOURCE_IDS],
			})),
			items: null,
			candidates: mixes(count).map((resources) => ({
				index: indexes[0],
				resources,
				items: [],
				label: '',
			})),
			decline: null,
			lead: `Pay ${sideWords(pay)}. Pick the ${count} resource${count > 1 ? 's' : ''} you gain, one in each row.`,
			then: 'chooseResource',
		});
	}
	const free = rows.filter((row) => row.fixed === null).length;
	return worthPicking({
		mode: 'pay',
		rows,
		items: null,
		candidates: indexes.map((index) => ({
			index,
			resources: resourcesOf(answers[index].pay),
			items: [],
			label: describeAnswer(decision, answers[index], game),
		})),
		decline: null,
		lead: `${gain.vp ? `Gain ${gain.vp} VP. ` : ''}Pick the ${free} resource${free > 1 ? 's' : ''} you pay, one in each row.`,
		then: null,
	});
}

/**
 * Chooses or unchooses a card or tile; once enough are chosen, another is refused until one is unchosen.
 * @param {PickModel} model
 * @param {Selection} selection
 * @param {number | string} id
 * @returns {Selection}
 */
export function toggleItem(model, selection, id) {
	if (!model.items || !model.items.ids.includes(id)) {
		return selection;
	}
	if (selection.items.includes(id)) {
		return {
			...selection,
			items: selection.items.filter((item) => item !== id),
		};
	}
	if (selection.items.length >= model.items.count) {
		return selection;
	}
	return { ...selection, items: [...selection.items, id] };
}

/**
 * Whether a card or tile can be pressed now: a chosen one can always be unchosen; another needs room and an answer
 * that holds it with everything chosen so far.
 * @param {PickModel} model
 * @param {Selection} selection
 * @param {number | string} id
 * @returns {boolean}
 */
export function canPickItem(model, selection, id) {
	if (!model.items || !model.items.ids.includes(id)) {
		return false;
	}
	if (selection.items.includes(id)) {
		return true;
	}
	if (selection.items.length >= model.items.count) {
		return false;
	}
	const counts = countsOf(model, selection.rows);
	const items = [...selection.items, id];
	return model.candidates.some((c) => covers(c, counts, items));
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
	const left = model.items ? model.items.count - selection.items.length : 0;
	if (model.items && left > 0) {
		const { noun } = ITEM_WORDS[model.items.kind];
		return {
			text: `Choose ${left} more ${noun}${left > 1 ? 's' : ''}.`,
			warn: false,
		};
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

/**
 * The rows as ResourceRows draws them: each resource with the count the viewer would hold after the choices so far
 * (never above the cap), and whether it can be pressed now, with the reason when it can't. The chosen one stays
 * pressable, to clear its row.
 * @param {PickModel} model
 * @param {Selection} selection
 * @param {Partial<Record<ResourceId, number>>} held
 * @returns {{ fixed: ResourceId | null, picked: ResourceId | null, choices: { id: ResourceId, count: number, disabled: boolean, reason?: string }[] }[]}
 */
export function rowView(model, selection, held) {
	const after = pendingCounts(model, selection, held);
	return model.rows.map((row, i) => {
		const picked = selection.rows[i] ?? null;
		const ids = row.fixed ? [row.fixed] : row.offers;
		return {
			fixed: row.fixed,
			picked,
			choices: ids.map((id) => {
				const count = Math.max(0, Math.min(after[id], RESOURCE_CAP));
				const disabled =
					row.fixed === null &&
					picked !== id &&
					!canPick(model, selection, i, id);
				if (!disabled) {
					return { id, count, disabled };
				}
				return {
					id,
					count,
					disabled,
					reason:
						after[id] <= 0
							? `You have no ${id} left`
							: 'Not with your other choices',
				};
			}),
		};
	});
}
