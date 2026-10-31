// The track board and the board switcher follow the number of tracks, so a fifth track fits (#120).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { render } from 'svelte/server';
import BoardSwitcher from '../src/lib/components/board/BoardSwitcher.svelte';
import ExplorationFace from '../src/lib/components/board/ExplorationFace.svelte';
import Track from '../src/lib/components/board/Track.svelte';
import TrackBoard from '../src/lib/components/board/TrackBoard.svelte';
import TrackSpace from '../src/lib/components/board/TrackSpace.svelte';
import { boardChoices, trackMarks } from '../src/lib/board-icons.js';
import { TRACK_IDS } from '../src/lib/engine/data/ids.js';

/** @param {string} path - A path from the repository root */
const read = (path) =>
	readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

/**
 * The <style> blocks of a component.
 * @param {string} path
 */
const cssOf = (path) =>
	[...read(path).matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)]
		.map((match) => match[1])
		.join('\n');

/** The custom properties tokens.css declares, as name → value. */
const tokens = new Map(
	[...read('src/styles/tokens.css').matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(
		(match) => [match[1], match[2].trim()]
	)
);

/** A stand-in fifth track id: the layout only counts the tracks. */
const FIFTH = /** @type {import('../src/lib/ui.js').TrackId} */ ('arts');

/**
 * A plain track for the board: twelve named spaces, four prices and the players.
 * @param {import('../src/lib/ui.js').TrackId} id
 * @param {number} [spaces=12]
 */
function plainTrack(id, spaces = 12) {
	return {
		id,
		name: id,
		spaces: Array.from({ length: spaces }, (_, index) => ({
			name: `Space ${index + 1}`,
		})),
		tiers: [['any'], ['any'], ['any'], ['any']],
		players: [
			{ seat: 1, name: 'You', position: 2 },
			{ seat: 2, name: 'Ana', position: 0 },
		],
	};
}

test('four track marks are the four bands the switcher always drew', () => {
	assert.deepEqual(
		trackMarks(TRACK_IDS).map((mark) => mark.points),
		[
			'1,2 44,2 53,5.5 44,9 1,9',
			'1,9.5 44,9.5 53,13 44,16.5 1,16.5',
			'1,17 44,17 53,20.5 44,24 1,24',
			'1,24.5 44,24.5 53,28 44,31.5 1,31.5',
		]
	);
	assert.deepEqual(
		trackMarks(TRACK_IDS).map((mark) => mark.color),
		TRACK_IDS.map((id) => `var(--${id})`)
	);
});

test('five track marks share the same height, half a unit apart', () => {
	const marks = trackMarks([...TRACK_IDS, FIFTH]);
	assert.equal(marks.length, 5);
	assert.equal(marks[4].color, 'var(--arts)');
	const bands = marks.map((mark) => {
		const ys = mark.points
			.split(' ')
			.map((point) => Number(point.split(',')[1]));
		return { top: Math.min(...ys), bottom: Math.max(...ys) };
	});
	assert.equal(bands[0].top, 2);
	assert.equal(bands[4].bottom, 31.5);
	for (const [index, band] of bands.entries()) {
		assert.equal(band.bottom - band.top, 5.5, `band ${index}`);
		if (index > 0) {
			assert.equal(band.top - bands[index - 1].bottom, 0.5);
		}
	}
});

test('each board choice carries its title, viewBox and marks', () => {
	const [tracks, map] = boardChoices(TRACK_IDS);
	assert.deepEqual(
		[tracks.value, tracks.title, tracks.viewBox, tracks.marks.length],
		['tracks', 'Advancement Tracks', '0 0 54 32', 4]
	);
	assert.deepEqual(
		[map.value, map.title, map.viewBox, map.marks.length],
		['map', 'World Map', '0 0 54 32', 7]
	);
});

test('BoardSwitcher draws its icons in one loop, a band for every track it is given', () => {
	const source = read('src/lib/components/board/BoardSwitcher.svelte');
	assert.equal(source.match(/<svg/g)?.length, 1);
	const bands = (html) =>
		html.match(/rg-board-switcher--track-mark/g)?.length ?? 0;
	assert.equal(bands(render(BoardSwitcher, { props: {} }).body), 4);
	assert.equal(
		bands(
			render(BoardSwitcher, {
				props: { tracks: [...TRACK_IDS, FIFTH] },
			}).body
		),
		5
	);
	assert.equal(
		render(BoardSwitcher, { props: {} }).body.match(
			/rg-board-switcher--hex-mark/g
		)?.length,
		7
	);
});

test("Track's fixed rows are tokens, and the board adds them up for its chrome", () => {
	assert.equal(tokens.get('--track-heading'), '18px');
	assert.equal(tokens.get('--track-prices'), '18px');
	const track = cssOf('src/lib/components/board/Track.svelte');
	assert.match(
		track,
		/grid-template-rows:\s*var\(--track-heading\)\s+var\(--track-prices\)\s+auto\s+auto;/
	);
	const board = cssOf('src/lib/components/board/TrackBoard.svelte');
	for (const token of [
		'--track-heading',
		'--track-prices',
		'--progress-lane',
		'--progress-line',
	]) {
		assert.ok(board.includes(`var(${token})`), token);
	}
	assert.doesNotMatch(board, /53px|\/ 4\b|\/ 12\b/);
});

test('track names follow their symbols and precede the divider line', () => {
	const html = render(Track, { props: plainTrack('science') }).body;
	const heading =
		html.match(
			/<div class="rg-track--heading[^\"]*">([\s\S]*?)<\/div>/
		)?.[1] ?? '';
	assert.ok(
		heading.indexOf('rg-track--symbol') < heading.indexOf('rg-track--name')
	);
	assert.match(heading, /rg-track--name[^>]*>science<\/h2>/);
	const style = cssOf('src/lib/components/board/Track.svelte');
	assert.match(style, /\.rg-track--heading::after/);
	assert.match(style, /\.rg-track--name[\s\S]*?flex:\s*none/);
});

test('TrackBoard sets the count of tracks, of spaces and of lanes', () => {
	const style = (tracks) =>
		render(TrackBoard, { props: { tracks } }).body.match(
			/class="rg-track-board[^"]*"[^>]*style="([^"]*)"/
		)?.[1] ?? '';
	const four = style(TRACK_IDS.map((id) => plainTrack(id)));
	assert.match(four, /--rg-track-board-count: 4;/);
	assert.match(four, /--rg-track-board-spaces: 12;/);
	assert.match(four, /--rg-track-board-lanes: 2;/);
	const five = style([...TRACK_IDS, FIFTH].map((id) => plainTrack(id)));
	assert.match(five, /--rg-track-board-count: 5;/);
});

test('Track marks only its final space as the last, however many it has', () => {
	// The names of the spaces drawn as the last one.
	const lastSpaces = (html) =>
		[...html.matchAll(/<button[^>]*>/g)]
			.filter((tag) => /\brg-track-space--last\b/.test(tag[0]))
			.map((tag) => tag[0].match(/aria-label="([^,"]*)/)?.[1]);
	assert.deepEqual(
		lastSpaces(render(Track, { props: plainTrack('science') }).body),
		['Space 12']
	);
	assert.deepEqual(
		lastSpaces(render(Track, { props: plainTrack('science', 9) }).body),
		['Space 9']
	);
});

