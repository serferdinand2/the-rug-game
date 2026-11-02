// The decisions' titles and answers in words (#26, #126): what the decision panel asks and offers.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { decisionTitle, describeAnswer } from '../src/lib/decision-words.js';
import { describeEffects, describePayment } from '../src/lib/describe.js';
import { createGame, play, VARIANTS, view } from '../src/lib/engine/game.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { openDecisions } from '../src/lib/engine/stack.js';
import { seededRandom } from '../src/lib/engine/random.js';
import { allOps } from './helpers/views.mjs';
import { assertReadable } from './helpers/readable.mjs';

test('payments read as what is paid and discarded', () => {
	assert.equal(
		describePayment({ food: 1, worker: 1 }),
		'Pay 1 food and 1 worker'
	);
	assert.equal(describePayment({}), 'Pay nothing');
	assert.equal(
		describePayment({ coin: 1, tapestry: ['democracy', 'trap-3'] }),
		'Pay 1 coin and discard Democracy and Trap'
	);
	assert.equal(
		describePayment({ territory: [17, 3] }),
		'Discard territory tiles 17 and 3'
	);
	assert.equal(
		describePayment({ tech: ['clocks', 'radio', 'paper'] }),
		'Discard Clocks, Radio and Paper'
	);
	const bonus = {
		id: 7,
		batch: 1,
		player: 1,
		kind: 'chooseBonus',
		track: 'exploration',
		space: 5,
		cost: { any: 1 },
		gain: [{ building: 'farm' }],
	};
	assert.equal(
		describeAnswer(bonus, { pay: { food: 1, worker: 1 } }),
		'Pay 1 food and 1 worker'
	);
	assert.equal(describeAnswer(bonus, { pay: null }), 'No bonus');
	assert.equal(decisionTitle(bonus), 'Take the bonus: gain a Farm?');
	const advance = { id: 8, batch: 1, player: 1, kind: 'chooseAdvance' };
	assert.equal(
		describeAnswer(advance, {
			track: 'exploration',
			from: 4,
			pay: { food: 1, culture: 1 },
		}),
		'Advance to Ships and pay 1 food and 1 culture'
	);
});

test('places in the capital and on the map read as rows, columns and hexes', () => {
	const landmark = {
		id: 1,
		batch: 1,
		player: 1,
		kind: 'choosePlacement',
		landmark: 'lighthouse',
	};
	assert.equal(
		describeAnswer(landmark, { row: 2, col: 4, rotation: 1 }),
		'Row 3, column 5, turned once'
	);
	assert.equal(
		describeAnswer(landmark, { row: 2, col: 4, rotation: 2 }),
		'Row 3, column 5, turned twice'
	);
	assert.equal(
		describeAnswer(landmark, { row: 0, col: 0, rotation: 0 }),
		'Row 1, column 1'
	);
	assert.equal(decisionTitle(landmark), 'Where does the Lighthouse go?');
	const farm = { ...landmark, landmark: undefined, building: 'farm' };
	delete farm.landmark;
	assert.equal(describeAnswer(farm, { row: 8, col: 8 }), 'Row 9, column 9');
	assert.equal(
		describeAnswer(farm, { besideMat: true }),
		'Beside your capital mat'
	);
	assert.equal(decisionTitle(farm), 'Where does the Farm go?');
	const explore = { id: 2, batch: 1, player: 1, kind: 'chooseExplore' };
	assert.equal(
		describeAnswer(explore, { tile: 17, hex: '2_-1', orient: 2 }),
		'Hex 2,−1 with tile 17, turned twice'
	);
	assert.equal(
		describeAnswer(explore, { tile: 17, hex: '0_3', orient: 0 }),
		'Hex 0,3 with tile 17'
	);
});

test("the attacker's counter names the trapper and the card (#33)", () => {
	const game = { seats: [{ name: 'Ana' }, { name: 'Bo' }] };
	const decision = {
		id: 4,
		batch: 1,
		player: 2,
		kind: 'chooseCounter',
		defender: 1,
		hex: '1_2',
	};
	assert.equal(
		decisionTitle(decision, /** @type {any} */ (game)),
		"Counter Ana's trap?"
	);
	assert.equal(
		describeAnswer(decision, { card: 'double-cross' }),
		'Play Double Cross'
	);
	assert.equal(describeAnswer(decision, { card: null }), "Don't counter");
});

