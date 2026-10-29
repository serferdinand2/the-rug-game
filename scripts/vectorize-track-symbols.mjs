import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const names = ['tech-card', 'tapestry-card', 'civilization-card'];
const browser = await chromium.launch({
	headless: true,
	executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
});

try {
	const page = await browser.newPage();
	for (const name of names) {
		const png = await readFile(`art/exports/track-symbols-png/${name}.png`);
		const pixels = await page.evaluate(async (base64) => {
			const image = new Image();
			image.src = `data:image/png;base64,${base64}`;
			await image.decode();
			const canvas = document.createElement('canvas');
			canvas.width = image.naturalWidth;
			canvas.height = image.naturalHeight;
			const context = canvas.getContext('2d', {
				willReadFrequently: true,
			});
			context.drawImage(image, 0, 0);
			return {
				width: canvas.width,
				height: canvas.height,
				data: Array.from(
					context.getImageData(0, 0, canvas.width, canvas.height).data
				),
			};
		}, png.toString('base64'));
		const rows = [];
		for (let y = 0; y < pixels.height; y++) {
			for (let x = 0; x < pixels.width;) {
				const offset = 4 * (y * pixels.width + x);
				const rgba = pixels.data.slice(offset, offset + 4);
				if (rgba[3] === 0) {
					x++;
					continue;
				}
				let end = x + 1;
				while (end < pixels.width) {
					const next = 4 * (y * pixels.width + end);
					if (
						rgba.some(
							(channel, index) =>
								channel !== pixels.data[next + index]
						)
					)
						break;
					end++;
				}
				const hex = rgba
					.slice(0, 3)
					.map((value) => value.toString(16).padStart(2, '0'))
					.join('');
				const opacity =
					rgba[3] === 255
						? ''
						: ` opacity="${(rgba[3] / 255).toFixed(6)}"`;
				rows.push(
					`<path fill="#${hex}"${opacity} d="M${x} ${y}h${end - x}v1H${x}z"/>`
				);
				x = end;
			}
		}
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${pixels.width} ${pixels.height}" shape-rendering="crispEdges">${rows.join('')}</svg>\n`;
		await writeFile(`static/art/symbol/${name}.svg`, svg);
	}
	await page.close();
} finally {
	await browser.close();
}
