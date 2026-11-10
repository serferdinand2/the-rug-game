// Distinct interface titles for the owner's card design; these are not printed official rules or extra effects.
export const AUTOMA_CARD_TITLES = Object.freeze([
	'Final Push',
	'Muster',
	'Scientific Legacy',
	'Engineering Marvels',
	'Western Expedition',
	'Border Assault',
	'Chosen Path',
	'Southern Voyage',
	'Industrial Offensive',
	'Fortress Hunt',
	'National Ambition',
	'Scientific Campaign',
	'Research Mission',
	'Discovery and Glory',
	'Coveted Monuments',
	'Industrial Expansion',
	'New Horizons',
	'Pursuit of Greatness',
	'Wartime Mobilization',
	'Technical Advance',
	'Eastern Campaign',
	'Decisive Victory',
]);

/** @param {number} id */
export const automaCardTitle = (id) =>
	AUTOMA_CARD_TITLES[id - 1] ?? `Automa ${id}`;
