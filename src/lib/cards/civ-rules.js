// The civilizations' full abilities in plain words, in each table version (#42), as the engine plays them: the 16 base ones and Plans & Ploys' built ones (#33).

/** @typedef {import('../engine/data/ids.js').VersionId} VersionId */

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
 * Each civilization's words by the engine's id, paraphrased from 02 §1.2 and 03 §1.3 with the README's rules (R28–R35,
 * R113) and src/lib/engine/civs/. Expansion civilizations not built yet have none here.
 * @type {Readonly<Record<string, Readonly<CivText>>>}
 */
const CIV_TEXTS = Object.freeze({
	advisors: civ([
		'When you start the game with the Advisors, or gain them later, you draw 3 tapestry cards. If you gain them later in the game, you may then give any of those 3 cards to your neighbours, gaining 5 VP for each card you give.',
		'At the start of income turns 2 to 5, gain 1 VP for each tapestry card in your hand. Then, if you hold more than 4, discard down to 4, choosing which; if you discarded any, gain 1 resource of your choice.',
		'On a neighbour’s advance turn, whenever they would draw a tapestry card, you may give them a card of your choice from your hand instead, and then draw 1 tapestry card yourself. You are asked whenever you hold a card, but not on an income turn, and not once you have finished the game.',
	]),
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
	aliens: civ([
		'When you start the game with the Aliens, or gain them later, you gain 4 space tiles into your supply.',
		'At the start of income turns 2 to 5, first discard the space tile on this mat, if there is one. It leaves the game.',
		'Then either explore a space tile from your supply onto this mat, or gain 1 resource of your choice. If you just discarded a tile, you must first pay 1 resource of your choice to explore.',
		'A tile on this mat gives you its benefit as if you explored it. One that lasts, such as 5 VP for each advance on a track, works until it is discarded.',
	]),
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
	// Arts & Architecture (#37; 03 §2.4).
	relentless: civ([
		'At the end of each of your income turns and advance turns on which you gained an income building or a landmark, put a token on this mat.',
		'At the end of each advance turn on which you gained neither, take every token off and gain by their number: 1 token, 1 VP; 2, 3 VP and 1 tapestry card; 3, 6 VP and a tapestry card or 1 resource of your choice; 4, 10 VP and one of those or explore a territory; 5 or more, 15 VP and one of those or invent a tech card.',
	]),
	gamblers: civ([
		'If you start the game with the Gamblers: at the end of your first income turn, reveal 3 tapestry cards. Play a When Played one on Maker of Fire and gain its effect, and discard the others; with none, keep 1 in your hand and discard the others.',
		'At the start of income turns 2 to 4, do the same on that era’s slot, then play your tapestry card for the era on top of it.',
		'A card that can’t be fully resolved resolves as far as it can.',
	]),
	renegades: civ([
		'You start with a token on the start of this mat’s track, which has one space for each tier.',
		'When you advance on a track and would gain its benefit, you may give up the benefit and the bonus to move your token 1 space here instead, if the tier you advance into or within is the tier of that space. You still gain landmarks.',
		'Tier I: 1 tapestry card and an income building of your choice. Tier II: roll the science die and advance with the benefit, then invent a tech card. Tier III: explore, conquer, then upgrade a tech card. Tier IV: 20 VP.',
		'This track is no advancement track for any other effect, but reaching its end counts as completing a track for the achievement.',
	]),
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
	islanders: civ([
		'When you start the game with the Islanders, you gain 4 territory tiles into your supply. Gained later, you may discard them and gain another civilization; if you keep them, you gain the 4 tiles and may place up to 4 of your territory tiles on this mat, with no VP and no benefit.',
		'This mat is an island: a printed centre hex with six empty hexes round it. The centre is four equal quarters: mountain top-left, grassland top-right, forest bottom-right and desert bottom-left.',
		'At the start of income turns 2 to 5, you may explore 1 tile onto an empty hex of this mat. It scores 1 VP for each side that matches the centre or a tile beside it, as on the map, and gives you its benefit.',
		'Any explore you take on an advance turn may also go onto an empty hex of this mat. These hexes can’t be conquered and are not territories you control.',
		'On your final income turn, gain 4 VP for each tile on this mat whose three outer sides show only sea.',
	]),
	infiltrators: civ(
		[
			'When you start the game with the Infiltrators, or gain them later, you gain 1 culture.',
			'At the start of income turns 2 to 5, you may do one of two things.',
			'Share a territory: place an outpost from your supply on a territory whose only piece is an opponent’s upright outpost. It is not a conquest, and nothing topples. You both control the territory, and you gain the benefit shown on it. With two outposts on it, nobody can conquer it, and sharing the middle island doesn’t earn its achievement.',
			'Slip into a capital: place a player token on an opponent’s capital-city territory, where their two outposts started, and gain 1 VP for each outpost still in their supply. The token gives you no control. When it is your third token on that same territory, you gain a civilization.',
			'Whenever you gain a civilization while you hold the Infiltrators, draw 3 and keep 1; the others are discarded. This holds again when you discard a civilization you just gained, such as the Riverfolk, to gain another.',
		],
		{
			current: [
				'Current rules: if you start the game with the Infiltrators, you don’t gain that culture.',
			],
		}
	),
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
	recyclers: civ(
		[
			'When you start the game with the Recyclers, or gain them later, you draw 3 tech cards, keep 1 in your bottom row and discard the others.',
			'At the start of income turns 2 to 5, you may upgrade a tech card, as well as the usual upgrade.',
			'Whenever you upgrade a tech card, you may instead move a card from your top row back to your bottom row and gain 5 VP. It takes the upgrade’s place: it gains no benefit, and abilities that reward an upgrade don’t count it. Only your own upgrades can, not an Inventors token’s.',
			'Whenever you gain a tech card, you may take any card from the tech discard pile instead, unless what gives it names the deck or the face-up cards, as Steam Tycoon does.',
		],
		{
			current: [
				'Current rules: if you start the game with the Recyclers, you also upgrade a tech card.',
			],
		}
	),
	riverfolk: civ([
		'When you start the game with the Riverfolk, or keep them when you gain them later, you gain 4 VP for each district of your capital city with at least 2 impassable plots showing.',
		'You may place income buildings and landmarks on impassable plots. They still count as filled for districts, rows and columns.',
		'Whenever you cover the last impassable plot of a district, you gain 1 resource of your choice. Each district pays once, and one without impassable plots pays nothing.',
		'At the start of income turn 5, you lose 1 VP for each impassable plot still showing, but you never go below 0 VP.',
		'If you gain the Riverfolk later in the game, you may discard them and gain another civilization instead.',
	]),
	spies: civ(
		[
			'At the start of income turns 2 to 5, you may put a token on one of these 4 options that you have not used yet, and gain its benefit from a neighbour of your choice. Each option is used once a game.',
			'A When Played card: gain the effect of a When Played tapestry card face up on that neighbour’s income mat, as if you had played it. If you copy Espionage, you copy another card through it, and a This Era card copied so lasts until your next income turn.',
			'A tile in their supply: gain the benefit of a territory or space tile in that neighbour’s supply; the tile stays there. A space tile that gives VP for each advance on a track gives them to you whenever you advance on it, for as long as it stays in their supply. Once they explore it, it stops. The Monolith’s tile can’t be taken, as a copied landmark gives nothing.',
			'Their track position: gain the benefit of the space one of that neighbour’s tokens stands on, without its bonus.',
			'Their tech card: gain the benefit of one of that neighbour’s tech cards for the row it is in, the circle of a middle-row card or the square of a top-row card. A landmark card’s square gives nothing.',
			'Then, if that neighbour holds any tapestry cards, you may look at their hand.',
		],
		{
			current: [
				'Current rules: if you start the game with the Spies, at the end of your first income turn you lose 1 resource of your choice.',
			],
		}
	),
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
	tinkerers: civ(
		[
			'If you start the game with the Tinkerers, each opponent gains 1 tech card from the deck into their bottom row and may not upgrade a tech card during their first income turn. If you gain the Tinkerers later in the game, your opponents gain nothing.',
			'At the start of income turns 2 to 5, you may put a token on one of these 4 options that you have not used yet: each is used once a game.',
			'Pay back: gain the resources it cost to advance into the space of one of your tokens. The token stays where it is.',
			'Catch up: advance a token to the space of the closest opponent ahead of you on its track. You gain the benefit but not the bonus, and the landmarks you reach or pass.',
			'Step back: move a token back exactly 3 spaces. You gain that space’s benefit and you may pay its bonus, but no landmark.',
			'Jump ahead: move a token forward to the next space with a bonus and gain that bonus for free. You gain no benefit and no landmark for the tiers you pass, and it is not an advance for abilities that reward one.',
			'You may not catch up or jump ahead on a track you are blocked from advancing on.',
		],
		{
			current: [
				'Current rules: if you start the game with the Tinkerers, each opponent also gains 1 tapestry card.',
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
	'treasure-hunters': civ([
		'When you start the game with the Treasure Hunters, or gain them later, you put 4 tokens on this mat and gain 2 territory tiles.',
		'At the start of income turns 2 to 5, you may move a token from this mat onto an empty explored territory next to one you control, if it shows the terrain of an unused treasure anywhere, at a corner or on its island. If it shows more than one, you choose which. You control it, and that treasure is used: each is claimed once.',
		'Desert: gain 1 coin, then roll the black conquer die twice and gain one of the two results.',
		'Grassland: gain 1 culture, then roll the science die twice and choose one result. You may advance on that track, gaining its benefit, and you may pay its bonus.',
		'Mountain: gain 1 worker, then roll both conquer dice and gain both results, the black die first.',
		'Forest: gain 1 food, then roll the red conquer die twice and gain both results.',
		'Claiming a territory this way is not a conquest. An opponent may conquer it as if your token were a lone outpost, and you may answer with a trap, Surprise Party or Surrender, but not Retreat. After their conquest your token stays and they control the territory; after a trap you control it again.',
	]),
	utilitarians: civ(
		[
			'The mat lists 8 landmarks, each with an ability: the Forge, Barracks, Lighthouse and Apothecary from tier II of the tracks, and the Rubber Works, Tank Factory, Train Station and Academy from tier III. You have 2 tokens, and a landmark you own uses its ability while a token is beside it, so at most 2 abilities work at once.',
			'If you start the game with the Utilitarians, choose a tier II landmark from a track that nobody owns, gain it and place it in your capital city, with a token beside it. If you gain them later in the game, you gain no landmark: put up to 2 tokens beside listed landmarks you already own.',
			'Whenever you gain a listed landmark, you may put a token from your mat beside it, or, with both tokens out, move one beside it.',
			'Forge: whenever you upgrade a tech card to your top row, gain 1 resource of your choice. An Inventors token’s upgrade of your card doesn’t count.',
			'Barracks: whenever you conquer, also gain the red die’s result, even if you kept that die. When you gain both dice, as with Tanks, you gain the red result twice.',
			'Lighthouse: once on each of your advance turns, before or after you advance, you may discard 2 territory tiles to gain 1 resource of your choice. It is offered as the turn starts and, if you didn’t use it then, once more after the advance. If you can afford an advance only with its resource, you may still take an advance turn: it starts with the Lighthouse, which you must use for a resource that pays for an advance.',
			'Apothecary: whenever you gain another landmark, gain 1 resource of your choice.',
			'Rubber Works, Tank Factory, Train Station and Academy: whenever you advance to a space in tier III or IV of technology, military, exploration or science respectively, gain 4 VP.',
		],
		{
			current: [
				'Current rules: if you start the game with the Utilitarians, at the end of your first income turn you lose 1 resource of your choice.',
			],
		}
	),
});

/**
 * A civilization's full ability as short paragraphs, in a table's version. The current rules add the setup adjustment
 * of the civilization a player starts with (R34), or a rule they changed, as a last "Current rules:" paragraph.
 * @param {string} id - The engine's civilization id, such as 'the-chosen'
 * @param {VersionId} version - The table's rules version
 * @returns {string[] | null} A new list each call; null for a civilization with no text, such as an expansion's not built yet
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
 * @returns {string | null} Null for a civilization with no text, such as an expansion's not built yet
 */
export function civAbilityText(id, version) {
	return civRules(id, version)?.join('\n\n') ?? null;
}
