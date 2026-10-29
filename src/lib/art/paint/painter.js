// The pixel painter: draws style C art on a pixel grid and writes it as SVG with one crispEdges path per colour.

/**
 * A colour, always written as lowercase `#rrggbb` so each colour gets exactly one path.
 * @typedef {string} Colour
 */

/**
 * A pixel grid. `p` is row-major; `null` is an empty pixel.
 * @typedef {{ w: number, h: number, p: (Colour | null)[], alpha?: number[] }} Canvas
 */

/**
 * A rectangle measured from its top-left pixel.
 * @typedef {{ x: number, y: number, w: number, h: number }} Box
 */

const COLOUR = /^#[0-9a-f]{6}$/;

/** The four neighbours a pixel touches along its edges. */
const NEIGHBOURS = [
	[1, 0],
	[-1, 0],
	[0, 1],
	[0, -1],
];

/**
 * Creates an empty canvas.
 * @param {number} w - Width in pixels
 * @param {number} h - Height in pixels
 * @returns {Canvas}
 */
export function createCanvas(w, h) {
	return { w, h, p: new Array(w * h).fill(null) };
}

/**
 * Tells whether a point lies on the canvas.
 * @param {Canvas} canvas
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
export function inside(canvas, x, y) {
	return x >= 0 && y >= 0 && x < canvas.w && y < canvas.h;
}

/**
 * Throws unless both numbers are integers. A fractional coordinate would read or write
 * a non-index property of the pixel array, so the pixel would silently vanish.
 * @param {number} x
 * @param {number} y
 * @param {string} [what] - What the numbers are, for the message
 */
function assertIntegers(x, y, what = 'x and y') {
	if (!Number.isInteger(x) || !Number.isInteger(y)) {
		throw new Error(`${what} must be integers, got ${x}, ${y}`);
	}
}

/**
 * Reads one pixel.
 * @param {Canvas} canvas
 * @param {number} x
 * @param {number} y
 * @returns {Colour | null | undefined} The colour, `null` when empty, `undefined` outside the canvas.
 * @throws {Error} When x or y isn't an integer.
 */
export function get(canvas, x, y) {
	assertIntegers(x, y);
	return inside(canvas, x, y) ? canvas.p[y * canvas.w + x] : undefined;
}

/**
 * Paints one pixel. Points outside the canvas and empty colours are ignored, as in the approved prototype.
 * @param {Canvas} canvas
 * @param {number} x
 * @param {number} y
 * @param {Colour | null | undefined} colour
 * @throws {Error} When x or y isn't an integer (the pixel would silently vanish) or the colour isn't lowercase #rrggbb.
 */
export function set(canvas, x, y, colour) {
	assertIntegers(x, y);
	if (!colour) {
		return;
	}
	if (!COLOUR.test(colour)) {
		throw new Error(`colour must be lowercase #rrggbb, got "${colour}"`);
	}
	if (inside(canvas, x, y)) {
		canvas.p[y * canvas.w + x] = colour;
	}
}

/**
 * Empties one pixel.
 * @param {Canvas} canvas
 * @param {number} x
 * @param {number} y
 * @throws {Error} When x or y isn't an integer.
 */
export function clear(canvas, x, y) {
	assertIntegers(x, y);
	if (inside(canvas, x, y)) {
		canvas.p[y * canvas.w + x] = null;
	}
}

/**
 * Paints a filled rectangle.
 * @param {Canvas} canvas
 * @param {number} x - Left column
 * @param {number} y - Top row
 * @param {number} w - Width
 * @param {number} h - Height
 * @param {Colour} colour
 * @throws {Error} When the position or size isn't made of integers.
 */
export function rect(canvas, x, y, w, h, colour) {
	assertIntegers(w, h, 'w and h');
	for (let j = 0; j < h; j++) {
		for (let i = 0; i < w; i++) {
			set(canvas, x + i, y + j, colour);
		}
	}
}

/**
 * Paints a pixel only when it is empty.
 * @param {Canvas} canvas
 * @param {number} x
 * @param {number} y
 * @param {Colour} colour
 */
export function fillEmpty(canvas, x, y, colour) {
	if (get(canvas, x, y) === null) {
		set(canvas, x, y, colour);
	}
}

