// The game page in Chromium (#55): a new visitor lands on the landing page, without an error in the console.
import { expect, test } from '@playwright/test';

test('the game page shows the landing page, with no console errors', async ({
	page,
}) => {
	/** @type {string[]} */
	const errors = [];
	page.on('console', (message) => {
		if (message.type() === 'error') {
			errors.push(message.text());
		}
	});
	page.on('pageerror', (error) => errors.push(error.message));
	await page.goto('/');
	await expect(
		page.getByRole('button', { name: 'Create a table' })
	).toBeVisible();
	await expect(
		page.getByRole('textbox', { name: 'Your name' })
	).toBeVisible();
	await expect(
		page.getByRole('heading', { name: 'Open tables' })
	).toBeVisible();
	const texture = await page
		.locator('.rg-landing')
		.evaluate(async (surface) => {
			const background = getComputedStyle(surface).backgroundImage;
			const url = background.match(/url\(["']?([^"')]+)/)?.[1];
			if (!url) return false;
			const image = new Image();
			image.src = url;
			try {
				await image.decode();
				return (
					image.naturalWidth === 256 && image.naturalHeight === 256
				);
			} catch {
				return false;
			}
		});
	expect(texture, 'the pixel noise SVG renders as a background').toBe(true);
	expect(errors).toEqual([]);
});
