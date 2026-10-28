// The component library page (#48) in Chromium (#55): every section renders, without an error in the console.
import { readdirSync } from 'node:fs';
import { expect, test } from '@playwright/test';

/** Every library section, as src/library/sections/<area>/<Name>.svelte; the page shows one per file. */
const SECTIONS = readdirSync(
	new URL('../../src/library/sections/', import.meta.url),
	{ withFileTypes: true }
)
	.filter((entry) => entry.isDirectory())
	.flatMap((area) =>
		readdirSync(
			new URL(`../../src/library/sections/${area.name}/`, import.meta.url)
		).filter((file) => file.endsWith('.svelte'))
	);

test('the library page shows every section, with no console errors', async ({
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
	expect(SECTIONS.length).toBeGreaterThan(40);
	await page.goto('/components.html');
	for (const file of SECTIONS) {
		const name = file.replace(/\.svelte$/, '');
		await expect(
			page.getByRole('heading', { name, exact: true }).first(),
			`the ${name} section`
		).toBeVisible();
	}
	expect(errors).toEqual([]);
});

/**
 * A colour as the page computes it, such as 'rgb(226, 184, 87)' for 'var(--gold)', so a test compares like with like.
 * @param {import('@playwright/test').Page} page
 * @param {string} value - Any CSS colour, token or color-mix()
 * @returns {Promise<string>}
 */
function computedColor(page, value) {
	return page.evaluate((colour) => {
		const probe = document.createElement('i');
		probe.style.color = colour;
		document.body.append(probe);
		const rgb = getComputedStyle(probe).color;
		probe.remove();
		return rgb;
	}, value);
}

test("a decision panel confirms in solid gold, or in its track's colour, as the play mockup does (#65)", async ({
	page,
}) => {
	await page.goto('/components.html');
	const section = page.locator('#decision-panel');
	const gold = await computedColor(page, 'var(--gold)');
	const ink = await computedColor(page, 'var(--ink)');

	for (const [title, label] of [
		['Choose a tapestry card', 'Confirm choice'],
		['Choose where to explore', 'Explore'],
	]) {
		// The section's explores include one with nothing chosen yet; its Explore is disabled.
		const confirm = section
			.getByRole('dialog', { name: title })
			.getByRole('button', { name: label, disabled: false });
		await expect(confirm, title).toHaveCSS('background-color', gold);
		await expect(confirm, title).toHaveCSS('color', ink);
	}

	// A decision about a track keeps the mockup's track tint (main-screen.html, [data-track] #decision-confirm).
	const tracked = section
		.getByRole('dialog', { name: 'Choose a track' })
		.getByRole('button', { name: 'Confirm choice' });
	await expect(tracked).toHaveCSS(
		'background-color',
		await computedColor(
			page,
			'color-mix(in srgb, var(--exploration) 65%, var(--text))'
		)
	);
	await expect(tracked).toHaveCSS('color', ink);
});

test('a tab row too wide for its place scrolls, fades at the cut edge and keeps the selected tab in view (#64)', async ({
	page,
}) => {
	await page.goto('/components.html');
	const section = page.locator('#tabs');
	const row = section.getByRole('tablist', { name: 'A narrow tab row' });
	const last = row.getByRole('tab', { name: 'Terrain' });

	expect(await row.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(
		true
	);
	// More tabs to the right: the row fades out at its right edge.
	expect(
		await row.evaluate((el) => getComputedStyle(el).maskImage)
	).toContain('gradient');

	// Selected from outside the row, as a decision switches the player's tab, the last tab scrolls into view.
	await section.getByRole('button', { name: 'Select Terrain' }).click();
	await expect(last).toHaveAttribute('aria-selected', 'true');
	const box = await row.boundingBox();
	const tab = await last.boundingBox();
	if (!box || !tab) {
		throw new Error('The narrow tab row is not drawn.');
	}
	expect(tab.x).toBeGreaterThanOrEqual(box.x - 0.5);
	expect(tab.x + tab.width).toBeLessThanOrEqual(box.x + box.width + 0.5);
});

test("a progress line's token sits on the line's end, and its marker keeps within the lanes (#72)", async ({
	page,
}) => {
	await page.goto('/components.html');
	const lanes = page.locator('.rg-progress-lanes');
	await expect(lanes.first()).toBeVisible();
	const measured = await lanes.evaluateAll((all) =>
		all.map((el) => {
			const box = el.getBoundingClientRect();
			return {
				// A marker moved past the lanes' right edge would widen what the page scrolls.
				overflow: el.scrollWidth - el.clientWidth,
				offsets: [
					...el.querySelectorAll('.rg-progress-lanes--marker'),
				].map((marker) => {
					const end = Number(
						getComputedStyle(marker).getPropertyValue(
							'--rg-progress-lanes-end'
						)
					);
					const token = /** @type {HTMLElement} */ (
						marker.querySelector('.rg-progress-lanes--token')
					).getBoundingClientRect();
					return (
						(token.left + token.right) / 2 -
						box.left -
						end * box.width
					);
				}),
			};
		})
	);
	expect(measured.length).toBeGreaterThan(0);
	for (const { overflow, offsets } of measured) {
		expect(overflow).toBeLessThanOrEqual(0);
		expect(offsets.length).toBeGreaterThan(0);
		for (const offset of offsets) {
			expect(Math.abs(offset)).toBeLessThan(0.5);
		}
	}
});

test('a hot-seat seat to name draws one gold frame, not one inside another', async ({
	page,
}) => {
	await page.goto('/components.html');
	const seat = page
		.getByRole('group', { name: 'Seat 3: add a player' })
		.first();
	await expect(seat).toBeVisible();
	// The frame is a border with the gold glow around it; the name field and Add have borders but no glow.
	const frames = await seat.evaluate(
		(root) =>
			[root, ...root.querySelectorAll('*')].filter((el) => {
				const style = getComputedStyle(el);
				return (
					style.boxShadow !== 'none' &&
					parseFloat(style.borderTopWidth) > 0
				);
			}).length
	);
	expect(frames).toBe(1);
});

test('two chosen resources are gained, and a resource can be picked with the keyboard (#75)', async ({
	page,
}) => {
	await page.goto('/components.html');
	const rows = page.locator('#resource-rows .rg-resource-rows');
	const gain = rows.nth(0);
	await gain.getByTestId('row-0-coin').focus();
	await page.keyboard.press('Tab');
	await expect(gain.getByTestId('row-0-food')).toBeFocused();
	await page.keyboard.press('Space');
	await expect(gain.getByTestId('row-0-food')).toHaveAttribute(
		'aria-pressed',
		'true'
	);
	// The row's other resources fade but stay in the tab order, so a pick can change.
	for (let i = 0; i < 3; i++) {
		await page.keyboard.press('Tab');
	}
	await expect(gain.getByTestId('row-1-coin')).toBeFocused();
	await page.keyboard.press('Space');
	await expect(page.getByTestId('resource-rows-report')).toHaveText(
		'Last pick: row 2: coin'
	);

	// A resource no answer allows is skipped.
	const pay = rows.nth(3);
	await expect(pay.getByTestId('row-1-worker')).toBeDisabled();
	await pay.getByTestId('row-1-food').focus();
	await page.keyboard.press('Tab');
	await expect(pay.getByTestId('row-1-culture')).toBeFocused();
});

test('the decision panel section shows the four pick prompts the owner approved, and not the list they replace (#75)', async ({
	page,
}) => {
	await page.goto('/components.html');
	const section = page.locator('#decision-panel');
	for (const name of [
		'Choose 3 resources',
		'Advance to Tanks',
		'Take the bonus: gain 10 VP?',
		'Choose a trade',
	]) {
		await expect(section.getByRole('dialog', { name })).toBeVisible();
	}
	await expect(
		section.getByRole('dialog', { name: 'How do you pay for Ships?' })
	).toHaveCount(0);
});

test('with a decision panel open, the dice tray rolls clear of it (#61)', async ({
	page,
}) => {
	await page.goto('/components.html');
	await page.getByRole('button', { name: 'Roll beside the panel' }).click();
	const stage = page.locator('.rg-library-tray-stage--screen');
	const tray = stage.locator('.rg-dice-tray');
	await expect(tray).toBeVisible();
	const a = await tray.boundingBox();
	const b = await stage.locator('.rg-decision-panel--panel').boundingBox();
	if (!a || !b) {
		throw new Error('No tray or panel.');
	}
	const overlap =
		a.x < b.x + b.width &&
		b.x < a.x + a.width &&
		a.y < b.y + b.height &&
		b.y < a.y + a.height;
	expect(overlap).toBe(false);
});
