// The Cavern advanced mat's printed layout (#6). Its relief draws its impassable plots (#132).

/**
 * The mat's printed layout (research 03 §Cavern, #9), one string per row, top first: '.' an open plot, 'X' an impassable one.
 * The nine 3×3 districts, the unlocking rule and the row values (printed on the right edge, not legible in the photos) are not drawn.
 * @type {readonly string[]}
 */
export const LAYOUT = [
	'XX...XXX.',
	'...X..X..',
	'...X..X..',
	'...X.....',
	'..XX.....',
	'..XXX....',
	'.........',
	'....X....',
	'...XXXX..',
];

/**
 * What #36 composes this mat in the game from (#6, #132). `pools.open` holds the buildable ground variants, safe on any
 * buildable plot; there are no impassable tiles, as `capital-relief/cavern` draws the impassable plots. `matOnly`
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
