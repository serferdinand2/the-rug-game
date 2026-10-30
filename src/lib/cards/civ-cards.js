// Each civilization card as a recipe of patterns, built from the engine's data in the table's rules version (#107).
// game.js goes first: the civilization modules can't be the first engine modules imported (docs/architecture.md).
import '../engine/game.js';
import { CIVS } from '../engine/civs/index.js';
import { ALCHEMISTS_OFF_TRACK_VP } from '../engine/civs/alchemists.js';
import { ARCHITECTS_SWAPS } from '../engine/civs/architects.js';
import { CRAFTSMEN_COLUMNS } from '../engine/civs/craftsmen.js';
import {
	ENTERTAINERS_GRID,
	entertainersMoves,
} from '../engine/civs/entertainers.js';
import { FUTURISTS_HEAD_START } from '../engine/civs/futurists.js';
import { HERALDS_TOKENS } from '../engine/civs/heralds.js';
import { HISTORIANS_SQUARES } from '../engine/civs/historians.js';
import { INVENTORS_TOKENS } from '../engine/civs/inventors.js';
import {
	ISOLATIONISTS_TOKENS,
	LAND_MASS_VP,
} from '../engine/civs/isolationists.js';
import { MERRYMAKERS_COLUMNS } from '../engine/civs/merrymakers.js';
import { MILITANTS_SPACES } from '../engine/civs/militants.js';
import {
	MYSTICS_EXACT_VP,
	MYSTICS_PROPHECIES,
} from '../engine/civs/mystics.js';
import { CHOSEN_FINAL_VP } from '../engine/civs/the-chosen.js';
import { TRADERS_TOKENS } from '../engine/civs/traders.js';
import { ASSETS } from '../art/catalog.js';
import { artUrl } from '../ui.js';
import { buildingName, civilizationName, trackName } from '../game-names.js';

/** @typedef {import('../ui.js').CostSymbol} CostSymbol */
/** @typedef {import('../engine/data/ids.js').VersionId} VersionId */
/** @typedef {import('../engine/data/effects.js').Effect} Effect */
/** @typedef {import('../civ-card.js').CivCardView} CivCardView */

/**
 * One piece of a card's text: words, a bold word, strong words, an inline resource icon or a line break.
 * @typedef {string | { b: string } | { strong: CardTextPart[] } | { resource: CostSymbol, fine?: boolean } | { br: true }} CardTextPart
 */

/** @typedef {CardTextPart[]} CardText - A card's text, its pieces in reading order */

/**
 * A pictogram in an effect box's symbol, when it is neither a gain nor a word: the Architects' district and line icons,
 * a map territory (empty, or with an outpost `piece`), four track symbols or four resources, a mini tapestry card with
 * its `picture`, or an era numeral on a mini tapestry card.
 * @typedef {{ kind: 'district' } | { kind: 'lines' } | { kind: 'territory', piece?: string } | { kind: 'tracks' } |
 *   { kind: 'resources' } | { kind: 'card', picture: string } | { kind: 'era', numeral: string, title: string }} CardPictogram
 */

/**
 * One effect box: its title, its symbol (a gain, a word or a pictogram) and its rules.
 * @typedef {Object} CivEffect
 * @property {string} title - The trigger or condition
 * @property {CostSymbol} [gain] - The symbol is "+" and this resource
 * @property {string} [label] - The symbol is this word or value
 * @property {12 | 13 | 14 | 15} [symbolText] - Bold size of a word or "+" symbol in px
 * @property {CardPictogram} [pictogram] - The symbol is this pictogram
 * @property {CardText} text - The rules
 */

/**
 * One part of the card under the portrait, in order. A primitive's part carries its `props`; `seated` gives it the
 * card's seat, for its tokens' colour, and `pickable` the decision's spots.
 * @typedef {{ pattern: 'placementRows' | 'pathGrid' | 'predictionTracks' | 'rewardColumns' | 'terrainRewards' |
 *   'scoreLadder' | 'tokenReserve' | 'technologyTransfer', props: Record<string, any>, seated?: boolean, pickable?: boolean } |
 *   { pattern: 'effects', above?: number, effects: CivEffect[] } |
 *   { pattern: 'clarity', above?: number, minHeight?: number, text: CardText, setup: CardText | null } |
 *   { pattern: 'guide', text: string }} CivCardSection
 */

/**
 * A civilization card, as CivilizationCard draws it.
 * @typedef {Object} CivCardRecipe
 * @property {string} id - The civilization's id
 * @property {string} title - Its name
 * @property {string} art - Its portrait's URL
 * @property {string} portraitAlt - The portrait's description; empty on a card without a reviewed layout
 * @property {string[]} editions - Its editions' codes, for the chips
 * @property {number} complexity - Complexity dots, 1 to 3
 * @property {number} [bodyMinHeight] - Least height of the portrait row in px
 * @property {number} [textLeading] - Line height of the main effect
 * @property {CardText} effect - The main effect beside the portrait
 * @property {CivCardSection[]} sections - The card's parts under the portrait, in order
 */

