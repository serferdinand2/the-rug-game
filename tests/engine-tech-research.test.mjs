// The 33 base tech cards against the research's table (02-base-content §4): every name and prerequisite read from the
// research file itself, and every circle and square as the table gives them, so a slip in the data can't pass unseen.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import '../src/lib/engine/game.js';
import { TECH_CARDS } from '../src/lib/engine/data/tech-cards.js';

/** The research's tech-card rows: number, name, kind, circle, square, prerequisite. */
const ROWS = readFileSync(
	new URL('../docs/research/02-base-content.md', import.meta.url),
	'utf8'
)
	.split('## 4. Tech cards (33)')[1]
	.split('\n## ')[0]
	.split('\n')
	.filter((line) => /^\| \d+ \|/.test(line))
	.map((line) =>
		line
			.split('|')
			.slice(1, -1)
			.map((cell) => cell.trim())
	);

const TIERS = /** @type {Record<string, number>} */ ({
	I: 1,
	II: 2,
	III: 3,
	IV: 4,
});

/**
 * A prerequisite as the research words it: "Technology tier II", or an innovation such as **"Farming"** (…).
 * @param {string} cell
 */
function requirementOf(cell) {
	const tier =
		/^(Exploration|Science|Technology|Military) tier (I{1,3}|IV)$/.exec(
			cell
		);
	if (tier) {
		return { track: tier[1].toLowerCase(), tier: TIERS[tier[2]] };
	}
	const innovation = /"([A-Za-z]+)"/.exec(cell);
	assert.ok(innovation, `an unread prerequisite: ${cell}`);
	return { innovation: innovation[1].toLowerCase() };
}

/**
 * Each card's circle and square, transcribed from the research's row (its words in the comment).
 * @type {Record<string, [unknown[], unknown[]]>}
 */