test('answers name seats, cards and resources', () => {
	const game = { seats: [{ name: 'Ana' }, { name: 'Bo' }] };
	const gift = { id: 1, batch: 1, player: 1, kind: 'chooseGift' };
	assert.equal(
		describeAnswer(
			gift,
			{ tile: 12, player: 2 },
			/** @type {any} */ (game)
		),
		'Give tile 12 to Bo'
	);
	assert.equal(
		describeAnswer(
			{ id: 2, batch: 1, player: 1, kind: 'chooseResource', count: 2 },
			{ resources: { coin: 1, food: 1 } }
		),
		'Gain 1 coin and 1 food'
	);
	assert.equal(
		describeAnswer(
			{ id: 3, batch: 1, player: 1, kind: 'chooseCiv', options: [] },
			{ civ: 'the-chosen' }
		),
		'The Chosen'
	);
	assert.equal(
		describeAnswer(
			{ id: 4, batch: 1, player: 1, kind: 'chooseTurn' },
			{ turn: 'income' }
		),
		'Take income'
	);
	assert.equal(
		describeAnswer(
			{ id: 5, batch: 1, player: 1, kind: 'chooseInvent' },
			{ card: 'deck' }
		),
		'The top card of the deck'
	);
	assert.equal(
		describeAnswer(
			{ id: 6, batch: 1, player: 1, kind: 'chooseTapestry' },
			{ card: 'age-of-sail' }
		),
		'Age of Sail'
	);
	// The Riverfolk gained mid-game (#33).
	const riverfolk = {
		id: 7,
		batch: 1,
		player: 1,
		kind: 'chooseOption',
		purpose: 'civOffer',
		options: [[], [{ discardCiv: { civ: 'riverfolk' } }, { gainCiv: {} }]],
	};
	assert.equal(decisionTitle(riverfolk), 'Use your civilization?');
	assert.deepEqual(
		[0, 1].map((option) => describeAnswer(riverfolk, { option })),
		[
			'Decline',
			'Discard the Riverfolk, then draw another civilization from the deck',
		]
	);
});

test("the Recyclers' keep, discard pile and recycle read as what they do (#33)", () => {
	const keep = {
		id: 1,
		batch: 1,
		player: 1,
		kind: 'chooseKeepTech',
		options: ['bakery', 'barn'],
	};
	assert.equal(decisionTitle(keep), 'Choose a tech card to keep');
	assert.equal(describeAnswer(keep, { card: 'barn' }), 'Keep Barn');
	const invent = { id: 2, batch: 1, player: 1, kind: 'chooseInvent' };
	assert.equal(
		describeAnswer(invent, { card: 'barn', from: 'discard' }),
		'Barn, from the discard pile'
	);
	assert.equal(describeAnswer(invent, { card: 'barn' }), 'Barn');
	const game = {
		seats: [
			{
				name: 'Ana',
				tech: { bottom: ['bakery'], middle: [], top: ['com-tower'] },
			},
		],
	};
	const upgrade = {
		id: 3,
		batch: 1,
		player: 1,
		kind: 'chooseUpgrade',
		optional: true,
	};
	assert.deepEqual(
		[{ card: 'bakery' }, { card: 'com-tower' }].map((a) =>
			describeAnswer(upgrade, a, /** @type {any} */ (game))
		),
		[
			'Bakery, to the middle row',
			'Com Tower, back to the bottom row for 5 VP',
		]
	);
	assert.equal(decisionTitle(upgrade), 'Upgrade a tech card?');
	// The card just invented (Steam Tycoon, Technocracy, Engineering), or a recycle.
	assert.equal(
		decisionTitle({ ...upgrade, optional: false, only: 'bakery' }),
		'Upgrade Bakery, or recycle a top-row card'
	);
});

