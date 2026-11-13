// Motion in Chromium (#175), with motion on: a track token hops and comes to rest on its space, or goes there still
// under Skip all (#179), a hand's cards come in
// and close up, a prompt rises with its shelf dealt in from a deck one card after another (#176), and a menu lifts
// away; each settles where it rests. Under
// reduced motion nothing moves. The rest of the suite runs with reduced motion (playwright.config.js). The test uses
// the component library only, so it opens no table.
import { expect, test } from '@playwright/test';

test.use({ reducedMotion: 'no-preference' });

// Every element that starts to move is noted as it starts, so a busy machine that is slow to look can't miss a short
// motion: Web Animations (the token's hop, Svelte's transitions), CSS animations and CSS transitions.
test.beforeEach(async ({ page }) => {
	await page.addInitScript(() => {
		const started = new Set();
		Object.defineProperty(window, 'rgMoved', { value: started });
		// Each Web Animation's first frame and delay, by element, for the deal (#176).
		const flights = new Map();
		Object.defineProperty(window, 'rgFlights', { value: flights });
		const animate = Element.prototype.animate;
		Element.prototype.animate = function (...args) {
			started.add(this);
			const [frames, options] = args;
			if (Array.isArray(frames) && typeof options === 'object') {
				flights.set(this, {
					from: String(frames[0]?.transform ?? ''),
					delay: options.delay ?? 0,
				});
			}
			return animate.apply(this, args);
		};
		for (const type of ['animationstart', 'transitionrun']) {
			document.addEventListener(
				type,
				(event) => started.add(event.target),
				true
			);
		}
	});
});

/**
 * Whether anything in the element has started to move since the page last forgot.
 * @param {import('@playwright/test').Locator} locator
 * @returns {Promise<boolean>}
 */
const moved = (locator) =>
	locator.evaluate((element) =>
		[
			.../** @type {Set<Node>} */ (/** @type {any} */ (window).rgMoved),
		].some((one) => element.contains(one))
	);

/**
 * Forgets what has moved so far.
 * @param {import('@playwright/test').Page} page
 */
const forget = (page) =>
	page.evaluate(() => /** @type {any} */ (window).rgMoved.clear());

/**
 * How many animations run in an element and its children now.
 * @param {import('@playwright/test').Locator} locator
 * @returns {Promise<number>}
 */
const running = (locator) =>
	locator.evaluate(
		(element) => element.getAnimations({ subtree: true }).length
	);

/** @param {import('@playwright/test').Locator} locator */
const pageBounds = (locator) =>
	locator.evaluate((element) => {
		const rect = element.getBoundingClientRect();
		return {
			x: rect.left + window.scrollX,
			y: rect.top + window.scrollY,
			width: rect.width,
			height: rect.height,
		};
	});

/**
 * Waits until nothing in the element moves any more.
 * @param {import('@playwright/test').Locator} locator
 */
async function settled(locator) {
	await expect.poll(() => running(locator)).toBe(0);
}

test('a track token hops to its new space and comes to rest on it (#175)', async ({
	page,
}) => {
	await page.goto('/components.html#progress-lanes');
	const example = page.locator('.rg-library-progress-lanes--hop');
	const lanes = example.locator('.rg-progress-lanes');
	await expect(lanes).toHaveAttribute('aria-label', 'You 1, Ana 2');
	await settled(lanes);
	await forget(page);
	await example.getByRole('button', { name: 'Advance 3' }).click();
	await expect(lanes).toHaveAttribute('aria-label', 'You 4, Ana 2');
	// The hop, the landing and the ring play on the marker as it slides.
	await expect
		.poll(() => moved(lanes.locator('.rg-progress-lanes--token').first()))
		.toBe(true);
	await settled(lanes);
	const token = lanes.locator('.rg-progress-lanes--token').first();
	await expect(token).toHaveCSS('transform', 'none');
	await expect(token).toHaveCSS('opacity', '1');
});

test('a still token goes to its new space at once, without a hop or a slide, and the next move hops (#179)', async ({
	page,
}) => {
	await page.goto('/components.html#progress-lanes');
	const example = page.locator('.rg-library-progress-lanes--hop');
	const lanes = example.locator('.rg-progress-lanes');
	await expect(lanes).toHaveAttribute('aria-label', 'You 1, Ana 2');
	await settled(lanes);
	await forget(page);
	// Skip all leaves every token on its final space at once.
	await example.getByRole('button', { name: 'Skip all: 3 at once' }).click();
	await expect(lanes).toHaveAttribute('aria-label', 'You 4, Ana 2');
	await page.waitForTimeout(300);
	expect(await moved(lanes)).toBe(false);
	await example
		.getByRole('button', { name: 'Advance 1', exact: true })
		.click();
	await expect(lanes).toHaveAttribute('aria-label', 'You 5, Ana 2');
	await expect
		.poll(() => moved(lanes.locator('.rg-progress-lanes--token').first()))
		.toBe(true);
});

