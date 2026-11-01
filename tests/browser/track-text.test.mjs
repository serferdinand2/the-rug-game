// The track spaces' text in Chromium (#69): 10px at the 1920×1080 reference, then larger as the board grows, with
// nothing in a space cut off or overlapping. The test opens a two-seat hot-seat game, then closes the table.
import { expect, test } from '@playwright/test';

/**
 * Sends one table API request as a guest.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} endpoint
 * @param {Record<string, unknown> | undefined} body - Left out for a GET
 * @param {string} [token]
 * @returns {Promise<any>}
 */
async function api(request, endpoint, body, token) {
	const headers = token ? { Authorization: `Bearer ${token}` } : {};
	const response =
		body === undefined
			? await request.get(`/api/${endpoint}`, { headers })
			: await request.post(`/api/${endpoint}`, { headers, data: body });
	expect(response.ok(), `${endpoint}: ${await response.text()}`).toBe(true);
	return response.json();
}

/**
 * Each screen, with the size of a space's name and of the first resource's picture there. That resource is in a
 * bonus (Mathematics' "pay 1 resource"), whose pictures grow 18, 19, then 20px with the space (#85).
 */
const SCREENS = [
	{ width: 1920, height: 1080, text: '10px', resource: 18 },
	{ width: 2240, height: 1260, text: '11px', resource: 19 },
	{ width: 2560, height: 1440, text: '12px', resource: 20 },
	{ width: 3840, height: 2160, text: '12px', resource: 20 },
];

