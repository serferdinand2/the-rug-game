// Official bot landmark boxes, distinct gains and shared achievement claims (#31).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { answerDefaults, newGame, resolveTapestry } from './helpers/engine.mjs';
import { createBotSeat } from '../src/lib/engine/state.js';
import { contextFor, run } from '../src/lib/engine/loop.js';
import { moveToken } from '../src/lib/engine/movement.js';
import {
	claimAchievement,
	checkToppleTwo,
	toppledBy,
} from '../src/lib/engine/achievements.js';
import { countVp, landmarksOwned, vp } from '../src/lib/engine/effects/vp.js';
import { ALL_LANDMARKS } from '../src/lib/engine/data/landmarks.js';

const tracks = ['exploration', 'science', 'technology', 'military'];

function fixture(solo = true) {
	const { state, random } = newGame(solo ? 1 : 2);
	state.pending.length = 0;
	state.seats[0].civs = [];
	if (solo) {
		state.seats.push(createBotSeat(2, 'automa', 'Automa', tracks, 8));
	}
	state.seats.push(createBotSeat(3, 'shadow', 'Shadow Empire', tracks, 10));
	return { state, random, ctx: contextFor(state, random, state.pending) };
}

function crossLandmark({ state, random, ctx }, player, track = 'exploration') {
	state.seats[player - 1].tracks[track] = [3];
	moveToken(ctx, player, {
		track,
		from: 3,
		to: 4,
		benefit: false,
		noBonus: true,
	});
	run(state, random);
}

test('each bot starts with an independent landmark box and no human placement fields', () => {
	const { state } = fixture();
	assert.deepEqual(state.seats[1].landmarks, []);
	assert.deepEqual(state.seats[2].landmarks, []);
	state.seats[1].landmarks.push('lighthouse');
	assert.deepEqual(state.seats[2].landmarks, []);
	for (const bot of state.seats.slice(1)) {
		assert.equal(Object.hasOwn(bot, 'capital'), false);
		assert.equal(Object.hasOwn(bot, 'besideMat'), false);
	}
});

test('Automa gains a track landmark in its box without a placement choice and can score it', () => {
	const game = fixture();
	crossLandmark(game, 2);
	assert.equal(game.state.landmarks.includes('lighthouse'), false);
	assert.deepEqual(landmarksOwned(game.state, 2), ['lighthouse']);
	assert.equal(countVp(game.state, 2, 'landmark'), 1);
	vp(game.ctx, 2, { per: 'landmark', each: 3 }, { origin: 'civ' });
	assert.equal(game.state.seats[1].vp, 3);
	assert.deepEqual(game.state.seats[1].vpSources, { civ: 3 });
	assert.deepEqual(game.state.pending, []);
	assert.ok(
		game.state.events.some(
			(event) =>
				event.type === 'landmarkGained' &&
				event.player === 2 &&
				event.landmark === 'lighthouse'
		)
	);
	assert.ok(
		game.state.events.some(
			(event) =>
				event.type === 'landmarkPlaced' &&
				event.player === 2 &&
				event.owner === 2 &&
				event.landmark === 'lighthouse' &&
				event.box === true &&
				event.automatic === true
		)
	);
});

test('solo Shadow acquisition belongs to Automa but its Historians gain stays distinct', () => {
	const game = fixture();
	const human = game.state.seats[0];
	human.civs = ['historians'];
	human.civData.historians = {
		squares: [false, true, true, true],
		given: { 3: 1 },
	};
	crossLandmark(game, 2);
	assert.equal(human.vp, 0);
	crossLandmark(game, 3, 'science');
	assert.equal(human.vp, 3);
	assert.deepEqual(landmarksOwned(game.state, 2), [
		'lighthouse',
		'apothecary',
	]);
	assert.deepEqual(landmarksOwned(game.state, 3), []);
	assert.equal(countVp(game.state, 2, 'landmark'), 2);
	assert.equal(countVp(game.state, 3, 'landmark'), 0);
	const gains = game.state.events.filter(
		(event) => event.type === 'landmarkGained'
	);
	assert.deepEqual(
		gains.map(({ player, landmark }) => [player, landmark]),
		[
			[2, 'lighthouse'],
			[3, 'apothecary'],
		]
	);
	assert.ok(
		game.state.events.some(
			(event) =>
				event.type === 'landmarkPlaced' &&
				event.player === 3 &&
				event.owner === 2 &&
				event.landmark === 'apothecary' &&
				event.box === true
		)
	);
	assert.deepEqual(game.state.pending, []);
});

test('standalone Shadow keeps its own landmark box and gains no VP', () => {
	const game = fixture(false);
	game.state.seats[1].civs = [];
	crossLandmark(game, 3);
	assert.deepEqual(landmarksOwned(game.state, 3), ['lighthouse']);
	assert.equal(countVp(game.state, 3, 'landmark'), 1);
	assert.equal(game.state.seats[2].vp, 0);
	assert.ok(
		game.state.events.some(
			(event) =>
				event.type === 'landmarkPlaced' &&
				event.player === 3 &&
				event.owner === 3
		)
	);
});

