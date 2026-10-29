// The symbols a track space shows for its benefit and bonus (#59): resources, buildings and tracks as their approved
// art, and the game symbols that have no art yet (tiles, cards, explore, conquer, VP) as short words, as #5 decided.

/** @typedef {import('./ui.js').TrackId} TrackId */
/** @typedef {import('./ui.js').CostSymbol} CostSymbol */
/** @typedef {'market' | 'house' | 'farm' | 'armory'} BuildingId */

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

/** The resources in the order the words list them (describe.js), then a resource of any type. */
const RESOURCES = /** @type {readonly CostSymbol[]} */ ([
	'coin',
	'food',
	'worker',
	'culture',
	'any',
]);

/** @type {readonly BuildingId[]} */
const BUILDINGS = ['market', 'house', 'farm', 'armory'];

/** @type {readonly TrackId[]} */
const TRACK_IDS = ['exploration', 'science', 'technology', 'military'];

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
		.filter((id) => TRACK_IDS.includes(id))
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
	} else if (value.per === 'trackSpace' && TRACK_IDS.includes(value.track)) {
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
