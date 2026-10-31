// The Swamp advanced mat's printed layout and features (#6): black water and six lily pads on buildable plots.
// Its relief and features pictures draw it (#132).

/**
 * The mat's printed layout, one string per row, top first: '.' an open plot, 'X' an impassable one (18 of them),
 * and 'L' a lily pad (6 of them). A lily pad plot is open: it counts as completed, but may be built over.
 * Source: docs/research/03-expansions.md, Swamp (#12). The mat's rule text about losing 2 VP per visible lily pad
 * is text, so it isn't drawn.
 * @type {readonly string[]}
 */
export const LAYOUT = [
	'XXL......',
	'X...LXX..',
	'.......XL',
	'..X....XX',
	'...XX....',
	'...XX....',
	'.LXXXL...',
	'.....X.L.',
	'.....X...',
];

/**
 * What #36 composes this mat in the game from (#6, #132). `pools.open` holds the buildable ground variants, safe on any
 * buildable plot; there are no impassable tiles, as `capital-relief/swamp` draws the impassable plots. `matOnly`
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
			name: 'lily pads',
			where: "capital-feature/swamp draws a pond with lily pads on each 'L' plot of LAYOUT: (0,2), (1,4), (2,8), (6,1), (6,5) and (7,7), as [row, column]",
		}),
	]),
});
