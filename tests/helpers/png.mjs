// Decode native RGBA PNG fixtures for exact artwork comparisons.
import { inflateSync } from 'node:zlib';
/** @param {Buffer} png @returns {{ width: number, height: number, pixels: Buffer }} */
export function decodePng(png) {
	if (
		png.length < 8 ||
		!png
			.subarray(0, 8)
			.equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
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
			const upperLeft =
				y && x >= 4 ? pixels[(y - 1) * stride + x - 4] : 0;
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
