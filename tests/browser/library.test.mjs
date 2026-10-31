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

test('the library opens without drawing the art below the fold (#82)', async ({
	page,
}) => {
	await page.goto('/components.html');
	const tile = page.locator('figure[data-id="capital-relief/mountain"]');
	await expect(tile).toHaveAttribute('data-drawn', 'yes');
	expect(await tile.locator('img').count(), 'drawn at load').toBe(0);
	const waiting = await tile.boundingBox();

	await tile.scrollIntoViewIfNeeded();
	await expect(tile).toHaveAttribute('data-loaded', 'yes');
	await expect(tile.locator('img')).toHaveCount(2);
	// Its placeholder took the picture's room, so the slot doesn't jump when the picture lands.
	const drawn = await tile.boundingBox();
	expect(drawn?.width).toBe(waiting?.width);
	expect(drawn?.height).toBe(waiting?.height);
});

test('territory tiles show their reward icon and matching hover words (#150)', async ({
	page,
}) => {
	await page.goto('/components.html#territory-tile');
	const coinTile = page.locator(
		'#territory-tile .rg-territory-tile[aria-label^="Territory tile 1:"]'
	);
	// A title attribute, which the styled Tooltip shows; an SVG <title> would show the browser's own.
	await expect(coinTile.first()).toHaveAttribute('title', /Benefit:.*coin/i);
	await expect(coinTile.first().locator('title')).toHaveCount(0);
	await expect(
		coinTile.first().locator('.rg-territory-tile--reward-icon')
	).toHaveAttribute('href', '/art/resource-24/coin.svg');
	const twoTileReward = page.locator(
		'#territory-tile .rg-territory-tile[aria-label^="Territory tile 2:"]'
	);
	await expect(
		twoTileReward.locator('.rg-territory-tile--reward-count')
	).toHaveText('×2');
	const researchTile = page.locator(
		'#territory-tile .rg-territory-tile[aria-label^="Territory tile 12:"]'
	);
	await expect(
		researchTile.locator('.rg-territory-tile--reward-cross')
	).toBeVisible();
});

test('income mat rewards use shared symbols and retain readable accessible labels (#151)', async ({
	page,
}) => {
	await page.goto('/components.html#income-mat');
	const section = page.locator('#income-mat');
	const barter = section.getByRole('img', {
		name: /Barter\. Income: Gain 1 coin\. Score: Gain 1 VP per tech card/,
	});
	await expect(barter).toBeVisible();
	await expect(barter.getByText('Income:')).toBeVisible();
	await expect(barter.getByText('Score')).toHaveCount(0);
	await expect(barter.getByText('Gain 1 coin')).toHaveCount(0);
	await expect(barter.locator('img').first()).toHaveAttribute(
		'src',
		'/art/resource-24/coin.svg'
	);
	await expect(barter.locator('img').nth(1)).toHaveAttribute(
		'src',
		'/art/symbol/victory-points.svg'
	);
	await expect(barter.locator('img').nth(2)).toHaveAttribute(
		'src',
		'/art/symbol/tech-card.svg'
	);

	const biometrics = section.getByRole('img', {
		name: /Biometrics\. Score: Gain 10 VP/,
	});
	await expect(biometrics).toBeVisible();
	await expect(biometrics.locator('img')).toHaveAttribute(
		'src',
		'/art/symbol/victory-points.svg'
	);
	await expect(biometrics.locator('b').last()).toHaveText('10');
});

