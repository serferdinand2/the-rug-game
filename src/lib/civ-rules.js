// The 16 base civilizations' full abilities in plain words, in each table version (#42), as the engine plays them.

/** @typedef {import('./engine/data/ids.js').VersionId} VersionId */

/**
 * One civilization's words, as short paragraphs: those both versions share, then those only one version has.
 * @typedef {Object} CivText
 * @property {readonly string[]} both - The ability in both versions
 * @property {readonly string[]} [original] - Only in the original 2019 printing
 * @property {readonly string[]} [current] - Only under the current rules, each starting "Current rules:": the setup adjustment of the F&F rulebook's p.32 (R34), or a rule the current rules changed
 */

/**
 * Freezes one civilization's words, lists and all.
 * @param {string[]} both
 * @param {{ original?: string[], current?: string[] }} [only]
 * @returns {Readonly<CivText>}
 */
function civ(both, { original, current } = {}) {
	return Object.freeze({
		both: Object.freeze(both),
		...(original && { original: Object.freeze(original) }),
		...(current && { current: Object.freeze(current) }),
	});
}

/**
 * Each base civilization's words by the engine's id, paraphrased from 02 §1.2 with the README's rules (R28–R35) and
 * src/lib/engine/civs/. Expansion civilizations aren't built, so they have none here.
 * @type {Readonly<Record<string, Readonly<CivText>>>}
 */
