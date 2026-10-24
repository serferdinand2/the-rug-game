// Grouped local review page for the 84 reusable capital terrain tiles and six mats.
import { CAPITAL_GRIDS, OPEN_VARIANTS, BLOCKED_VARIANTS, drawTile, drawCapitalMat } from '../parts/capital-terrain.js';
import { toSvg } from '../painter.js';
const groups = document.querySelector('#groups');
const summary = document.querySelector('#summary');
if (!(groups instanceof HTMLElement) || !(summary instanceof HTMLElement)) throw new Error('Terrain review page is missing its gallery containers');
const biomes = Object.keys(CAPITAL_GRIDS);
summary.textContent = biomes.length * (OPEN_VARIANTS + BLOCKED_VARIANTS) + ' tiles · ' + biomes.length + ' base capital mats';
for (const biome of biomes) {
	const section = document.createElement('section');
	section.className = 'terrain-section';
	section.innerHTML = '<div class="group-head"><h2>' + biome + '</h2><span>' + (OPEN_VARIANTS + BLOCKED_VARIANTS) + ' variants</span></div>';
	for (const [blocked, count, label] of [[false, OPEN_VARIANTS, 'Buildable'], [true, BLOCKED_VARIANTS, 'Impassable']]) {
		const subgroup = document.createElement('div');
		subgroup.className = 'tile-subgroup';
		subgroup.innerHTML = '<h3>' + label + ' <span>· ' + count + ' variants</span></h3><div class="tile-grid"></div>';
		const grid = subgroup.querySelector('.tile-grid');
		if (!(grid instanceof HTMLElement)) throw new Error('Terrain section is missing its tile grid');
		for (let variant = 0; variant < count; variant++) {
			const id = biome + '-' + (blocked ? 'blocked' : 'open') + '-' + String(variant + 1).padStart(2, '0');
			const card = document.createElement('article');
			card.className = 'terrain-card';
			card.innerHTML = '<div class="tile-preview">' + toSvg(drawTile(biome, blocked, variant)) + '</div><strong>' + (blocked ? 'Impassable' : 'Buildable') + ' ' + String(variant + 1).padStart(2, '0') + '</strong><small>' + id + ' · 32×32</small>';
			grid.append(card);
		}
		section.append(subgroup);
	}
	groups.append(section);
}
const mats = document.createElement('section');
mats.className = 'capital-mats';
mats.innerHTML = '<div class="group-head"><h2>Base capital mats</h2><span>Six 9×9 layouts · 288×288 art</span></div><div class="mats-grid"></div>';
const matGrid = mats.querySelector('.mats-grid');
if (!(matGrid instanceof HTMLElement)) throw new Error('Terrain review page is missing its capital mat grid');
for (const biome of biomes) {
	const card = document.createElement('article');
	card.className = 'mat-card';
	card.innerHTML = '<div class="mat-preview">' + toSvg(drawCapitalMat(biome)) + '</div><strong>' + biome + '</strong><small>capital-mat/' + biome + ' · 9×9</small>';
	matGrid.append(card);
}
groups.append(mats);
