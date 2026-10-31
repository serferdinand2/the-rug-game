// How to play's rules for the base game (#42) and its expansions (#32): the sections the rules panel shows, in our own words, one tab each.
import { deepFreeze } from './engine/data/ids.js';
import { LANDMARK_CARDS } from './engine/data/landmark-cards.js';
import { landmarkGoalPhrase } from './cards/landmark-text.js';
import { landmarkName } from './game-names.js';

/**
 * A block of a section: a paragraph, or a list of short sentences.
 * @typedef {{ text: string } | { list: string[] }} RulesBlock
 */

/**
 * One section of How to play, shown as one tab of the rules panel.
 * @typedef {Object} RulesSection
 * @property {string} id - Stable, such as 'tracks'
 * @property {string} title - The tab's name
 * @property {RulesBlock[]} blocks - In reading order
 * @property {string} [expansion] - The expansion whose rules it tells, shown only at a table with it; left out for the base game's
 */

/**
 * The base game's rules in reading order, paraphrased from docs/research/01-base-core-rules.md and the README's
 * Rules conventions. Every number is the engine's (tests/client-rules-help.test.mjs checks them). Each expansion
 * issue adds its own sections here.
 * @type {readonly RulesSection[]}
 */
export const RULES_HELP = deepFreeze([
	{
		id: 'your-turn',
		title: 'Your turn',
		blocks: [
			{
				text: 'You lead a civilization through the eras of history: you advance on four tracks, build your capital city and spread across the map. Whoever has the most VP when the game ends wins.',
			},
			{
				text: "On your turn you do exactly one thing: advance on a track or take an income turn. There is no passing. If you can't pay for any advance, an income turn is all you can do, and the game offers only that. You may also take an income turn while you could still advance.",
			},
			// #77: the game takes every player's income turn 1 by itself as setup ends.
			{
				text: 'Your first turn is always income turn 1, and the game takes it for you as setup ends. Your income mat shows only the first space of each row, so you gain 1 coin, 1 worker, 1 food, 1 culture, 1 territory tile and 1 tapestry card, and era I begins.',
			},
			{
				text: 'You take 5 income turns in all. The fifth is your last turn: after it you have finished, and play skips you. The game ends once every player has finished.',
			},
		],
	},
	{
		id: 'tracks',
		title: 'Advancing on a track',
		blocks: [
			{
				text: 'On an advance turn, pay for the next space of one track, move your token 1 space forward and resolve it.',
			},
			{
				text: "Each of the four tracks has 12 spaces in four tiers of 3, and you pay for the tier you move into. Its price differs between tracks only in the track's own resource: food for Exploration, worker for Science, coin for Technology and culture for Military.",
			},
			{
				list: [
					'Tier I (spaces 1–3): 1 resource of your choice.',
					"Tier II (spaces 4–6): 1 of the track's resource and 1 of your choice.",
					"Tier III (spaces 7–9): 1 of the track's resource and 2 of your choice.",
					"Tier IV (spaces 10–12): 2 of the track's resource.",
				],
			},
			// R9: a move that passes a tier's first space without stopping on it gains the landmark too.
			{
				text: "The first player to enter tier II, III or IV of a track, in any way, gains the landmark on that tier's first space and places it in their capital city at once.",
			},
			// R19: the same track space is used at most once per turn, in both versions.
			{
				text: "Then you must gain the space's benefit. If it also has a bonus, you may pay for that once. You can't use the same track space twice in one turn.",
			},
			{
				text: "Space 12 ends the track, and you can't go past it. Reaching it earns the Complete a track achievement while its boxes last.",
			},
		],
	},
	{
		id: 'income',
		title: 'Income turns',
		blocks: [
			{
				text: 'Income turn 1 begins era I, income turns 2–4 each end an era and begin the next, and income turn 5 ends era IV.',
			},
			{
				text: 'Its steps run in this order.',
			},
			{
				list: [
					"Civilization (income turns 2–5): use your civilization's income-turn abilities.",
					"Tapestry card (income turns 2–4): if neither neighbour has begun this era, first gain resources of your choice: 1 in era II, 2 in era III and 3 in era IV. Then play a tapestry card from your hand on the era's slot; with an empty hand, the deck's top card goes there face down, with no ability.",
					'Upgrade and score (income turns 2–5): you may upgrade 1 tech card, then score every VP icon your income mat shows.',
					'Income (income turns 1–4): gain every resource, territory tile and tapestry card your income mat shows, up to 8 of each resource.',
				],
			},
			{
				text: 'A When Played ability happens at once; a This Era one lasts until your next income turn.',
			},
			{
				text: 'Your neighbours are the players either side of you, or your one opponent with 2 players.',
			},
			{
				text: 'An upgrade moves a tech card up a row for its circle or square benefit; the top row needs its prerequisite, met by you or a neighbour.',
			},
		],
	},
	{
		id: 'capital',
		title: 'Your capital city',
		blocks: [
			{
				text: "Your capital city is a 9 by 9 grid of plots in nine districts of 3 by 3. Impassable plots can't be built on, but count as filled.",
			},
			{
				text: 'When you gain a farm, house, market or armory, take the leftmost one of that kind from your income mat and place it on any open plot. That uncovers the space it covered, which pays income or VP on later income turns.',
			},
			// R14, R15, R106: quarter turns only, at least 1 plot on the grid, and no overlap off the grid either.
			{
				text: 'A landmark covers plots in its own shape. You may turn it a quarter turn at a time, but not flip it. It may hang over the edge of the grid if it covers at least 1 plot of the grid, and it never overlaps another building.',
			},
			{
				text: "You must place what you gain if it fits. If it can't, it goes beside your city and is still yours.",
			},
			{
				text: 'Filling the last open plot of a district gains you 1 resource of your choice.',
			},
			{
				text: 'Each complete row and each complete column scores 1 VP whenever your city is scored. The house row of your income mat scores it on income turns 2–5, and uncovering more of that row scores it more often. Some track spaces and cards score it too.',
			},
		],
	},
	{
		id: 'map',
		title: 'The map',
		blocks: [
			{
				text: "To explore, place a territory tile from your supply on an unexplored hex next to a territory you control. Score 1 VP for each side whose terrain matches, even in part, the terrain across it; water counts. Then gain the tile's benefit.",
			},
			// R16: only an explored hex can be conquered.
			{
				text: 'To conquer, place an outpost on an explored territory next to one you control, not yours already and holding at most 1 outpost or token. A lone opponent outpost there is toppled, and the territory is yours.',
			},
			{
				text: 'Then roll both conquer dice and gain one result; a few spaces give both.',
			},
			// R7, R8: the faces of the two conquer dice.
			{
				list: [
					'Red die: 4, 5, 6 or 7 VP, or 1 VP per territory you control.',
					"Black die: 1 coin, 1 worker, 1 food or 1 culture, or the conquered territory tile's benefit; a printed territory gives none.",
				],
			},
			// R21, R17, R107: the trapper gains 1 resource of their choice, and the attacker still rolls. The owner's #17
			// ruling asks every defender holding a card, so a wait reveals no trap.
			{
				text: 'The defender may discard a trap card instead: they keep the territory, gain 1 resource of their choice and topple your outpost, and you still roll. Every defender holding a tapestry card is asked, so a wait reveals nothing.',
			},
			{
				text: "Exploring places no outpost. You control a territory where your outpost is the only upright one, and one with 2 outposts can't be conquered, so your starting territory stays yours.",
			},
		],
	},
	{
		id: 'end',
		title: 'Achievements and the end',
		blocks: [
			// R23: the VP are gained at once, even on an opponent's turn.
			{
				text: "The first time you meet an achievement's condition, you take its highest free box and gain its VP at once, even on another player's turn. Each is earned once, and gives nothing once its boxes are taken.",
			},
			// R24: the VP boxes on each side of the board.
			{
				list: [
					'Complete a track: reach space 12 of any track. Boxes: 15, 10 and 5 VP with 4 or 5 players; 10 and 5 VP with 1 to 3.',
					'Topple two outposts: have 2 opponent outposts toppled by your conquests or traps. Boxes: 15, 10 and 5 VP with 4 or 5 players; 10 and 5 VP with 1 to 3.',
					'Conquer the middle: conquer the middle island without being trapped. Boxes: 10 and 5 VP with 4 or 5 players; 10 and 5 VP with 1 to 3.',
				],
			},
			{
				text: 'The game ends when every player has finished income turn 5. Every VP was scored as it was earned, so the most VP wins.',
			},
			{
				text: 'Ties are broken in steps, shown in the results.',
			},
			// R10, R11, R12, R13: the table's version picks the chain, and the landmarks' heights come from R12's ranking.
			{
				list: [
					'Current official rules: the tallest landmark in your capital city (any landmark beats none), then the most resources left.',
					'Original 2019 printing: the most resources left.',
				],
			},
			{
				text: 'Resources left count your coins, workers, food and culture together. Players still tied share the place.',
			},
		],
	},
	{
		id: 'plans-ploys',
		title: 'Plans & Ploys',
		expansion: 'pp',
		blocks: [
			{
				text: 'With Plans & Ploys, each player has a landmark card: a goal, and the landmark it gains.',
			},
			// 03 §1.2: the draft passes counter-clockwise from the player going last; alone, draw 2 and keep 1.
			{
				text: 'As setup ends, the player going last draws one landmark card per player and keeps one; the rest pass back through turn order, each player keeping one, the first player last. Alone, you draw 2 and keep 1. Your card shows on your Civ tab, for everyone to see.',
			},
			// R111: the final income turn's end counts too.
			{
				text: "At the end of each of your turns, your final income turn included, if your card's goal is met you must gain its landmark and place it in your capital city.",
			},
			{
				list: LANDMARK_CARDS.map(
					(card) =>
						`${landmarkName(card.landmark)}: ${landmarkGoalPhrase(card.id)}.`
				),
			},
			// 03 §1.5: a move of several spaces is one advance.
			{
				text: 'Four space tiles join the stack. Once explored, three give 5 VP whenever you advance on their track (technology, science or military); a move of several spaces is one advance. The fourth gains you the Monolith landmark.',
			},
		],
	},
]);

/**
 * How to play's sections for a table: the base game's, and those of its expansions (#32).
 * @param {readonly string[]} expansions - The table's expansion codes
 * @returns {RulesSection[]}
 */
export function rulesSections(expansions) {
	return RULES_HELP.filter(
		(section) =>
			section.expansion === undefined ||
			expansions.includes(section.expansion)
	);
}