/**
 * What a recipe is built from.
 * @typedef {Object} CivCardContext
 * @property {VersionId} version - The table's rules version
 * @property {Record<string, import('../civ-card.js').SpotMark[]>} marks - What each spot shows
 * @property {string[]} choices - The spots the open decision offers
 * @property {Record<string, string>} pieces - The piece on each spot, such as a building id
 */

/** @param {string} text @returns {CardTextPart} */
const b = (text) => ({ b: text });
/** @param {CardTextPart[]} parts @returns {CardTextPart} */
const strong = (...parts) => ({ strong: parts });
/** @param {CostSymbol} symbol @param {boolean} [fine] @returns {CardTextPart} */
const res = (symbol, fine) =>
	fine ? { resource: symbol, fine } : { resource: symbol };
/** @type {CardTextPart} */
const BR = { br: true };

/** The four tracks in the order the Leaders' and Alchemists' cards print them. */
const TRACK_ROW = /** @type {const} */ ([
	'exploration',
	'technology',
	'science',
	'military',
]);

/** The resources a reward square draws as icons. */
const ICON_RESOURCES = ['worker', 'coin', 'food', 'culture', 'any'];

/** Small counts as the cards spell them. */
const NUMBER_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six'];

/**
 * A count in words, as the card spells it.
 * @param {number} count
 * @returns {string}
 */
const numberWord = (count) => NUMBER_WORDS[count] ?? String(count);

/**
 * The resource icons one effect gains, in its order.
 * @param {Effect} effect
 * @returns {CostSymbol[]}
 */
function gainedIcons(effect) {
	const gain = /** @type {Record<string, number> | undefined} */ (
		/** @type {any} */ (effect).gain
	);
	return gain
		? /** @type {CostSymbol[]} */ (
				Object.keys(gain).filter((key) => ICON_RESOURCES.includes(key))
			)
		: [];
}

/**
 * An action space's words on the Entertainers' and the Merrymakers' cards.
 * @param {any} effect
 * @returns {string}
 */
function actionWords(effect) {
	if (effect.conquer) {
		return 'Conquer';
	}
	if (effect.research) {
		return effect.research.noBenefit
			? 'Research without benefit or bonus'
			: 'Research';
	}
	if (effect.invent) {
		return 'Invent';
	}
	if (effect.explore) {
		return 'Explore';
	}
	if (effect.advance) {
		return `Advance ${trackName(effect.advance.tracks[0])}`;
	}
	if (effect.gain?.tapestry) {
		return 'tapestry card';
	}
	if (effect.gain?.territory) {
		return 'Territory tile';
	}
	if (effect.vp !== undefined) {
		return `${effect.vp} VP`;
	}
	throw new Error(`No card words for ${JSON.stringify(effect)}.`);
}

/**
 * The words the Craftsmen's card prints beside a space.
 * @param {any} effect
 * @returns {{ vp?: number, gain?: CostSymbol, text?: string, keep?: string, after?: string }}
 */
function craftsmenReward(effect) {
	if (effect.vp !== undefined) {
		return { vp: effect.vp };
	}
	const [icon] = gainedIcons(effect);
	if (icon) {
		return { gain: icon };
	}
	if (effect.gain?.territory) {
		return { text: `Gain ${effect.gain.territory} territory tile` };
	}
	if (effect.gain?.tapestry) {
		return { text: `Gain ${effect.gain.tapestry} tapestry card` };
	}
	if (effect.upgrade) {
		return { text: 'Upgrade 1 tech card' };
	}
	if (effect.invent) {
		return { text: 'Invent 1 tech card' };
	}
	if (effect.research) {
		return {
			text: 'Research',
			keep: 'with benefit;',
			after: 'bonus is available',
		};
	}
	throw new Error(`No Craftsmen words for ${JSON.stringify(effect)}.`);
}

/**
 * A covered square's reward: VP, or a resource icon.
 * @param {any} effect
 * @returns {{ vp: number } | { gain: CostSymbol }}
 */
function squareReward(effect) {
	return effect.vp !== undefined
		? { vp: effect.vp }
		: { gain: gainedIcons(effect)[0] };
}

/**
 * The effects a civilization's current-rules setup adjustment gives (R34), recorded from the engine: it pushes one
 * effects operation, which a context that only collects what is pushed catches.
 * @param {string} civ
 * @returns {any[]}
 */