test('the track spaces keep 10px text at 1920×1080 and grow it on larger screens, with nothing cut off', async ({
	page,
	request,
}) => {
	const { token } = await api(request, 'login', { name: 'Ana' });
	let room = await api(
		request,
		'create',
		{ options: { mode: 'hotseat' } },
		token
	);
	room = await api(
		request,
		'add-seat',
		{ version: room.version, name: 'Ben' },
		token
	);
	await api(request, 'start', { version: room.version }, token);

	try {
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.addInitScript(
			(saved) => sessionStorage.setItem('rg-token', saved),
			token
		);
		await page.goto('/');
		await page.getByRole('button', { name: "I'm Ana" }).click();
		const spaces = page.locator('.rg-track-space');
		await expect(spaces).toHaveCount(48);

		const lighthouse = page.locator(
			'.rg-track-space[data-landmark="lighthouse"]'
		);
		await expect(lighthouse).toHaveCount(1);
		const offeredFootprints = page.locator(
			'.rg-track-space [data-landmark-footprint]'
		);
		await expect(offeredFootprints).toHaveCount(12);
		const footprintBounds = await offeredFootprints.evaluateAll((shapes) =>
			shapes.map((shape) => {
				const box = shape.getBoundingClientRect();
				const tile = shape
					.closest('.rg-track-space')
					.getBoundingClientRect();
				return {
					label: shape.getAttribute('aria-label'),
					inside:
						box.left >= tile.left &&
						box.right <= tile.right &&
						box.top >= tile.top &&
						box.bottom <= tile.bottom,
					width: box.width,
					height: box.height,
				};
			})
		);
		expect(footprintBounds.every((shape) => shape.inside)).toBe(true);
		expect(
			footprintBounds.every(
				(shape) => shape.width <= 23 && shape.height <= 23
			)
		).toBe(true);
		expect(footprintBounds.map((shape) => shape.label)).toContain(
			'Rubber Works, capital footprint: 4 rows by 4 columns'
		);
		// The fresh game opens a decision panel over part of the board. Dispatch the same bubbling
		// pointer event the shared tooltip listens for, independent of whether that panel covers this tile.
		await lighthouse.dispatchEvent('pointerover', { pointerType: 'mouse' });
		const landmarkDetail = page.locator(
			'[data-landmark-detail="lighthouse"]'
		);
		await expect(landmarkDetail).toBeVisible();
		await expect(landmarkDetail).toContainText('Lighthouse');
		await expect(
			landmarkDetail.locator('.rg-landmark-hover-detail--name')
		).toHaveCSS('color', 'rgb(226, 184, 87)');
		await expect(landmarkDetail.locator('img')).toHaveAttribute(
			'src',
			/art\/landmark\/lighthouse\.svg/
		);
		await expect(landmarkDetail.locator('img')).toHaveCSS('width', '44px');
		await expect(
			landmarkDetail.locator('[data-footprint]')
		).toHaveAttribute('data-footprint', 'XX/XX');
		await lighthouse.evaluate((tile) =>
			tile.removeAttribute('data-landmark')
		);
		await expect(landmarkDetail).toBeHidden();
		await page.keyboard.press('Escape');

		for (const screen of SCREENS) {
			await page.setViewportSize(screen);
			const name = page.locator('.rg-track-space--name').first();
			await expect(name, `${screen.width}px`).toHaveCSS(
				'font-size',
				screen.text
			);
			await expect(
				page.locator('.rg-space-glyphs--resource img').first()
			).toHaveCSS('width', `${screen.resource}px`);

			const sizeComparisons = await page.evaluate(() => {
				const images = (selector) =>
					[...document.querySelectorAll(selector)].map((image) =>
						parseFloat(getComputedStyle(image).width)
					);
				const technology = document.querySelector(
					'.rg-track[aria-label="Technology"]'
				);
				const science = document.querySelector(
					'.rg-track[aria-label="Science"]'
				);
				const bySpace = (track, space) =>
					[...track.querySelectorAll('.rg-track-space')].find(
						(tile) =>
							tile.style.getPropertyValue(
								'--rg-track-space-step'
							) === String(space)
					);
				const tech2 = bySpace(technology, 2);
				const science5 = bySpace(science, 5);
				const alienBiology = bySpace(science, 12);
				const alienBenefit = alienBiology.querySelector(
					'.rg-track-space--benefit'
				);
				const alienTranslate = parseFloat(
					getComputedStyle(alienBenefit).translate
				);
				const alienTip = parseFloat(
					getComputedStyle(alienBiology).getPropertyValue(
						'--track-tip'
					)
				);
				const singularity = bySpace(technology, 12);
				const singularityBenefit = singularity.querySelector(
					'.rg-track-space--benefit'
				);
				const singularityTranslate = parseFloat(
					getComputedStyle(singularityBenefit).translate
				);
				const singularityTip = parseFloat(
					getComputedStyle(singularity).getPropertyValue(
						'--track-tip'
					)
				);
				const finalTrackBenefitOffsets = [
					...document.querySelectorAll(
						'.rg-track-space--last .rg-track-space--benefit'
					),
				].map((benefit) =>
					parseFloat(getComputedStyle(benefit).translate)
				);
				const finalTrackTip = parseFloat(
					getComputedStyle(
						document.querySelector('.rg-track-space--last')
					).getPropertyValue('--track-tip')
				);
				const finishTile = document.querySelector(
					'.rg-track-space--last'
				);
				const finishEdge = getComputedStyle(finishTile, '::after');
				const finishEdgeHeight = parseFloat(finishEdge.height);
				const finishTileHeight =
					finishTile.getBoundingClientRect().height;
				const tech2AnyResource = parseFloat(
					getComputedStyle(
						tech2.querySelector(
							'.rg-space-glyphs--bonus .rg-space-glyphs--resource img'
						)
					).width
				);
				const tech12Resources = images(
					'.rg-track-space--ai-resources .rg-space-glyphs--resource img'
				);
				const chemistryDie = parseFloat(
					getComputedStyle(
						science5.querySelector('.rg-space-glyphs--symbol-icon')
					).width
				);
				const alienDice = images('.rg-track-space--alien-rolls img');
				const civCard = parseFloat(
					getComputedStyle(
						document.querySelector(
							'.rg-track-space--large-civ .rg-space-glyphs--card-icon'
						)
					).width
				);
				const research = document.querySelector(
					'.rg-track-space--repeat-large .rg-space-glyphs--repeat'
				);
				return {
					tech12ResourcesMatch: tech12Resources.every(
						(size) => size === tech2AnyResource
					),
					scienceDiceMatch: alienDice.every(
						(size) => size === chemistryDie
					),
					civilizationCard: civCard,
					alienBiologyShiftedLeft: alienTranslate < alienTip - 2,
					aiSingularityShiftedLeft:
						singularityTranslate < singularityTip - 2,
					allFinalBenefitsShareOffset:
						new Set(finalTrackBenefitOffsets).size === 1 &&
						finalTrackBenefitOffsets[0] < finalTrackTip / 2 - 2,
					finishEdgeDashedFullHeight:
						finishEdge.zIndex === '5' &&
						parseFloat(finishEdge.width) === 3 &&
						finishEdgeHeight >= finishTileHeight - 1 &&
						finishEdge.backgroundImage.includes(
							'repeating-linear-gradient'
						),
					repeatGlyphSizes: [
						...research.querySelectorAll(
							'.rg-space-glyphs--direction, svg'
						),
					].map((glyph) => ({
						width: parseFloat(getComputedStyle(glyph).width),
						height: parseFloat(getComputedStyle(glyph).height),
					})),
				};
			});
			expect(sizeComparisons.tech12ResourcesMatch).toBe(true);
			expect(sizeComparisons.scienceDiceMatch).toBe(true);
			expect(sizeComparisons.civilizationCard).toBe(34);
			expect(sizeComparisons.alienBiologyShiftedLeft).toBe(true);
			expect(sizeComparisons.aiSingularityShiftedLeft).toBe(true);
			expect(sizeComparisons.allFinalBenefitsShareOffset).toBe(true);
			expect(sizeComparisons.finishEdgeDashedFullHeight).toBe(true);
			expect(sizeComparisons.repeatGlyphSizes).toEqual([
				{ width: 31, height: 31 },
				{ width: 22, height: 22 },
			]);

			const faults = await spaces.evaluateAll((all) =>
				all.flatMap((space) => {
					const label = space.getAttribute('aria-label');
					/** @param {string} part */
					const box = (part) =>
						space
							.querySelector(`.rg-track-space--${part}`)
							?.getBoundingClientRect();
					const benefit = space.querySelector(
						'.rg-track-space--benefit'
					);
					const nameText = space.querySelector(
						'.rg-track-space--name'
					);
					const body = box('body');
					const parts = ['name', 'benefit', 'bonus', 'landmark']
						.map((part) => box(part))
						.filter((part) => part !== undefined);
					const found = [];
					if (
						benefit &&
						(benefit.scrollHeight > benefit.clientHeight + 1 ||
							benefit.scrollWidth > benefit.clientWidth + 1)
					) {
						found.push(`${label}: its benefit is cut off`);
					}
					if (
						nameText &&
						nameText.scrollWidth > nameText.clientWidth + 1
					) {
						found.push(`${label}: its name is cut off`);
					}
					for (let i = 1; i < parts.length; i++) {
						const acceptedTwoLineBonusOverlap =
							i === 2 &&
							(label.startsWith('Nanotechnology,') ||
								label.startsWith('Drone Assassins,'));
						if (
							parts[i].top < parts[i - 1].bottom - 1 &&
							!acceptedTwoLineBonusOverlap
						) {
							found.push(`${label}: its parts overlap`);
						}
					}
					const last = parts.at(-1);
					if (body && last && last.bottom > body.bottom + 1) {
						found.push(`${label}: it runs out of the space`);
					}
					return found;
				})
			);
			expect(faults, `${screen.width}×${screen.height}`).toEqual([]);
		}
	} finally {
		// A running hot-seat game is ended, then left, so the table closes and the address's table limit is free.
		const latest = await api(request, 'state', undefined, token);
		await api(request, 'end', { version: latest.version }, token);
		await api(request, 'leave', {}, token);
	}
});