/**
 * Paints a small sprite from rows of keys, one character per pixel. Keys with no colour (such as '.') are skipped.
 * @param {Canvas} canvas
 * @param {number} x - The sprite's left column
 * @param {number} y - The sprite's top row
 * @param {readonly string[]} rows - The sprite, top row first
 * @param {Readonly<Record<string, Colour>>} colours - The colour for each key
 * @param {{ mirror?: boolean }} [options] - `mirror` flips each row within the sprite's width
 * @returns {Box} The sprite's box: its widest row by its number of rows.
 */
export function paint(canvas, x, y, rows, colours, { mirror = false } = {}) {
	const w = Math.max(0, ...rows.map((row) => row.length));
	rows.forEach((row, j) => {
		[...row].forEach((key, i) => {
			if (Object.hasOwn(colours, key)) {
				set(canvas, x + (mirror ? w - 1 - i : i), y + j, colours[key]);
			}
		});
	});
	return { x, y, w, h: rows.length };
}

/**
 * Paints a one-pixel line between two points, both included: one pixel for each step along the longer axis.
 * It always runs from the lower end of that axis, so swapping the ends draws the same pixels.
 * @param {Canvas} canvas
 * @param {number} x0
 * @param {number} y0
 * @param {number} x1
 * @param {number} y1
 * @param {Colour} colour
 * @throws {Error} When an end isn't made of integers.
 */
export function line(canvas, x0, y0, x1, y1, colour) {
	assertIntegers(x0, y0, 'x0 and y0');
	assertIntegers(x1, y1, 'x1 and y1');
	const steep = Math.abs(y1 - y0) > Math.abs(x1 - x0);
	const [a, b] = (steep ? y0 > y1 : x0 > x1)
		? [
				[x1, y1],
				[x0, y0],
			]
		: [
				[x0, y0],
				[x1, y1],
			];
	const steps = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]));
	for (let i = 0; i <= steps; i++) {
		const t = steps === 0 ? 0 : i / steps;
		set(
			canvas,
			Math.round(a[0] + (b[0] - a[0]) * t),
			Math.round(a[1] + (b[1] - a[1]) * t),
			colour
		);
	}
}

/**
 * Outlines every shape: each empty pixel that touches a pixel of another colour gets the outline colour.
 * Every pixel is decided before any is painted, so the outline is one pixel thick.
 * @param {Canvas} canvas
 * @param {Colour} colour
 */
export function outline(canvas, colour) {
	/** @type {[number, number][]} */
	const add = [];
	for (let y = 0; y < canvas.h; y++) {
		for (let x = 0; x < canvas.w; x++) {
			if (get(canvas, x, y) !== null) {
				continue;
			}
			const touches = NEIGHBOURS.some(([dx, dy]) => {
				const next = get(canvas, x + dx, y + dy);
				return Boolean(next) && next !== colour;
			});
			if (touches) {
				add.push([x, y]);
			}
		}
	}
	for (const [x, y] of add) {
		set(canvas, x, y, colour);
	}
}

/**
 * Blends two colours channel by channel.
 * @param {Colour} a
 * @param {Colour} b
 * @param {number} t - 0 gives `a`, 1 gives `b`
 * @returns {Colour}
 */
export function mix(a, b, t) {
	const channels = [1, 3, 5].map((i) => {
		const from = parseInt(a.slice(i, i + 2), 16);
		const to = parseInt(b.slice(i, i + 2), 16);
		return Math.round(from + (to - from) * t)
			.toString(16)
			.padStart(2, '0');
	});
	return `#${channels.join('')}`;
}

/**
 * A seeded random generator, the same linear congruential generator as the prototype, so drawings repeat exactly.
 * @param {number} seed
 * @returns {() => number} Returns numbers in [0, 1).
 */
export function seededRandom(seed) {
	let state = seed;
	return () => {
		state = (state * 1664525 + 1013904223) >>> 0;
		return state / 4294967296;
	};
}

/**
 * Fills each empty pixel of a canvas from a layer underneath it.
 * @param {Canvas} canvas - The foreground, changed in place
 * @param {Canvas} layer - The background, the same size
 */