function adjustmentEffects(civ) {
	/** @type {any[]} */
	const pushed = [];
	const ctx = /** @type {any} */ ({
		state: null,
		push: (/** @type {any[]} */ ops) => pushed.push(...ops),
	});
	CIVS[civ].adjustment?.setup?.(ctx, 1);
	if (pushed.length !== 1 || pushed[0].kind !== 'effects') {
		throw new Error(`The ${civ}' setup adjustment is not one gain.`);
	}
	return pushed[0].effects;
}

/**
 * The setup line of a current-rules adjustment that is one gain, worded from the engine.
 * @param {string} civ
 * @returns {CardText}
 */
function setupGain(civ) {
	const effects = adjustmentEffects(civ);
	if (effects.every((effect) => effect.vp?.per === 'opponent')) {
		return [
			`Setup, current rules: start with ${effects[0].vp.each} VP per opponent.`,
		];
	}
	/** @type {CardText} */
	const text = ['Setup, current rules: gain '];
	effects.forEach((effect, index) => {
		if (index > 0) {
			text.push(' and ');
		}
		if (effect.gain?.any) {
			if (effect.gain.any > 1) {
				text.push(`${effect.gain.any} `);
			}
			text.push(res('any'));
		} else if (effect.gain?.territory) {
			text.push(`${effect.gain.territory} territory tiles`);
		} else {
			text.push(`${effect.vp} VP`);
		}
	});
	text.push('.');
	return joined(text);
}

/**
 * A text with each run of words in one piece: the browser shapes each text node on its own, so split words would not
 * set exactly as the same words written out.
 * @param {CardText} text
 * @returns {CardText}
 */
function joined(text) {
	return text.reduce((/** @type {CardText} */ parts, part) => {
		const last = parts.length - 1;
		if (typeof part === 'string' && typeof parts[last] === 'string') {
			parts[last] += part;
		} else {
			parts.push(part);
		}
		return parts;
	}, []);
}

/**
 * A clarity section, with its setup line in the version it belongs to.
 * @param {CivCardContext} context
 * @param {CardText} text
 * @param {Partial<Record<VersionId, CardText>>} [setup]
 * @param {{ above?: number, minHeight?: number }} [space]
 * @returns {CivCardSection[]} None when the version leaves it empty
 */
function clarity(context, text, setup = {}, space = {}) {
	const line = setup[context.version] ?? null;
	return text.length === 0 && line === null
		? []
		: [{ pattern: 'clarity', ...space, text, setup: line }];
}

/**
 * Whether a spot shows a mark.
 * @param {CivCardContext} context
 * @param {string} spot
 * @param {import('../civ-card.js').SpotMark} mark
 */
const marked = (context, spot, mark) =>
	context.marks[spot]?.includes(mark) === true;

/**
 * A token reserve, its used tokens from the spots 'token0' onwards.
 * @param {CivCardContext} context
 * @param {number} count
 * @returns {CivCardSection}
 */
function reserve(context, count) {
	const used = Array.from({ length: count }, (_, index) =>
		marked(context, `token${index}`, 'used')
	).filter(Boolean).length;
	return { pattern: 'tokenReserve', props: { count, used } };
}

/**
 * The parts of each reviewed card, from the context.
 * @type {Record<string, (context: CivCardContext) => Omit<CivCardRecipe, 'id' | 'title' | 'art' | 'editions'>>}
 */
