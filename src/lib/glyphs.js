// The symbols a track space shows for its benefit and bonus (#59): resources, buildings and tracks as their approved
// art, and the game symbols that have no art yet (tiles, cards, explore, conquer, VP) as short words, as #5 decided.
import { ARTS_TRACK, BUILDING_IDS, TRACK_IDS } from './engine/data/ids.js';
import { RESOURCE_ORDER } from './ui.js';

/** @typedef {import('./ui.js').TrackId} TrackId */
/** @typedef {import('./ui.js').CostSymbol} CostSymbol */
/** @typedef {import('./engine/data/ids.js').BuildingId} BuildingId */

/**
 * One symbol on a track space. A count of 1 draws no count; `cross` marks a benefit taken without its own benefit,
 * as the board's X does; a VP glyph without a count reads "VP", one VP for each thing the next glyphs count.
 * @typedef {{ kind: 'resource', id: CostSymbol, count: number }
 *   | { kind: 'building', id: BuildingId, count: number }
 *   | { kind: 'track', id: TrackId }
 *   | { kind: 'word', text: string, count: number, cross?: boolean }
 *   | { kind: 'vp', count: number | null }
 *   | { kind: 'per' }
 *   | { kind: 'plus' }
 *   | { kind: 'or' }} Glyph
 */

/**
 * A bonus as a space shows it: its price, then what it gives.
 * @typedef {Object} BonusGlyphs
 * @property {Glyph[]} pay
 * @property {Glyph[]} gain
 */

/** The resources in the order the screens list them, then a resource of any type. */
const RESOURCES = /** @type {readonly CostSymbol[]} */ ([
	...RESOURCE_ORDER,
	'any',
]);

/** @type {readonly BuildingId[]} */
const BUILDINGS = BUILDING_IDS;

/** The words for the things gained, paid or counted that have no art yet. */
const NOUNS = /** @type {Readonly<Record<string, string>>} */ ({
	territory: 'Tile',
	space: 'Space tile',
	tapestry: 'Tapestry',
	tech: 'Tech',
});

/** The words for what a `vp: { per }` effect counts, where it is not a building or a track. */
const COUNTERS = /** @type {Readonly<Record<string, string>>} */ ({
	territory: 'Territory',
	territoryTile: 'Tile',
	techCard: 'Tech',
	tapestryCard: 'Tapestry',
	trackLead: 'Track lead',
	landmark: 'Landmark',
	opponent: 'Opponent',
	// The Holocenter's count (R71, #35).
	incomeBuilding: 'Building',
});

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
 * A word glyph.
 * @param {string} text
 * @param {number} [count]
 * @param {boolean} [cross]
 * @returns {Glyph}
 */
function word(text, count = 1, cross = false) {
	return cross
		? { kind: 'word', text, count, cross: true }
		: { kind: 'word', text, count };
}

/**
 * The listed tracks as track glyphs.
 * @param {unknown} tracks
 * @returns {Glyph[]}
 */
function trackGlyphs(tracks) {
	return (Array.isArray(tracks) ? tracks : [])
		.filter((id) => TRACK_IDS.includes(id) || id === ARTS_TRACK)
		.map((id) => ({ kind: 'track', id }));
}

/**
 * Resources, buildings, tiles, cards and VP in a gain or a price: art for resources and buildings, words for the rest.
 * @param {Record<string, any>} amounts
 * @returns {Glyph[]}
 */
function amountGlyphs(amounts) {
	/** @type {Glyph[]} */
	const glyphs = [];
	for (const id of RESOURCES) {
		if (isCount(amounts[id])) {
			glyphs.push({ kind: 'resource', id, count: amounts[id] });
		}
	}
	for (const id of BUILDINGS) {
		if (isCount(amounts[id])) {
			glyphs.push({ kind: 'building', id, count: amounts[id] });
		}
	}
	for (const [key, text] of Object.entries(NOUNS)) {
		if (isCount(amounts[key])) {
			glyphs.push(word(text, amounts[key]));
		}
	}
	if (isCount(amounts.vp)) {
		glyphs.push({ kind: 'vp', count: amounts.vp });
	}
	return glyphs;
}

