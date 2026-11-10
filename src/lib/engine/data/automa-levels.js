// The six base Automa difficulty charts, first-income extras and scoring columns (02 §9.7).
import { deepFreeze } from './ids.js';

/** @typedef {import('./ids.js').BoardTrackId} BoardTrackId */
/** @typedef {'changeFavourite' | 'advanceBots' | 'civilizationIncome' | 'score' | 'addProgressCards' | 'coverMultiplier' | 'gainTrapCard' | 'shuffleDecisionDeck'} AutomaIncomeRowKind */

/**
 * One chart row in printed resolution order. Empty turns mean the level omits it.
 * advanceBots uses the most recent decision pair. addProgressCards moves the
 * indicated number from progress to decision discard. coverMultiplier takes the
 * top tapestry-deck card face down onto the leftmost empty mat space. gainTrapCard
 * gives one face-down tapestry card beside the Automa mat. shuffleDecisionDeck
 * shuffles all cards of the latest era together with those just added (02 §9.7).
 * @typedef {Object} AutomaIncomeRow
 * @property {AutomaIncomeRowKind} kind
 * @property {readonly number[]} turns - Income-turn numbers, not era indices
 * @property {Readonly<Record<number, number>>} [cardsByTurn] - Progress additions; explicit zero at level 3 IT2
 */

/**
 * The exceptional first-income/setup instructions; they are data, not operations.
 * @typedef {{kind: 'humanAdvance', tracks: readonly BoardTrackId[], withBenefits: true} | {kind: 'botAdvance', tracks: readonly (BoardTrackId | 'favourite')[]} | {kind: 'secondCivilization', chosenBy: 'human', affectsFavourite: false, resolveAfterPrimary: true}} AutomaFirstIncomeExtra
 */

/**
 * Four scoring columns for IT2–IT5, before that turn covers a column. Civ VP is
 * separate and is not multiplied (02 §9.3). First-era bonuses are keyed by era.
 * @typedef {Object} AutomaScoreMultipliers
 * @property {readonly number[]} landmarksAndTerritories
 * @property {readonly number[]} militaryAndScience
 * @property {readonly number[]} technologyAndExploration
 * @property {Readonly<Record<number, number>>} firstEra
 */

/**
 * A base difficulty. Level 2 is the default (02 §9.7).
 * @typedef {Object} AutomaLevel
 * @property {number} level
 * @property {string} name
 * @property {readonly AutomaIncomeRow[]} incomeRows - Top to bottom, left column first
 * @property {readonly AutomaFirstIncomeExtra[]} firstIncomeExtras - Level 6's second civ is chosen at setup, not drawn on IT1
 * @property {AutomaScoreMultipliers} scoreMultipliers
 */

/** Levels 1–4 use Normal scoring; levels 5–6 use Hard (02 §9.7). @type {AutomaScoreMultipliers} */
const NORMAL = {
	landmarksAndTerritories: [1, 2, 2, 3],
	militaryAndScience: [0, 1, 1, 2],
	technologyAndExploration: [1, 1, 2, 3],
	firstEra: { 2: 2, 3: 3, 4: 4 },
};
/** @type {AutomaScoreMultipliers} */
const HARD = {
	landmarksAndTerritories: [1, 2, 2, 3],
	militaryAndScience: [0, 1, 2, 3],
	technologyAndExploration: [1, 2, 2, 4],
	firstEra: { 2: 2, 3: 3, 4: 4 },
};

