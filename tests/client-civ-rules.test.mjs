// The civilizations' full abilities in words, in each table version (#42, #33), checked against the engine's own rules.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { civAbilityText, civRules } from '../src/lib/cards/civ-rules.js';
// game.js first: it loads the civilization modules in an order free of their import cycle.
import { VERSIONS } from '../src/lib/engine/game.js';
import { CIVS } from '../src/lib/engine/civs/index.js';
import { CRAFTSMEN_COLUMNS } from '../src/lib/engine/civs/craftsmen.js';
import { ENTERTAINERS_GRID } from '../src/lib/engine/civs/entertainers.js';
import { MERRYMAKERS_COLUMNS } from '../src/lib/engine/civs/merrymakers.js';
import { MILITANTS_SPACES } from '../src/lib/engine/civs/militants.js';
import { RIVERFOLK_DISTRICT_VP } from '../src/lib/engine/civs/riverfolk.js';
import {
	RECYCLERS_DRAW,
	RECYCLERS_VP,
} from '../src/lib/engine/civs/recyclers.js';
import { ALIENS_TILES } from '../src/lib/engine/civs/aliens.js';
import {
	TREASURES,
	TREASURE_HUNTERS_TILES,
	TREASURE_HUNTERS_TOKENS,
} from '../src/lib/engine/civs/treasure-hunters.js';
import {
	TINKERERS_OPTIONS,
	TINKERERS_STEP_BACK,
} from '../src/lib/engine/civs/tinkerers.js';
import { SPIES_OPTIONS } from '../src/lib/engine/civs/spies.js';
import {
	LIGHTHOUSE_TRADE,
	UTILITARIANS_ADVANCE_VP,
	UTILITARIANS_LANDMARKS,
	UTILITARIANS_TOKENS,
} from '../src/lib/engine/civs/utilitarians.js';
import {
	INFILTRATORS_CIV_TOKEN,
	INFILTRATORS_CULTURE,
	INFILTRATORS_DRAW,
} from '../src/lib/engine/civs/infiltrators.js';
import {
	ADVISORS_CARDS,
	ADVISORS_GIFT_VP,
	ADVISORS_HAND,
} from '../src/lib/engine/civs/advisors.js';
import {
	AA_CIVS,
	FF_CIVS,
	BASE_CIVS,
	PP_CIVS,
} from '../src/lib/engine/decks.js';
import { ASSETS } from '../src/lib/art/catalog.js';

/** @typedef {import('../src/lib/engine/data/effects.js').Effect} Effect */

const VERSION_IDS = VERSIONS.map((version) => version.id);

/**
 * Civilizations that change with the version without an `adjustment`: the Inventors' top-row benefit (the F&F
 * rulebook r10-1, 03 FF.8.2), which civs/inventors.js gives only under the original rules; and the Infiltrators, whose
 * setup itself withholds the culture from the civilization chosen at setup under the current rules (F&F p.32, R34), as
 * an adjustment can only add or take away.
 */
const VERSIONED_RULES = ['inventors', 'infiltrators'];

/** The words for a resource, a tile or a card, one and several. @type {Record<string, [string, string]>} */
const NOUNS = {
	coin: ['coin', 'coins'],
	worker: ['worker', 'workers'],
	food: ['food', 'food'],
	culture: ['culture', 'culture'],
	any: ['resource of your choice', 'resources of your choice'],
	territory: ['territory tile', 'territory tiles'],
	tapestry: ['tapestry card', 'tapestry cards'],
};

/** @type {Record<string, string>} */
const TRACK_NAMES = {
	exploration: 'Exploration',
	science: 'Science',
	technology: 'Technology',
	military: 'Military',
};

/**
 * The phrases a civilization's text must show, in order, for one of the engine's effects. Unknown kinds throw, so a
 * changed grid fails here instead of passing unread.
 * @param {Effect} effect
 * @returns {string[]}
 */
function phrasesOf(effect) {
	const [[kind, value]] = Object.entries(effect);
	if (kind === 'gain' || kind === 'lose') {
		return Object.entries(value).map(([key, n]) => {
			const [one, several] = NOUNS[key];
			return `${n} ${n === 1 ? one : several}`;
		});
	}
	if (kind === 'vp') {
		return typeof value === 'number'
			? [`${value} VP`]
			: [`${value.each} VP for each ${value.per}`];
	}
	if (kind === 'building') {
		return [value[0].toUpperCase() + value.slice(1)];
	}
	if (kind === 'invent' || kind === 'upgrade') {
		return [`${kind} a tech card`];
	}
	if (kind === 'explore' || kind === 'conquer') {
		return [`${kind} a territory`];
	}
	if (kind === 'research') {
		return value.noBenefit
			? ['roll the science die', 'without its benefit or bonus']
			: ['roll the science die'];
	}
	if (kind === 'advance') {
		return value.tracks.map((/** @type {string} */ t) => TRACK_NAMES[t]);
	}
	throw new Error(`No phrase for the effect kind ${kind}.`);
}

