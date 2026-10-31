// Plans & Ploys in the client (#32): the landmark cards' words and faces, the draft and placing prompts, the Civ tab's
// card and goal line, the new space tiles' art and words, and the log.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { landmarkCardData } from '../src/lib/cards/game-cards.js';
import { landmarkCondition } from '../src/lib/cards/landmark-text.js';
import { heldLandmarkCard } from '../src/lib/area/landmark-card.js';
import { spaceTileArt, terrainView } from '../src/lib/area/terrain.js';
import { decisionTitle, describeAnswer } from '../src/lib/decision-words.js';
import { kindFacts } from '../src/lib/decision-kinds.js';
import { placingCard, promptFor, shelfFace } from '../src/lib/prompts.js';
import { eventText } from '../src/lib/log.js';
import { LANDMARK_CARDS } from '../src/lib/engine/data/landmark-cards.js';
import { FOOTPRINTS } from '../src/lib/art/footprints.js';

const TABLE = { seats: [{ name: 'Ana' }, { name: 'Bo' }, { name: 'Cy' }] };

/** A seat of a view holding a landmark card, with nothing towards its goal. */
const seatWith = (/** @type {string} */ card, gained = false) => ({
	seat: 1,
	landmarkCard: { card, gained },
	tech: { bottom: [], middle: [], top: [] },
	capital: { mat: 1, buildings: [], landmarks: [], cubes: [] },
	territoryTiles: [],
});

test('each Plans & Ploys landmark card finishes the card\'s line "Gain this landmark when you …"', () => {
	assert.deepEqual(
		LANDMARK_CARDS.map((card) => landmarkCondition(card.id)),
		[
			'have at least 1 tech card in your top row.',
			'have at least 3 income buildings of the same type in your capital city.',
			'have at least 2 complete districts in your capital city.',
			'have at least 1 complete row or column in your capital city.',
			'have at least 6 territory tiles in your supply.',
		]
	);
});

test('a landmark card face has its name, art, footprint, edition and goal', () => {
	assert.deepEqual(landmarkCardData('skyscraper'), {
		id: 'skyscraper',
		title: 'Skyscraper',
		artwork: '/art/landmark-card/skyscraper.svg',
		footprint: FOOTPRINTS.skyscraper,
		edition: 'pp',
		condition:
			'have at least 1 complete row or column in your capital city.',
	});
	for (const card of LANDMARK_CARDS) {
		assert.ok(
			existsSync(
				new URL(
					`../static/art/landmark-card/${card.id}.svg`,
					import.meta.url
				)
			),
			card.id
		);
	}
});

test('the Civ tab says how far the goal is, then that it is met, then gained', () => {
	const seat = seatWith('urban-farm');
	seat.territoryTiles = [1, 2];
	assert.deepEqual(heldLandmarkCard(seat, true), {
		data: landmarkCardData('urban-farm'),
		state: 'open',
		line: 'Not met yet: 2 of 6 territory tiles in the supply',
	});
	seat.territoryTiles = [1, 2, 3, 4, 5, 6];
	const met = heldLandmarkCard(seat, true);
	assert.equal(met?.state, 'met');
	assert.equal(
		met?.line,
		'Met: you gain the Urban Farm at the end of your turn'
	);
	assert.equal(
		heldLandmarkCard(seat, false)?.line,
		'Met: its landmark comes at the end of their turn'
	);
	const gained = heldLandmarkCard(seatWith('urban-farm', true), true);
	assert.equal(gained?.state, 'gained');
	assert.equal(gained?.line, 'Gained: the Urban Farm is yours');
	assert.equal(
		heldLandmarkCard(seatWith('urban-farm', true), false)?.line,
		'Gained: the Urban Farm is theirs'
	);
	assert.equal(heldLandmarkCard({ ...seat, landmarkCard: null }, true), null);
	assert.equal(
		heldLandmarkCard({ ...seat, landmarkCard: undefined }, true),
		null
	);
});

test('the goal line counts in the singular for a goal of one', () => {
	assert.equal(
		heldLandmarkCard(seatWith('skyscraper'), true)?.line,
		'Not met yet: 0 of 1 complete row or column'
	);
	assert.equal(
		heldLandmarkCard(seatWith('game-store'), true)?.line,
		'Not met yet: 0 of 1 tech card in the top row'
	);
});