test("the Aliens' choice, its payment and the tile for their mat read as what they do (#33)", () => {
	const choice = {
		id: 1,
		batch: 1,
		player: 1,
		kind: 'chooseOption',
		purpose: 'aliens',
		options: [
			[{ pay: { any: 1 } }, { exploreSpace: { civ: 'aliens' } }],
			[{ gain: { any: 1 } }],
		],
	};
	assert.equal(
		decisionTitle(choice),
		'Explore a space tile onto your Aliens mat, or gain a resource'
	);
	assert.deepEqual(
		[0, 1].map((option) => describeAnswer(choice, { option })),
		[
			'Pay 1 resource of your choice, then explore a space tile onto your Aliens mat',
			'Gain 1 resource of your choice',
		]
	);
	const pay = {
		id: 2,
		batch: 1,
		player: 1,
		kind: 'chooseSlot',
		purpose: 'payResource',
		options: ['coin', 'food'],
	};
	assert.equal(decisionTitle(pay), 'Choose a resource to pay');
	assert.equal(describeAnswer(pay, { slot: 'food' }), 'Pay 1 food');
	const tile = {
		id: 3,
		batch: 1,
		player: 1,
		kind: 'chooseSpaceTile',
		options: [13, 5],
	};
	assert.equal(decisionTitle(tile), 'Choose a space tile to explore');
	assert.equal(
		decisionTitle({ ...tile, civ: 'aliens' }),
		'Choose a space tile to explore onto your Aliens mat'
	);
});

test("the Treasure Hunters' territory, treasure and black die result read as what they do (#33)", () => {
	const hex = {
		id: 1,
		batch: 1,
		player: 1,
		kind: 'chooseHex',
		purpose: 'treasureHunters',
		optional: true,
		options: ['-2_-1'],
	};
	assert.equal(
		decisionTitle(hex),
		'Move a Treasure Hunters token onto a territory?'
	);
	assert.equal(describeAnswer(hex, { hex: '-2_-1' }), 'Hex −2,−1');
	assert.equal(describeAnswer(hex, { hex: null }), 'Decline');
	const treasure = {
		id: 2,
		batch: 1,
		player: 1,
		kind: 'chooseSlot',
		purpose: 'treasureHunters',
		optional: false,
		options: ['desert', 'grassland', 'mountain', 'forest'],
	};
	assert.equal(decisionTitle(treasure), 'Choose a treasure to claim');
	assert.deepEqual(
		treasure.options.map((slot) => describeAnswer(treasure, { slot })),
		[
			'Desert: gain 1 coin, then roll the black conquer die twice and gain one result',
			'Grassland: gain 1 culture, then roll the science die twice and advance on one result',
			'Mountain: gain 1 worker, then roll both conquer dice and gain both results',
			'Forest: gain 1 food, then roll the red conquer die twice and gain both results',
		]
	);
	const black = {
		id: 3,
		batch: 1,
		player: 1,
		kind: 'chooseOption',
		purpose: 'treasureHunters',
		options: [[{ tileBenefit: {} }], [{ gain: { worker: 1 } }]],
	};
	assert.equal(decisionTitle(black), 'Keep one of the two black die results');
	assert.deepEqual(
		[0, 1].map((option) => describeAnswer(black, { option })),
		['Gain the benefit of the territory tile you claimed', 'Gain 1 worker']
	);
});

test("the Tinkerers' option, the space Pay back pays for and the token to move read as what they do (#33)", () => {
	const option = {
		id: 1,
		batch: 1,
		player: 1,
		kind: 'chooseSlot',
		purpose: 'tinkerers',
		optional: true,
		options: [1, 2, 3, 4],
	};
	assert.equal(decisionTitle(option), 'Put a Tinkerers token on an option?');
	assert.deepEqual(
		[null, ...option.options].map((slot) =>
			describeAnswer(option, { slot })
		),
		[
			'Decline',
			'Pay back: gain what advancing into one of your track spaces cost',
			'Catch up: advance to the closest opponent ahead, with the benefit but not the bonus',
			'Step back: go back 3 spaces, with the benefit, and you may pay the bonus',
			'Jump ahead: move to the next space with a bonus and take that bonus for free, without the benefit',
		]
	);
	const payBack = {
		id: 2,
		batch: 1,
		player: 1,
		kind: 'chooseSlot',
		purpose: 'tinkerersPayBack',
		optional: false,
		options: [
			{ track: 'science', space: 5 },
			{ track: 'military', space: 10 },
		],
	};
	assert.equal(
		decisionTitle(payBack),
		'Pay back: choose one of your track spaces'
	);
	assert.deepEqual(
		payBack.options.map((slot) => describeAnswer(payBack, { slot })),
		[
			'Chemistry on Science: gain 1 worker and 1 resource of your choice',
			'Nuclear Bomb on Military: gain 2 culture',
		]
	);
	const move = {
		id: 3,
		batch: 1,
		player: 1,
		kind: 'chooseMove',
		direction: 'jump',
		purpose: 'tinkerers',
		option: 4,
		optional: false,
		options: [{ track: 'exploration', from: 0, to: 2 }],
	};
	assert.equal(decisionTitle(move), 'Jump ahead: choose a token to move');
	assert.equal(
		decisionTitle({ ...move, option: 2 }),
		'Catch up: choose a token to move'
	);
	assert.equal(
		describeAnswer(move, move.options[0]),
		'Move from the start to Rafts on Exploration'
	);
});