/**
 * What a VP counter counts: a building, a track, or a word.
 * @param {Record<string, any>} value - The `vp` effect's `{ per, track?, each? }`
 * @returns {Glyph[]}
 */
function counterGlyphs(value) {
	const each = isCount(value.each) && value.each > 1 ? value.each : null;
	/** @type {Glyph} */
	let counted;
	if (BUILDINGS.includes(value.per)) {
		counted = { kind: 'building', id: value.per, count: 1 };
	} else if (
		value.per === 'trackSpace' &&
		(TRACK_IDS.includes(value.track) || value.track === ARTS_TRACK)
	) {
		counted = { kind: 'track', id: value.track };
	} else {
		counted = word(COUNTERS[value.per] ?? 'Thing');
	}
	return [{ kind: 'vp', count: each }, { kind: 'per' }, counted];
}

/**
 * The symbols for one effect of the vocabulary in data/effects.js. The kinds no track space uses read as nothing.
 * @param {unknown} effect - A one-key effect, such as `{ explore: {} }`
 * @returns {Glyph[]}
 */
export function effectGlyphs(effect) {
	if (!isRecord(effect)) {
		return [];
	}
	const [kind] = Object.keys(effect);
	const value = effect[kind];
	const v = isRecord(value) ? value : {};
	switch (kind) {
		case 'gain':
			return amountGlyphs(v);
		case 'building':
			return BUILDINGS.includes(value)
				? [{ kind: 'building', id: value, count: 1 }]
				: [];
		case 'landmark':
			return [word('Landmark')];
		case 'vp':
			if (typeof value === 'number') {
				return [{ kind: 'vp', count: value }];
			}
			return isRecord(value) ? counterGlyphs(value) : [];
		case 'explore':
			return [word(v.anywhere ? 'Explore anywhere' : 'Explore')];
		case 'exploreSpace':
			return [word('Explore space')];
		case 'conquer': {
			/** @type {Glyph[]} */
			const glyphs = [word(v.anywhere ? 'Conquer anywhere' : 'Conquer')];
			if (v.bothDice === 'always') {
				glyphs.push(word('Both dice'));
			} else if (v.bothDice === 'ifOpponent') {
				glyphs.push(word('Both dice vs. opponent'));
			}
			return glyphs;
		}
		case 'research': {
			/** @type {Glyph[]} */
			const glyphs = [
				word(
					'Science die',
					isCount(v.rolls) ? v.rolls : 1,
					Boolean(v.noBenefit)
				),
			];
			if (isCount(v.offTrackVp)) {
				glyphs.push(
					{ kind: 'or' },
					{ kind: 'vp', count: v.offTrackVp }
				);
			}
			return glyphs;
		}
		case 'advance': {
			/** @type {Glyph[]} */
			const glyphs = [
				word(
					v.optional ? 'May advance' : 'Advance',
					1,
					Boolean(v.noBenefit)
				),
				...trackGlyphs(v.tracks),
			];
			if (v.freeBonus) {
				glyphs.push(word('Free bonus'));
			}
			if (v.noBonus) {
				glyphs.push(word('No bonus'));
			}
			if (isCount(v.offTrackVp)) {
				glyphs.push(
					{ kind: 'or' },
					{ kind: 'vp', count: v.offTrackVp }
				);
			}
			return glyphs;
		}
		case 'regress':
			return [
				word('Regress', 1, Boolean(v.noBenefit)),
				...trackGlyphs(v.tracks),
			];
		case 'repeat':
			return [word('Repeat')];
		case 'invent': {
			/** @type {Glyph[]} */
			const glyphs = [word('Invent', isCount(v.count) ? v.count : 1)];
			if (v.refresh) {
				glyphs.push(word('May refresh'));
			}
			if (v.thenUpgrade) {
				glyphs.push(word('Upgrade'));
			}
			return glyphs;
		}
		case 'upgrade':
			return [word('Upgrade')];
		case 'techBenefit':
			return [
				word(v.icon === 'square' ? 'Square benefit' : 'Circle benefit'),
			];
		case 'tapestryOnTop':
			return [word('Play tapestry')];
		case 'scoreCapital':
			return [word('Score capital')];
		case 'tileBenefit':
			return [word('Tile benefit')];
		case 'gainCiv':
			return [word('Civilization')];
		case 'restartToken':
			return [word('Restart')];
		case 'anyBuilding':
			return [word('Any building')];
		// A&A's arts effects are drawn by the shared ArtsSymbol component.
		case 'create':
			return [word('Create')];
		case 'inspire':
			return [word('Inspire')];
		case 'broadcast':
			return [word('Broadcast')];
		case 'refreshMasterpieces':
			return [word(v.optional ? 'May refresh' : 'Refresh')];
		case 'streamingImplants':
			return [word('Fire 3')];
		case 'choice':
			return (Array.isArray(value) ? value : []).flatMap(
				(option, index) => [
					...(index > 0
						? [/** @type {Glyph} */ ({ kind: 'or' })]
						: []),
					...(Array.isArray(option) && option.length > 0
						? spaceGlyphs(option)
						: [word('Nothing')]),
				]
			);
		default:
			return [];
	}
}

