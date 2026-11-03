// How many options a slot pick can put in the decision panel at its worst, at 5 players (#172).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { promptFor, shelfCards, shelfFace } from '../src/lib/prompts.js';
import { tabFor } from '../src/lib/area/tabs.js';
import { TECH_CARDS } from '../src/lib/engine/data/tech-cards.js';
import { TAPESTRY_CARDS } from '../src/lib/engine/data/tapestry-cards.js';
import { LANDMARKS } from '../src/lib/engine/data/landmarks.js';

/** The most options the panel may list for a slot pick; a longer choice is made where the thing is. */
const PANEL_MAX = 8;

const TRACKS = ['exploration', 'science', 'technology', 'military'];
const tech = TECH_CARDS.map((c) => c.id);
const tapestry = TAPESTRY_CARDS.map((c) => c.id);
const landmarks = LANDMARKS.map((l) => l.id);

/**
 * `count` slots from `make`, numbered from 0.
 * @param {number} count
 * @param {(i: number) => any} make
 */
const many = (count, make) => Array.from({ length: count }, (_, i) => make(i));

/**
 * Each slot purpose's worst case at 5 players, read from its option builder: the options it can offer at most.
 * @type {Record<string, any[]>}
 */
const WORST = {
	// Every player's bottom and middle tech cards, 4 in a row (inventors.js).
	inventors: many(40, (i) => ({
		player: 1 + (i % 5),
		card: tech[i % tech.length],
	})),
	// Every played tapestry card of the others, 4 each, or the hand (heralds.js).
	heralds: many(20, (i) => ({
		player: 2 + (i % 4),
		card: tapestry[i % tapestry.length],
	})),
	// Two neighbours, up to 10 played cards or 8 tech cards each (spies.js).
	spiesCard: many(20, (i) => ({
		player: 2 + (i % 2),
		card: tapestry[i],
	})),
	spiesTech: many(16, (i) => ({
		player: 2 + (i % 2),
		card: tech[i],
		icon: 'circle',
	})),
	// Two neighbours' territory tiles, held and gained (spies.js).
	spiesTile: many(18, (i) => ({
		player: 2 + (i % 2),
		stack: 'territory',
		tile: i + 1,
	})),
	// Two neighbours' tokens on 4 tracks (spies.js).
	spiesSpace: many(16, (i) => ({
		player: 2 + (i % 2),
		track: TRACKS[i % 4],
		space: 1 + i,
	})),
	// The territory tiles in hand (historians.js).
	historiansTile: many(8, (i) => i + 1),
	// A token per track and option (tinkerers.js).
	tinkerers: many(8, (i) => ({
		track: TRACKS[i % 4],
		from: 1 + i,
		to: 2 + i,
	})),
	tinkerersPayBack: many(8, (i) => ({ track: TRACKS[i % 4], space: 1 + i })),
	// The listed landmarks, and a token move per landmark (utilitarians.js).
	utilitariansPlace: landmarks.slice(0, 8),
	utilitariansLandmark: landmarks.slice(0, 4),
	utilitariansToken: many(8, (i) => ({
		landmark: landmarks[i],
		from: null,
	})),
	// The treasures of one territory (treasure-hunters.js).
	treasureHunters: ['forest', 'island', 'mountain'],
	// Every explored hex they may place on, lit on the map (traders.js).
	traders: many(32, (i) => `${i}_0`),
};

/**
 * Choices the panel still lists in a long list, waiting for the owner's decision on where they are made (#172).
 * Each must still be over the limit; take a purpose out of this list when its pick moves.
 */
const PENDING = /** @type {string[]} */ ([]);

/**
 * The options a slot pick lists in the panel itself, a decline apart.
 * @param {string} purpose
 * @param {any[]} slots
 */
function panelCount(purpose, slots) {
	const decision = {
		id: 1,
		kind: 'chooseSlot',
		player: 1,
		purpose,
		optional: true,
		options: slots,
		answers: [...slots.map((slot) => ({ slot })), { decline: true }],
	};
	const prompt = promptFor(decision, { seats: [], hexes: {} }, 1);
	assert.ok(prompt, purpose);
	return prompt.options.filter(
		(o, i) => o.place === 'panel' && i < slots.length
	).length;
}

for (const [purpose, slots] of Object.entries(WORST)) {
	if (PENDING.includes(purpose)) {
		continue;
	}
	test(`${purpose}: at most ${PANEL_MAX} options in the panel at its worst (#172)`, () => {
		assert.ok(panelCount(purpose, slots) <= PANEL_MAX);
	});
}

test('the choices waiting for a decision are still over the limit (#172)', () => {
	for (const purpose of PENDING) {
		assert.ok(panelCount(purpose, WORST[purpose]) > PANEL_MAX, purpose);
	}
});

test('every slot pick of the worst cases shows art on its panel options (#172)', () => {
	for (const [purpose, slots] of Object.entries(WORST)) {
		const decision = {
			id: 1,
			kind: 'chooseSlot',
			player: 1,
			purpose,
			options: slots,
			answers: slots.map((slot) => ({ slot })),
		};
		const prompt = promptFor(decision, { seats: [], hexes: {} }, 1);
		for (const option of prompt?.options ?? []) {
			if (option.place === 'panel') {
				assert.ok(option.art.length > 0, `${purpose} #${option.index}`);
			}
		}
	}
});

test("the Spies' tiles stand on a tile shelf, territory and space tiles with their art (#172)", () => {
	const slots = WORST.spiesTile;
	const decision = {
		id: 1,
		kind: 'chooseSlot',
		player: 1,
		purpose: 'spiesTile',
		options: slots,
		answers: slots.map((slot) => ({ slot })),
	};
	const prompt = promptFor(decision, { seats: [] }, 1);
	assert.equal(prompt?.shelf, 'tile');
	assert.ok(prompt?.options.every((o) => o.place === 'shelf'));
	const cards = shelfCards(prompt, decision);
	assert.equal(cards.length, 18);
	assert.deepEqual(cards[0].face, { tile: 'territory', id: 1 });
	assert.deepEqual(shelfFace('tile', 'space:3'), { tile: 'space', id: 3 });
});

test("the Spies' space pick is made on lit spaces of the tracks, one per distinct space (#172)", () => {
	const slots = [
		{ player: 2, track: 'science', space: 4 },
		{ player: 3, track: 'science', space: 4 },
		{ player: 2, track: 'military', space: 6 },
	];
	const decision = {
		id: 1,
		kind: 'chooseSlot',
		player: 1,
		purpose: 'spiesSpace',
		options: slots,
		answers: slots.map((slot) => ({ slot })),
	};
	const prompt = promptFor(decision, { seats: [] }, 1);
	assert.equal(prompt?.layout, 'track');
	assert.deepEqual(prompt?.trackSpaces, [
		{ track: 'science', space: 4 },
		{ track: 'military', space: 6 },
	]);
	assert.deepEqual(
		prompt?.options.map((o) => [o.place, o.spot]),
		[
			['track', 'science:4'],
			['track', 'science:4'],
			['track', 'military:6'],
		]
	);
	assert.equal(tabFor(decision), null);
});
