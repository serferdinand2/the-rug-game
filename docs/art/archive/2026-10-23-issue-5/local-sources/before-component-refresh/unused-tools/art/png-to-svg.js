// Exact, crisp-edged SVG conversion for imported pixel-art PNGs.
import { inflateSync } from 'node:zlib';

const PLAYER_COLOUR = '#b3afc2';

/**
 * Converts an 8-bit RGBA PNG to SVG rectangles without resizing or smoothing.
 * Upright outpost fills its enclosed flag cloth with the neutral player-colour channel; the
 * fallen outpost uses its enclosed transparent cloth area as that mask.
 * @param {Buffer} png
 * @param {{ playerMask?: 'outpost-flag' | 'transparent-white' | 'enclosed-transparent' }} [options]
 * @returns {{ width: number, height: number, svg: string }}
 */
export function pngToSvg(png, { playerMask } = {}) {
	const { width, height, pixels } = decodePng(png);
	if (playerMask === 'outpost-flag') {
		fillEnclosedTransparent(pixels, width, height);
		for (let i = 0; i < pixels.length; i += 4) {
			if (
				pixels[i + 3] === 0 &&
				pixels[i] === 255 &&
				pixels[i + 1] === 255 &&
				pixels[i + 2] === 255
			) {
				paintPlayerPixel(pixels, i);
			}
		}
	} else if (playerMask === 'transparent-white') {
		for (let i = 0; i < pixels.length; i += 4) {
			if (
				pixels[i + 3] === 0 &&
				pixels[i] === 255 &&
				pixels[i + 1] === 255 &&
				pixels[i + 2] === 255
			) {
				paintPlayerPixel(pixels, i);
			}
		}
	} else if (playerMask === 'enclosed-transparent') {
		fillEnclosedTransparent(pixels, width, height);
	}

	/** @type {Map<string, string[]>} */
	const runsByPaint = new Map();
	for (let y = 0; y < height; y++) {
		let x = 0;
		while (x < width) {
			const i = (y * width + x) * 4;
			const alpha = pixels[i + 3];
			if (alpha === 0) {
				x++;
				continue;
			}
			const color = `#${[0, 1, 2]
				.map((channel) => pixels[i + channel].toString(16).padStart(2, '0'))
				.join('')}`;
			let length = 1;
			while (x + length < width) {
				const next = ((y * width + x + length) * 4);
				if (
					pixels[next] !== pixels[i] ||
					pixels[next + 1] !== pixels[i + 1] ||
					pixels[next + 2] !== pixels[i + 2] ||
					pixels[next + 3] !== alpha
				)
					break;
				length++;
			}
			const key = `${color}|${alpha}`;
			const paths = runsByPaint.get(key) ?? [];
			paths.push(`M${x} ${y}h${length}v1h-${length}z`);
			runsByPaint.set(key, paths);
			x += length;
		}
	}

	const shapes = [...runsByPaint]
		.map(([key, paths]) => {
			const [color, alphaText] = key.split('|');
			const alpha = Number(alphaText);
			const opacity = alpha === 255 ? '' : ` fill-opacity="${alpha / 255}"`;
			return `<path fill="${color}"${opacity} d="${paths.join('')}"/>`;
		})
		.join('');
	return {
		width,
		height,
		svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges">${shapes}</svg>`,
	};
}

/** @param {Buffer} png @returns {{ width: number, height: number, pixels: Buffer }} */
function decodePng(png) {
	if (
		png.length < 8 ||
		!png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
	)
		throw new Error('Not a PNG file');
	let offset = 8;
	let width = 0;
	let height = 0;
	let bitDepth = 0;
	let colorType = 0;
	let interlace = 0;
	/** @type {Buffer[]} */
	const compressed = [];
	while (offset < png.length) {
		const length = png.readUInt32BE(offset);
		const type = png.toString('ascii', offset + 4, offset + 8);
		const data = png.subarray(offset + 8, offset + 8 + length);
		offset += length + 12;
		if (type === 'IHDR') {
			width = data.readUInt32BE(0);
			height = data.readUInt32BE(4);
			bitDepth = data[8];
			colorType = data[9];
			interlace = data[12];
		} else if (type === 'IDAT') compressed.push(data);
		else if (type === 'IEND') break;
	}
	if (bitDepth !== 8 || colorType !== 6 || interlace !== 0)
		throw new Error(
			`Expected a non-interlaced 8-bit RGBA PNG; received bit depth ${bitDepth}, color type ${colorType}, interlace ${interlace}`
		);
	const raw = inflateSync(Buffer.concat(compressed));
	const stride = width * 4;
	const pixels = Buffer.alloc(height * stride);
	let cursor = 0;
	for (let y = 0; y < height; y++) {
		const filter = raw[cursor++];
		for (let x = 0; x < stride; x++) {
			const value = raw[cursor++];
			const left = x >= 4 ? pixels[y * stride + x - 4] : 0;
			const above = y ? pixels[(y - 1) * stride + x] : 0;
			const upperLeft = y && x >= 4 ? pixels[(y - 1) * stride + x - 4] : 0;
			let predictor;
			if (filter === 0) predictor = 0;
			else if (filter === 1) predictor = left;
			else if (filter === 2) predictor = above;
			else if (filter === 3) predictor = Math.floor((left + above) / 2);
			else if (filter === 4) predictor = paeth(left, above, upperLeft);
			else throw new Error(`Unsupported PNG filter ${filter}`);
			pixels[y * stride + x] = (value + predictor) & 255;
		}
	}
	return { width, height, pixels };
}

/** @param {number} left @param {number} above @param {number} upperLeft */
function paeth(left, above, upperLeft) {
	const estimate = left + above - upperLeft;
	const leftDistance = Math.abs(estimate - left);
	const aboveDistance = Math.abs(estimate - above);
	const upperLeftDistance = Math.abs(estimate - upperLeft);
	if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance)
		return left;
	return aboveDistance <= upperLeftDistance ? above : upperLeft;
}

/** @param {Buffer} pixels @param {number} index */
function paintPlayerPixel(pixels, index) {
	pixels[index] = Number.parseInt(PLAYER_COLOUR.slice(1, 3), 16);
	pixels[index + 1] = Number.parseInt(PLAYER_COLOUR.slice(3, 5), 16);
	pixels[index + 2] = Number.parseInt(PLAYER_COLOUR.slice(5, 7), 16);
	pixels[index + 3] = 255;
}

/** @param {Buffer} pixels @param {number} width @param {number} height */
function fillEnclosedTransparent(pixels, width, height) {
	const count = width * height;
	const outside = new Uint8Array(count);
	/** @type {number[]} */
	const queue = [];
	const addOutside = (index) => {
		if (!outside[index] && pixels[index * 4 + 3] === 0) {
			outside[index] = 1;
			queue.push(index);
		}
	};
	for (let x = 0; x < width; x++) {
		addOutside(x);
		addOutside((height - 1) * width + x);
	}
	for (let y = 0; y < height; y++) {
		addOutside(y * width);
		addOutside(y * width + width - 1);
	}
	for (let head = 0; head < queue.length; head++) {
		const index = queue[head];
		const x = index % width;
		const y = Math.floor(index / width);
		if (x > 0) addOutside(index - 1);
		if (x + 1 < width) addOutside(index + 1);
		if (y > 0) addOutside(index - width);
		if (y + 1 < height) addOutside(index + width);
	}
	for (let index = 0; index < count; index++) {
		if (pixels[index * 4 + 3] === 0 && !outside[index])
			paintPlayerPixel(pixels, index * 4);
	}
}