const RECIPES = {
	collectors: (context) => {
		// Arts & Architecture has no engine module yet; its numbers are the reviewed card's.
		const items = [
			{
				spot: 'outpost',
				name: 'Outpost*',
				picture: artUrl('piece/outpost'),
				placed: artUrl('piece/outpost-blue'),
				large: true,
			},
			{ spot: 'house', name: 'House', picture: artUrl('building/house') },
			{
				spot: 'landmark',
				name: 'Landmark',
				picture: artUrl('landmark/clock-tower'),
			},
			{
				spot: 'tapestry',
				name: 'Tapestry',
				picture: artUrl('tapestry/lost-artifacts'),
				facedown: true,
			},
			{
				spot: 'territory',
				name: 'Territory',
				picture: artUrl('capital-terrain/grassland-open-01'),
				facedown: true,
			},
			{
				spot: 'tech',
				name: 'Tech',
				picture: artUrl('tech/eyeglasses'),
				facedown: true,
			},
		].map(({ spot, ...item }) => ({
			...item,
			gain: /** @type {CostSymbol} */ ('any'),
			collected: marked(context, spot, 'token'),
		}));
		return {
			portraitAlt: 'A collector studies a gem through a magnifying glass',
			complexity: 2,
			effect: [
				'During an ',
				b('advance'),
				' turn, when you gain one of these, you may place it on its space if the space is empty. Then gain ',
				res('any'),
				'. One item per turn.',
			],
			sections: [
				{
					pattern: 'placementRows',
					props: { kind: 'collection', items },
				},
				...clarity(
					context,
					[
						b('*'),
						" Only from a conquer benefit, instead of conquering; don't roll the dice.",
						BR,
						"Items here count for scoring but can't be used. Cards and tiles lie face down; you may look at them.",
					],
					{
						current: [
							'Setup, current rules: gain ',
							res('any'),
							'.',
						],
					}
				),
				{
					pattern: 'scoreLadder',
					props: {
						steps: [1, 3, 6, 10, 15, 21].map((points, index) => ({
							count: index + 1,
							points,
						})),
						current: items.filter((item) => item.collected).length,
					},
				},
			],
		};
	},
	architects: (context) => ({
		portraitAlt: 'Architects civilization portrait',
		complexity: 3,
		bodyMinHeight: 184,
		textLeading: 1.5,
		effect: [
			'Build with matching income buildings to gain more from completed districts and score more from completed rows and columns.',
		],
		sections: [
			{
				pattern: 'effects',
				effects: [
					{
						title: 'Complete a district',
						pictogram: { kind: 'district' },
						text: [
							'If all its income buildings match, gain ',
							strong('+ ', res('any', true)),
							' in addition to its usual reward.',
						],
					},
					{
						title: 'Score the capital',
						pictogram: { kind: 'lines' },
						text: [
							'Each complete row or column whose income buildings match is worth ',
							strong('+1 VP'),
							' beyond its usual score.',
						],
					},
				],
			},
			...clarity(
				context,
				[
					`Each qualifying district, row or column needs at least one income building. If gained mid-game, you may swap the places of 2 income buildings in your capital, up to ${ARCHITECTS_SWAPS} times.`,
				],
				{
					current: [
						'Setup, current rules: place one impassable plot per opponent, each in a different district.',
					],
				},
				{ minHeight: 70 }
			),
		],
	}),
	leaders: (context) => ({
		portraitAlt: 'Leaders civilization portrait',
		complexity: 1,
		bodyMinHeight: 184,
		textLeading: 1.5,
		effect: [
			'At the start of income turns 2–5, you may cover one unused track space. Advance on that track for free and gain its benefit.',
		],
		sections: [
			{
				pattern: 'placementRows',
				pickable: true,
				props: {
					kind: 'leaders',
					items: TRACK_ROW.map((track) => ({
						id: track,
						name: trackName(track),
						picture: artUrl(`track/${track}`),
						used: context.marks[track]?.includes('used'),
					})),
				},
			},
			...clarity(
				context,
				[
					'Each track space can be used once. This advance gains the benefit, but cannot gain its bonus.',
				],
				{},
				{ above: 16, minHeight: 70 }
			),
		],
	}),
	'treasure-hunters': (context) => ({
		// Plans & Ploys has no engine module yet; the terrains and rewards are the reviewed card's.
		portraitAlt: 'Treasure Hunters civilization portrait',
		complexity: 3,
		bodyMinHeight: 184,
		effect: [
			"At the start of income turns 2–5, you may move one token from this mat to an empty adjacent territory matching an unused terrain below. Control it and gain that terrain's reward.",
		],
		sections: [
			{
				pattern: 'terrainRewards',
				props: {
					rows: /** @type {const} */ ([
						{
							terrain: 'desert',
							name: 'Desert',
							gain: 'coin',
							effect: 'roll the black conquer die twice and take one result.',
						},
						{
							terrain: 'grassland',
							name: 'Grassland',
							gain: 'culture',
							effect: 'roll the science die twice, choose one result, and advance with benefit.',
						},
						{
							terrain: 'mountain',
							name: 'Mountain',
							gain: 'worker',
							effect: 'roll both conquer dice and gain both results.',
						},
						{
							terrain: 'forest',
							name: 'Forest',
							gain: 'food',
							effect: 'roll the red conquer die twice and gain both results.',
						},
					]).map((row) => ({
						...row,
						used: marked(context, row.terrain, 'used'),
					})),
				},
			},
			...clarity(context, [
				'Setup: put 4 player tokens here and gain 2 territory tiles. Each terrain can be used once. Claiming a territory this way is not a conquer action. For Grassland, you may pay for the advancement bonus.',
			]),
		],
	}),
	craftsmen: (context) => ({
		portraitAlt: 'Craftsmen civilization portrait',
		complexity: 1,
		bodyMinHeight: 184,
		effect: [
			'When you gain an income building, you may place it here instead of in your capital. Place it on the ',
			b('lowest open space'),
			" in any column and immediately gain that space's reward.",
		],
		sections: [
			{
				pattern: 'rewardColumns',
				props: {
					columns: CRAFTSMEN_COLUMNS.map((spaces, column) => ({
						title: `Column ${'ABC'[column]}`,
						note: 'fill from bottom',
						// The engine lists a column bottom first; the card prints it top first.
						rows: spaces
							.map((effects, space) => {
								const spot = `c${column}s${space}`;
								const filled = marked(context, spot, 'token');
								return {
									...craftsmenReward(effects[0]),
									...(filled && {
										building: context.pieces[spot],
									}),
									filled,
								};
							})
							.reverse(),
					})),
				},
			},
			...clarity(context, [
				'Buildings here count as part of your capital for building-related benefits, but these columns do not score as completed capital rows or columns. You may start another column before finishing one.',
			]),
		],
	}),
	entertainers: (context) => ({
		portraitAlt: 'Entertainers civilization portrait',
		complexity: 2,
		effect: [
			"At the start of income turns 2–5, move your token one column right along a path and gain the space's reward.",
		],
		sections: [
			{
				pattern: 'pathGrid',
				seated: true,
				pickable: true,
				props: {
					heads: ['1st move', '2nd', '3rd', '4th'],
					// The engine's grid is by column; the card reads it row by row.
					spaces: ENTERTAINERS_GRID[0].flatMap((_, row) =>
						ENTERTAINERS_GRID.map((column, index) => {
							const id = `c${index + 1}r${row + 1}`;
							const effect = /** @type {any} */ (column[row][0]);
							const [gain] = gainedIcons(effect);
							if (gain) {
								return { id, gain };
							}
							if (effect.building) {
								return {
									id,
									picture: artUrl(
										`building/${effect.building}`
									),
									text: buildingName(effect.building),
								};
							}
							return { id, text: actionWords(effect) };
						})
					),
					// The links are the engine's own moves (R28), so the card never shows a link it refuses.
					links: ENTERTAINERS_GRID.slice(0, -1).flatMap(
						(column, index) =>
							column.flatMap((_, row) => {
								const from = `c${index + 1}r${row + 1}`;
								return entertainersMoves(from).map(
									(to) => /** @type {const} */ ([from, to])
								);
							})
					),
					current:
						Object.keys(context.marks).find((spot) =>
							marked(context, spot, 'token')
						) ?? null,
					start: 'Start at the left; move one column each income turn.',
				},
			},
			...clarity(
				context,
				[
					'If gained mid-game, place the token on any reward space and gain it immediately.',
				],
				{ current: setupGain('entertainers') }
			),
		],
	}),
	militants: (context) => ({
		portraitAlt: 'Militants civilization portrait',
		complexity: 1,
		effect: [
			'When you conquer, take the leftmost outpost from either row. At the start of every income turn, gain all uncovered rewards.',
		],
		sections: [
			{
				pattern: 'placementRows',
				pickable: true,
				props: {
					kind: 'covered',
					items: /** @type {const} */ (['top', 'bottom']).flatMap(
						(row) =>
							MILITANTS_SPACES[row].map((effect, space) => ({
								id: `${row}${space}`,
								...squareReward(effect),
								exposed:
									context.marks[`${row}${space}`]?.includes(
										'exposed'
									),
							}))
					),
				},
			},
			{ pattern: 'guide', text: 'Take from the left of either row →' },
			...clarity(context, [
				`Start with ${MILITANTS_SPACES.top.length + MILITANTS_SPACES.bottom.length} outposts here and 2 on your starting territory. If you gain this civilization mid-game, refill spaces from right to left, choosing either row for each remaining outpost.`,
			]),
		],
	}),
	mystics: (context) => ({
		portraitAlt: 'Mystics civilization portrait',
		complexity: 3,
		effect: [
			'When you gain this civilization, predict one number in each category by placing a token on it.',
		],
		sections: [
			{
				pattern: 'predictionTracks',
				pickable: true,
				props: {
					categories: MYSTICS_PROPHECIES.map(
						({ category, most }) => ({
							id: category,
							...MYSTIC_LABELS[category],
							most,
							selected: predicted(context, category),
						})
					),
				},
			},
			{
				pattern: 'effects',
				above: 14,
				effects: [
					{
						title: 'First time reached',
						gain: 'any',
						symbolText: 15,
						text: [
							'Gain one resource of your choice when you first reach each predicted number.',
						],
					},
					{
						title: 'Final income turn',
						label: `${MYSTICS_EXACT_VP} VP`,
						symbolText: 15,
						text: [
							`Score ${MYSTICS_EXACT_VP} VP for each category predicted exactly.`,
						],
					},
				],
			},
			...clarity(
				context,
				[
					'If gained mid-game, discard this civilization and gain another. This is the original prediction mat; the revised Mystics ability uses a different system.',
				],
				{ current: setupGain('mystics') }
			),
		],
	}),
	alchemists: (context) => ({
		portraitAlt: 'Alchemists civilization portrait',
		complexity: 3,
		effect: [
			'At the start of income turns 2–5, roll the science die and mark its track. After each roll, stop or roll again.',
		],
		sections: [
			{
				pattern: 'placementRows',
				seated: true,
				props: {
					kind: 'tracks',
					items: TRACK_ROW.map((track) => ({
						name: trackName(track),
						picture: artUrl(`track/${track}`),
						rolled: marked(context, track, 'token'),
					})),
				},
			},
			{
				pattern: 'effects',
				above: 4,
				effects: [
					{
						title: 'Keep distinct rolls',
						label: 'STOP',
						symbolText: 14,
						text: [
							'Advance once on each marked track, without benefits or bonuses. Then clear the tokens.',
						],
					},
					{
						title: 'Roll a marked track again',
						label: 'BUST',
						symbolText: 14,
						text: [
							'Clear all tokens and gain + ',
							res('any'),
							' instead.',
						],
					},
					{
						title: "Past a track's end",
						label: `${ALCHEMISTS_OFF_TRACK_VP} VP`,
						symbolText: 14,
						text: [
							`Gain ${ALCHEMISTS_OFF_TRACK_VP} VP each time the final result would push you beyond a track's end.`,
						],
					},
				],
			},
			...clarity(
				context,
				[
					'Tokens mark only rolls from this activation; remove them after stopping or busting.',
				],
				{ current: setupGain('alchemists') }
			),
		],
	}),
	isolationists: (context) => ({
		portraitAlt: 'Isolationists civilization portrait',
		complexity: 2,
		effect: [
			`When you conquer an empty territory, you may add one of your ${numberWord(ISOLATIONISTS_TOKENS)} tokens there beside your outpost.`,
		],
		sections: [
			reserve(context, ISOLATIONISTS_TOKENS),
			{
				pattern: 'effects',
				effects: [
					{
						title: 'Place a token',
						gain: 'any',
						symbolText: 13,
						text: [
							'Gain any resource. With two tokens on it, that territory cannot be conquered.',
						],
					},
				],
			},
			{
				pattern: 'scoreLadder',
				props: {
					kind: 'flat',
					label: 'Final income turn · territories in your largest connected landmass of one terrain',
					// R31: the last entry scores that many territories or more.
					steps: LAND_MASS_VP.slice(1).map((points, index, all) => ({
						count:
							index === all.length - 1
								? `${index + 1}+`
								: index + 1,
						points,
					})),
					example: {
						pictures: Array(3).fill(artUrl('terrain/grassland')),
						text: '3 connected grassland territories',
						result: `= ${LAND_MASS_VP[3]} VP`,
					},
				},
			},
			...clarity(
				context,
				[
					'Only land territories you control count; water does not form a landmass. The middle island is not a wildcard.',
				],
				{ current: setupGain('isolationists') }
			),
		],
	}),
	traders: (context) => ({
		portraitAlt: 'Traders civilization portrait',
		complexity: 1,
		effect: [
			'At the start of income turns 2–5, you may place one of these tokens on a qualifying map territory.',
		],
		sections: [
			reserve(context, TRADERS_TOKENS),
			{
				pattern: 'effects',
				effects: [
					{
						title: 'Empty territory',
						pictogram: { kind: 'territory' },
						text: [
							'Gain 1 VP per adjacent opponent-controlled territory. If an opponent later conquers it, you may gain the benefit of an unselected conquer die.',
						],
					},
					{
						title: 'One opponent outpost',
						pictogram: {
							kind: 'territory',
							piece: artUrl('piece/outpost-red'),
						},
						text: [
							'Gain the benefit printed on its territory tile, if it has one.',
						],
					},
				],
			},
			...clarity(
				context,
				[
					'A territory with two tokens of any kind cannot be conquered. The token placement is not a conquer action.',
				],
				{ current: setupGain('traders') }
			),
		],
	}),
	merrymakers: (context) => ({
		portraitAlt: 'Merrymakers civilization portrait',
		complexity: 1,
		effect: [
			'At the start of income turns 2–5, move one token up one square and gain everything shown there.',
		],
		sections: [
			{
				pattern: 'rewardColumns',
				seated: true,
				pickable: true,
				props: {
					kind: 'inside',
					columns: MERRYMAKERS_COLUMNS.map((spaces, column) => ({
						id: `m${column}`,
						moved: context.marks[`m${column}`]?.includes('moved'),
						// The engine lists a column bottom first; the card prints it top first.
						cells: spaces
							.map((effects, space) => {
								const id = `m${column}l${space + 1}`;
								const gains = effects.flatMap(gainedIcons);
								const also = effects
									.map(
										(effect) =>
											/** @type {any} */ (effect).building
									)
									.find(Boolean);
								return {
									id,
									...(gains.length > 0
										? { gains, ...(also && { also }) }
										: {
												lines: effects.map(
													(effect, index) =>
														actionWords(effect) +
														(index <
														effects.length - 1
															? ' +'
															: '')
												),
											}),
									current:
										context.marks[id]?.includes('token'),
								};
							})
							.reverse(),
					})),
				},
			},
			...clarity(
				context,
				[
					'Each column starts with one token below its lowest square. Double rewards grant both items; Explore and Research include their benefits. This shows the original mat.',
				],
				{ current: setupGain('merrymakers') }
			),
		],
	}),
	historians: (context) => ({
		portraitAlt: 'Historians civilization portrait',
		complexity: 1,
		effect: [
			'At the start of income turns 2–5, you may discard a territory tile to give one of these tokens to an opponent.',
		],
		sections: [
			{
				pattern: 'placementRows',
				seated: true,
				pickable: true,
				props: {
					kind: 'history',
					items: HISTORIANS_SQUARES.map((effect, square) => ({
						id: `square${square}`,
						...squareReward(effect),
						exposed:
							context.marks[`square${square}`]?.includes(
								'exposed'
							),
					})),
				},
			},
			{
				pattern: 'effects',
				effects: [
					{
						title: 'Opponent holding your token',
						label: 'Landmark',
						symbolText: 12,
						text: [
							'When they gain a landmark, gain every currently exposed reward above.',
						],
					},
				],
			},
			...clarity(context, [
				`An opponent may hold more than one token. If gained mid-game, give away all ${numberWord(HISTORIANS_SQUARES.length)} immediately and expose every reward. This shows the original mat.`,
			]),
		],
	}),
	inventors: (context) => ({
		portraitAlt: 'Inventors civilization portrait',
		complexity: 1,
		effect: [
			'At the start of income turns 2–5, you may put one token on any technology card and upgrade it one row.',
		],
		sections: [
			reserve(context, INVENTORS_TOKENS),
			{
				pattern: 'technologyTransfer',
				props: { active: marked(context, 'transfer', 'token') },
			},
			{
				pattern: 'effects',
				effects: [
					{
						title: "On an opponent's card",
						label: 'Upgrade',
						symbolText: 12,
						text: [
							'They gain the upgrade benefit; you may gain it too. Top-row prerequisites are ignored.',
						],
					},
					{
						title: 'When their marked card reaches the top',
						label: 'Top row',
						symbolText: 12,
						text: [
							'They gain the benefit first; under the original rules you may gain it too, under the current rules only if your own token moved it there. Then take the card into your bottom row, keeping your token on it.',
						],
					},
				],
			},
			...clarity(context, [
				'On your own card, gain the upgrade benefit normally. A landmark already claimed by the opponent gives you nothing.',
			]),
		],
	}),
	// 02-base-content §1.2; current rules' adjustment D (§2.2), at the end of income turn 1 (#20 design).
	futurists: (context) => ({
		portraitAlt: 'Futurists civilization portrait',
		complexity: 3,
		effect: [
			'When you gain this civilization, at setup or during the game, jump ahead on every advancement track at once.',
		],
		sections: [
			{
				pattern: 'effects',
				effects: [
					{
						title: 'Head start',
						pictogram: { kind: 'tracks' },
						text: [
							'Advance exactly ',
							strong(`${FUTURISTS_HEAD_START} spaces`),
							' on each of the four tracks, without their benefits, bonuses or landmarks. The end of a track is the limit.',
						],
					},
					{
						title: 'Supplies',
						pictogram: { kind: 'resources' },
						text: ['Gain 1 of each resource.'],
					},
				],
			},
			...clarity(
				context,
				[
					'A landmark you jump past stays on its track; you gain it only by later advancing onto its space.',
				],
				{
					current: [
						'Current rules: at the end of your first income turn, lose 1 culture and 1 other resource of your choice.',
					],
				}
			),
		],
	}),
	// 02-base-content §1.2; current rules' adjustment D (§2.2), at the end of income turn 1 (#20 design).
	heralds: (context) => ({
		portraitAlt: 'Heralds civilization portrait',
		complexity: 1,
		effect: [
			"At the start of income turns 2–5, you may move one of these tokens onto a When Played tapestry card, yours or an opponent's, and gain its benefit.",
		],
		sections: [
			reserve(context, HERALDS_TOKENS),
			{
				pattern: 'effects',
				effects: [
					{
						title: 'Copy a card',
						pictogram: {
							kind: 'card',
							picture: artUrl('tapestry/renaissance'),
						},
						text: [
							'Only the top card of a slot can be chosen, and each card holds at most one token.',
						],
					},
					{
						title: 'Started with the Heralds',
						pictogram: {
							kind: 'era',
							numeral: 'I',
							title: 'Maker of Fire, era I',
						},
						text: [
							'At the end of your first income turn, you may play a tapestry card on top of Maker of Fire.',
						],
					},
				],
			},
			...clarity(context, [], {
				current: [
					'Current rules: instead, at the end of your first income turn draw tapestry cards until you find a When Played card, and discard the others. You may play that card on Maker of Fire, unless it is Renaissance.',
				],
			}),
		],
	}),
	// 02-base-content §1.2; no adjustment in either version (§2.2).
	nomads: (context) => ({
		portraitAlt: 'Nomads civilization portrait',
		complexity: 3,
		effect: [
			'Whenever you gain a building or a landmark, you may place it on the map instead of in your capital, in one of two ways.',
		],
		sections: [
			{
				pattern: 'effects',
				effects: [
					{
						title: 'Your territory with one item',
						pictogram: {
							kind: 'territory',
							piece: artUrl('piece/outpost-blue'),
						},
						text: [
							'Place it beside the one outpost or building there and gain ',
							strong('+ ', res('any', true)),
							'. Opponents can no longer conquer that territory.',
						],
					},
					{
						title: 'Empty territory next to yours',
						pictogram: { kind: 'territory' },
						text: [
							'Place it there to take control. This is not a conquest; if an opponent conquers the territory, the piece counts as an outpost.',
						],
					},
				],
			},
			...clarity(context, [
				'Buildings on the map still count for VP per building.',
			]),
		],
	}),
	// 02-base-content §1.2; current rules' adjustment (§2.2): +15 VP per opponent.
	'the-chosen': (context) => ({
		portraitAlt: 'The Chosen civilization portrait',
		complexity: 2,
		effect: [
			'At the start of income turns 2–5, gain VP for the tracks you lead and resources for your achievements.',
		],
		sections: [
			{
				pattern: 'effects',
				effects: [
					{
						title: 'Each track you lead',
						pictogram: { kind: 'tracks' },
						text: [
							'Gain ',
							strong('1 VP per opponent'),
							' for each track you have completed, or on which no token is further advanced than yours.',
						],
					},
					{
						title: 'Each achievement',
						gain: 'any',
						text: [
							'Gain any resource for each achievement you have earned. On your final income turn, gain ',
							strong(`${CHOSEN_FINAL_VP} VP`),
							' per achievement instead.',
						],
					},
				],
			},
			...clarity(
				context,
				[
					'A track where another token is level with yours still counts.',
				],
				{ current: setupGain('the-chosen') }
			),
		],
	}),
};