/** @type {readonly AutomaLevel[]} */
export const AUTOMA_LEVELS = deepFreeze([
	{
		level: 1,
		name: 'Automa the Underachiever',
		incomeRows: [
			{ kind: 'changeFavourite', turns: [2, 3, 4, 5] },
			{ kind: 'advanceBots', turns: [] },
			{ kind: 'civilizationIncome', turns: [] },
			{ kind: 'score', turns: [2, 3, 4, 5] },
			{
				kind: 'addProgressCards',
				turns: [2, 3, 4],
				cardsByTurn: { 2: 2, 3: 2, 4: 2 },
			},
			{ kind: 'coverMultiplier', turns: [2, 3, 4] },
			{ kind: 'gainTrapCard', turns: [] },
			{ kind: 'shuffleDecisionDeck', turns: [2, 3, 4] },
		],
		firstIncomeExtras: [
			{
				kind: 'humanAdvance',
				tracks: ['military', 'exploration', 'technology', 'science'],
				withBenefits: true,
			},
		],
		scoreMultipliers: NORMAL,
	},
	{
		level: 2,
		name: 'Automa the Average',
		incomeRows: [
			{ kind: 'changeFavourite', turns: [2, 3, 4, 5] },
			{ kind: 'advanceBots', turns: [] },
			{ kind: 'civilizationIncome', turns: [2, 3, 4, 5] },
			{ kind: 'score', turns: [2, 3, 4, 5] },
			{
				kind: 'addProgressCards',
				turns: [2, 3, 4],
				cardsByTurn: { 2: 2, 3: 2, 4: 2 },
			},
			{ kind: 'coverMultiplier', turns: [2, 3, 4] },
			{ kind: 'gainTrapCard', turns: [1, 2, 3, 4] },
			{ kind: 'shuffleDecisionDeck', turns: [2, 3, 4] },
		],
		firstIncomeExtras: [],
		scoreMultipliers: NORMAL,
	},
	{
		level: 3,
		name: 'Automa the Slightly Intimidating',
		incomeRows: [
			{ kind: 'changeFavourite', turns: [2, 3, 4, 5] },
			{ kind: 'advanceBots', turns: [2, 3, 4, 5] },
			{ kind: 'civilizationIncome', turns: [2, 3, 4, 5] },
			{ kind: 'score', turns: [2, 3, 4, 5] },
			{
				kind: 'addProgressCards',
				turns: [2, 3, 4],
				cardsByTurn: { 2: 0, 3: 2, 4: 2 },
			},
			{ kind: 'coverMultiplier', turns: [2, 3, 4] },
			{ kind: 'gainTrapCard', turns: [1, 2, 3, 4] },
			{ kind: 'shuffleDecisionDeck', turns: [2, 3, 4] },
		],
		firstIncomeExtras: [],
		scoreMultipliers: NORMAL,
	},
	{
		level: 4,
		name: 'Automa the Somewhat Awesome',
		incomeRows: [
			{ kind: 'changeFavourite', turns: [2, 3, 4, 5] },
			{ kind: 'advanceBots', turns: [2, 3, 4, 5] },
			{ kind: 'civilizationIncome', turns: [2, 3, 4, 5] },
			{ kind: 'score', turns: [2, 3, 4, 5] },
			{
				kind: 'addProgressCards',
				turns: [2, 3, 4],
				cardsByTurn: { 2: 2, 3: 4, 4: 4 },
			},
			{ kind: 'coverMultiplier', turns: [2, 3, 4] },
			{ kind: 'gainTrapCard', turns: [1, 2, 3, 4] },
			{ kind: 'shuffleDecisionDeck', turns: [2, 3, 4] },
		],
		firstIncomeExtras: [],
		scoreMultipliers: NORMAL,
	},
	{
		level: 5,
		name: 'Automa the Definitely Awesome',
		incomeRows: [
			{ kind: 'changeFavourite', turns: [2, 3, 4, 5] },
			{ kind: 'advanceBots', turns: [2, 3, 4, 5] },
			{ kind: 'civilizationIncome', turns: [2, 3, 4, 5] },
			{ kind: 'score', turns: [2, 3, 4, 5] },
			{
				kind: 'addProgressCards',
				turns: [2, 3, 4],
				cardsByTurn: { 2: 2, 3: 6, 4: 6 },
			},
			{ kind: 'coverMultiplier', turns: [2, 3, 4] },
			{ kind: 'gainTrapCard', turns: [1, 2, 3, 4] },
			{ kind: 'shuffleDecisionDeck', turns: [2, 3, 4] },
		],
		firstIncomeExtras: [{ kind: 'botAdvance', tracks: ['favourite'] }],
		scoreMultipliers: HARD,
	},
	{
		level: 6,
		name: 'Automa the Crusher of Dreams',
		incomeRows: [
			{ kind: 'changeFavourite', turns: [2, 3, 4, 5] },
			{ kind: 'advanceBots', turns: [2, 3, 4, 5] },
			{ kind: 'civilizationIncome', turns: [2, 3, 4, 5] },
			{ kind: 'score', turns: [2, 3, 4, 5] },
			{
				kind: 'addProgressCards',
				turns: [2, 3, 4],
				cardsByTurn: { 2: 2, 3: 6, 4: 6 },
			},
			{ kind: 'coverMultiplier', turns: [2, 3, 4] },
			{ kind: 'gainTrapCard', turns: [1, 2, 3, 4] },
			{ kind: 'shuffleDecisionDeck', turns: [2, 3, 4] },
		],
		firstIncomeExtras: [
			{
				kind: 'botAdvance',
				tracks: ['military', 'exploration', 'technology', 'science'],
			},
			{
				kind: 'secondCivilization',
				chosenBy: 'human',
				affectsFavourite: false,
				resolveAfterPrimary: true,
			},
		],
		scoreMultipliers: HARD,
	},
]);
