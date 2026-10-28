// How to play's rules (#42): every section is whole sentences that fit one screen, and its numbers are the engine's.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { RULES_HELP } from '../src/lib/rules-help.js';
import { INCOME_STEP_KINDS } from '../src/lib/engine/game.js';
import { TIER_COSTS, TRACK_RESOURCE } from '../src/lib/engine/data/tracks.js';
import {
	INCOME_MAT,
	TAPESTRY_SLOTS,
} from '../src/lib/engine/data/income-mat.js';
import { ACHIEVEMENTS } from '../src/lib/engine/data/achievements.js';
import { BLACK_DIE, RED_DIE } from '../src/lib/engine/data/dice.js';

const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

/**
 * The section with this id.
 * @param {string} id
 */
function section(id) {
	const found = RULES_HELP.find((s) => s.id === id);
	assert.ok(found, `There is no section ${id}.`);
	return found;
}

/**
 * Every sentence of a section's text blocks and lists, in order.
 * @param {string} id
 * @returns {string[]}
 */
function lines(id) {
	return section(id).blocks.flatMap((block) =>
		'list' in block ? block.list : [block.text]
	);
}

/**
 * The list item of a section that starts with these words.
 * @param {string} id
 * @param {string} start
 * @returns {string}
 */
function item(id, start) {
	const found = section(id)
		.blocks.flatMap((block) => ('list' in block ? block.list : []))
		.find((line) => line.startsWith(start));
	assert.ok(found, `${id} has no list item starting "${start}".`);
	return found;
}

/**
 * Words joined as English lists them: "4, 5, 6 or 7".
 * @param {(string | number)[]} words
 * @param {string} [last]
 * @returns {string}
 */
function joined(words, last = 'and') {
	return words.length === 1
		? String(words[0])
		: `${words.slice(0, -1).join(', ')} ${last} ${words.at(-1)}`;
}

test('every section has an id, a title and blocks of whole sentences (#42)', () => {
	assert.ok(Object.isFrozen(RULES_HELP));
	assert.ok(RULES_HELP.length >= 6);
	const ids = RULES_HELP.map((s) => s.id);
	assert.equal(new Set(ids).size, ids.length, 'ids are unique');
	for (const { id, title, blocks } of RULES_HELP) {
		assert.match(id, /^[a-z]+(-[a-z]+)*$/);
		assert.ok(title.trim().length > 0, id);
		assert.ok(blocks.length > 0, id);
		for (const block of blocks) {
			assert.ok(Object.isFrozen(block), id);
			assert.notEqual('text' in block, 'list' in block, id);
			if ('list' in block) {
				assert.ok(block.list.length > 0, id);
			}
		}
		for (const line of lines(id)) {
			assert.equal(typeof line, 'string', id);
			assert.match(line, /^\S[\s\S]*\.$/, `${id}: ${line}`);
		}
	}
});

test('every section fits on one screen of the panel (#42)', () => {
	for (const { id } of RULES_HELP) {
		const words = lines(id).join(' ').split(/\s+/).length;
		assert.ok(words >= 60 && words <= 200, `${id} has ${words} words`);
	}
});

test("the five income turns and income turn 1 are the income mat's (#42, #77)", () => {
	const text = lines('your-turn').join(' ');
	assert.deepEqual(INCOME_STEP_KINDS.finish.turns, [5]);
	assert.ok(text.includes('take 5 income turns'), text);
	/** @type {Record<string, number>} */
	const first = {};
	for (const row of Object.values(INCOME_MAT)) {
		for (const effect of row[0].income) {
			if ('gain' in effect) {
				for (const [id, count] of Object.entries(effect.gain)) {
					first[id] = (first[id] ?? 0) + count;
				}
			}
		}
	}
	const names = {
		coin: 'coin',
		worker: 'worker',
		food: 'food',
		culture: 'culture',
		territory: 'territory tile',
		tapestry: 'tapestry card',
	};
	assert.deepEqual(Object.keys(first).sort(), Object.keys(names).sort());
	const gains = Object.entries(names).map(
		([id, name]) => `${first[id]} ${name}`
	);
	assert.ok(text.includes(joined(gains)), joined(gains));
});