/**
 * The symbols for a list of effects, in order. The same effect twice in a row (Quantum Physics' two advances) is drawn
 * once, its first symbol counted.
 * @param {unknown} effects
 * @returns {Glyph[]}
 */
export function spaceGlyphs(effects) {
	if (!Array.isArray(effects)) {
		return [];
	}
	/** @type {Glyph[]} */
	const glyphs = [];
	for (let i = 0; i < effects.length;) {
		const same = JSON.stringify(effects[i]);
		let n = 1;
		while (
			i + n < effects.length &&
			JSON.stringify(effects[i + n]) === same
		) {
			n += 1;
		}
		const [first, ...rest] = effectGlyphs(effects[i]);
		if (first && n > 1 && 'count' in first && first.count !== null) {
			glyphs.push({ ...first, count: first.count * n }, ...rest);
		} else {
			for (let k = 0; k < n; k++) {
				glyphs.push(...effectGlyphs(effects[i]));
			}
		}
		i += n;
	}
	return glyphs;
}

/**
 * A bonus's price and gain as symbols, or null for a space without a bonus.
 * @param {unknown} bonus - `{ pay, gain }` from TRACKS, or bonusOf() for a game's own price
 * @returns {BonusGlyphs | null}
 */
export function bonusGlyphs(bonus) {
	if (!isRecord(bonus)) {
		return null;
	}
	return {
		pay: isRecord(bonus.pay) ? amountGlyphs(bonus.pay) : [],
		gain: spaceGlyphs(bonus.gain),
	};
}

/**
 * One row of the symbol key (#174): symbols as a track space draws them, or a bonus box, or a landmark's name, and
 * what they mean.
 * @typedef {Object} SymbolKeyRow
 * @property {Glyph[]} [glyphs] - Drawn by SpaceGlyphs
 * @property {BonusGlyphs} [bonus] - Drawn as a space's bonus box: its price, then what it gives
 * @property {string} [landmark] - A landmark's name, as the bottom of a space shows it
 * @property {string} words - What they mean, without a full stop
 */

/**
 * The symbol key How to play shows (#174): every symbol the track spaces draw, in three groups. A test checks that it
 * covers every word symbol and every kind of glyph the four tracks use.
 * @type {readonly { heading: string, rows: readonly SymbolKeyRow[] }[]}
 */