test("a hand's gained card rises in and the others close up when one is played (#175)", async ({
	page,
}) => {
	await page.goto('/components.html#card-fan');
	const example = page
		.locator('#card-fan')
		.locator('div', {
			has: page.getByRole('button', { name: 'Gain a card' }),
		})
		.last();
	const cards = example.locator('.rg-card-fan--card');
	await expect(cards).toHaveCount(3);
	await settled(example);
	await forget(page);
	await example.getByRole('button', { name: 'Gain a card' }).click();
	await expect(cards).toHaveCount(4);
	await expect.poll(() => moved(cards.last())).toBe(true);
	await settled(example);
	await forget(page);
	await example.getByRole('button', { name: 'Play the second card' }).click();
	await expect(cards).toHaveCount(3);
	// The cards after the one played glide into its place.
	await expect.poll(() => moved(cards.nth(1))).toBe(true);
	await settled(example);
	for (const card of await cards.all()) {
		await expect(card).toHaveCSS('opacity', '1');
	}
});

test('a prompt opened again rises over its scrim, deals its shelf in and rests at the tracks’ centre (#175)', async ({
	page,
}) => {
	await page.goto('/components.html#decision-panel');
	const section = page.locator('#decision-panel');
	const example = section.locator('.rg-library-decision-panel-shelf');
	const first = example.locator('.rg-decision-panel').first();
	await expect(first).toBeVisible();
	await settled(first);
	const panel = first.locator('.rg-decision-panel--panel');
	const rest = await pageBounds(panel);
	await forget(page);
	await example.getByRole('button', { name: 'Open again' }).click();
	const again = example.locator('.rg-decision-panel').first();
	await expect
		.poll(() => moved(again.locator('.rg-decision-panel--panel')))
		.toBe(true);
	await expect
		.poll(() => moved(again.locator('.rg-card-fan--card').first()))
		.toBe(true);
	await settled(again);
	const reopenedPanel = again.locator('.rg-decision-panel--panel');
	await expect(reopenedPanel).toHaveCSS('opacity', '1');
	const reopened = await pageBounds(reopenedPanel);
	for (const dimension of /** @type {const} */ ([
		'x',
		'y',
		'width',
		'height',
	])) {
		expect(Math.abs(reopened[dimension] - rest[dimension])).toBeLessThan(1);
	}
});

test('a shelf deals its cards in from a deck at the left, one after another (#176)', async ({
	page,
}) => {
	await page.goto('/components.html#decision-panel');
	const section = page.locator('#decision-panel');
	const example = section.locator('.rg-library-decision-panel-shelf');
	await settled(example.locator('.rg-decision-panel').first());
	await example.getByRole('button', { name: 'Open again' }).click();
	const cards = example
		.locator('.rg-decision-panel')
		.first()
		.locator('.rg-card-fan--card');
	await expect(cards).toHaveCount(3);
	const flights = () =>
		cards.evaluateAll((all) =>
			all.map(
				(card) =>
					/** @type {any} */ (window).rgFlights.get(card) ?? null
			)
		);
	await expect.poll(async () => (await flights()).every(Boolean)).toBe(true);
	const dealt = await flights();
	expect(dealt.map((flight) => flight.delay)).toEqual([0, 130, 260]);
	for (const flight of dealt) {
		// Each leaves the deck turned, from the left of where it rests.
		expect(flight.from).toMatch(
			/^translate\(-\d+(\.\d+)?px, -?\d+(\.\d+)?px\) rotate\(-14deg\)$/
		);
	}
	await settled(example.locator('.rg-decision-panel').first());
	for (const card of await cards.all()) {
		await expect(card).toHaveCSS('opacity', '1');
	}
});

test('a menu lifts away when it closes and drops from its button when it opens (#175)', async ({
	page,
}) => {
	await page.goto('/components.html#menu');
	const section = page.locator('#menu');
	const toggle = section.getByRole('button', { name: 'Menu' }).first();
	const menus = section.getByRole('menu');
	await expect(menus).toHaveCount(3);
	await toggle.click();
	await expect(menus).toHaveCount(2);
	await forget(page);
	await toggle.click();
	await expect(menus).toHaveCount(3);
	await expect.poll(() => moved(menus.first())).toBe(true);
	await settled(menus.first());
	await expect(menus.first()).toHaveCSS('opacity', '1');
});

test('under reduced motion nothing hops, rises or deals (#175)', async ({
	page,
}) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/components.html#progress-lanes');
	const example = page.locator('.rg-library-progress-lanes--hop');
	const lanes = example.locator('.rg-progress-lanes');
	await forget(page);
	await example.getByRole('button', { name: 'Advance 3' }).click();
	await expect(lanes).toHaveAttribute('aria-label', 'You 4, Ana 2');
	const section = page.locator('#decision-panel');
	const shelfExample = section.locator('.rg-library-decision-panel-shelf');
	await shelfExample.getByRole('button', { name: 'Open again' }).click();
	await expect(
		shelfExample.locator('.rg-decision-panel--panel').first()
	).toBeVisible();
	await page.waitForTimeout(300);
	expect(await moved(lanes)).toBe(false);
	expect(await moved(shelfExample.locator('.rg-decision-panel').first())).toBe(
		false
	);
});
