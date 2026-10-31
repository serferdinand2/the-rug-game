// The Archipelago advanced mat's printed layout and features (#6): nine islands separated by impassable water,
// and three volcanoes on island land. Its relief and features pictures draw it (#132).

/**
 * The mat's printed layout (research 03 "Archipelago"), one string per row, top first: '.' an open plot, 'X' an impassable one.
 * Every X is water except the three volcanoes listed in `VOLCANOES`, which are printed on island land.
 * @type {readonly string[]}
 */
export const LAYOUT = [
	'..X..XX..',
	'..X...XX.',
	'..X....X.',
	'XXXXX.XXX',
	'.X.XXXXX.',
	'.X.X..X..',
	'.X....X..',
	'.XXX..XXX',
	'XX.XXXX..',
	'.XX..X...',
	'..X..X...',
];

/**
 * The volcanoes, [row, column] from 0: impassable plots on an island's land. The other impassable plots are water.
 * @type {readonly (readonly [number, number])[]}
 */
export const VOLCANOES = [
	[4, 3],
	[5, 3],
	[9, 2],
];

/**
 * What #36 composes this mat in the game from (#6, #132). `pools.open` holds the buildable ground variants, safe on any
 * buildable plot; there are no impassable tiles, as `capital-relief/archipelago` draws the impassable plots. `matOnly`
 * says which picture draws each printed feature.
 * @type {import('./index.js').BiomeFeatures}
 */
export const FEATURES = Object.freeze({
	// The eight buildable ground variants are ordinary; the impassable plots have no tiles, as the relief draws them.
	pools: Object.freeze({
		open: Object.freeze([0, 1, 2, 3, 4, 5, 6, 7]),
		blocked: Object.freeze([]),
	}),
	special: Object.freeze([]),
	matOnly: Object.freeze([
		Object.freeze({
			name: 'volcanoes',
			where: 'capital-relief/archipelago draws the three VOLCANOES plots as volcanic islands with a black-sand shore, the two touching ones as one massif',
		}),
		Object.freeze({
			name: 'beaches',
			where: 'capital-feature/archipelago draws a beach on every island side, and round every island corner, that faces water; a volcano is land, so no beach faces it',
		}),
	]),
});
