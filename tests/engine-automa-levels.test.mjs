// Every base difficulty retains its ordered income chart and scoring columns (02 §9.7).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { AUTOMA_LEVELS } from '../src/lib/engine/data/automa-levels.js';

// Literal columns from docs/research/02-base-content.md §9.7; IT2 is column 1.
const NORMAL = {
	landmarksAndTerritories: [1, 2, 2, 3],
	militaryAndScience: [0, 1, 1, 2],
	technologyAndExploration: [1, 1, 2, 3],
	firstEra: { 2: 2, 3: 3, 4: 4 },
};
const HARD = {
	landmarksAndTerritories: [1, 2, 2, 3],
	militaryAndScience: [0, 1, 2, 3],
	technologyAndExploration: [1, 2, 2, 4],
	firstEra: { 2: 2, 3: 3, 4: 4 },
};
const LEVEL_ROWS = [
	[
		1,
		'Automa the Underachiever',
		[],
		[],
		[],
		{ 2: 2, 3: 2, 4: 2 },
		[
			{
				kind: 'humanAdvance',
				tracks: ['military', 'exploration', 'technology', 'science'],
				withBenefits: true,
			},
		],
		NORMAL,
	],
	[
		2,
		'Automa the Average',
		[],
		[2, 3, 4, 5],
		[1, 2, 3, 4],
		{ 2: 2, 3: 2, 4: 2 },
		[],
		NORMAL,
	],
	[
		3,
		'Automa the Slightly Intimidating',
		[2, 3, 4, 5],
		[2, 3, 4, 5],
		[1, 2, 3, 4],
		{ 2: 0, 3: 2, 4: 2 },
		[],
		NORMAL,
	],
	[
		4,
		'Automa the Somewhat Awesome',
		[2, 3, 4, 5],
		[2, 3, 4, 5],
		[1, 2, 3, 4],
		{ 2: 2, 3: 4, 4: 4 },
		[],
		NORMAL,
	],
	[
		5,
		'Automa the Definitely Awesome',
		[2, 3, 4, 5],
		[2, 3, 4, 5],
		[1, 2, 3, 4],
		{ 2: 2, 3: 6, 4: 6 },
		[{ kind: 'botAdvance', tracks: ['favourite'] }],
		HARD,
	],
	[
		6,
		'Automa the Crusher of Dreams',
		[2, 3, 4, 5],
		[2, 3, 4, 5],
		[1, 2, 3, 4],
		{ 2: 2, 3: 6, 4: 6 },
		[
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
		HARD,
	],
];

test('there are exactly six base difficulty levels', () => {
	assert.deepEqual(
		AUTOMA_LEVELS.map((level) => level.level),
		[1, 2, 3, 4, 5, 6]
	);
});

for (const [
	level,
	name,
	advances,
	civ,
	traps,
	cardsByTurn,
	extras,
	multipliers,
] of LEVEL_ROWS) {
	test(`level ${level} follows its exact income schedule, extras and scoring columns`, () => {
		assert.deepEqual(
			AUTOMA_LEVELS.find((entry) => entry.level === level),
			{
				level,
				name,
				incomeRows: [
					{ kind: 'changeFavourite', turns: [2, 3, 4, 5] },
					{ kind: 'advanceBots', turns: advances },
					{ kind: 'civilizationIncome', turns: civ },
					{ kind: 'score', turns: [2, 3, 4, 5] },
					{ kind: 'addProgressCards', turns: [2, 3, 4], cardsByTurn },
					{ kind: 'coverMultiplier', turns: [2, 3, 4] },
					{ kind: 'gainTrapCard', turns: traps },
					{ kind: 'shuffleDecisionDeck', turns: [2, 3, 4] },
				],
				firstIncomeExtras: extras,
				scoreMultipliers: multipliers,
			}
		);
	});
}

test('level schedules, nested extras and score columns cannot be mutated', () => {
	function frozen(value) {
		if (value && typeof value === 'object') {
			assert.ok(Object.isFrozen(value));
			for (const child of Object.values(value)) {
				frozen(child);
			}
		}
	}
	frozen(AUTOMA_LEVELS);
	assert.throws(() => {
		AUTOMA_LEVELS[2].incomeRows[4].cardsByTurn[2] = 2;
	}, TypeError);
	assert.throws(
		() => AUTOMA_LEVELS[5].firstIncomeExtras[0].tracks.reverse(),
		TypeError
	);
	assert.throws(() => {
		AUTOMA_LEVELS[4].scoreMultipliers.technologyAndExploration[3] = 3;
	}, TypeError);
});