/**
 * Asserts that each phrase shows in the text in order, starting at a marker.
 * @param {string} text
 * @param {string} marker - Where the part of the text being checked starts
 * @param {string[]} phrases
 * @param {string} what - Named in the failure
 */
function assertInOrder(text, marker, phrases, what) {
	let from = text.indexOf(marker);
	assert.ok(from >= 0, `${what}: "${marker}" is missing from "${text}"`);
	for (const phrase of phrases) {
		const at = text.indexOf(phrase, from);
		assert.ok(
			at >= 0,
			`${what}: "${phrase}" is missing or out of order in "${text.slice(from)}"`
		);
		from = at + phrase.length;
	}
}

/**
 * The paragraphs one version has and the other lacks.
 * @param {string} id
 * @returns {string[]}
 */
function currentOnly(id) {
	const original = /** @type {string[]} */ (civRules(id, 'original'));
	return /** @type {string[]} */ (civRules(id, 'current')).filter(
		(paragraph) => !original.includes(paragraph)
	);
}

test('every civilization the engine knows has its ability in words, in both versions', () => {
	assert.equal(
		Object.keys(CIVS).length,
		BASE_CIVS.length + PP_CIVS.length + AA_CIVS.length + FF_CIVS.length
	);
	for (const id of Object.keys(CIVS)) {
		for (const version of VERSION_IDS) {
			const paragraphs = civRules(id, version);
			const what = `${id} (${version})`;
			assert.ok(Array.isArray(paragraphs), `${what} has no text`);
			assert.ok(paragraphs.length > 0, `${what} has no paragraphs`);
			for (const paragraph of paragraphs) {
				assert.equal(typeof paragraph, 'string');
				assert.ok(paragraph.trim().length > 0, `${what}: empty`);
				assert.equal(paragraph, paragraph.trim(), `${what}: spaces`);
				assert.ok(!paragraph.includes('  '), `${what}: "${paragraph}"`);
				assert.match(paragraph, /^[A-Z]/, `${what}: "${paragraph}"`);
				assert.match(paragraph, /[^.]\.$/, `${what}: "${paragraph}"`);
			}
			assert.equal(civAbilityText(id, version), paragraphs.join('\n\n'));
		}
	}
});

test('the versions differ exactly for the civilizations the current rules change', () => {
	for (const [id, civ] of Object.entries(CIVS)) {
		const changed =
			civ.adjustment !== undefined || VERSIONED_RULES.includes(id);
		const original = civRules(id, 'original');
		const current = civRules(id, 'current');
		assert.ok(
			original?.every((p) => !p.includes('Current rules')),
			`${id}'s original text names the current rules`
		);
		if (!changed) {
			assert.deepEqual(current, original, `${id} differs by version`);
			continue;
		}
		assert.notDeepEqual(current, original, `${id} is the same in both`);
		const added = currentOnly(id);
		assert.ok(
			added.length > 0,
			`${id} adds nothing under the current rules`
		);
		for (const paragraph of added) {
			assert.match(
				paragraph,
				/^Current rules: /,
				`${id}: "${paragraph}"`
			);
		}
		// R34: an adjustment is only for the civilization a player starts with.
		if (civ.adjustment) {
			assert.ok(
				added.some((p) => p.includes('if you start the game with')),
				`${id}'s adjustment doesn't say it is for a starting civilization`
			);
		}
	}
});

test('an expansion civilization not built yet, or an unknown one, has no text', () => {
	const expansion = ASSETS.filter(
		(asset) => asset.group === 'civ' && asset.expansion !== 'base'
	).map((asset) => asset.id.slice('civ-'.length));
	assert.ok(expansion.includes('collectors'));
	assert.ok(PP_CIVS.every((id) => expansion.includes(id)));
	for (const id of [
		...expansion.filter(
			(id) =>
				!PP_CIVS.includes(id) &&
				!AA_CIVS.includes(id) &&
				!FF_CIVS.includes(id)
		),
		'unknown',
		'',
		'constructor',
		'__proto__',
	]) {
		for (const version of VERSION_IDS) {
			assert.equal(civRules(id, version), null, id);
			assert.equal(civAbilityText(id, version), null, id);
		}
	}
});

