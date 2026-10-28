// Group and filter the asset catalog for the public gallery without duplicating its entries.
import { ASSETS, EXPANSIONS, GROUPS } from '../lib/art/catalog.js';

export const CARD_GROUPS = Object.freeze([
	'civ',
	'tapestry',
	'tech',
	'landmark-card',
	'masterpiece',
	'space-tile',
]);
export const GALLERY_GROUPS = GROUPS;
export const GALLERY_EXPANSIONS = EXPANSIONS;

/** @param {string} group */
export function groupCount(group) {
	return ASSETS.filter((asset) => asset.group === group).length;
}

/**
 * @param {{group?:string,expansion?:string,query?:string}} filters
 * @returns {typeof ASSETS[number][]}
 */
export function galleryAssets({
	group = 'all',
	expansion = 'all',
	query = '',
} = {}) {
	const needle = query.trim().toLocaleLowerCase();
	return ASSETS.filter(
		(asset) =>
			(group === 'all' || asset.group === group) &&
			(expansion === 'all' || asset.expansion === expansion) &&
			(!needle ||
				`${asset.name} ${asset.id} ${asset.group}`
					.toLocaleLowerCase()
					.includes(needle))
	);
}
