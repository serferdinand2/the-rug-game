// The results screen and the scoreboard (#29 design §5–§6): standings, shared places, ties step by step, VP by source and the table's facts.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { tiebreakValues, view } from '../src/lib/engine/game.js';
import { simulate } from './helpers/simulation.mjs';
import {
	VP_SOURCES,
	ordinal,
	ruleNote,
	scoreboard,
	standings,
	tableFacts,
	tieExplanations,
	vpBreakdown,
	yourResult,
} from '../src/lib/results.js';

/**
 * The final state of simulated game `index`.
 * @param {number} index
 * @returns {any}
 */
function finished(index) {
	/** @type {any} */
	let last = null;
	simulate(index, {
		check: (state) => {
			last = state;
		},
	});
	return last;
}

/**
 * A finished game's view for seat 1, with its seats' VP and result replaced: Ana and Bo tie on 87 VP and stay tied
 * after the tallest landmark and the resources, Cy is third.
 * @returns {any}
 */
function sharedWin() {
	const game = structuredClone(view(finished(2), 1));
	const [ana, bo, cy] = game.seats;
	ana.vp = 87;
	ana.vpSources = { income: 40, tracks: 30, tapestry: 17 };
	bo.vp = 87;
	bo.vpSources = { income: 50, civ: 40, paid: -3 };
	cy.vp = 60;
	cy.vpSources = { map: 60 };
	game.version = 'current';
	game.result = {
		ranking: [
			{ seat: 1, place: 1, vp: 87 },
			{ seat: 2, place: 1, vp: 87 },
			{ seat: 3, place: 3, vp: 60 },
		],
		ties: [
			{
				vp: 87,
				seats: [1, 2],
				steps: [
					{
						by: 'tallestLandmark',
						values: [
							{ seat: 1, value: 'fusion-reactor' },
							{ seat: 2, value: 'fusion-reactor' },
						],
					},
					{
						by: 'resources',
						values: [
							{ seat: 1, value: 2 },
							{ seat: 2, value: 2 },
						],
					},
				],
			},
		],
	};
	return game;
}

test('ordinals read as places', () => {
	assert.deepEqual([1, 2, 3, 4, 5].map(ordinal), [
		'1st',
		'2nd',
		'3rd',
		'4th',
		'5th',
	]);
});

test("a finished game's standings follow the engine's ranking, each with VP by source adding up", () => {
	const state = finished(2);
	const game = view(state, 1);
	const rows = standings(game);
	assert.equal(rows.length, game.seats.length);
	assert.deepEqual(
		rows.map((row) => [row.seat, row.place, row.vp]),
		game.result.ranking.map((/** @type {any} */ p) => [
			p.seat,
			p.place,
			p.vp,
		])
	);
	for (const row of rows) {
		assert.equal(row.name, game.seats[row.seat - 1].name);
		assert.ok(row.civ.length > 0, 'a civilization name');
		assert.equal(row.winner, row.place === 1);
		assert.equal(
			row.sources.reduce((sum, source) => sum + source.vp, 0),
			row.vp
		);
	}
});

test('VP by source keeps the sources in order, leaves out zeros and names each one', () => {
	const sources = vpBreakdown({
		vpSources: { paid: -4, tapestry: 6, income: 10, map: 0 },
	});
	assert.deepEqual(sources, [
		{ id: 'income', label: 'Income turn scoring', vp: 10 },
		{ id: 'tapestry', label: 'Tapestry effects', vp: 6 },
		{ id: 'paid', label: 'VP paid', vp: -4 },
	]);
	assert.equal(new Set(VP_SOURCES.map((s) => s.id)).size, VP_SOURCES.length);
});