test("the tier prices and each track's resource are the engine's (#42)", () => {
	for (const [tier, cost] of Object.entries(TIER_COSTS)) {
		const n = Number(tier);
		const line = item('tracks', `Tier ${ROMAN[n - 1]} `);
		assert.ok(line.includes(`(spaces ${3 * n - 2}–${3 * n})`), line);
		if (cost.track) {
			assert.ok(line.includes(`${cost.track} of the track's`), line);
		} else {
			assert.ok(!line.includes("track's"), line);
		}
		if (cost.any) {
			assert.match(
				line,
				new RegExp(`\\b${cost.any} (resource )?of your choice`),
				line
			);
		} else {
			assert.ok(!line.includes('of your choice'), line);
		}
	}
	const text = lines('tracks').join(' ');
	for (const [track, resource] of Object.entries(TRACK_RESOURCE)) {
		const name = track[0].toUpperCase() + track.slice(1);
		assert.ok(text.includes(`${resource} for ${name}`), track);
	}
});

test("each income step runs on the engine's income turns, with its first-of-neighbours bonus (#42)", () => {
	const steps = {
		civAbilities: 'Civilization',
		tapestry: 'Tapestry card',
		upgrade: 'Upgrade and score',
		score: 'Upgrade and score',
		income: 'Income',
	};
	for (const [id, start] of Object.entries(steps)) {
		const { turns } = INCOME_STEP_KINDS[id];
		const from = turns[0];
		const to = /** @type {number} */ (turns.at(-1));
		assert.deepEqual(
			turns,
			Array.from({ length: to - from + 1 }, (_, i) => from + i),
			id
		);
		const line = item('income', `${start} (`);
		assert.ok(line.startsWith(`${start} (income turns ${from}–${to})`), id);
	}
	const line = item('income', 'Tapestry card (');
	const bonuses = TAPESTRY_SLOTS.filter((slot) => slot.firstBonus).map(
		(slot) => `${slot.firstBonus?.any} in era ${ROMAN[slot.era - 1]}`
	);
	assert.equal(bonuses.length, 3);
	assert.ok(line.includes(joined(bonuses)), joined(bonuses));
});

test("the conquer dice faces are the engine's (#42)", () => {
	const red = item('map', 'Red die');
	const fixed = RED_DIE.flatMap((face) =>
		'vp' in face && typeof face.vp === 'number' ? [face.vp] : []
	);
	assert.ok(red.includes(`${joined(fixed, 'or')} VP`), red);
	assert.ok(
		RED_DIE.some((face) => 'vp' in face && typeof face.vp === 'object')
	);
	assert.ok(red.includes('1 VP per territory you control'), red);
	const black = item('map', 'Black die');
	const gains = BLACK_DIE.flatMap((face) =>
		'gain' in face
			? Object.entries(face.gain).map(([id, n]) => `${n} ${id}`)
			: []
	);
	assert.ok(black.includes(joined(gains, 'or')), black);
	assert.ok(black.includes('territory tile'), black);
});

test("the achievements' VP boxes are the engine's on both map sides (#42)", () => {
	const names = {
		'complete-track': 'Complete a track',
		'topple-two': 'Topple two outposts',
		'middle-island': 'Conquer the middle',
	};
	assert.deepEqual(
		ACHIEVEMENTS.map((a) => a.id),
		Object.keys(names)
	);
	for (const { id, vp } of ACHIEVEMENTS) {
		const line = item('end', `${names[/** @type {keyof names} */ (id)]}:`);
		assert.ok(
			line.includes(
				`Boxes: ${joined([...vp.large])} VP with 4 or 5 players; ${joined([...vp.small])} VP with 1 to 3.`
			),
			line
		);
	}
});