export function underlay(canvas, layer) {
	for (let i = 0; i < canvas.p.length; i++) {
		if (!canvas.p[i]) {
			canvas.p[i] = layer.p[i];
		}
	}
}

/**
 * Paints one canvas over another. An opaque pixel replaces the one below it. A translucent pixel, such
 * as a shadow, is blended into the colour below it, or copied with its opacity onto an empty pixel.
 * @param {Canvas} base - The canvas below, changed in place
 * @param {Canvas} top - The canvas above, the same size
 * @throws {Error} When the canvases aren't the same size.
 */
export function overlay(base, top) {
	if (base.w !== top.w || base.h !== top.h) {
		throw new Error(
			`overlay needs canvases of the same size, not ${base.w}×${base.h} and ${top.w}×${top.h}`
		);
	}
	for (let i = 0; i < top.p.length; i++) {
		const colour = top.p[i];
		if (!colour) {
			continue;
		}
		const alpha = top.alpha?.[i] ?? 1;
		const below = base.p[i];
		if (alpha < 1 && below) {
			base.p[i] = mix(below, colour, alpha);
			continue;
		}
		base.p[i] = colour;
		if (alpha < 1 && !base.alpha) {
			base.alpha = new Array(base.w * base.h).fill(1);
		}
		if (base.alpha) {
			base.alpha[i] = alpha;
		}
	}
}

/**
 * Writes a canvas as SVG: one path per colour, in order of each colour's first pixel, with each horizontal run as one rectangle.
 * @param {Canvas} canvas
 * @param {{ opacity?: Record<Colour, number> }} [options] - Opacity per colour
 * @returns {string}
 */
export function toSvg(canvas, { opacity = {} } = {}) {
	/** @type {Map<Colour, string[]>} */
	const runs = new Map();
	for (let y = 0; y < canvas.h; y++) {
		let x = 0;
		while (x < canvas.w) {
			const colour = canvas.p[y * canvas.w + x];
			if (!colour) {
				x++;
				continue;
			}
			const alpha =
				canvas.alpha?.[y * canvas.w + x] ?? opacity[colour] ?? 1;
			const key = `${colour}|${alpha}`;
			let n = 1;
			while (
				x + n < canvas.w &&
				canvas.p[y * canvas.w + x + n] === colour &&
				(canvas.alpha?.[y * canvas.w + x + n] ??
					opacity[colour] ??
					1) === alpha
			) {
				n++;
			}
			const list = runs.get(key) ?? [];
			list.push(`M${x} ${y}h${n}v1h-${n}z`);
			runs.set(key, list);
			x += n;
		}
	}
	const paths = [...runs]
		.map(([key, d]) => {
			const [colour, value] = key.split('|');
			const alpha = Number(value) === 1 ? '' : ` fill-opacity="${value}"`;
			return `<path fill="${colour}"${alpha} d="${d.join('')}"/>`;
		})
		.join('');
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvas.w} ${canvas.h}" shape-rendering="crispEdges">${paths}</svg>`;
}

/**
 * Reads back an SVG in the format `toSvg` writes, preserving each pixel's opacity.
 * @param {string} svg
 * @returns {Canvas}
 * @throws {Error} When the SVG has no viewBox.
 */
export function fromSvg(svg) {
	const box = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
	if (!box) {
		throw new Error('the SVG has no viewBox');
	}
	const canvas = createCanvas(Number(box[1]), Number(box[2]));
	for (const path of svg.matchAll(
		/<path fill="(#[0-9a-f]{6})"([^>]*?) d="([^"]*)"/g
	)) {
		const alpha = Number(path[2].match(/fill-opacity="([^"]+)"/)?.[1] ?? 1);
		if (alpha !== 1 && !canvas.alpha) {
			canvas.alpha = new Array(canvas.w * canvas.h).fill(1);
		}
		for (const run of path[3].matchAll(/M(\d+) (\d+)h(\d+)/g)) {
			rect(
				canvas,
				Number(run[1]),
				Number(run[2]),
				Number(run[3]),
				1,
				path[1]
			);
			if (canvas.alpha) {
				const start = Number(run[2]) * canvas.w + Number(run[1]);
				canvas.alpha.fill(alpha, start, start + Number(run[3]));
			}
		}
	}
	return canvas;
}