test('TrackSpace and ExplorationFace take the last space from their parent', () => {
	const space = (props) =>
		render(TrackSpace, {
			props: { track: 'military', space: 12, name: 'Mechs', ...props },
		}).body;
	assert.doesNotMatch(space({}), /rg-track-space--last/);
	assert.match(space({ last: true }), /rg-track-space--last/);
	const face = (props) =>
		render(ExplorationFace, {
			props: { space: 12, name: 'Warpgates', ...props },
		}).body;
	assert.doesNotMatch(face({}), /rg-exploration-face--last/);
	assert.match(face({ last: true }), /rg-exploration-face--last/);
	for (const path of [
		'src/lib/components/board/TrackSpace.svelte',
		'src/lib/components/board/ExplorationFace.svelte',
	]) {
		assert.doesNotMatch(read(path), /SPACE_COUNT|=== 12\b/, path);
	}
});

test('Exploration 11 lays out three space tiles, a plus, and one explored space tile', () => {
	const face = render(ExplorationFace, {
		props: { space: 11, name: 'Interstellar Travel' },
	}).body;
	assert.equal((face.match(/symbol\/space-tile\.svg/g) ?? []).length, 3);
	assert.equal((face.match(/symbol\/explore-space\.svg/g) ?? []).length, 1);
	assert.match(face, />\+<\/span>/);
	const style = cssOf('src/lib/components/board/ExplorationFace.svelte');
	assert.match(
		style,
		/space-sequence \.rg-exploration-face--main\s*\{[\s\S]*?display:\s*grid/
	);
	assert.match(
		style,
		/space-sequence \.rg-exploration-face--operator\s*\{[\s\S]*?grid-row:\s*2/
	);
	assert.match(
		style,
		/space-sequence \.rg-exploration-face--unit:last-child\s*\{[\s\S]*?grid-row:\s*3/
	);
});
