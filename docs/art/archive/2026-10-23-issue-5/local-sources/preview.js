// Grouped local review gallery for issue #5 sprites.
import { ASSETS, GROUPS, EXPANSIONS } from '../../src/lib/art/catalog.js';
import { drawingCanvas } from '../gallery.js';
import { toSvg } from '../painter.js';
import { PLAYER_TOKEN_CHANNEL } from '../icons.js';
import { PLAYER_OUTPOST_CHANNEL } from '../parts/outpost.js';
const ICONS = ASSETS.filter((a) => a.issue === 5 && a.kind === 'icon');
const PLAYER_COLOURS = ['#4ea1d3', '#e06a55', '#64ae67', '#e1b84d', '#b07fd0'];
const PLAYER_NAMES = ['blue', 'red', 'green', 'yellow', 'purple'];
const container = document.querySelector('#groups');
const summary = document.querySelector('#summary');
if (!(container instanceof HTMLElement) || !(summary instanceof HTMLElement))
	throw new Error('Review page is missing its gallery containers');
summary.textContent =
	ICONS.length +
	' icons · 25 at 24×24 · 15 at 32×32 · 2 outpost flags at 128×128 · ' +
	GROUPS.filter((g) => g.issue === 5 && g.kind === 'icon').length +
	' groups';
for (const group of GROUPS.filter((g) => g.issue === 5 && g.kind === 'icon')) {
	const assets = ICONS.filter((a) => a.group === group.id);
	const section = document.createElement('section');
	section.innerHTML =
		'<div class="group-head"><h2>' +
		group.label +
		'</h2><span>' +
		assets.length +
		' assets</span></div><div class="grid"></div>';
	const grid = section.querySelector('.grid');
	if (!(grid instanceof HTMLElement))
		throw new Error('Review section is missing its asset grid');
	for (const asset of assets) {
		const importedPng =
			asset.group === 'resource' ||
			asset.group === 'track' ||
			asset.id === 'piece/token' ||
			asset.id === 'piece/outpost' ||
			asset.id === 'piece/outpost-toppled';
		let svg = '';
		if (importedPng) {
			const response = await fetch(`/art/${asset.id}.svg`);
			if (!response.ok)
				throw new Error(`Could not load SVG for ${asset.id}: ${response.status}`);
			svg = await response.text();
		} else {
			const module = await import('../drawings/' + asset.id + '.js');
			const canvas = drawingCanvas(asset.id, module);
			svg = toSvg(canvas);
		}
		const card = document.createElement('article');
		card.className = 'card';
		const preview = document.createElement('div');
		preview.className = 'preview';
		preview.innerHTML = svg;
		const meta = document.createElement('div');
		meta.className = 'meta';
		const expansion =
			EXPANSIONS.find((e) => e.code === asset.expansion)?.name ??
			asset.expansion;
		const size =
			asset.group === 'building' ||
			asset.group === 'resource' ||
			asset.group === 'track' ||
			asset.id === 'piece/token'
				? 32
				: asset.id === 'piece/outpost' ||
					  asset.id === 'piece/outpost-toppled'
					? 128
					: 24;
		meta.innerHTML =
			'<strong>' +
			asset.name +
			'</strong><small>' +
			asset.id +
			' · ' +
			size +
			'×' +
			size +
			(importedPng ? ' · imported PNG → SVG' : '') +
			' · ' +
			expansion +
			'</small>';
		card.append(preview, meta);
		if (asset.id === 'piece/token' || asset.id.startsWith('piece/outpost')) {
			const variants = document.createElement('div');
			variants.className = 'variants';
			const channel =
				asset.id === 'piece/token'
					? PLAYER_TOKEN_CHANNEL
					: PLAYER_OUTPOST_CHANNEL;
			for (const [index, color] of PLAYER_COLOURS.entries()) {
				const item = document.createElement('button');
				item.type = 'button';
				item.className = 'variant';
				const playerName = PLAYER_NAMES[index];
				item.setAttribute(
					'aria-label',
					asset.id === 'piece/token'
						? `Show ${playerName} player token`
						: `Show ${playerName} player ${asset.name.toLowerCase()}`
				);
				item.setAttribute('aria-pressed', 'false');
				item.innerHTML = svg.replaceAll(channel, color);
				item.title = color;
				item.addEventListener('click', () => {
					preview.innerHTML = svg.replaceAll(channel, color);
					variants.querySelectorAll('.variant').forEach((variant) => {
						variant.classList.remove('selected');
						variant.setAttribute('aria-pressed', 'false');
					});
					item.classList.add('selected');
					item.setAttribute('aria-pressed', 'true');
				});
				variants.append(item);
			}
			card.append(variants);
		}
		grid.append(card);
	}
	container.append(section);
}
