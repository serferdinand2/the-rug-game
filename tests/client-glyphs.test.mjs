// The symbols a track space shows for its benefit and bonus (#59): approved art where it exists, short words for the rest.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { TRACKS } from '../src/lib/engine/data/tracks.js';
import { bonusGlyphs, effectGlyphs, spaceGlyphs } from '../src/lib/glyphs.js';

const TRACK_IDS = /** @type {const} */ ([
	'exploration',
	'science',
	'technology',
	'military',
]);

/**
 * A short form of glyphs, for comparing: 'food', 'farm', 'track:science', 'Explore', 'Tile×2', 'VP', '5 VP', '/', 'or', '✕'.
 * @param {import('../src/lib/glyphs.js').Glyph[]} glyphs
 * @returns {string[]}
 */
function short(glyphs) {
	return glyphs.map((glyph) => {
		switch (glyph.kind) {
			case 'resource':
			case 'building':
				return glyph.count > 1
					? `${glyph.id}×${glyph.count}`
					: glyph.id;
			case 'track':
				return `track:${glyph.id}`;
			case 'word':
				return `${glyph.text}${glyph.count > 1 ? `×${glyph.count}` : ''}${glyph.cross ? '✕' : ''}`;
			case 'vp':
				return glyph.count === null ? 'VP' : `${glyph.count} VP`;
			case 'per':
				return '/';
			default:
				return glyph.kind;
		}
	});
}

test('every effect of all 48 track spaces and their bonuses has symbols, with nothing blank', () => {
	for (const track of TRACK_IDS) {
		for (const space of TRACKS[track].slice(1)) {
			for (const effect of space.benefit) {
				assert.ok(
					effectGlyphs(effect).length > 0,
					`${space.name}: ${JSON.stringify(effect)}`
				);
			}
			const all = [
				...spaceGlyphs(space.benefit),
				...(space.bonus
					? [
							...bonusGlyphs(space.bonus).pay,
							...bonusGlyphs(space.bonus).gain,
						]
					: []),
			];
			for (const glyph of all) {
				const text = JSON.stringify(glyph);
				assert.ok(
					!text.includes('undefined'),
					`${space.name}: ${text}`
				);
				if (glyph.kind === 'word') {
					assert.ok(glyph.text.length > 0, space.name);
				}
			}
			if (space.bonus) {
				const bonus = bonusGlyphs(space.bonus);
				assert.ok(bonus.pay.length > 0, `${space.name} has a price`);
				assert.ok(
					bonus.gain.length > 0,
					`${space.name} gives something`
				);
			}
		}
	}
});

test('resources, buildings and tracks use their art; the game symbols are words', () => {
	const [ships, wagons] = [TRACKS.exploration[5], TRACKS.exploration[3]];
	assert.deepEqual(short(spaceGlyphs(ships.benefit)), [
		'VP',
		'/',
		'Territory',
	]);
	assert.deepEqual(short(bonusGlyphs(ships.bonus).pay), ['any']);
	assert.deepEqual(short(bonusGlyphs(ships.bonus).gain), ['farm']);
	assert.deepEqual(short(spaceGlyphs(wagons.benefit)), [
		'Explore',
		'or',
		'farm',
	]);
	assert.deepEqual(short(spaceGlyphs(TRACKS.exploration[1].benefit)), [
		'Tile×2',
	]);
	assert.deepEqual(short(spaceGlyphs(TRACKS.science[8].benefit)), [
		'house',
		'VP',
		'/',
		'house',
	]);
	assert.deepEqual(short(spaceGlyphs(TRACKS.technology[10].benefit)), [
		'VP',
		'/',
		'track:military',
		'VP',
		'/',
		'track:science',
	]);
});

test('a benefit without its own benefit is crossed out, and a VP counter on a track is that track', () => {
	assert.deepEqual(short(spaceGlyphs(TRACKS.science[1].benefit)), [
		'Science die✕',
	]);
	assert.deepEqual(short(spaceGlyphs(TRACKS.science[5].benefit)), [
		'Science die',
	]);
	// Alien Biology: four rolls without benefits, or 5 VP for a track already complete.
	assert.deepEqual(short(spaceGlyphs(TRACKS.science[12].benefit)), [
		'Science die×4✕',
		'or',
		'5 VP',
	]);
	assert.deepEqual(short(spaceGlyphs(TRACKS.science[10].benefit)), [
		'Regress',
		'track:technology',
		'track:military',
	]);
});

test('the same effect twice in a row is drawn once with a count', () => {
	// Quantum Physics advances twice on exploration, technology or military.
	assert.deepEqual(short(spaceGlyphs(TRACKS.science[11].benefit)), [
		'Advance×2',
		'track:exploration',
		'track:technology',
		'track:military',
	]);
});

test('the other spaces read as the board prints them', () => {
	assert.deepEqual(short(spaceGlyphs(TRACKS.technology[12].benefit)), [
		'coin',
		'food',
		'worker',
		'culture',
		'Restart',
	]);
	assert.deepEqual(short(spaceGlyphs(TRACKS.technology[4].benefit)), [
		'Invent',
		'May refresh',
	]);
	assert.deepEqual(short(spaceGlyphs(TRACKS.technology[7].benefit)), [
		'Invent×2',
		'May refresh',
	]);
	assert.deepEqual(short(spaceGlyphs(TRACKS.technology[9].benefit)), [
		'Upgrade',
		'Circle benefit',
	]);
	assert.deepEqual(short(spaceGlyphs(TRACKS.military[12].benefit)), [
		'Conquer',
		'Both dice',
		'Civilization',
	]);
	assert.deepEqual(short(spaceGlyphs(TRACKS.military[8].benefit)), [
		'Conquer anywhere',
	]);
	assert.deepEqual(short(spaceGlyphs(TRACKS.exploration[11].benefit)), [
		'Space tile×3',
		'Explore space',
	]);
	assert.deepEqual(short(bonusGlyphs(TRACKS.exploration[8].bonus).pay), [
		'Tile×2',
	]);
	assert.deepEqual(short(bonusGlyphs(TRACKS.exploration[8].bonus).gain), [
		'5 VP',
	]);
	assert.deepEqual(short(bonusGlyphs(TRACKS.technology[11].bonus).pay), [
		'Tech×3',
	]);
});