const CIV_TEXTS = Object.freeze({
	alchemists: civ(
		[
			'At the start of income turns 2 to 5, roll the science die and mark the track it shows. Then roll again or stop.',
			'If you roll a track you have already marked this turn, you bust: the marks clear and you gain 1 resource of your choice.',
			'If you stop before you bust, you may advance once on each marked track, without its benefit or bonus. Then the marks clear.',
			'On a marked track where you are already at the end, you gain 5 VP instead.',
		],
		{
			current: [
				'Current rules: if you start the game with the Alchemists, you also gain 1 resource of your choice and 10 VP.',
			],
		}
	),
	architects: civ(
		[
			'When you complete a district whose income buildings are all of one type, you gain 1 more resource of your choice.',
			'Whenever you score your capital city, each complete row or column whose income buildings are all of one type scores 2 VP instead of 1.',
			'Each such district, row or column needs at least 1 income building; landmarks and impassable plots in it don’t matter.',
			'If you gain the Architects later in the game, you may swap the places of 2 income buildings in your capital city, up to 3 times.',
		],
		{
			current: [
				'Current rules: if you start the game with the Architects, place 1 impassable cube per opponent on empty plots of your capital city, each in a different district.',
			],
		}
	),
	craftsmen: civ([
		'Whenever you gain an income building, you may put it on this mat instead of in your capital city, on the lowest open space of any column. You gain that space’s benefit at once.',
		'First column, bottom to top: 1 worker, 1 territory tile, 5 VP.',
		'Second column: 1 coin, invent a tech card, upgrade a tech card, 10 VP.',
		'Third column: 1 food, 1 tapestry card, 1 culture, roll the science die to advance on the track rolled, 15 VP.',
		'Buildings here count as part of your capital city for effects about its buildings, but these columns never complete a district, row or column.',
	]),
	entertainers: civ(
		[
			'You start with a token on the start space, to the left of a grid of 4 columns and 4 rows.',
			'At the start of income turns 2 to 5, move the token along a link to the next column and gain the space it reaches. Once it is in the last column, it stays there.',
			'Column 1, top to bottom: 1 worker, 1 culture, 1 food, 1 coin. Column 2: a Farm, a Market, a House, an Armory.',
			'Column 3: conquer a territory, roll the science die to advance on the track rolled without its benefit or bonus, invent a tech card, explore a territory.',
			'Column 4: advance on Technology, Exploration, Military, Science; you gain the benefit and may pay the bonus.',
			'The start links to every space of column 1. Between columns 1 and 2, and between 3 and 4, row 1 links to rows 1 and 2, rows 2 and 3 to rows 2 and 3, and row 4 to rows 3 and 4.',
			'Between columns 2 and 3, rows 1 and 2 link to rows 1 and 2, and rows 3 and 4 to rows 3 and 4.',
			'If you gain the Entertainers later in the game, put the token on any space of the grid and gain it.',
		],
		{
			current: [
				'Current rules: if you start the game with the Entertainers, you also gain 1 resource of your choice and 10 VP.',
			],
		}
	),
	futurists: civ(
		[
			'When you gain the Futurists, at the start of the game or later, advance 4 spaces on each of the four tracks, stopping at the end of a track.',
			'You gain no benefit, bonus or landmark for these moves, and the landmarks you pass stay on their tracks. You also gain 1 coin, 1 worker, 1 food and 1 culture.',
		],
		{
			current: [
				'Current rules: if you start the game with the Futurists, at the end of your first income turn you lose 1 culture and 1 resource of your choice.',
			],
		}
	),
	heralds: civ(
		[
			'You start with 4 tokens.',
			'At the start of income turns 2 to 5, you may put a token on any visible When Played tapestry card, yours or an opponent’s, and gain its effect as if you had played it. A card can hold only one token.',
		],
		{
			original: [
				'If you start the game with the Heralds, at the end of your first income turn you may play a tapestry card from your hand on top of Maker of Fire.',
			],
			current: [
				'Current rules: if you start the game with the Heralds, at the end of your first income turn draw tapestry cards until you reveal a When Played card (a trap counts as one) and discard the rest. You keep that card, and unless it is Renaissance you may play it on top of Maker of Fire and gain its effect.',
			],
		}
	),
	historians: civ([
		'You start with 4 tokens covering four squares: 3 VP and 1 food on top, 1 worker and 3 VP below.',
		'At the start of income turns 2 to 5, you may discard 1 territory tile to give a token to any opponent, even one who holds one already. You choose which covered square it uncovers.',
		'Whenever an opponent holding one of your tokens gains a landmark, you gain every uncovered square.',
		'If you gain the Historians later in the game, give all 4 tokens to opponents at once, choosing who gets each one.',
	]),
	inventors: civ(
		[
			'You start with 4 tokens.',
			'At the start of income turns 2 to 5, you may put a token on any tech card in a bottom or middle row, yours or an opponent’s. Its owner upgrades it at once and gains the benefit, and the card ignores its prerequisite for the rest of the game.',
			'When your token upgrades an opponent’s card, you may gain the same benefit after them.',
		],
		{
			original: [
				'When an opponent’s card with your token reaches their top row, whoever upgraded it, you may gain its benefit after them. Then you take the card into your bottom row, with your token still on it.',
			],
			current: [
				'Current rules: when an opponent’s card with your token reaches their top row, you take it into your bottom row, with your token still on it. You gain its benefit too only when your own token upgraded it.',
			],
		}
	),
	isolationists: civ(
		[
			'You start with 4 tokens.',
			'Whenever you conquer a territory with nothing on it, you may also put one of these tokens there beside your outpost and gain 1 resource of your choice. With both on it, that territory can never be conquered.',
			'At the start of income turn 5, score VP for your largest group of linked territories you control that share one land terrain.',
			'A group of 1 territory scores 5 VP, 2 score 10 VP, 3 score 16 VP, 4 score 23 VP, 5 score 31 VP, and 6 or more score 40 VP.',
			'Two neighbouring territories link when that terrain is on both sides of a corner they share. Water never counts, and the middle island is always a group of 1.',
		],
		{
			current: [
				'Current rules: if you start the game with the Isolationists, you also gain 2 territory tiles.',
			],
		}
	),
	leaders: civ([
		'You have four leader squares, one for each track, and each can be used once.',
		'At the start of income turns 2 to 5, you may cover the square of a track and advance on that track for free. You gain the space’s benefit but not its bonus.',
	]),
	merrymakers: civ(
		[
			'You have three columns of three spaces, each with a token below its bottom space.',
			'At the start of income turns 2 to 5, move one token up one space and gain that space. A space with two rewards gives both.',
			'First column, bottom to top: 1 coin; 1 worker and 1 food; 1 culture and an Armory.',
			'Second column: 1 territory tile; invent a tech card and gain 1 tapestry card; explore a territory and roll the science die to advance on the track rolled.',
			'Third column: 5 VP, 10 VP, 15 VP.',
		],
		{
			current: [
				'Current rules: if you start the game with the Merrymakers, you also gain 1 resource of your choice.',
			],
		}
	),
	militants: civ([
		'The 8 outposts in your supply start on this mat’s 8 spaces, in two rows of four.',
		'Whenever an outpost leaves your supply, as when you conquer, take it from the far left of either row.',
		'At the start of income turns 2 to 5, gain every uncovered space.',
		'Top row, left to right: 1 coin, 2 VP, 1 food, 4 VP. Bottom row: 1 VP, 1 worker, 3 VP, 1 culture.',
		'If you gain the Militants later in the game, put the outposts left in your supply on the spaces from right to left, choosing the row for each.',
	]),
	mystics: civ(
		[
			'When you start the game with the Mystics, predict a number in each of four categories: tech cards you have (1 to 9), complete districts (1 to 9), territories you control (1 to 9) and completed tracks (1 to 4).',
			'The first time a count equals its prediction, you gain 1 resource of your choice.',
			'At the start of income turn 5, you gain 10 VP for each category whose count equals its prediction exactly.',
			'If you gain the Mystics later in the game, discard them and gain another civilization instead.',
		],
		{
			current: [
				'Current rules: if you start the game with the Mystics, you also gain 1 resource of your choice.',
			],
		}
	),
	nomads: civ([
		'Whenever you gain a building or a landmark, you may put it on the map instead of in your capital city.',
		'It may go on a territory you control that holds only one outpost, building or landmark. You gain 1 resource of your choice, and with two there the territory can no longer be conquered.',
		'Or it may go on a territory with nothing on it, next to one you control. You now control that territory, though this is not a conquer.',
		'A building or landmark on the map works like an outpost: it gives you control, and an opponent can conquer its territory and topple it.',
		'Buildings on the map still count for VP per building.',
	]),
	'the-chosen': civ(
		[
			'At the start of income turns 2 to 5, gain 1 VP per opponent for each track on which nobody is ahead of you. A tie counts, and so does a track you have finished.',
			'Also gain 1 resource of your choice for each achievement you have earned. On income turn 5, gain 5 VP per achievement instead.',
		],
		{
			current: [
				'Current rules: if you start the game with The Chosen, you also gain 15 VP for each opponent.',
			],
		}
	),
	traders: civ(
		[
			'You start with 4 tokens.',
			'At the start of income turns 2 to 5, you may put a token on a territory that has nothing on it, or whose only piece is an opponent’s upright outpost.',
			'On an empty territory, gain 1 VP for each neighbouring territory an opponent controls. On an opponent’s outpost, gain the benefit shown on that territory.',
			'Your token gives you no control, but a territory holding two outposts or tokens of any kind can’t be conquered.',
			'If an opponent conquers a territory holding your token, you may gain the conquer die they didn’t keep, as if you had rolled it.',
		],
		{
			current: [
				'Current rules: if you start the game with the Traders, you also gain 2 resources of your choice and 10 VP.',
			],
		}
	),
});

/**
 * A civilization's full ability as short paragraphs, in a table's version. The current rules add the setup adjustment
 * of the civilization a player starts with (R34), or a rule they changed, as a last "Current rules:" paragraph.
 * @param {string} id - The engine's civilization id, such as 'the-chosen'
 * @param {VersionId} version - The table's rules version
 * @returns {string[] | null} A new list each call; null for a civilization with no text, such as an expansion's
 */
export function civRules(id, version) {
	if (!Object.hasOwn(CIV_TEXTS, id)) {
		return null;
	}
	const text = CIV_TEXTS[id];
	const only = version === 'current' ? text.current : text.original;
	return [...text.both, ...(only ?? [])];
}

/**
 * A civilization's full ability as one text for a tooltip: its paragraphs with a blank line between them.
 * @param {string} id - The engine's civilization id, such as 'the-chosen'
 * @param {VersionId} version - The table's rules version
 * @returns {string | null} Null for a civilization with no text, such as an expansion's
 */
export function civAbilityText(id, version) {
	return civRules(id, version)?.join('\n\n') ?? null;
}
