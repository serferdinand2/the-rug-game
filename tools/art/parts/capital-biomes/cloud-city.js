// The Cloud City advanced mat's printed layout, clouds and their tints (#6). Its ground tiles, relief and features
// picture draw it (#132).

/**
 * The mat's printed layout (research 03 §Cloud City, #10), one string per row, top first: '.' an open plot, 'X' an impassable one.
 * The cloud (district) each plot belongs to is in `CLOUDS`.
 * @type {readonly string[]}
 */
export const LAYOUT = [
	'......X..',
	'........X',
	'.X......X',
	'XX.....XX',
	'.........',
	'.....XX..',
	'XXX....XX',
	'X...X..X.',
	'X..XXX...',
];

/**
 * The cloud (district) of each plot, one digit 1-9 per plot, as reconstructed in the research from the mat's fill colours.
 * @type {readonly string[]}
 */
export const CLOUDS = [
	'111222233',
	'111222333',
	'114442335',
	'664445555',
	'664445555',
	'666667788',
	'666977788',
	'999977788',
	'999997888',
];

/**
 * Each cloud's tint: 0 white, 1 grey, 2 tan, 3 cream (research table; cloud 1 grey, 2 tan, 3 cream, 4 white, 5 grey, 6 cream, 7 tan, 8 white, 9 white).
 * @type {readonly number[]}
 */
export const CLOUD_TINTS = [0, 1, 2, 3, 0, 1, 3, 2, 0, 0];

/** The names of the four cloud tints, by tint index (#132). */
export const CLOUD_TINT_NAMES = Object.freeze([
	'white',
	'grey',
	'tan',
	'cream',
]);

/**
 * What #36 composes this mat in the game from (#6, #132). `pools.open` holds the buildable ground variants, safe on any
 * buildable plot; there are no impassable tiles, as `capital-relief/cloud-city` draws the impassable plots. `matOnly`
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
			name: 'cloud tints',
			where: 'The buildable ground tiles capital-terrain/cloud-city-<tint>-open-01 to -08, picked for each plot by CLOUD_TINT_NAMES[CLOUD_TINTS[CLOUDS[row][col]]]; capital-relief/cloud-city tints each puff of cloud the same way',
		}),
		Object.freeze({
			name: 'cloud rims',
			where: 'capital-feature/cloud-city draws a scalloped rim along every edge between two different clouds in CLOUDS',
		}),
	]),
});
