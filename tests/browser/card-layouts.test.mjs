// Card frames keep one art inset and a full-width edition rule; long tapestry text grows the card and its scaled shelf face.
import { expect, test } from '@playwright/test';

test('card art and edition rules align, and tapestry cards grow with their text', async ({
	page,
}) => {
	test.setTimeout(90_000);
	await page.goto('/components.html', {
		waitUntil: 'domcontentloaded',
		timeout: 30_000,
	});
	await page
		.locator('#card-frame article.rg-card-frame')
		.first()
		.waitFor({ state: 'attached', timeout: 60_000 });
	for (const [frame, art, footer] of [
		[
			'#card-frame article.rg-card-frame',
			'.rg-card-frame--portrait',
			'.rg-card-frame--foot',
		],
		[
			'#technology-card .rg-tech-layout',
			'.rg-tech-layout--art',
			'.rg-tech-layout--footer',
		],
		[
			'#tapestry-card .rg-tapestry-layout',
			'.rg-tapestry-layout--portrait img',
			'.rg-tapestry-layout--footer',
		],
	]) {
		const card = page.locator(frame).first();
		const positions = await card.evaluate(
			(element, selectors) => {
				const box = (selector) =>
					(
						element.querySelector(selector) ??
						(() => {
							throw new Error(
								'Missing ' +
									selector +
									' in ' +
									element.className
							);
						})()
					).getBoundingClientRect();
				const outer = element.getBoundingClientRect();
				const header = element.querySelector('header');
				if (!header)
					throw new Error(
						'Missing header in ' + element.outerHTML.slice(0, 200)
					);
				const band = header.getBoundingClientRect();
				const picture = box(selectors.art);
				const edition = box(selectors.footer);
				return {
					left: picture.left - outer.left,
					top: picture.top - band.bottom,
					footerLeft: edition.left - outer.left,
					footerRight: outer.right - edition.right,
				};
			},
			{ art, footer }
		);
		expect(positions.left, frame).toBeCloseTo(14, 0);
		expect(positions.top, frame).toBeCloseTo(12, 0);
		expect(positions.footerLeft, frame).toBeCloseTo(2, 0);
		expect(positions.footerRight, frame).toBeCloseTo(2, 0);
	}

	const card = page.locator('#tapestry-card .rg-tapestry-layout').first();
	const original = await card.evaluate(
		(element) => element.getBoundingClientRect().height
	);
	await card.locator('.rg-tapestry-layout--copy').evaluate((copy) => {
		copy.textContent =
			'A long tapestry effect that needs its own room. '.repeat(45);
	});
	const grown = await card.evaluate(
		(element) => element.getBoundingClientRect().height
	);
	expect(grown).toBeGreaterThan(original);
	const overlap = await card.evaluate((element) => {
		const copy = element
			.querySelector('.rg-tapestry-layout--copy')
			.getBoundingClientRect();
		const footer = element
			.querySelector('.rg-tapestry-layout--footer')
			.getBoundingClientRect();
		return footer.top - copy.bottom;
	});
	expect(overlap).toBeGreaterThanOrEqual(0);

	const scaled = page.locator('#card-shelf .rg-scaled-tapestry-card').first();
	const scaledBefore = await scaled.evaluate(
		(element) => element.getBoundingClientRect().height
	);
	await scaled.locator('.rg-tapestry-layout--copy').evaluate((copy) => {
		copy.textContent =
			'A long tapestry effect that needs its own room. '.repeat(45);
	});
	await expect
		.poll(() =>
			scaled.evaluate((element) => element.getBoundingClientRect().height)
		)
		.toBeGreaterThan(scaledBefore);
});