test('a civilization’s text is a fresh list, so changing it changes nothing else', () => {
	const first = /** @type {string[]} */ (civRules('leaders', 'current'));
	first.push('Changed.');
	assert.ok(!civRules('leaders', 'current')?.includes('Changed.'));
});

test('the Craftsmen columns read as the engine pays them, bottom to top', () => {
	const text = /** @type {string} */ (
		civAbilityText('craftsmen', 'original')
	);
	['First column', 'Second column', 'Third column'].forEach((marker, i) => {
		assertInOrder(
			text,
			marker,
			CRAFTSMEN_COLUMNS[i].flat().flatMap(phrasesOf),
			`Craftsmen ${marker}`
		);
	});
});

test('the Merrymakers columns read as the engine pays them, bottom to top', () => {
	const text = /** @type {string} */ (
		civAbilityText('merrymakers', 'original')
	);
	['First column', 'Second column', 'Third column'].forEach((marker, i) => {
		assertInOrder(
			text,
			marker,
			MERRYMAKERS_COLUMNS[i].flat().flatMap(phrasesOf),
			`Merrymakers ${marker}`
		);
	});
});

test('the Militants spaces read as the engine pays them, left to right', () => {
	const text = /** @type {string} */ (
		civAbilityText('militants', 'original')
	);
	assertInOrder(
		text,
		'Top row',
		MILITANTS_SPACES.top.flatMap(phrasesOf),
		'Militants top row'
	);
	assertInOrder(
		text,
		'Bottom row',
		MILITANTS_SPACES.bottom.flatMap(phrasesOf),
		'Militants bottom row'
	);
});

test('the Entertainers grid reads as the engine pays it, top to bottom (R29)', () => {
	const text = /** @type {string} */ (
		civAbilityText('entertainers', 'original')
	);
	[1, 2, 3, 4].forEach((column) => {
		assertInOrder(
			text,
			`Column ${column}`,
			ENTERTAINERS_GRID[column - 1].flat().flatMap(phrasesOf),
			`Entertainers column ${column}`
		);
	});
	assert.match(text, /may pay the bonus/);
});

test('each current-rules adjustment gives what the engine gives (R34)', () => {
	for (const id of [
		'alchemists',
		'entertainers',
		'futurists',
		'isolationists',
		'merrymakers',
		'mystics',
		'recyclers',
		'spies',
		'the-chosen',
		'traders',
		'utilitarians',
	]) {
		const { setup, firstTurnEnd } = CIVS[id].adjustment ?? {};
		/** @type {any[]} */
		const pushed = [];
		const ctx = /** @type {any} */ ({
			state: { version: 'current' },
			push: (/** @type {any[]} */ ops) => pushed.push(...ops),
		});
		(setup ?? firstTurnEnd)?.(ctx, 1);
		const effects = pushed.flatMap((op) => {
			assert.equal(op.kind, 'effects', `${id} pushes ${op.kind}`);
			return op.effects;
		});
		assert.ok(effects.length > 0, `${id} has no adjustment`);
		const [paragraph] = currentOnly(id);
		assertInOrder(
			paragraph,
			'Current rules: ',
			effects.flatMap(phrasesOf),
			`${id}'s adjustment`
		);
		const lost = effects.some((effect) => 'lose' in effect);
		assert.equal(paragraph.includes(' lose '), lost, paragraph);
		assert.equal(
			paragraph.includes('end of your first income turn'),
			firstTurnEnd !== undefined && setup === undefined,
			paragraph
		);
	}
});

test('the Riverfolk read as the engine plays them (03 §1.3)', () => {
	const text = /** @type {string} */ (
		civAbilityText('riverfolk', 'original')
	);
	assert.equal(civAbilityText('riverfolk', 'current'), text);
	assertInOrder(
		text,
		'When you start',
		[
			`${RIVERFOLK_DISTRICT_VP} VP for each district`,
			'at least 2 impassable plots',
			'impassable plots',
			'1 resource of your choice',
			'income turn 5',
			'1 VP for each impassable plot',
			'0 VP',
			'discard them and gain another civilization',
		],
		'Riverfolk'
	);
});

