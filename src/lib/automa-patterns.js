// Descriptive interface names, not additional rules: origin and scan direction for each canonical hex pattern.
export const AUTOMA_PATTERN_NAMES = Object.freeze([
	'North–southeast',
	'Northeast–northwest',
	'East–south',
	'Southeast–north',
	'Southeast–southwest',
	'South–northeast',
	'South–northwest',
	'Southwest–southeast',
	'Southwest–north',
	'West–south',
]);

/** @param {number} pattern */
export const automaPatternName = (pattern) =>
	AUTOMA_PATTERN_NAMES[pattern - 1] ?? 'Hex selection';