/** The Mystics' categories as the card names them. */
const MYSTIC_LABELS =
	/** @type {Record<string, { label: string, note?: string }>} */ ({
		techCards: { label: 'Tech cards', note: 'you have' },
		districts: { label: 'Complete districts' },
		territories: { label: 'Territories', note: 'you control' },
		tracks: { label: 'Completed advancement tracks' },
	});

/**
 * The number the Mystics predicted in a category, as the marks show it.
 * @param {CivCardContext} context
 * @param {string} category
 * @returns {number | undefined}
 */
function predicted(context, category) {
	const spot = Object.keys(context.marks).find(
		(each) =>
			each.startsWith(`${category}:`) && marked(context, each, 'chosen')
	);
	return spot === undefined ? undefined : Number(spot.split(':')[1]);
}

/** The civilizations with a reviewed card layout, in no particular order. */
export const CIV_CARD_IDS = Object.freeze(Object.keys(RECIPES));

/**
 * A civilization's card as a recipe: its frame, its main effect and its parts, with the numbers the engine holds, the
 * setup line of the table's rules version and the marks of a view. A civilization without a reviewed layout gets its
 * frame, portrait and name only, and no invented rules text.
 * @param {string} id - The civilization's id
 * @param {{ version?: VersionId, view?: CivCardView | null }} [options] - The table's rules version ('current' by
 *   default), and the card's state: a seat's live view or a sample view; none for the unmarked card
 * @returns {CivCardRecipe}
 */
export function civCard(id, { version = 'current', view = null } = {}) {
	/** @type {CivCardContext} */
	const context = {
		version,
		marks: view?.marks ?? {},
		choices: Object.keys(view?.choices ?? {}),
		pieces: view?.pieces ?? {},
	};
	const frame = {
		id,
		title: civilizationName(id),
		art: artUrl(`civ/${id}`),
		editions: [
			ASSETS.find((asset) => asset.id === `civ/${id}`)?.expansion ??
				'base',
		],
	};
	const recipe = RECIPES[id];
	if (!recipe) {
		return {
			...frame,
			portraitAlt: '',
			complexity: 1,
			effect: ['The full card is on its way.'],
			sections: [],
		};
	}
	const parts = recipe(context);
	return {
		...frame,
		...parts,
		// The patterns a decision is answered on offer its spots.
		sections: parts.sections.map((section) =>
			'pickable' in section && section.pickable
				? {
						...section,
						props: { ...section.props, choices: context.choices },
					}
				: section
		),
	};
}