test('the Recyclers read as the engine plays them (03 §1.3)', () => {
	const text = /** @type {string} */ (
		civAbilityText('recyclers', 'original')
	);
	assertInOrder(
		text,
		'When you start',
		[
			'or gain them later',
			`draw ${RECYCLERS_DRAW} tech cards`,
			'keep 1 in your bottom row',
			'income turns 2 to 5',
			'upgrade a tech card',
			'top row back to your bottom row',
			`${RECYCLERS_VP} VP`,
			'not an Inventors token',
			'tech discard pile',
			'Steam Tycoon',
		],
		'Recyclers'
	);
});

test('the Aliens read as the engine plays them (03 §1.3)', () => {
	const text = /** @type {string} */ (civAbilityText('aliens', 'original'));
	assert.equal(civAbilityText('aliens', 'current'), text);
	assertInOrder(
		text,
		'When you start',
		[
			'or gain them later',
			`${ALIENS_TILES} space tiles`,
			'income turns 2 to 5',
			'discard the space tile on this mat',
			'leaves the game',
			'explore a space tile from your supply onto this mat',
			'1 resource of your choice',
			'just discarded',
			'first pay 1 resource of your choice',
			'its benefit',
			'until it is discarded',
		],
		'Aliens'
	);
});

test('the Treasure Hunters read as the engine plays them (03 §1.3, R114)', () => {
	const text = /** @type {string} */ (
		civAbilityText('treasure-hunters', 'original')
	);
	assert.equal(civAbilityText('treasure-hunters', 'current'), text);
	/** Each treasure's terrain, then its resource, in the engine's order. */
	const treasures = TREASURES.flatMap(({ terrain, gain }) => [
		`${terrain[0].toUpperCase()}${terrain.slice(1)}:`,
		...phrasesOf({ gain }),
	]);
	assertInOrder(
		text,
		'When you start',
		[
			'or gain them later',
			`${TREASURE_HUNTERS_TOKENS} tokens`,
			`${TREASURE_HUNTERS_TILES} territory tiles`,
			'income turns 2 to 5',
			'empty',
			'next to one you control',
			'anywhere',
			'You control it',
			'once',
			...treasures,
			'not a conquest',
			'trap, Surprise Party or Surrender',
			'not Retreat',
			'your token stays',
			'after a trap you control it again',
		],
		'Treasure Hunters'
	);
	for (const words of [
		'black conquer die twice',
		'science die twice',
		'both conquer dice',
		'red conquer die twice',
	]) {
		assert.ok(text.includes(words), words);
	}
});

test('the Tinkerers read as the engine plays them, with the current rules adding a tapestry card (03 §1.3, R48)', () => {
	const text = /** @type {string} */ (
		civAbilityText('tinkerers', 'original')
	);
	assertInOrder(
		text,
		'If you start',
		[
			'each opponent',
			'1 tech card',
			'from the deck into their bottom row',
			'first income turn',
			'gain the Tinkerers later',
			'nothing',
			'income turns 2 to 5',
			`${TINKERERS_OPTIONS.length} options`,
			'once a game',
			'Pay back:',
			'cost to advance into the space',
			'stays',
			'Catch up:',
			'closest opponent ahead',
			'the benefit but not the bonus',
			'landmarks',
			'Step back:',
			`exactly ${TINKERERS_STEP_BACK} spaces`,
			'benefit',
			'may pay its bonus',
			'no landmark',
			'Jump ahead:',
			'next space with a bonus',
			'for free',
			'no benefit',
			'no landmark',
			'not an advance',
			'blocked',
		],
		'Tinkerers'
	);
	assert.deepEqual(currentOnly('tinkerers'), [
		'Current rules: if you start the game with the Tinkerers, each opponent also gains 1 tapestry card.',
	]);
});

test('the Spies read as the engine plays them, Espionage and the watched space tile included (03 §1.3, §1.8)', () => {
	const text = /** @type {string} */ (civAbilityText('spies', 'original'));
	assertInOrder(
		text,
		'At the start of income turns 2 to 5',
		[
			`${SPIES_OPTIONS.length} options`,
			'neighbour of your choice',
			'once a game',
			'A When Played card:',
			'face up',
			'income mat',
			'Espionage',
			'This Era card',
			'until your next income turn',
			'A tile in their supply:',
			'territory or space tile',
			'stays there',
			'VP for each advance',
			'as long as',
			'explore it',
			'stops',
			'Monolith',
			'can’t be taken',
			'Their track position:',
			'without its bonus',
			'Their tech card:',
			'circle of a middle-row card',
			'square of a top-row card',
			'landmark',
			'nothing',
			'Then',
			'look at their hand',
		],
		'Spies'
	);
});

