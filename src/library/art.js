// The art on the library page: every scene part and every drawing, drawn in the browser from the art toolkit.
// In npm run dev a changed drawing shows at once; npm run art still writes the SVGs the game uses.
import { ASSETS } from '../lib/art/catalog.js';

/** Groups resolved through text or later artwork. @type {Readonly<Record<string, string>>} */
export const DEFERRED_ART = Object.freeze({
	die: 'Dice results use text, numerals, approved track symbols and resource/VP labels. Decorative dice artwork can be drawn later with the final controls. Resolved in issue #5.',
	symbol: 'VP, territory tiles, tapestry cards, tech cards and space tiles use text labels and counts, then their actual pictures. Additional pictograms can be drawn later. Resolved in issue #5.',
});
import { toSvg } from '../../art/painter.js';
import {
	PART_SAMPLES,
	drawingCanvas,
	gallerySections,
} from '../../art/gallery.js';

/** @typedef {import('../../art/painter.js').Canvas} Canvas */
/** @typedef {import('../../art/gallery.js').GallerySection} GallerySection */

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
		return 'Six full mats are example compositions only. Actual mats are generated from reusable terrain tiles for each game, following its setup and plot layout. Expansion artwork remains part of issue #6.';
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

const modules = import.meta.glob('../../art/drawings/**/*.js', {
	eager: true,
});

/** Every drawing's picture, by asset id. @type {ReadonlyMap<string, Picture>} */
export const PICTURES = new Map(
	Object.entries(modules).map(([path, module]) => {
		const id = path.replace(/^.*\/drawings\//, '').replace(/\.js$/, '');
		return [
			id,
			safely(() =>
				drawingCanvas(id, /** @type {{ draw?: unknown }} */ (module))
			),
		];
	})
);

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