test('Shadow track completion occupies the first shared box for zero VP and leaves the second for Automa', () => {
	const game = fixture();
	game.state.seats[2].tracks.science = [11];
	moveToken(game.ctx, 3, {
		track: 'science',
		from: 11,
		to: 12,
		benefit: false,
		noBonus: true,
	});
	run(game.state, game.random);
	claimAchievement(game.ctx, 3, 'complete-track');
	assert.deepEqual(game.state.achievements['complete-track'], [3]);
	assert.equal(game.state.seats[2].vp, 0);
	assert.deepEqual(game.state.seats[2].vpSources, {});
	assert.equal(
		game.state.events.some(
			(event) => event.type === 'vpGained' && event.player === 3
		),
		false
	);
	claimAchievement(game.ctx, 2, 'complete-track');
	claimAchievement(game.ctx, 1, 'complete-track');
	assert.deepEqual(game.state.achievements['complete-track'], [3, 2]);
	assert.equal(game.state.seats[1].vp, 5);
	assert.deepEqual(game.state.seats[1].vpSources, { achievements: 5 });
	assert.deepEqual(
		game.state.events
			.filter((event) => event.type === 'achievementClaimed')
			.map(({ player, vp }) => [player, vp]),
		[
			[3, 0],
			[2, 5],
		]
	);
});

test('Shadow ignores other achievements and every bot still obeys finished/once-only claims', () => {
	const game = fixture();
	claimAchievement(game.ctx, 3, 'middle-island');
	claimAchievement(game.ctx, 3, 'topple-two');
	assert.deepEqual(game.state.achievements['middle-island'], []);
	assert.deepEqual(game.state.achievements['topple-two'], []);
	game.state.seats[2].finished = true;
	claimAchievement(game.ctx, 3, 'complete-track');
	assert.deepEqual(game.state.achievements['complete-track'], []);
	claimAchievement(game.ctx, 2, 'middle-island');
	claimAchievement(game.ctx, 2, 'middle-island');
	assert.deepEqual(game.state.achievements['middle-island'], [2]);
	assert.equal(game.state.seats[1].vp, 10);
	game.state.seats[1].finished = true;
	claimAchievement(game.ctx, 2, 'complete-track');
	assert.deepEqual(game.state.achievements['complete-track'], []);
});

test('Automa topple-two counts only human outposts personally toppled and still toppled', () => {
	const game = fixture();
	for (const hex of Object.values(game.state.hexes)) {
		hex.outposts.length = 0;
	}
	game.state.hexes['0_0'].outposts.push(
		{ seat: 1, toppled: true, toppledBy: 2 },
		{ seat: 3, toppled: true, toppledBy: 2 },
		{ seat: 1, toppled: true, toppledBy: 3 },
		{ seat: 1, toppled: false, toppledBy: 2 },
		{
			seat: 1,
			toppled: true,
			toppledBy: 2,
			piece: { landmark: 'lighthouse' },
		}
	);
	assert.equal(toppledBy(game.state, 2), 1);
	checkToppleTwo(game.ctx, 2);
	assert.deepEqual(game.state.achievements['topple-two'], []);
	game.state.hexes['0_0'].outposts.push({
		seat: 1,
		toppled: true,
		toppledBy: 2,
	});
	checkToppleTwo(game.ctx, 2);
	assert.deepEqual(game.state.achievements['topple-two'], [2]);
	assert.equal(game.state.seats[1].vp, 10);
});

test('the Automa topple restriction does not remove human credit for toppling bot outposts', () => {
	const game = fixture();
	for (const hex of Object.values(game.state.hexes)) {
		hex.outposts.length = 0;
	}
	game.state.hexes['0_0'].outposts.push(
		{ seat: 2, toppled: true, toppledBy: 1 },
		{ seat: 3, toppled: true, toppledBy: 1 }
	);
	assert.equal(toppledBy(game.state, 1), 2);
	checkToppleTwo(game.ctx, 1);
	assert.deepEqual(game.state.achievements['topple-two'], [1]);
});

for (const [humanCount, resources, points] of [
	[1, 2, 0],
	[2, 1, 6],
	[3, 0, 12],
]) {
	test(`Age of Wonders compares solo human's ${humanCount} landmarks against the combined bot box once`, () => {
		const game = fixture();
		crossLandmark(game, 2);
		crossLandmark(game, 3, 'science');
		game.state.seats[0].besideMat = ALL_LANDMARKS.filter(
			({ id }) => !['lighthouse', 'apothecary'].includes(id)
		)
			.slice(0, humanCount)
			.map(({ id }) => id);
		const next = answerDefaults(
			resolveTapestry(game.state, game.random, 1, 'age-of-wonders'),
			game.random
		);
		assert.equal(next.seats[0].vp, points);
		assert.equal(
			Object.values(next.seats[0].resources).reduce(
				(sum, value) => sum + value,
				0
			),
			resources
		);
		assert.deepEqual(landmarksOwned(next, 2), ['lighthouse', 'apothecary']);
		assert.deepEqual(landmarksOwned(next, 3), []);
	});
}

for (const [shadowCount, resources, points] of [
	[2, 1, 6],
	[1, 1, 6],
	[0, 0, 12],
]) {
	test(`Age of Wonders keeps standalone Shadow's ${shadowCount} landmarks as a separate opponent`, () => {
		const game = fixture(false);
		game.state.seats[1].civs = [];
		game.state.seats[0].besideMat = ['forge'];
		game.state.seats[2].landmarks = ['lighthouse', 'apothecary'].slice(
			0,
			shadowCount
		);
		const next = answerDefaults(
			resolveTapestry(game.state, game.random, 1, 'age-of-wonders'),
			game.random
		);
		assert.equal(next.seats[0].vp, points);
		assert.equal(
			Object.values(next.seats[0].resources).reduce(
				(sum, value) => sum + value,
				0
			),
			resources
		);
	});
}