test('the Utilitarians read as the engine plays them, each listed landmark in the card’s order (03 §1.3, §1.8, R113)', () => {
	const text = /** @type {string} */ (
		civAbilityText('utilitarians', 'original')
	);
	const names = UTILITARIANS_LANDMARKS.map((id) =>
		id
			.split('-')
			.map((word) => word[0].toUpperCase() + word.slice(1))
			.join(' ')
	);
	assertInOrder(
		text,
		'The mat lists',
		[
			...names,
			`${UTILITARIANS_TOKENS} tokens`,
			'while a token is beside it',
			`at most ${UTILITARIANS_TOKENS}`,
			'If you start the game with the Utilitarians',
			'tier II landmark',
			'nobody owns',
			'a token beside it',
			'later in the game',
			'no landmark',
			`up to ${UTILITARIANS_TOKENS} tokens`,
			'already own',
			'Whenever you gain a listed landmark',
			'from your mat',
			'move one',
			'Forge:',
			'top row',
			'1 resource of your choice',
			'Inventors',
			'Barracks:',
			'whenever you conquer',
			'red die',
			'even if you kept',
			'both dice',
			'twice',
			'Lighthouse:',
			'once on each of your advance turns',
			'before or after you advance',
			`${LIGHTHOUSE_TRADE.pay.territory} territory tiles`,
			'1 resource of your choice',
			'as the turn starts',
			'once more after the advance',
			'only with its resource',
			'advance turn',
			'must',
			'pays for an advance',
			'Apothecary:',
			'another landmark',
			'1 resource of your choice',
			'Rubber Works, Tank Factory, Train Station and Academy:',
			'tier III or IV',
			'technology, military, exploration or science',
			`${UTILITARIANS_ADVANCE_VP} VP`,
		],
		'Utilitarians'
	);
	assert.deepEqual(currentOnly('utilitarians'), [
		'Current rules: if you start the game with the Utilitarians, at the end of your first income turn you lose 1 resource of your choice.',
	]);
});

test('the Infiltrators read as the engine plays them, and the current rules withhold their setup culture (03 §1.3, §1.8, R34)', () => {
	const text = /** @type {string} */ (
		civAbilityText('infiltrators', 'original')
	);
	assertInOrder(
		text,
		'When you start',
		[
			'or gain them later',
			`${INFILTRATORS_CULTURE} culture`,
			'income turns 2 to 5',
			'one of two things',
			'Share a territory:',
			'an outpost from your supply',
			'only piece is an opponent’s upright outpost',
			'not a conquest',
			'You both control',
			'benefit',
			'nobody can conquer it',
			'middle island',
			'Slip into a capital:',
			'player token',
			'capital-city territory',
			'1 VP for each outpost still in their supply',
			'no control',
			`${['first', 'second', 'third'][INFILTRATORS_CIV_TOKEN - 1]} token on that same territory`,
			'gain a civilization',
			`draw ${INFILTRATORS_DRAW} and keep 1`,
			'Riverfolk',
		],
		'Infiltrators'
	);
	assert.deepEqual(currentOnly('infiltrators'), [
		'Current rules: if you start the game with the Infiltrators, you don’t gain that culture.',
	]);
	assert.equal(CIVS.infiltrators.adjustment, undefined);
});

test('the Advisors read as the engine plays them, the same in both versions (03 §1.3, §1.8, R113)', () => {
	const text = /** @type {string} */ (civAbilityText('advisors', 'original'));
	assert.equal(civAbilityText('advisors', 'current'), text);
	assertInOrder(
		text,
		'When you start',
		[
			'or gain them later',
			`draw ${ADVISORS_CARDS} tapestry cards`,
			'later in the game',
			`any of those ${ADVISORS_CARDS} cards`,
			'neighbours',
			`${ADVISORS_GIFT_VP} VP for each card`,
			'income turns 2 to 5',
			'1 VP for each tapestry card in your hand',
			`more than ${ADVISORS_HAND}`,
			`down to ${ADVISORS_HAND}`,
			'1 resource of your choice',
			'neighbour’s advance turn',
			'would draw a tapestry card',
			'instead',
			'then draw 1 tapestry card',
			'not on an income turn',
			'finished',
		],
		'Advisors'
	);
});