test("the Spies' option, what it takes from a neighbour and the look at their hand read as what they do (#33)", () => {
	const game = /** @type {any} */ ({
		seats: [{ name: 'Ana' }, { name: 'Bo' }],
	});
	const option = {
		id: 1,
		batch: 1,
		player: 1,
		kind: 'chooseSlot',
		purpose: 'spies',
		optional: true,
		options: [1, 2, 3, 4],
	};
	assert.equal(decisionTitle(option), 'Put a Spies token on an option?');
	assert.deepEqual(
		[null, ...option.options].map((slot) =>
			describeAnswer(option, { slot })
		),
		[
			'Decline',
			"A WHEN PLAYED card: gain the effect of a When Played tapestry card face up on a neighbour's income mat",
			"A tile in their supply: gain the benefit of a territory or space tile in a neighbour's supply",
			"Their track position: gain the benefit of a neighbour's track space, without its bonus",
			"Their tech card: gain the benefit of a neighbour's middle-row or top-row tech card",
		]
	);
	/**
	 * The question of what an option takes.
	 * @param {string} purpose
	 * @param {any[]} options
	 */
	const pick = (purpose, options) => ({
		id: 2,
		batch: 1,
		player: 1,
		kind: 'chooseSlot',
		purpose,
		optional: false,
		options,
	});
	/** @param {ReturnType<typeof pick>} decision */
	const words = (decision) =>
		decision.options.map((slot) =>
			describeAnswer(decision, { slot }, game)
		);

	const card = pick('spiesCard', [
		{ player: 2, card: 'double-cross' },
		{ player: 2, card: 'trap-1' },
	]);
	assert.equal(
		decisionTitle(card),
		"Choose a neighbour's tapestry card to copy"
	);
	assert.deepEqual(words(card), ["Bo's Double Cross", "Bo's Trap"]);

	const tile = pick('spiesTile', [
		{ player: 2, stack: 'territory', tile: 1 },
		{ player: 2, stack: 'space', tile: 5 },
		{ player: 2, stack: 'space', tile: 16 },
	]);
	assert.equal(decisionTitle(tile), "Choose a tile in a neighbour's supply");
	assert.deepEqual(words(tile), [
		"Bo's territory tile 1: gain 1 coin",
		"Bo's space tile 5: gain 1 coin, 1 worker and 8 VP",
		"Bo's space tile 16: whenever you advance on the technology track, gain 5 VP, while it stays in Bo's supply",
	]);

	const space = pick('spiesSpace', [
		{ player: 2, track: 'technology', space: 2 },
		{ player: 2, track: 'military', space: 4 },
	]);
	assert.equal(decisionTitle(space), "Choose a neighbour's track space");
	assert.deepEqual(words(space), [
		"Bo's Carpentry on Technology: gain 1 tapestry card",
		"Bo's Standing Army on Military: gain 1 worker and gain 1 VP for each territory tile in your supply",
	]);

	const tech = pick('spiesTech', [
		{ player: 2, card: 'canned-food', icon: 'circle' },
		{ player: 2, card: 'calendar', icon: 'square' },
	]);
	assert.equal(decisionTitle(tech), "Choose a neighbour's tech card");
	assert.deepEqual(words(tech), [
		"Bo's Canned Food, middle row: gain 1 food",
		"Bo's Calendar, top row: gain 7 VP",
	]);

	const look = {
		id: 3,
		batch: 1,
		player: 1,
		kind: 'chooseSlot',
		purpose: 'spiesLook',
		optional: true,
		options: [2],
	};
	assert.equal(decisionTitle(look, game), "Look at Bo's hand?");
	assert.equal(decisionTitle(look), "Look at Player 2's hand?");
	assert.deepEqual(
		[null, 2].map((slot) => describeAnswer(look, { slot }, game)),
		['Decline', "Look at Bo's hand"]
	);
	// A slot of another shape falls back to a readable sentence.
	for (const decision of [option, card, tile, space, tech, look]) {
		assertReadable(
			describeAnswer(decision, { slot: { odd: true } }, game),
			`an odd ${decision.purpose} slot`
		);
	}
});

