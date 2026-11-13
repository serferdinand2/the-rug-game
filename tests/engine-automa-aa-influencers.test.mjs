// Influencers' choice, income ordering and tied-track condition (#38).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
	askInfluencersTrendy,
	botInfluencersChoose,
	botInfluencersConditional,
	botInfluencersIncome,
	botInfluencersSetTrendy,
} from '../src/lib/engine/automa-expansion-aa.js';

function context(positions = [0, 0, 0, 0], trendy = 'exploration') {
	const tracks = ['exploration', 'science', 'technology', 'military'];
	const human = {
		seat: 1,
		kind: 'player',
		tracks: Object.fromEntries(
			tracks.map((track, i) => [track, [positions[i]]])
		),
		restartedTracks: [],
	};
	const automa = {
		seat: 2,
		kind: 'automa',
		trendyTrack: trendy,
		incomePair: { trackCard: 1, tiebreakerCard: 2 },
	};
	const shadow = { seat: 3, kind: 'shadow' };
	const state = {
		seats: [human, automa, shadow],
		expansions: ['aa'],
		variants: ['no-arts-track'],
		events: [],
		seq: 0,
	};
	const queued = [];
	const ctx = { state, random: () => 0, push: (ops) => queued.push(...ops) };
	return { ctx, automa, queued };
}

test('Influencers setup offers the human every track; subsequent picks exclude the old Trendy track', () => {
	const { ctx, automa, queued } = context();
	askInfluencersTrendy(ctx, 2, true);
	assert.equal(queued[0].kind, 'chooseTrack');
	assert.equal(queued[0].player, 1);
	assert.equal(queued[0].then.bot, 2);
	assert.deepEqual(queued[0].options, [
		'exploration',
		'science',
		'technology',
		'military',
	]);
	botInfluencersSetTrendy(ctx, { bot: 2, track: 'science' });
	assert.equal(automa.trendyTrack, 'science');
	queued.length = 0;
	botInfluencersChoose(ctx, { player: 2 });
	assert.deepEqual(queued[0].options, [
		'exploration',
		'technology',
		'military',
	]);
});

test('Influencers income rolls first, evaluates the condition, then asks for the next track', () => {
	const { ctx, queued } = context();
	botInfluencersIncome(ctx, { player: 2 });
	assert.deepEqual(
		queued.map((op) => op.kind),
		['botResearch', 'botInfluencersConditional', 'botInfluencersChoose']
	);
	assert.equal(queued[0].benefit, false);
});

test('a tied or trailing Trendy track triggers both extra rolls; strictly ahead does not', () => {
	for (const positions of [
		[3, 3, 1, 0],
		[2, 4, 1, 0],
	]) {
		const { ctx, queued } = context(positions);
		botInfluencersConditional(ctx, { player: 2 });
		assert.deepEqual(
			queued.map(({ player, kind, benefit }) => ({
				player,
				kind,
				benefit,
			})),
			[
				{ player: 2, kind: 'botResearch', benefit: true },
				{ player: 3, kind: 'botResearch', benefit: false },
			]
		);
	}
	const { ctx, queued } = context([4, 3, 2, 1]);
	botInfluencersConditional(ctx, { player: 2 });
	assert.deepEqual(queued, []);
});