export const SYMBOL_KEY = Object.freeze([
	{
		heading: 'What you gain or do',
		rows: [
			{ glyphs: [word('Tile')], words: 'Gain a territory tile' },
			{ glyphs: [word('Space tile')], words: 'Gain a space tile' },
			{ glyphs: [word('Explore')], words: 'Explore a territory' },
			{
				glyphs: [word('Explore anywhere')],
				words: 'Explore a territory anywhere',
			},
			{ glyphs: [word('Explore space')], words: 'Explore a space tile' },
			{ glyphs: [word('Conquer')], words: 'Conquer a territory' },
			{
				glyphs: [word('Conquer anywhere')],
				words: 'Conquer a territory anywhere',
			},
			{
				glyphs: [word('Both dice')],
				words: 'Gain the results of both conquer dice',
			},
			{
				glyphs: [word('Both dice vs. opponent')],
				words: 'Both dice, if an opponent controlled the territory',
			},
			{ glyphs: [word('Tapestry')], words: 'Gain a tapestry card' },
			{
				glyphs: [word('Play tapestry')],
				words: 'Play a tapestry card on top of your current one',
			},
			{ glyphs: [word('Invent')], words: 'Invent a tech card' },
			{ glyphs: [word('Create')], words: 'Create a masterpiece' },
			{ glyphs: [word('Inspire')], words: 'Inspire an income row' },
			{ glyphs: [word('Broadcast')], words: 'Broadcast a masterpiece' },
			{
				glyphs: [word('Any building')],
				words: 'Gain an income building of your choice',
			},
			{ glyphs: [word('Building')], words: 'An income building' },
			{
				glyphs: [word('May refresh')],
				words: 'You may refresh the face-up tech cards first',
			},
			{ glyphs: [word('Upgrade')], words: 'Upgrade a tech card' },
			{
				glyphs: [word('Circle benefit')],
				words: 'The circle benefit of a tech card in your middle row',
			},
			{
				glyphs: [word('Square benefit')],
				words: 'The square benefit of a tech card in your top row',
			},
			{
				glyphs: [word('Science die')],
				words: 'Roll the science die and advance on the track rolled',
			},
			{
				glyphs: [{ kind: 'track', id: 'exploration' }, word('Advance')],
				words: 'Advance on the track shown',
			},
			{
				glyphs: [{ kind: 'track', id: 'technology' }, word('Regress')],
				words: 'Go back 1 space on the track shown and gain its benefit',
			},
			{
				glyphs: [word('Repeat')],
				words: 'Repeat the benefit of a track space you are on',
			},
			{
				glyphs: [word('Score capital')],
				words: 'Score your capital city',
			},
			{
				glyphs: [word('Restart')],
				words: 'Move this token to the start of any track',
			},
			{
				glyphs: [word('Civilization')],
				words: 'Draw another civilization',
			},
			{ glyphs: [{ kind: 'vp', count: 5 }], words: 'Victory points' },
		],
	},
	{
		heading: 'Buildings and resources',
		rows: [
			{
				glyphs: BUILDINGS.map(
					(id) =>
						/** @type {Glyph} */ ({
							kind: 'building',
							id,
							count: 1,
						})
				),
				words: 'An income building for your capital',
			},
			{
				glyphs: RESOURCE_ORDER.map(
					(id) =>
						/** @type {Glyph} */ ({
							kind: 'resource',
							id,
							count: 1,
						})
				),
				words: 'A resource: coin, worker, food or culture',
			},
			{
				glyphs: [{ kind: 'resource', id: 'any', count: 1 }],
				words: 'A resource of your choice',
			},
		],
	},
	{
		heading: 'How a space reads',
		rows: [
			{
				glyphs: [
					{ kind: 'building', id: 'farm', count: 1 },
					{ kind: 'or' },
					{ kind: 'building', id: 'house', count: 1 },
				],
				words: 'Choose one of them',
			},
			{
				glyphs: [word('Tile'), { kind: 'plus' }, word('Explore')],
				words: 'Gain both, in that order',
			},
			{
				glyphs: [
					{ kind: 'vp', count: null },
					{ kind: 'per' },
					word('Territory'),
				],
				words: '1 VP for each territory you control, or each thing shown',
			},
			{
				glyphs: [
					{ kind: 'vp', count: null },
					{ kind: 'per' },
					word('Tech'),
				],
				words: '1 VP for each tech card you have',
			},
			{
				glyphs: [word('Science die', 1, true)],
				words: 'Without the benefit or bonus of the space it moves you to',
			},
			{
				bonus: {
					pay: [{ kind: 'resource', id: 'any', count: 1 }],
					gain: [word('Tapestry')],
				},
				words: 'The bonus: you may pay its price to gain what follows',
			},
			{
				landmark: 'Lighthouse',
				words: 'The landmark the first player into this tier gains',
			},
		],
	},
]);
