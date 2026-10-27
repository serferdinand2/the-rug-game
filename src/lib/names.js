// Names for a player who leaves the name field empty (#25): Lazar's generator from the launch mockup, with longer lists.

/** The first parts, from the launch mockup and more in the same spirit. */
export const FIRST_PARTS = Object.freeze([
	'Aster',
	'Myr',
	'Cedar',
	'Ilyra',
	'Orin',
	'Thessa',
	'Cael',
	'Vesper',
	'Bryn',
	'Elara',
	'Kade',
	'Liora',
	'Nym',
	'Odra',
	'Pell',
	'Rowan',
	'Sela',
	'Tamsin',
	'Ulric',
	'Wren',
]);

/** The endings, from the launch mockup and more in the same spirit. */
export const ENDINGS = Object.freeze([
	'vale',
	'doria',
	'heim',
	'th',
	'mere',
	'gard',
	'oria',
	'wyn',
	'ford',
	'mont',
	'ia',
	'ion',
	'ara',
	'el',
	'ric',
	'wick',
]);

/**
 * A mythical-sounding name, such as Cedarwyn.
 * @param {(n: number) => number} random - A whole number from 0 to n − 1
 * @returns {string}
 */
export function generateName(random) {
	return (
		FIRST_PARTS[random(FIRST_PARTS.length)] +
		ENDINGS[random(ENDINGS.length)]
	);
}
