// The art on the library page: every scene part and every drawing, drawn in the browser from the art toolkit when a tile asks for it.
// In npm run dev a changed drawing shows at once; npm run art still writes the SVGs the game uses.
import { ASSETS } from '../lib/art/catalog.js';
import { FOOTPRINTS, PLOT_SIZE } from '../lib/art/footprints.js';
import { PLOT, RELIEF_BIOMES, reliefSize } from '../lib/art/relief.js';
import {
	CLOUD_SIZE,
	PICTURE_SIZE,
	VOLCANO_SIZE,
} from '../lib/art/hex-overlays.js';
import { CAPITAL_MATS } from '../lib/engine/data/capitals.js';
import { MAPS } from '../lib/engine/data/maps.js';
import { inSlice } from './slices.js';

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
import { BIOMES } from '../../tools/art/parts/capital-biomes/index.js';
import { SPACE, SPACES } from '../../tools/art/parts/inspiration-tile.js';
import {
	SPECIMEN_LAYOUT,
	drawReliefPreview,
	matData,
	matLayout,
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
		return 'The expansion mats as example compositions only: each lays its buildable and impassable tiles on its printed layout, with what only the mat draws, until #132 and #133 draw its relief. A base mat has no example here: its relief preview under Capital relief is that picture. The game composes each mat from its tiles.';
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
 * A picture's size in pixels.
 * @typedef {{ w: number, h: number }} PictureSize
 */

/**
 * A picture the library draws only when a tile asks for it.
 * @typedef {Object} LazyPicture
 * @property {string} label - The caption
 * @property {PictureSize} size - Its size, known before it is drawn
 * @property {() => Promise<Picture>} load - Draws it the first time, then gives the same promise
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
 * The message of anything thrown.
 * @param {unknown} error
 * @returns {string}
 */
function message(error) {
	return error instanceof Error ? error.message : String(error);
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
		return { error: message(error) };
	}
}

/**
 * Draws a picture in a slice of its own, the first time it is asked for, and gives the same promise after.
 * @param {() => Canvas} draw
 * @returns {() => Promise<Picture>}
 */
function drawnOnce(draw) {
	/** @type {Promise<Picture> | undefined} */
	let drawn;
	return () => (drawn ??= inSlice(() => safely(draw)));
}

/** Each drawing module, fetched only when its picture is wanted. */
const modules = import.meta.glob('../../tools/art/drawings/**/*.js');

/**
 * Every drawing's module loader, by asset id.
 * @type {ReadonlyMap<string, () => Promise<unknown>>}
 */