test("the Utilitarians' landmark, their tokens and the Lighthouse's trade read as what they do (#33)", () => {
	/**
	 * A slot pick of the Utilitarians.
	 * @param {string} purpose
	 * @param {any[]} options
	 * @param {boolean} optional
	 */
	const pick = (purpose, options, optional) => ({
		id: 1,
		batch: 1,
		player: 1,
		kind: 'chooseSlot',
		purpose,
		optional,
		options,
	});
	/** @param {ReturnType<typeof pick>} decision */
	const words = (decision) =>
		decision.options.map((slot) => describeAnswer(decision, { slot }));

	const start = pick(
		'utilitariansLandmark',
		['forge', 'barracks', 'lighthouse', 'apothecary'],
		false
	);
	assert.equal(
		decisionTitle(start),
		'Choose a tier II landmark for your Utilitarians'
	);
	assert.deepEqual(words(start), [
		'Forge: whenever you upgrade a tech card to your top row, gain 1 resource of your choice',
		"Barracks: whenever you conquer, also gain the red die's result",
		'Lighthouse: once each advance turn, before or after you advance, you may discard 2 territory tiles to gain 1 resource of your choice',
		'Apothecary: whenever you gain another landmark, gain 1 resource of your choice',
	]);

	const place = pick(
		'utilitariansPlace',
		['rubber-works', 'tank-factory', 'train-station', 'academy'],
		true
	);
	assert.equal(
		decisionTitle(place),
		'Put a Utilitarians token beside a landmark you own?'
	);
	assert.deepEqual(words(place), [
		'Rubber Works: whenever you advance into tier III or IV of Technology, gain 4 VP',
		'Tank Factory: whenever you advance into tier III or IV of Military, gain 4 VP',
		'Train Station: whenever you advance into tier III or IV of Exploration, gain 4 VP',
		'Academy: whenever you advance into tier III or IV of Science, gain 4 VP',
	]);
	assert.equal(describeAnswer(place, { slot: null }), 'Decline');

	const fromMat = pick(
		'utilitariansToken',
		[{ landmark: 'barracks', from: 'mat' }],
		true
	);
	assert.equal(
		decisionTitle(fromMat),
		'Put a Utilitarians token beside the Barracks?'
	);
	assert.deepEqual(words(fromMat), [
		'Put a token from your mat beside the Barracks',
	]);
	const move = pick(
		'utilitariansToken',
		[
			{ landmark: 'academy', from: 'forge' },
			{ landmark: 'academy', from: 'barracks' },
		],
		true
	);
	assert.equal(
		decisionTitle(move),
		'Move a Utilitarians token beside the Academy?'
	);
	assert.deepEqual(words(move), [
		'Move the token from the Forge to the Academy',
		'Move the token from the Barracks to the Academy',
	]);
	// A slot of another shape falls back to a readable sentence.
	for (const decision of [start, place, fromMat, move]) {
		assertReadable(
			describeAnswer(decision, { slot: { odd: true } }),
			`an odd ${decision.purpose} slot`
		);
	}

	const lighthouse = {
		id: 2,
		batch: 1,
		player: 1,
		kind: 'chooseTrade',
		purpose: 'lighthouse',
		optional: true,
		offers: [{ pay: { territory: 2 }, gain: [{ gain: { any: 1 } }] }],
	};
	assert.equal(
		decisionTitle(lighthouse),
		'Use your Lighthouse: discard 2 territory tiles for a resource?'
	);
	assert.deepEqual(
		[{ offer: null }, { offer: 0, pay: { territory: [4, 16] } }].map(
			(answer) => describeAnswer(lighthouse, answer)
		),
		[
			'No trade',
			'Discard territory tiles 4 and 16 to gain 1 resource of your choice',
		]
	);
	// When only its resource pays for the turn's advance: mandatory, for the resources that open one.
	const opening = {
		...lighthouse,
		optional: false,
		offers: ['food', 'coin'].map((id) => ({
			pay: { territory: 2 },
			gain: [{ gain: { [id]: 1 } }],
		})),
	};
	assert.equal(
		decisionTitle(opening),
		'Use your Lighthouse: discard 2 territory tiles for a resource to advance with'
	);
	assert.deepEqual(
		[0, 1].map((offer) =>
			describeAnswer(opening, { offer, pay: { territory: [4, 16] } })
		),
		[
			'Discard territory tiles 4 and 16 to gain 1 food',
			'Discard territory tiles 4 and 16 to gain 1 coin',
		]
	);
});

