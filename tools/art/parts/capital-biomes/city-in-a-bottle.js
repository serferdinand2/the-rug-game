// The City in a Bottle advanced mat's printed layout (#6). Its ground tiles, relief and overlay draw it (#133).

/**
 * The mat's printed layout, one string per row, top first: '.' an open plot, 'X' an impassable one.
 * It is 6 rows by 6 columns with 17 impassable plots and six 3×2 districts (rows 0-2 and 3-5, column pairs 0-1, 2-3, 4-5).
 * No landmark may be placed in this city. Source: docs/research/03-expansions.md, FF.6 §2.1.
 * @type {readonly string[]}
 */
export const LAYOUT = [
	'.XX..X',
	'.X.X.X',
	'...XX.',
	'.XX.X.',
	'XX...X',
	'..XXX.',
];

/**
 * What #40 composes this mat in the game from (#6, #133). `pools.open` holds the buildable ground variants, safe on any buildable plot; there are no impassable tiles, as `capital-relief/city-in-a-bottle` draws the impassable plots. `matOnly` says which picture draws each printed feature.
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
			name: 'bottle glass',
			where: 'capital-overlay/city-in-a-bottle tints the outer 4 pixels of the mat: a teal rim, a long reflection down the left and glints at the bottom right',
		}),
	]),
});