const EFFECTS = {
	// 1 worker | 1 house
	'Air Conditioning': [[{ gain: { worker: 1 } }], [{ building: 'house' }]],
	// 1 farm | 1 VP per farm (R71: every farm off the income mat)
	Ammonia: [[{ building: 'farm' }], [{ vp: { per: 'farm' } }]],
	// 1 armory | 1 VP per armory
	Anesthesia: [[{ building: 'armory' }], [{ vp: { per: 'armory' } }]],
	// Square benefit of a top-row card | circle benefit of a middle-row card
	'Assembly Line': [
		[{ techBenefit: { icon: 'square' } }],
		[{ techBenefit: { icon: 'circle' } }],
	],
	Bakery: [[{ vp: 4 }], [{ landmark: 'bakery' }]],
	Barn: [[{ vp: 3 }], [{ landmark: 'barn' }]],
	Calendar: [[{ gain: { culture: 1 } }], [{ vp: 7 }]],
	'Canned Food': [[{ gain: { food: 1 } }], [{ vp: 7 }]],
	// Advance on Technology (no benefit/bonus) | 1 VP per Technology space advanced
	Clocks: [
		[{ advance: { tracks: ['technology'], noBenefit: true } }],
		[{ vp: { per: 'trackSpace', track: 'technology' } }],
	],
	'Com Tower': [[{ vp: 5 }], [{ landmark: 'com-tower' }]],
	// 2 territory tiles | Explore
	Compass: [[{ gain: { territory: 2 } }], [{ explore: {} }]],
	Concrete: [[{ building: 'market' }], [{ vp: { per: 'market' } }]],
	// Conquer | 1 VP per territory you control
	Dynamite: [[{ conquer: {} }], [{ vp: { per: 'territory' } }]],
	// Invent | 1 VP per tech card you have
	Eyeglasses: [[{ invent: {} }], [{ vp: { per: 'techCard' } }]],
	Irrigation: [[{ gain: { food: 1 } }], [{ building: 'farm' }]],
	Library: [[{ vp: 3 }], [{ landmark: 'library' }]],
	'Light Bulb': [[{ gain: { coin: 1 } }], [{ building: 'market' }]],
	// 4 VP | the benefit (and the bonus) of your current space on a track, at most once a turn
	'Lithium-Ion Battery': [[{ vp: 4 }], [{ repeat: { oncePerTurn: true } }]],
	Paper: [[{ building: 'house' }], [{ vp: { per: 'house' } }]],
	// Research (no benefit/bonus) | 5 VP
	Penicillin: [[{ research: { noBenefit: true } }], [{ vp: 5 }]],
	// 1 tapestry card | play a tapestry card on top of your current one
	'Printing Press': [[{ gain: { tapestry: 1 } }], [{ tapestryOnTop: {} }]],
	// 3 VP | a random additional civilization
	Radio: [[{ vp: 3 }], [{ gainCiv: {} }]],
	'Sewage & Plumbing': [[{ gain: { culture: 1 } }], [{ building: 'armory' }]],
	Siegecraft: [
		[{ advance: { tracks: ['military'], noBenefit: true } }],
		[{ vp: { per: 'trackSpace', track: 'military' } }],
	],
	'Stock Market': [[{ vp: 5 }], [{ landmark: 'stock-market' }]],
	// 1 culture + 1 territory tile | 1 VP per territory tile in your supply
	Telescope: [
		[{ gain: { culture: 1, territory: 1 } }],
		[{ vp: { per: 'territoryTile' } }],
	],
	// 1 tapestry card | 1 market, house or farm
	'The Nail': [
		[{ gain: { tapestry: 1 } }],
		[
			{
				choice: [
					[{ building: 'market' }],
					[{ building: 'house' }],
					[{ building: 'farm' }],
				],
			},
		],
	],
	// 1 coin | regress on Exploration or Military (no benefit/bonus)
	'Time Travel': [
		[{ gain: { coin: 1 } }],
		[{ regress: { tracks: ['exploration', 'military'], noBenefit: true } }],
	],
	// 1 coin | 1 culture + 4 VP
	Transistors: [
		[{ gain: { coin: 1 } }],
		[{ gain: { culture: 1 } }, { vp: 4 }],
	],
	Treasury: [[{ vp: 4 }], [{ landmark: 'treasury' }]],
	Vaccines: [
		[{ advance: { tracks: ['science'], noBenefit: true } }],
		[{ vp: { per: 'trackSpace', track: 'science' } }],
	],
	// 1 worker | conquer
	Warships: [[{ gain: { worker: 1 } }], [{ conquer: {} }]],
	Zeppelins: [
		[{ advance: { tracks: ['exploration'], noBenefit: true } }],
		[{ vp: { per: 'trackSpace', track: 'exploration' } }],
	],
};

test('the research lists the same 33 tech cards as the data', () => {
	assert.equal(ROWS.length, 33);
	assert.deepEqual(
		ROWS.map((row) => row[1]).sort(),
		TECH_CARDS.map((card) => card.name).sort()
	);
	assert.deepEqual(
		Object.keys(EFFECTS).sort(),
		ROWS.map((row) => row[1]).sort()
	);
});

test("every tech card's prerequisite is the research's", () => {
	for (const [, name, , , , prerequisite] of ROWS) {
		const card = TECH_CARDS.find((c) => c.name === name);
		assert.deepEqual(card?.requires, requirementOf(prerequisite), name);
	}
});

test("every tech card's circle and square are the research's", () => {
	for (const card of TECH_CARDS) {
		const [circle, square] = EFFECTS[card.name];
		assert.deepEqual(card.circle, circle, `${card.name}'s circle`);
		assert.deepEqual(card.square, square, `${card.name}'s square`);
	}
});

test('a landmark card is a landmark in the research and places that landmark', () => {
	for (const [, name, kind] of ROWS) {
		const card = TECH_CARDS.find((c) => c.name === name);
		const isLandmark = kind.includes('Landmark');
		assert.equal(Boolean(card?.landmark), isLandmark, name);
		if (isLandmark) {
			assert.deepEqual(
				card?.square,
				[{ landmark: card?.landmark }],
				name
			);
		}
	}
});