test('covered income buildings lift to reveal their printed rewards without changing cell size (#142)', async ({
	page,
}) => {
	await page.goto('/components.html#income-mat');
	const section = page.locator('#income-mat');
	const barterCell = section.locator('.rg-income-mat--space-covered').first();
	const building = barterCell.locator('.rg-income-mat--building');
	const cover = barterCell.locator('.rg-income-mat--cover');
	const content = barterCell.locator('.rg-income-mat--tile-content');
	const before = await barterCell.boundingBox();
	await expect(content.getByText('Currency')).toBeVisible();
	await expect(cover).toHaveCSS('transform', 'none');
	await barterCell.hover();
	await expect(content.getByText('Income:')).toBeVisible();
	await expect(cover).toHaveCSS('transform', /matrix\(/);
	await expect(building).toBeVisible();
	const after = await barterCell.boundingBox();
	expect(after?.width).toBe(before?.width);
	expect(after?.height).toBe(before?.height);

	await barterCell.focus();
	await expect(barterCell).toBeFocused();
	await expect(content.getByText('Currency')).toBeVisible();
	await expect(cover).toHaveCSS('transform', /matrix\(/);
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
			.getByRole('dialog', { name: title, exact: true })
			.getByRole('button', { name: label, disabled: false });
		await expect(confirm, title).toHaveCSS('background-color', gold);
		await expect(confirm, title).toHaveCSS('color', ink);
	}

	// A decision about a track keeps the mockup's track tint (main-screen.html, [data-track] #decision-confirm).
	const tracked = section
		.getByRole('dialog', { name: 'Choose a track', exact: true })
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
	// The frame is a border with the gold glow around it: a shadow that blurs. The name field and Add have borders but no glow; the focused field's 1px gold ring does not blur (owner, 2026-10-30).
	const frames = await seat.evaluate(
		(root) =>
			[root, ...root.querySelectorAll('*')].filter((el) => {
				const style = getComputedStyle(el);
				return (
					/\) -?[\d.]+px -?[\d.]+px [1-9]/.test(style.boxShadow) &&
					parseFloat(style.borderTopWidth) > 0
				);
			}).length
	);
	expect(frames).toBe(1);
	// The name field and Add are the shared TextInput and gold Button.
	await expect(seat.locator('.rg-text-input--field')).toHaveCount(1);
	await expect(
		seat.getByRole('button', { name: 'Add', exact: true })
	).toHaveClass(/rg-button--gold/);
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

test('the dice tray fades out rather than vanishing (#61)', async ({
	page,
}) => {
	await page.goto('/components.html');
	await page.getByRole('button', { name: 'Roll the conquer dice' }).click();
	const tray = page.locator('.rg-dice-tray').first();
	await expect(tray).toBeVisible();
	await tray.click();
	// Dismissed, it stays a moment while its fade runs.
	const fading = await page.evaluate(() => {
		const el = document.querySelector('.rg-dice-tray');
		return el ? el.getAnimations().length > 0 : false;
	});
	expect(fading).toBe(true);
	await expect(tray).toHaveCount(0);
});

test('the library shows the first-income notice and the forced-income footer (#77)', async ({
	page,
}) => {
	await page.goto('/components.html');
	const notice = page.locator('.rg-income-notice').first();
	await expect(
		notice.getByRole('heading', { name: 'Era I begins' })
	).toBeVisible();
	await expect(notice.getByRole('button', { name: 'Got it' })).toBeVisible();
	const forced = page
		.locator('.rg-turn-bar')
		.filter({
			hasText: "You can't pay for any advance, so take an income turn.",
		})
		.first();
	await expect(
		forced
			.locator('.rg-turn-bar--actions')
			.getByRole('button', { name: 'Take income' })
	).toBeVisible();
	await expect(forced.locator('.rg-income-reveal')).toHaveCount(0);
});

/**
 * A CapitalGrid library example, found by text in its label.
 * @param {import('@playwright/test').Page} page
 * @param {string} text - Part of the example's label
 * @returns {import('@playwright/test').Locator}
 */
function capitalExample(page, text) {
	return page
		.locator('#capital-grid figure')
		.filter({ has: page.locator('figcaption', { hasText: text }) });
}

test('a capital draws its relief over the ground, under the buildings and the district dashes (#82)', async ({
	page,
}) => {
	await page.goto('/components.html');
	const mountain = capitalExample(page, 'cube on plot 0');
	const relief = mountain.locator(
		'img[src$="/art/capital-relief/mountain.svg"]'
	);
	await expect(relief).toBeVisible();
	await expect(relief).toHaveCSS('pointer-events', 'none');
	await expect(relief).toHaveCSS('z-index', '1');

	// The farm on plot 26 sits beside the Forest's corner join at row 2, column 7: it must draw over the relief.
	const forest = capitalExample(page, 'farm on plot 26');
	const farm = forest.locator(
		'[data-plot="26"] img[src$="/art/building/farm.svg"]'
	);
	await expect(farm).toHaveCSS('z-index', '1');
	expect(
		await forest.evaluate((root) => {
			const art = root.querySelector(
				'img[src$="/art/capital-relief/forest.svg"]'
			);
			const building = root.querySelector(
				'[data-plot="26"] img[src$="/art/building/farm.svg"]'
			);
			return Boolean(
				art &&
				building &&
				art.compareDocumentPosition(building) &
					Node.DOCUMENT_POSITION_FOLLOWING
			);
		}),
		'the farm comes after the relief'
	).toBe(true);

	// The district dashes stay on top of the relief.
	expect(
		await mountain
			.locator('.rg-capital-grid')
			.evaluate((grid) => getComputedStyle(grid, '::before').zIndex)
	).toBe('2');

	// The relief replaces the red X of an impassable plot.
	const blocked = page.locator('#capital-grid .rg-capital-grid--blocked');
	expect(await blocked.count()).toBeGreaterThan(0);
	expect(
		await blocked.evaluateAll(
			(all) =>
				all.filter(
					(plot) =>
						getComputedStyle(plot, '::after').content !== 'none'
				).length
		)
	).toBe(0);
});

test("an Architects' cube stands on its plot, and a terraformed plot's ground covers the relief (#82)", async ({
	page,
}) => {
	await page.goto('/components.html');
	const mountain = capitalExample(page, 'cube on plot 0');
	await expect(
		mountain.locator(
			'[data-plot="0"] img[src$="/art/piece/architects-cube.svg"]'
		)
	).toBeVisible();
	// Plot 9 is printed impassable; the farm built on it clears the relief there, and plot 10 keeps it.
	await expect(
		mountain.locator('[data-plot="9"] img[src$="/art/building/farm.svg"]')
	).toBeVisible();
	await expect(
		mountain.locator(
			'[data-plot="9"] img[src*="/art/capital-terrain/mountain-open-"]'
		)
	).toHaveCSS('z-index', '1');
	await expect(
		mountain.locator(
			'[data-plot="10"] img[src*="/art/capital-terrain/mountain-open-"]'
		)
	).toHaveCSS('z-index', 'auto');
});

test('the plots line up with the relief: a proportional gap (#82)', async ({
	page,
}) => {
	await page.goto('/components.html');
	const grid = capitalExample(page, 'cube on plot 0').locator(
		'.rg-capital-grid'
	);
	await expect(grid).toBeVisible();
	const measured = await grid.evaluate((root) => {
		const style = getComputedStyle(root);
		const outer = root.getBoundingClientRect();
		/** @param {string} selector */
		const box = (selector) =>
			/** @type {Element} */ (
				root.querySelector(selector)
			).getBoundingClientRect();
		const first = box('[data-plot="0"]');
		const relief = box('img[src$="/art/capital-relief/mountain.svg"]');
		return {
			unit:
				(outer.width -
					parseFloat(style.paddingLeft) -
					parseFloat(style.paddingRight)) /
				296,
			across: box('[data-plot="1"]').left - first.right,
			down: box('[data-plot="9"]').top - first.bottom,
			// The relief covers exactly what the plots span.
			edges: [
				relief.left - first.left,
				relief.top - first.top,
				relief.right - box('[data-plot="8"]').right,
				relief.bottom - box('[data-plot="80"]').bottom,
			],
		};
	});
	expect(Math.abs(measured.across - measured.unit)).toBeLessThan(0.5);
	expect(Math.abs(measured.down - measured.unit)).toBeLessThan(0.5);
	for (const edge of measured.edges) {
		expect(Math.abs(edge)).toBeLessThan(0.5);
	}
});

test('a landmark over the edge still lines up with the plots (#82)', async ({
	page,
}) => {
	await page.goto('/components.html');
	const grid = capitalExample(page, 'col -1]}  (over the left edge').locator(
		'.rg-capital-grid'
	);
	await expect(grid).toBeVisible();
	const measured = await grid.evaluate((root) => {
		/** @param {string} selector */
		const box = (selector) =>
			/** @type {Element} */ (
				root.querySelector(selector)
			).getBoundingClientRect();
		const ninth = box('[data-plot="9"]');
		const tenth = box('[data-plot="10"]');
		const piece = box('[data-piece="lighthouse"]');
		return {
			left: piece.left - (ninth.left - (tenth.left - ninth.left)),
			right: piece.right - ninth.right,
			top: piece.top - box('[data-plot="54"]').top,
			bottom: piece.bottom - box('[data-plot="63"]').bottom,
		};
	});
	for (const [edge, offset] of Object.entries(measured)) {
		expect(Math.abs(offset), edge).toBeLessThan(1);
	}
});

test("an arrow key steps a landmark among the engine's places, over the edge included (#112, R14)", async ({
	page,
}) => {
	await page.goto('/components.html');
	const example = capitalExample(page, 'positions={[row 6 col 5');
	const piece = example.locator('[data-piece="lighthouse"]');
	await expect(piece).toHaveCSS('grid-column-start', '6');
	await piece.locator('[tabindex="0"]').focus();
	await page.keyboard.press('ArrowRight');
	await expect(example.locator('figcaption')).toContainText(
		'row 6, col 8, rotation 0'
	);
	await expect(piece).toHaveCSS('grid-column-start', '9');
	await expect(piece).toHaveCSS('grid-column-end', 'span 1');
	await page.keyboard.press('ArrowRight');
	await expect(example.locator('figcaption')).toContainText('row 6, col 8');
	await page.keyboard.press('ArrowDown');
	await expect(example.locator('figcaption')).toContainText(
		'row 8, col 5, rotation 0'
	);
	await page.keyboard.press('.');
	await expect(example.locator('figcaption')).toContainText(
		'row 8, col 5, rotation 1'
	);
});

test('a mat on offer shows its relief (#82)', async ({ page }) => {
	await page.goto('/components.html');
	const example = page
		.locator('#card-shelf figure')
		.filter({ has: page.locator('figcaption', { hasText: 'kind="mat"' }) });
	await expect(
		example.locator('img[src$="/art/capital-relief/mountain.svg"]')
	).toBeVisible();
});

test('a target under a corner patch still takes the click (#82)', async ({
	page,
}) => {
	await page.goto('/components.html');
	const example = capitalExample(page, 'targets={forestOpen}');
	const target = example.locator('button[data-plot="26"]');
	await target.scrollIntoViewIfNeeded();
	expect(
		await target.evaluate((button) => {
			const box = button.getBoundingClientRect();
			const top = document.elementFromPoint(
				box.left + box.width / 2,
				box.top + box.height / 2
			);
			return top !== null && button.contains(top);
		})
	).toBe(true);
	// Playwright's click fails when another element would take it.
	await target.click();
	await expect(target).toHaveAttribute('aria-pressed', 'true');
});

test('a hovered target stays over the relief (#82)', async ({ page }) => {
	await page.goto('/components.html');
	const target = capitalExample(page, 'targets={forestOpen}').locator(
		'button[data-plot="26"]'
	);
	await target.hover();
	// A filtered button would be a stacking context of its own, drawn under the relief; its pictures brighten instead.
	await expect(target).toHaveCSS('filter', 'none');
	await expect(target.locator('img').first()).toHaveCSS(
		'filter',
		'brightness(1.15)'
	);
});

test('a landmark moves onto the capital by keyboard, turns, locks, and starts again (#111)', async ({
	page,
}) => {
	await page.goto('/components.html');
	const example = capitalExample(page, 'Interactive: PlacementTray');
	const caption = example.locator('figcaption');
	await expect(caption).toContainText('pieces=[]');

	// An arrow key on the tray's piece puts it on the grid, and the grid's piece takes the focus.
	await example
		.getByRole('button', { name: /^Lighthouse, \d+ plots, to be placed$/ })
		.press('ArrowRight');
	await expect(caption).toContainText(
		/Lighthouse at row \d, col \d, rotation 0\]/
	);
	const placed = example.getByRole('button', {
		name: /^Lighthouse, \d+ plots, not confirmed/,
	});
	await expect(placed).toBeFocused();
	const [, row, col] = /row (\d), col (\d)/.exec(
		(await caption.textContent()) ?? ''
	) ?? ['', '0', '0'];

	await page.keyboard.press('ArrowDown');
	await expect(caption).toContainText(
		`Lighthouse at row ${Number(row) + 1}, col ${col}, rotation 0]`
	);
	await page.keyboard.press('.');
	await expect(caption).toContainText('rotation 1]');
	await page.keyboard.press('Enter');
	await expect(caption).toContainText('rotation 1, locked]');

	await example.getByRole('button', { name: 'Start again' }).click();
	await expect(caption).toContainText('pieces=[]');
});

test('a landmark drags from the tray onto the capital and back (#111)', async ({
	page,
}) => {
	await page.goto('/components.html');
	const example = capitalExample(page, 'Interactive: PlacementTray');
	const caption = example.locator('figcaption');
	await expect(caption).toContainText('pieces=[]');

	await example
		.getByRole('button', { name: /^Lighthouse, \d+ plots, to be placed$/ })
		.dragTo(example.locator('[data-plot="40"]'));
	await expect(caption).toContainText(
		/Lighthouse at row \d, col \d, rotation 0\]/
	);

	// The tray only shows itself as a drop target once a drag has started, so the drag back is driven by hand.
	const placed = example.getByRole('button', {
		name: /^Lighthouse, \d+ plots, not confirmed/,
	});
	await placed.hover();
	await page.mouse.down();
	const box = await placed.boundingBox();
	await page.mouse.move((box?.x ?? 0) + 5, (box?.y ?? 0) + 5, { steps: 5 });
	const tray = example.getByRole('region', { name: 'To be placed' });
	await expect(tray).toBeVisible();
	await tray.hover();
	await page.mouse.up();
	await expect(caption).toContainText('pieces=[]');
});

