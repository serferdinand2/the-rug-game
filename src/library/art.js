// The art on the library page: every scene part and every drawing, drawn in the browser from the art toolkit.
// In npm run dev a changed drawing shows at once; npm run art still writes the SVGs the game uses.
import { ASSETS } from '../lib/art/catalog.js';
import { RELIEF_BIOMES } from '../lib/art/relief.js';

/** Groups resolved through text or later artwork. @type {Readonly<Record<string, string>>} */
export const DEFERRED_ART = Object.freeze({
	die: 'Dice results use text, numerals, approved track symbols and resource/VP labels. Decorative dice artwork can be drawn later with the final controls. Resolved in issue #5.',
	symbol: 'VP, territory tiles, tapestry cards, tech cards and space tiles use text labels and counts, then their actual pictures. Additional pictograms can be drawn later. Resolved in issue #5.',
});
import { toSvg } from '../../tools/art/painter.js';
import {
	PART_SAMPLES,
	drawingCanvas,
	gallerySections,
} from '../../tools/art/gallery.js';
import { CAPITAL_GRIDS } from '../../tools/art/parts/capital-terrain.js';
import {
	SPECIMEN_LAYOUT,
	drawReliefPreview,
} from '../../tools/art/parts/capital-relief/index.js';

/** @typedef {import('../../tools/art/painter.js').Canvas} Canvas */
/** @typedef {import('../../tools/art/gallery.js').GallerySection} GallerySection */

/**
 * Explains each group's current artwork and the owner-approved deferrals.
 * @param {GallerySection} section
 * @returns {string}
 */
export function artDescription(section) {
	if (DEFERRED_ART[section.id]) {
		return DEFERRED_ART[section.id];
	}
	if (section.id === 'terrain') {
		return 'Five owner-reviewed terrain hex markers at native 24×24. These are card/map terrain symbols, separate from the capital biome tile solutions.';
	}
	if (section.id === 'capital-mat') {
		return "The full mats are example compositions only. Each one lays ground tiles on its printed layout. The six base mats' reliefs lie over their ground; the expansion mats keep their impassable tiles until #132 and #133 draw theirs. The game composes each mat the same way.";
	}
	if (section.id === 'capital-relief') {
		return `${section.total} reliefs, ${section.drawn} drawn. Each mat's impassable plots are one relief, drawn from its printed layout over the mat's per-plot ground. Each preview shows the relief on that ground, and the specimens show every kind of join. The owner approves each batch here. Source issue #${section.issues.join(', #')}.`;
	}
	return `${section.total} assets, ${section.drawn} drawn. Source issue #${section.issues.join(', #')}.${section.id === 'landmark' ? ' Largest footprint first, drawn in its footprint shape under the plot grid.' : ''}`;
}

/**
 * A drawn picture, ready for an <img>, or the reason it couldn't be drawn.
 * @typedef {{ url: string, w: number, h: number } | { error: string }} Picture
 */

/**
 * @param {Canvas} canvas
 * @returns {Picture}
 */
function picture(canvas) {
	return {
		url: `data:image/svg+xml,${encodeURIComponent(toSvg(canvas))}`,
		w: canvas.w,
		h: canvas.h,
	};
}

/**
 * Draws without letting one broken drawing take the whole page down.
 * @param {() => Canvas} draw
 * @returns {Picture}
 */
function safely(draw) {
	try {
		return picture(draw());
	} catch (error) {
		return {
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

const modules = import.meta.glob('../../tools/art/drawings/**/*.js', {
	eager: true,
});

/**
 * Every drawing's picture, by asset id. A capital relief is shown as its preview on the mat's ground,
 * because alone it is mostly transparent; the preview draws the same relief.
 * @type {ReadonlyMap<string, Picture>}
 */
export const PICTURES = new Map(
	Object.entries(modules).map(([path, module]) => {
		const id = path.replace(/^.*\/drawings\//, '').replace(/\.js$/, '');
		const [group, slug] = id.split('/');
		return [
			id,
			safely(() =>
				group === 'capital-relief'
					? drawReliefPreview(
							CAPITAL_GRIDS[
								/** @type {keyof typeof CAPITAL_GRIDS} */ (slug)
							],
							slug
						)
					: drawingCanvas(
							id,
							/** @type {{ draw?: unknown }} */ (module)
						)
			),
		];
	})
);

/** The capital mat names by slug, such as 'Mountain'. */
const MAT_NAMES = new Map(
	ASSETS.filter((asset) => asset.group === 'capital-mat').map((asset) => [
		asset.id.split('/')[1],
		asset.name,
	])
);

/**
 * Each relief biome's preview on a layout with every kind of join.
 * @type {readonly { label: string, picture: Picture }[]}
 */
export const RELIEF_SPECIMENS = RELIEF_BIOMES.map((biome) => ({
	label: `${MAT_NAMES.get(biome) ?? biome}: a lone plot, side and corner joins, an L, a 2×2`,
	picture: safely(() => drawReliefPreview(SPECIMEN_LAYOUT, biome)),
}));

/** One picture per scene part. @type {readonly { label: string, picture: Picture }[]} */
export const PARTS = PART_SAMPLES.map((sample) => ({
	label: sample.label,
	picture: safely(sample.draw),
}));

/** Every catalog asset, grouped as the owner reviews them. @type {readonly GallerySection[]} */
export const ART_SECTIONS = gallerySections(ASSETS, new Set(PICTURES.keys()));

/**
 * The anchor id of an art section.
 * @param {string} group - A group id, such as 'landmark', or 'parts'
 * @returns {string} Such as 'art-landmark'
 */
export function artAnchor(group) {
	return `art-${group}`;
}