const DRAWINGS = new Map(
	Object.entries(modules).map(([path, load]) => [
		path.replace(/^.*\/drawings\//, '').replace(/\.js$/, ''),
		load,
	])
);

/**
 * Loads a drawing's module and draws it. A base mat's relief is shown as its preview on the mat's ground,
 * because alone it is mostly transparent; the preview draws the same relief.
 * @param {string} id
 * @returns {Promise<Picture>}
 */
async function drawPicture(id) {
	const load = DRAWINGS.get(id);
	if (!load) {
		return { error: `${id}: there is no drawing for this asset` };
	}
	const [group, slug] = id.split('/');
	const layout = group === 'capital-relief' ? matLayout(slug) : undefined;
	if (layout) {
		return inSlice(() =>
			safely(() => drawReliefPreview(layout, slug, 0, matData(slug)))
		);
	}
	try {
		const drawing = /** @type {{ draw?: unknown }} */ (await load());
		return inSlice(() => safely(() => drawingCanvas(id, drawing)));
	} catch (error) {
		return { error: message(error) };
	}
}

/** The pictures asked for so far, by asset id. @type {Map<string, Promise<Picture>>} */
const pictures = new Map();

/**
 * Draws an asset's picture the first time it is asked for, in a slice of its own, and gives the same
 * promise every time after. It never rejects: a drawing that fails gives its error.
 * @param {string} id - Such as 'landmark/lighthouse'
 * @returns {Promise<Picture>}
 */
export function loadPicture(id) {
	let drawn = pictures.get(id);
	if (!drawn) {
		drawn = drawPicture(id);
		pictures.set(id, drawn);
	}
	return drawn;
}

/** The catalog assets by id. */
const ASSETS_BY_ID = new Map(ASSETS.map((asset) => [asset.id, asset]));

/** The icon groups whose pictures share one native square size, in pixels. @type {Readonly<Record<string, number>>} */
const ICON_SIZES = Object.freeze({
	'resource-24': 24,
	'resource-48': 48,
	terrain: 24,
	building: 32,
	die: 32,
	track: 32,
});

/** A territory picture's size: a flat-topped hex. */
const [HEX_W, HEX_H] = PICTURE_SIZE;

/** The hex pictures that overlay a territory rather than fill it, at their own sizes. @type {ReadonlyMap<string, PictureSize>} */
const HEX_OVERLAYS = new Map([
	['hex/cloud', { w: CLOUD_SIZE[0], h: CLOUD_SIZE[1] }],
	['hex/volcano', { w: VOLCANO_SIZE, h: VOLCANO_SIZE }],
]);

/** The map boards by asset id, and the side of the board each shows. @type {Readonly<Record<string, 'large' | 'small'>>} */
const BOARDS = Object.freeze({
	'board/map-large': 'large',
	'board/map-small': 'small',
});

/**
 * A map board's size: its hexes' pictures tiled flat-topped, each step along an axis 3/4 of a picture
 * across and half a picture down, as the art toolkit lays them.
 * @param {'large' | 'small'} side
 * @returns {PictureSize}
 */
function boardSize(side) {
	const centres = MAPS[side].hexes.map((key) => {
		const [a, b] = key.split('_').map(Number);
		return [((HEX_W * 3) / 4) * (b - a), (HEX_H / 2) * (a + b)];
	});
	const xs = centres.map(([x]) => x);
	const ys = centres.map(([, y]) => y);
	return {
		w: Math.max(...xs) - Math.min(...xs) + HEX_W,
		h: Math.max(...ys) - Math.min(...ys) + HEX_H,
	};
}

/**
 * An asset's picture size before it is drawn: a landmark is its footprint at 32 pixels per plot, a
 * capital terrain tile one plot, a relief 32-pixel plots with 1-pixel gaps on its mat's layout, an
 * advanced mat 32-pixel plots on its layout, a map board its hexes, a hex overlay its own size, a territory
 * picture a 64×56 hex, an inspiration tile its six spaces, an outpost 128×128 and any other piece or
 * icon its native size, and any other illustration 64×64. Its placeholder takes that room, so nothing
 * on the page moves when it is drawn; tests/library-art.test.mjs checks each against npm run art.
 * @param {string} id - Such as 'landmark/lighthouse'
 * @returns {PictureSize | null} Null where only the drawing knows its size
 */
export function pictureSize(id) {
	const [group, slug] = id.split('/');
	if (group === 'landmark') {
		const rows = Object.hasOwn(FOOTPRINTS, slug) ? FOOTPRINTS[slug] : null;
		return rows
			? { w: rows[0].length * PLOT_SIZE, h: rows.length * PLOT_SIZE }
			: null;
	}
	if (group === 'capital-terrain') {
		return { w: PLOT, h: PLOT };
	}
	if (group === 'capital-feature') {
		// A mat's features picture is its relief's size (#132).
		const layout = matLayout(slug);
		return layout ? reliefSize(layout.length, layout[0].length) : null;
	}
	if (group === 'capital-relief' || group === 'capital-mat') {
		const advanced = Object.hasOwn(BIOMES, slug)
			? BIOMES[slug].LAYOUT
			: undefined;
		// An advanced mat lays its plots edge to edge; a relief leaves a 1-pixel gap between them.
		if (group === 'capital-mat') {
			return advanced
				? { w: advanced[0].length * PLOT, h: advanced.length * PLOT }
				: null;
		}
		const layout = matLayout(slug);
		return layout ? reliefSize(layout.length, layout[0].length) : null;
	}
	if (Object.hasOwn(BOARDS, id)) {
		return boardSize(BOARDS[id]);
	}
	if (group === 'hex' || group === 'territory-tile') {
		return HEX_OVERLAYS.get(id) ?? { w: HEX_W, h: HEX_H };
	}
	if (group === 'inspiration-tile') {
		return { w: SPACE * SPACES, h: SPACE };
	}
	if (group === 'piece') {
		return slug.startsWith('outpost')
			? { w: 128, h: 128 }
			: { w: 32, h: 32 };
	}
	if (group === 'symbol') {
		return slug === 'restart'
			? { w: 40, h: 20 }
			: slug === 'science-die'
				? { w: 32, h: 32 }
				: { w: 24, h: 24 };
	}
	if (Object.hasOwn(ICON_SIZES, group)) {
		return { w: ICON_SIZES[group], h: ICON_SIZES[group] };
	}
	return ASSETS_BY_ID.get(id)?.kind === 'illustration'
		? { w: 64, h: 64 }
		: null;
}

/** The base capital mat names by slug, such as 'Mountain'. */
const MAT_NAMES = new Map(CAPITAL_MATS.map((mat) => [mat.id, mat.name]));

/**
 * Each relief biome's preview on a layout with every kind of join.
 * @type {readonly LazyPicture[]}
 */
export const RELIEF_SPECIMENS = RELIEF_BIOMES.map((biome) => ({
	label: `${MAT_NAMES.get(biome) ?? biome}: a lone plot, side and corner joins, an L, a 2×2`,
	size: reliefSize(SPECIMEN_LAYOUT.length, SPECIMEN_LAYOUT[0].length),
	load: drawnOnce(() => drawReliefPreview(SPECIMEN_LAYOUT, biome)),
}));

/** One picture per scene part, each on a 64×64 canvas. @type {readonly LazyPicture[]} */
export const PARTS = PART_SAMPLES.map((sample) => ({
	label: sample.label,
	size: { w: 64, h: 64 },
	load: drawnOnce(sample.draw),
}));

/** Every catalog asset, grouped as the owner reviews them. @type {readonly GallerySection[]} */
export const ART_SECTIONS = gallerySections(ASSETS, new Set(DRAWINGS.keys()));

/**
 * The anchor id of an art section.
 * @param {string} group - A group id, such as 'landmark', or 'parts'
 * @returns {string} Such as 'art-landmark'
 */
export function artAnchor(group) {
	return `art-${group}`;
}