test('the draft is a shelf of landmark cards, kept with Keep card', () => {
	assert.deepEqual(kindFacts('chooseLandmarkCard'), {
		shelf: 'landmark',
		tab: null,
		confirm: 'Keep card',
		art: null,
	});
	assert.deepEqual(
		shelfFace('landmark', 'tv-station'),
		landmarkCardData('tv-station')
	);
	const decision = {
		id: 4,
		player: 2,
		kind: 'chooseLandmarkCard',
		options: ['skyscraper', 'tv-station', 'urban-farm'],
		drafters: [1, 3],
		answers: [
			{ card: 'skyscraper' },
			{ card: 'tv-station' },
			{ card: 'urban-farm' },
		],
	};
	assert.equal(decisionTitle(decision, TABLE), 'Keep a landmark card');
	assert.equal(
		describeAnswer(decision, { card: 'skyscraper' }, TABLE),
		'Keep Skyscraper: Ana and Cy keep the other two'
	);
	const prompt = promptFor(decision, TABLE, 2);
	assert.equal(prompt?.shelf, 'landmark');
	assert.equal(prompt?.confirmLabel, 'Keep card');
	assert.equal(
		prompt?.instruction,
		'Choose the card to keep, then confirm it here. Ana keeps one of the other two, and Cy the last.'
	);
});

test('the draft names who gets the rest, at two players and alone', () => {
	const two = {
		kind: 'chooseLandmarkCard',
		options: ['skyscraper', 'tv-station'],
		drafters: [1],
		answers: [{ card: 'skyscraper' }, { card: 'tv-station' }],
	};
	assert.equal(
		describeAnswer(two, { card: 'tv-station' }, TABLE),
		'Keep TV Station: Ana gets the other'
	);
	assert.equal(
		promptFor(two, TABLE, 2)?.instruction,
		'Choose the card to keep, then confirm it here. Ana gets the other.'
	);
	const alone = { ...two, drafters: [] };
	assert.equal(
		describeAnswer(alone, { card: 'tv-station' }, TABLE),
		'Keep TV Station: the other goes back under the landmark deck'
	);
});

test("a card landmark's placing prompt says the card's goal is met", () => {
	const decision = {
		id: 9,
		player: 1,
		kind: 'choosePlacement',
		landmark: 'skyscraper',
		source: { landmarkCard: 'skyscraper' },
		answers: [{ row: 0, col: 0, rotation: 0 }],
	};
	assert.equal(
		promptFor(decision, TABLE, 1)?.instruction,
		"Your Skyscraper card's goal is met: at least 1 complete row or column. Place the landmark in your capital: drag it, turn it with the . and , keys, then confirm."
	);
});

test('the placing prompt shows the card whose goal brought the landmark, and no card for another landmark', () => {
	assert.deepEqual(
		placingCard({
			kind: 'choosePlacement',
			landmark: 'skyscraper',
			source: { landmarkCard: 'skyscraper' },
		}),
		landmarkCardData('skyscraper')
	);
	assert.equal(
		placingCard({ kind: 'choosePlacement', landmark: 'lighthouse' }),
		null
	);
	assert.equal(placingCard(null), null);
});

test('the new space tiles draw their own art and say what they do', () => {
	assert.equal(spaceTileArt(3), 'space-tile/3');
	assert.equal(spaceTileArt(16), 'space-tile/technology-5-vp');
	assert.equal(spaceTileArt(19), 'space-tile/monolith');
	for (const id of [16, 17, 18, 19]) {
		assert.ok(
			existsSync(
				new URL(
					`../static/${spaceTileArt(id).replace('space-tile', 'art/space-tile')}.svg`,
					import.meta.url
				)
			),
			String(id)
		);
	}
	assert.deepEqual(
		terrainView({
			territoryTiles: [],
			spaceTiles: [16],
			exploredSpace: [3],
		}).space,
		[
			{ id: 16, explored: false, art: 'space-tile/technology-5-vp' },
			{ id: 3, explored: true, art: 'space-tile/3' },
		]
	);
	const choose = { kind: 'chooseSpaceTile', options: [17, 19] };
	assert.equal(
		describeAnswer(choose, { tile: 17 }, TABLE),
		'Space tile 17: whenever you advance on the science track, gain 5 VP'
	);
	assert.equal(
		describeAnswer(choose, { tile: 19 }, TABLE),
		'Space tile 19: gain the Monolith landmark'
	);
});

test('the log tells the draft and the goal, never another player the cards offered', () => {
	assert.equal(
		eventText(
			{
				type: 'landmarkCardsDrawn',
				player: 2,
				count: 3,
				secret: { landmarkCards: ['skyscraper'] },
			},
			TABLE
		),
		'Bo drew 3 landmark cards.'
	);
	assert.equal(
		eventText(
			{
				type: 'landmarkCardKept',
				player: 2,
				card: 'skyscraper',
				auto: false,
			},
			TABLE
		),
		'Bo kept the Skyscraper landmark card.'
	);
	assert.equal(
		eventText(
			{
				type: 'landmarkCardKept',
				player: 3,
				card: 'urban-farm',
				auto: true,
			},
			TABLE
		),
		'Cy kept the last landmark card, the Urban Farm.'
	);
	assert.equal(
		eventText(
			{ type: 'landmarkCardGoalMet', player: 1, card: 'tv-station' },
			TABLE
		),
		"Ana met the TV Station card's goal: at least 3 income buildings of one type in the capital."
	);
});
