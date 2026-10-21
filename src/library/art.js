// The art on the library page: every scene part and every drawing, drawn in the browser from the art toolkit.
// In npm run dev a changed drawing shows at once; npm run art still writes the SVGs the game uses.
import { ASSETS } from '../lib/art/catalog.js';
import { toSvg } from '../../art/painter.js';
import {
	PART_SAMPLES,
	drawingCanvas,
	gallerySections,
} from '../../art/gallery.js';

/** @typedef {import('../../art/painter.js').Canvas} Canvas */
/** @typedef {import('../../art/gallery.js').GallerySection} GallerySection */

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
