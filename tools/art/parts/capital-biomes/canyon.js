// The Canyon advanced mat's printed layout and features (#6): a gorge of impassable plots and six cacti on
// buildable plots. Its relief and features pictures draw it (#132).

/**
 * The mat's printed layout (research 03 "Canyon"), one string per row, top first: '.' an open plot, 'X' an impassable one,
 * and 'C' an open plot with a cactus. A cactus is a regular plot, but one completely surrounded by buildings and impassable plots counts as complete (the engine's job).
 * @type {readonly string[]}
 */
export const LAYOUT = [
	'..XX.....',
	'.CXXX..C.',
	'....XX...',
	'....XX...',
	'.C...XXC.',
	'.....X...',
	'....XX...',
	'.C.XXX.C.',
	'..XX.....',
];

/**
 * What #36 composes this mat in the game from (#6, #132). `pools.open` holds the buildable ground variants, safe on any
 * buildable plot; there are no impassable tiles, as `capital-relief/canyon` draws the impassable plots. `matOnly`
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
			name: 'cacti',
			where: "capital-feature/canyon draws one saguaro on each 'C' plot of LAYOUT: (1,1), (1,7), (4,1), (4,7), (7,1) and (7,7), as [row, column]",
		}),
	]),
});
