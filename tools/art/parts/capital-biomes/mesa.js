// The Mesa advanced mat's printed layout (#6). Its relief draws its impassable plots as one tableland (#132).

/**
 * The mat's printed layout, one string per row, top first: '.' an open plot, 'X' an impassable one (22 of them).
 * Source: docs/research/03-expansions.md, Mesa (#11). The mat's rule that landmarks may not extend outside the city
 * area is text, so it isn't drawn.
 * @type {readonly string[]}
 */
export const LAYOUT = [
	'.XXXXXXXX',
	'.......XX',
	'........X',
	'.........',
	'.........',
	'.........',
	'.........',
	'XXX......',
	'XXXXXXXX.',
];

/**
 * What #36 composes this mat in the game from (#6, #132). `pools.open` holds the buildable ground variants, safe on any
 * buildable plot; there are no impassable tiles, as `capital-relief/mesa` draws the impassable plots. `matOnly`
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
	matOnly: Object.freeze([]),
});