test('a shared victory: both winners, the shared place, the rule note and the tie explained step by step', () => {
	const game = sharedWin();
	const rows = standings(game);
	assert.deepEqual(
		rows.map((row) => [row.name, row.place, row.winner]),
		[
			[game.seats[0].name, 1, true],
			[game.seats[1].name, 1, true],
			[game.seats[2].name, 3, false],
		]
	);
	assert.match(ruleNote(game), /shared victory/);
	const [tie] = tieExplanations(game);
	const [ana, bo] = [game.seats[0].name, game.seats[1].name];
	assert.equal(
		tie.intro,
		`${ana} and ${bo} both finished on 87 VP. Under the current official rules, the tiebreaks decide their order.`
	);
	assert.deepEqual(
		tie.steps.map((step) => [step.title, step.separates]),
		[
			['Tallest landmark in the capital', false],
			['Resources left', false],
		]
	);
	assert.deepEqual(tie.steps[0].values[0], {
		seat: 1,
		name: ana,
		value: 'Fusion Reactor',
		landmark: true,
	});
	assert.equal(tie.steps[1].values[1].value, '2 resources');
	assert.equal(tie.outcome, `${ana} and ${bo} share 1st place.`);
	assert.deepEqual(yourResult(game, 1), {
		title: 'Your result',
		place: 'Shared 1st',
		vp: 87,
		outcome: `You share the victory with ${bo}.`,
	});
	assert.deepEqual(yourResult(game, 3), {
		title: 'Your result',
		place: '3rd',
		vp: 60,
		outcome: `${ana} and ${bo} share the victory.`,
	});
	// At a hot-seat table the view belongs to nobody: the winners instead.
	assert.deepEqual(yourResult(game, null), {
		title: 'The winners',
		place: 'Shared 1st',
		vp: 87,
		outcome: `${ana} and ${bo} share the victory.`,
	});
});

test('a tie the second step splits says so, and who comes first', () => {
	const game = sharedWin();
	game.result.ranking[1].place = 2;
	game.result.ties[0].steps = [
		{
			by: 'tallestLandmark',
			values: [
				{ seat: 1, value: 'fusion-reactor' },
				{ seat: 2, value: null },
			],
		},
	];
	const [tie] = tieExplanations(game);
	assert.equal(tie.steps[0].separates, true);
	assert.equal(tie.steps[0].values[1].value, 'No landmark');
	assert.equal(tie.outcome, `${game.seats[0].name} takes 1st place.`);
	assert.equal(yourResult(game, 1).outcome, 'You won this table.');
	assert.equal(yourResult(game, 1).place, '1st');
	assert.match(ruleNote(game), /tie-break chain/);
});

test('without a tie there is nothing to explain', () => {
	const game = sharedWin();
	game.result.ties = [];
	assert.deepEqual(tieExplanations(game), []);
});

test("the table's facts: rules, mode and players, expansions and variants by name", () => {
	const game = sharedWin();
	game.variants = ['tapestry-draft', 'closest-island'];
	const facts = tableFacts({ mode: 'hotseat', game });
	assert.equal(facts.rules, 'Current official rules');
	assert.equal(facts.mode, `Hot-seat · ${game.seats.length} players`);
	assert.deepEqual(facts.expansions, []);
	assert.equal(facts.variants.length, 2);
	assert.match(facts.variants[0], /tapestry/i);
	assert.equal(
		tableFacts({ mode: 'online', game }).mode.split(' · ')[0],
		'Online'
	);
});

test('the scoreboard during play: players by VP, with their sources and the tiebreak values of the version', () => {
	const game = sharedWin();
	game.phase = 'play';
	game.result = null;
	game.seats[2].vp = 99;
	game.seats[2].vpSources = { map: 99 };
	const rows = scoreboard(game);
	assert.deepEqual(
		rows.map((row) => row.seat),
		[3, 1, 2]
	);
	assert.deepEqual(
		rows.map((row) => row.place),
		[1, 2, 2]
	);
	assert.ok(rows.every((row) => typeof row.resources === 'number'));
	assert.ok(rows.every((row) => 'landmark' in row));
	game.version = 'original';
	assert.ok(scoreboard(game).every((row) => !('landmark' in row)));
});

test("the scoreboard's tiebreak values are the engine's, the landmark by name (#128)", () => {
	const game = sharedWin();
	game.phase = 'play';
	game.result = null;
	game.seats[0].resources = { coin: 2, worker: 1, food: 0, culture: 4 };
	game.seats[0].capital.landmarks = [
		{ landmark: 'lighthouse', row: 0, col: 0, rotation: 0 },
		{ landmark: 'skyscraper', row: 4, col: 0, rotation: 0 },
	];
	const row = /** @type {any} */ (scoreboard(game).find((r) => r.seat === 1));
	const values = tiebreakValues(game.seats[0]);
	assert.equal(values.tallestLandmark, 'skyscraper');
	assert.equal(row.landmark, 'Skyscraper');
	assert.equal(row.resources, values.resources);
	assert.equal(row.resources, 7);
});