/**
 * A covered space of the IncomeMat section's mid-game mat, with its parts.
 * @param {import('@playwright/test').Page} page
 * @param {string} name - The space's innovation
 */
function coveredSpace(page, name) {
	const space = page
		.locator('#income-mat figure')
		.filter({ has: page.locator('figcaption', { hasText: 'mid-game' }) })
		.locator('.rg-income-mat--space-covered')
		.filter({
			has: page.locator('.rg-income-mat--name', { hasText: name }),
		});
	return {
		space,
		cover: space.locator('.rg-income-mat--cover'),
		building: space.locator('.rg-income-mat--building'),
		reward: space.locator('.rg-income-mat--reward'),
	};
}

test('pointing at a covered income tile slides its cover left and restores it on leave (#151)', async ({
	page,
}) => {
	await page.goto('/components.html#income-mat');
	const telephone = coveredSpace(page, 'Telephone');
	await telephone.space.scrollIntoViewIfNeeded();
	const resting = await telephone.space.boundingBox();

	// The building cover hides the shared printed tile at rest.
	await expect(
		telephone.space.locator('.rg-income-mat--effect-label')
	).toHaveText('Income:');
	await expect(telephone.cover).toHaveCSS('transform', 'none');

	await telephone.space.hover();
	await expect(telephone.cover).toHaveCSS('transform', /matrix\(/);
	expect(await telephone.space.boundingBox()).toEqual(resting);

	await page.mouse.move(0, 0);
	await expect(telephone.cover).toHaveCSS('transform', 'none');
});

test('keyboard focus reveals a covered income tile without a lifted preview prop (#151)', async ({
	page,
}) => {
	await page.goto('/components.html#income-mat');
	const creditCards = coveredSpace(page, 'Credit Cards');
	await expect(creditCards.cover).toHaveCSS('transform', 'none');

	const telephone = coveredSpace(page, 'Telephone');
	const email = coveredSpace(page, 'Email');
	await telephone.space.focus();
	await page.keyboard.press('Tab');
	await expect(email.space).toBeFocused();
	await expect(email.cover).toHaveCSS('transform', /matrix\(/);
	await expect(telephone.cover).toHaveCSS('transform', 'none');
});

test('with reduced motion, covered income tile reveal slides immediately (#151)', async ({
	page,
}) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/components.html#income-mat');
	const telephone = coveredSpace(page, 'Telephone');
	await telephone.space.scrollIntoViewIfNeeded();
	const before = await telephone.space.boundingBox();
	await telephone.space.hover();
	await expect(telephone.cover).toHaveCSS('transform', /matrix\(/);
	await expect(telephone.cover).toHaveCSS('opacity', '1');
	expect(await telephone.space.boundingBox()).toEqual(before);
});
