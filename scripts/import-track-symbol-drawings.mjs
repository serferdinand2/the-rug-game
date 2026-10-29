// Convert the approved track SVGs into reproducible art drawing modules.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { toSvg } from '../tools/art/painter.js';

const names = [
	'capital-city',
	'civilization-card',
	'explore',
	'explore-anywhere',
	'explore-space',
	'invent',
	'restart',
	'science-die',
	'space-tile',
	'tapestry-card',
	'tech-card',
	'territory-tile',
	'victory-points',
];
const browser = await chromium.launch({
	headless: true,
	executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
});

try {
	const page = await browser.newPage();
	await mkdir('tools/art/drawings/symbol', { recursive: true });
	for (const name of names) {
		const source = await readFile(`static/art/symbol/${name}.svg`, 'utf8');
		const pixels = await page.evaluate(async (svg) => {
			const image = new Image();
			image.src = `data:image/svg+xml;base64,${btoa(svg)}`;
			await image.decode();
			const canvas = document.createElement('canvas');
			const box = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
			canvas.width = Number(box[1]);
			canvas.height = Number(box[2]);
			const context = canvas.getContext('2d', {
				willReadFrequently: true,
			});
			context.drawImage(image, 0, 0);
			return {
				w: canvas.width,
				h: canvas.height,
				data: Array.from(
					context.getImageData(0, 0, canvas.width, canvas.height).data
				),
			};
		}, source);
		const canvas = { w: pixels.w, h: pixels.h, p: [], alpha: [] };
		for (let i = 0; i < pixels.data.length; i += 4) {
			const [red, green, blue, alpha] = pixels.data.slice(i, i + 4);
			canvas.p.push(
				alpha
					? `#${[red, green, blue].map((n) => n.toString(16).padStart(2, '0')).join('')}`
					: null
			);
			canvas.alpha.push(alpha / 255);
		}
		const svg = toSvg(canvas);
		await writeFile(`static/art/symbol/${name}.svg`, svg);
		await writeFile(
			`tools/art/drawings/symbol/${name}.js`,
			`// Approved track symbol ${name}, preserved pixel for pixel.\nimport { fromSvg } from '../../painter.js';\n\nconst SVG = ${JSON.stringify(svg)};\n\nexport function draw() {\n\treturn fromSvg(SVG);\n}\n`
		);
	}
	await page.close();
} finally {
	await browser.close();
}
