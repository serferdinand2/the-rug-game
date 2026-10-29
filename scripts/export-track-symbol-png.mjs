import { readFile, mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const output = 'art/exports/track-symbols-png';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
	headless: true,
	executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
});

try {
	for (const name of ['tech-card', 'tapestry-card', 'civilization-card']) {
		const svg = await readFile(`static/art/symbol/${name}.svg`);
		const page = await browser.newPage({
			viewport: { width: 24, height: 24 },
			deviceScaleFactor: 1,
		});
		const image = `data:image/svg+xml;base64,${svg.toString('base64')}`;
		await page.setContent(
			`<body style="margin:0;background:transparent"><img width="24" height="24" src="${image}"></body>`
		);
		await page.locator('img').screenshot({
			path: `${output}/${name}.png`,
			omitBackground: true,
		});
		await page.close();
	}
} finally {
	await browser.close();
}