test('unknown decisions and answers fall back to a readable sentence', () => {
	const odd = { id: 1, batch: 1, player: 1, kind: 'chooseSomethingNew' };
	assertReadable(decisionTitle(odd), 'an unknown title');
	assert.equal(describeAnswer(odd, { x: { y: 1 } }), 'Choose this option');
	const slot = {
		id: 2,
		batch: 1,
		player: 1,
		kind: 'chooseSlot',
		purpose: 'somethingNew',
		options: [],
	};
	assertReadable(describeAnswer(slot, { slot: { z: [1] } }), 'an odd slot');
	assertReadable(
		describeAnswer(
			{ id: 3, batch: 1, player: 1, kind: 'chooseResource' },
			{ resources: 'lots' }
		),
		'an odd resource answer'
	);
});

test('every decision kind has a title of its own', () => {
	const fallback = decisionTitle({
		id: 1,
		batch: 1,
		player: 1,
		kind: 'chooseSomethingNew',
	});
	for (const kind of Object.keys(DECISIONS)) {
		const title = decisionTitle({ id: 1, batch: 1, player: 1, kind });
		assertReadable(title, `the ${kind} title`);
		assert.notEqual(title, fallback, `${kind} has no title`);
	}
});

const NAMES = ['Ana', 'Bo', 'Cy', 'Dee', 'Eli'];

test('over 20 random games, every open decision and answer describes to a sentence', () => {
	const generic = {
		title: decisionTitle({ kind: 'chooseSomethingNew' }),
		answer: describeAnswer({ kind: 'chooseSomethingNew' }, {}),
		effect: describeEffects([{ notAnEffect: {} }]).toLowerCase(),
	};
	/**
	 * Checks words the games produce: readable, and never the fallback for a shape this module doesn't know.
	 * @param {string} words
	 * @param {string} what
	 */
	const known = (words, what) => {
		assertReadable(words, what);
		assert.ok(
			!words.toLowerCase().includes(generic.effect),
			`${what}: ${words}`
		);
		assert.notEqual(words, generic.title, what);
		assert.notEqual(words, generic.answer, what);
	};
	const kinds = new Set();
	for (let i = 0; i < 20; i++) {
		const seed = 101 + i;
		const random = seededRandom(seed);
		const pick = seededRandom(seed * 7919);
		let state = createGame({
			players: NAMES.slice(0, 1 + (i % 5)).map((name) => ({ name })),
			version: i % 2 === 0 ? 'original' : 'current',
			variants: i % 4 >= 2 ? VARIANTS.map((v) => v.id) : [],
			random,
		});
		for (let actions = 0; ; actions++) {
			const open = openDecisions(state);
			if (open.length === 0) {
				break;
			}
			assert.ok(actions < 5000, `game ${seed} never ended`);
			/** @type {Map<number, any>} */
			const seen = new Map();
			for (const decision of open) {
				const seat = /** @type {number} */ (decision.player);
				const mine = view(state, seat);
				const op = allOps(mine).find((o) => o.id === decision.id);
				assert.ok(op?.answers, `game ${seed}: ${decision.kind}`);
				seen.set(decision.id, op);
				kinds.add(op.kind);
				const what = `game ${seed}, action ${actions}, ${op.kind}`;
				known(decisionTitle(op, mine), `${what}: the title`);
				// What another player sees of it: no answers and no hidden fields.
				const stranger = { ...op };
				delete stranger.answers;
				for (const field of DECISIONS[op.kind].hidden) {
					delete stranger[field];
				}
				known(
					decisionTitle(stranger, mine),
					`${what}: a stranger's title`
				);
				for (const answer of op.answers) {
					known(
						describeAnswer(op, answer, mine),
						`${what}: the answer ${JSON.stringify(answer)}`
					);
				}
			}
			const decision = open[pick(open.length)];
			const seat = /** @type {number} */ (decision.player);
			const answers = seen.get(decision.id).answers;
			const advances = answers.filter((a) => a.turn === 'advance');
			const answer =
				advances.length > 0 && pick(100) < 85
					? advances[0]
					: answers[pick(answers.length)];
			state = play(
				state,
				seat,
				{ decision: decision.id, ...answer },
				random
			);
		}
		assert.equal(state.phase, 'over', `game ${seed} ended`);
	}
	assert.ok(kinds.size >= 15, `only ${kinds.size} decision kinds opened`);
});
