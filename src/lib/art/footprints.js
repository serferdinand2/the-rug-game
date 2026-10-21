// Landmark footprints: the capital-city plots each landmark covers, and the check that a landmark's picture covers exactly those.
// Plain data with no imports, so the app, the rules engine (#12) and the art toolkit all import this one module, and the
// footprints never exist twice.

/**
 * A landmark's picture is drawn in its footprint's shape at this many pixels per plot, and the
 * same picture is shown on its card and on the capital grid. A 2×2 landmark is 64×64, like the approved Lighthouse.
 */
export const PLOT_SIZE = 32;

/**
 * Each landmark's footprint, keyed by its catalog slug: rows top first, as printed,
 * with `X` for an occupied plot and `.` for an empty one. Any of the four rotations
 * may be placed, but never a mirror image (R15).
 * Sources: 02 §5 (base), 03 §1.6 (Plans & Ploys), 03 §2.10 (Arts & Architecture),
 * with R63 (Castle, 12 plots) and R65 (the corrected Villa, Birdwatching Perch and Castle).
 * @type {Readonly<Record<string, readonly string[]>>}
 */
export const FOOTPRINTS = Object.freeze(
	Object.fromEntries(
		Object.entries({
			// Base game: track landmarks
			lighthouse: ['XX', 'XX'],
			'train-station': ['XXX', 'XXX', 'XXX'],
			'launch-pad': ['XXX', 'XXX'],
			apothecary: ['XX', 'XX'],
			academy: ['XXXX', 'XXXX'],
			laboratory: ['XXX', 'XXX'],
			forge: ['XX', 'XX'],
			'rubber-works': ['..XX', '..XX', 'XXXX', 'XXXX'],
			'tech-hub': ['XXX', 'XXX'],
			barracks: ['XX', 'XX'],
			'tank-factory': ['XXX', 'XXX', 'XXX'],
			'fusion-reactor': ['.XX', 'XXX', 'XXX'],
			// Base game: tech-card landmarks
			bakery: ['XX', 'XX'],
			barn: ['XXX', 'XXX', 'XXX'],
			'com-tower': ['XXX', 'XXX'],
			library: ['XXXX', 'XXXX'],
			'stock-market': ['XX', 'XX'],
			treasury: ['XX', 'XX'],
			// Plans & Ploys
			'digital-studio': ['XXX', 'XXX'],
			'game-store': ['XXX', 'XXX'],
			skyscraper: ['XXX', 'XXX', 'XXX'],
			'tv-station': ['.XX', 'XXX', 'XXX'],
			'urban-farm': ['.XX', 'XXX', 'XXX'],
			stadium: ['XXXX', 'XXXX'],
			monolith: ['XX', 'XX'],
			// Arts & Architecture
			villa: ['X..', 'XXX', 'XXX'],
			'birdwatching-perch': ['.XXX', 'XXX.'],
			castle: ['.XXX', 'XXXX', '.XXX', '.XX.'],
			windmill: ['XXXX', '.XX.'],
			bridge: ['.XX.', 'XXXX', '.XX.'],
			'clock-tower': ['XX', 'XX'],
			'opera-house': ['XX', 'XX', '.X'],
			holocenter: ['XXX', 'XXX', 'XXX', '.X.'],
		}).map(([slug, rows]) => [slug, Object.freeze(rows)])
	)
);

/**
 * Checks that a landmark's picture covers exactly its footprint: the canvas is the footprint's size
 * at PLOT_SIZE pixels per plot, every pixel of an occupied plot is filled, and every pixel of
 * an empty plot is empty.
 * @param {{ w: number, h: number, p: (string | null)[] }} canvas - The landmark's drawn picture
 * @param {readonly string[]} rows - The footprint
 * @returns {string[]} One message per problem, at most one per plot; empty when the piece matches.
 */
export function footprintMismatches(canvas, rows) {
	const w = rows[0].length * PLOT_SIZE;
	const h = rows.length * PLOT_SIZE;
	if (canvas.w !== w || canvas.h !== h) {
		return [`canvas is ${canvas.w}×${canvas.h}, expected ${w}×${h}`];
	}
	/** @type {string[]} */
	const problems = [];
	rows.forEach((row, plotRow) => {
		[...row].forEach((cell, plotCol) => {
			const occupied = cell === 'X';
			for (let dy = 0; dy < PLOT_SIZE; dy++) {
				for (let dx = 0; dx < PLOT_SIZE; dx++) {
					const x = plotCol * PLOT_SIZE + dx;
					const y = plotRow * PLOT_SIZE + dy;
					const filled = Boolean(canvas.p[y * w + x]);
					if (filled !== occupied) {
						problems.push(
							occupied
								? `plot (${plotCol}, ${plotRow}) is in the footprint but pixel (${x}, ${y}) is empty`
								: `plot (${plotCol}, ${plotRow}) is outside the footprint but pixel (${x}, ${y}) is filled`
						);
						return;
					}
				}
			}
		});
	});
	return problems;
}

/**
 * Empties every pixel outside a footprint, so a scene painted across the whole canvas
 * keeps only the plots the landmark covers. Use it last, after the outline and underlay.
 * @param {{ w: number, h: number, p: (string | null)[] }} canvas - The landmark's picture, changed in place
 * @param {readonly string[]} rows - The footprint
 */
export function clipToFootprint(canvas, rows) {
	for (let y = 0; y < canvas.h; y++) {
		const row = rows[Math.floor(y / PLOT_SIZE)] ?? '';
		for (let x = 0; x < canvas.w; x++) {
			if (row[Math.floor(x / PLOT_SIZE)] !== 'X') {
				canvas.p[y * canvas.w + x] = null;
			}
		}
	}
}
