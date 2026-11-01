// The turn footer (#86): footerView decides which of the eleven footers shows and every word in it.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { view } from '../src/lib/engine/game.js';
import { TRACKS } from '../src/lib/engine/data/tracks.js';
import {
	advanceOptions,
	decisionTurnHeading,
	footerView,
	takingTurnWords,
} from '../src/lib/turn.js';
import { spaceWords, tierSymbols } from '../src/lib/board.js';
import { playerColor } from '../src/lib/ui.js';
import { readyTurn } from './helpers/engine.mjs';

const RICH = { coin: 3, food: 3, worker: 3, culture: 3 };

/** The footer's inputs with nothing open, asked or chosen. */
const QUIET = Object.freeze({
	overviewOpen: false,
	noticeOpen: false,
	incomeAsk: false,
	trackAsk: false,
	selected: null,
	options: [],
	paying: false,
	income: null,
	incomeStep: null,
});

/**
 * The turn's player's view at their turn choice, with resources for every first space unless `poor`.
 * @param {{ poor?: boolean }} [options]
 */
function turnChoice({ poor = false } = {}) {
	const { state, player } = readyTurn(2, (seat) => {
		if (!poor) {
			seat.resources = { ...RICH };
		}
	});
	const game = view(state, player);
	return { state, player, game, options: advanceOptions(game, player) };
}

/**
 * A copy of a view whose only open decision is one of `kind` for `player`.
 * @param {any} game
 * @param {number} player
 * @param {string} kind
 */
function asking(game, player, kind) {
	return {
		...game,
		pending: [{ id: 99, batch: 99, player, kind, answers: [{}] }],
	};
}

test('the players overview shows its close bar over every other footer', () => {
	const { game, player, options } = turnChoice();
	assert.deepEqual(
		footerView(game, player, { ...QUIET, options, overviewOpen: true }),
		{ kind: 'overview' }
	);
});

test('a finished game offers its results, in the complete tone the results footer shares (#105)', () => {
	const { game, player } = turnChoice();
	const footer = footerView({ ...game, phase: 'over' }, player, QUIET);
	assert.equal(footer.kind, 'over');
	assert.equal(footer.tone, 'complete');
	assert.equal(footer.label, 'Game complete');
	assert.equal(footer.heading, 'The game is complete.');
	assert.equal(footer.detail, 'The board as the game ended.');
});

test('the income question says what the next income turn does', () => {
	const { game, player, options } = turnChoice();
	const footer = footerView(game, player, {
		...QUIET,
		options,
		incomeAsk: true,
	});
	assert.equal(footer.kind, 'incomeAsk');
	assert.equal(footer.heading, 'Take an income turn?');
	assert.equal(footer.detail, 'End era I, gain income and begin era II.');
});

test('the track question offers the tracks with a space the viewer can pay for, by number', () => {
	const { game, player, options } = turnChoice();
	const footer = footerView(game, player, {
		...QUIET,
		options: options.filter((o) => o.track !== 'military'),
		trackAsk: true,
	});
	assert.equal(footer.kind, 'trackAsk');
	assert.equal(footer.heading, 'Advance on which track?');
	assert.equal(footer.detail, 'Press its number, or Esc to go back.');
	assert.deepEqual(footer.tracks, [
		{ track: 'exploration', label: '1 · Exploration', enabled: true },
		{ track: 'science', label: '2 · Science', enabled: true },
		{ track: 'technology', label: '3 · Technology', enabled: true },
		{ track: 'military', label: '4 · Military', enabled: false },
	]);
});

test('with no advance to pay for, the footer takes income, but not under the notice', () => {
	const { game, player, options } = turnChoice({ poor: true });
	const footer = footerView(game, player, { ...QUIET, options });
	assert.equal(footer.kind, 'forcedIncome');
	assert.equal(
		footer.heading,
		"You can't pay for any advance, so take an income turn."
	);
	assert.equal(footer.detail, 'End era I, gain income and begin era II.');
	assert.equal(footer.takeIncome, true);
	assert.equal(
		footerView(game, player, { ...QUIET, options, noticeOpen: true })
			.takeIncome,
		false
	);
});

test('a selected space names it, says its benefit and prices its tier', () => {
	const { game, player, options } = turnChoice();
	const selected = { track: /** @type {const} */ ('science'), space: 1 };
	const footer = footerView(game, player, { ...QUIET, options, selected });
	assert.equal(footer.kind, 'selected');
	assert.equal(footer.tone, 'selected');
	assert.equal(footer.heading, 'Advance to');
	assert.equal(footer.properName, TRACKS.science[1].name);
	assert.equal(footer.track, 'science');
	assert.equal(footer.detail, spaceWords(game, 'science', 1));
	assert.deepEqual(footer.cost, tierSymbols('science', 1));
	assert.deepEqual(footer.income, {
		description: 'End era I, gain income and begin era II.',
		label: 'Take income',
		folded: true,
	});
	assert.deepEqual(footer.advance, { enabled: true, title: undefined });
});

test('a selected unclaimed landmark space includes its landmark footprint in the footer', () => {
	const { game, player, options } = turnChoice();
	const selected = { track: /** @type {const} */ ('exploration'), space: 4 };
	const footer = footerView(game, player, { ...QUIET, options, selected });
	assert.equal(footer.landmark, 'lighthouse');

	const claimed = {
		...game,
		landmarks: game.landmarks.filter((id) => id !== 'lighthouse'),
	};
	const claimedFooter = footerView(claimed, player, {
		...QUIET,
		options,
		selected,
	});
	assert.equal(claimedFooter.landmark, undefined);
});

test("Advance says why it can't be pressed: a space out of reach, or a payment to pick in the panel", () => {
	const { game, player, options } = turnChoice();
	const far = footerView(game, player, {
		...QUIET,
		options,
		selected: { track: 'science', space: 4 },
	});
	assert.deepEqual(far.advance, {
		enabled: false,
		title: "You can't advance there now.",
	});
	assert.deepEqual(far.cost, tierSymbols('science', 2));
	const paying = footerView(game, player, {
		...QUIET,
		options,
		selected: { track: 'science', space: 1 },
		paying: true,
	});
	assert.deepEqual(paying.advance, {
		enabled: false,
		title: 'Pick the payment in the panel.',
	});
});

test('the turn choice points at the outlined spaces and offers income, not under the notice', () => {
	const { game, player, options } = turnChoice();
	const footer = footerView(game, player, { ...QUIET, options });
	assert.equal(footer.kind, 'turn');
	assert.equal(footer.tone, 'neutral');
	assert.equal(
		footer.heading,
		'Choose a space to advance to, or take income.'
	);
	assert.equal(
		footer.detail,
		'The spaces you can pay for are outlined in green.'
	);
	assert.equal(footer.income?.label, 'Take income');
	assert.equal(footer.income?.folded, false);
	assert.equal(
		footerView(game, player, { ...QUIET, options, noticeOpen: true })
			.income,
		null
	);
});

test('an open advance has no income to offer, and with nothing to pay for says to take income', () => {
	const { game, player } = turnChoice();
	const advancing = asking(game, player, 'chooseAdvance');
	const footer = footerView(advancing, player, QUIET);
	assert.equal(footer.kind, 'turn');
	assert.equal(footer.heading, 'Take an income turn.');
	assert.equal(footer.detail, undefined);
	assert.equal(footer.income, null);
});

test("the viewer's income turn names its number and the step running", () => {
	const { game, player } = turnChoice();
	const deciding = asking(game, player, 'chooseResource');
	const footer = footerView(deciding, player, {
		...QUIET,
		income: { turn: 3 },
		incomeStep: 'Gain income',
	});
	assert.equal(footer.kind, 'income');
	assert.equal(footer.tone, 'income');
	assert.equal(footer.label, 'Your income turn');
	assert.equal(footer.heading, 'Income turn 3 · Gain income');
	assert.equal(footer.detail, undefined);
	const first = footerView(deciding, player, {
		...QUIET,
		income: { turn: 1 },
	});
	assert.equal(first.heading, 'Income turn 1');
	assert.equal(first.detail, 'Every player’s first turn is an income turn.');
});

test('any other decision of the viewer says whose turn it is part of', () => {
	const { game, player } = turnChoice();
	const deciding = asking(game, player, 'chooseResource');
	const footer = footerView(deciding, player, QUIET);
	assert.equal(footer.kind, 'decision');
	assert.equal(footer.label, 'Your decision');
	assert.equal(footer.heading, decisionTurnHeading(deciding, player));
});

test('in setup, with nothing to choose, the viewer waits for the others', () => {
	const { game, player } = turnChoice();
	const other = player === 1 ? 2 : 1;
	const setup = { ...asking(game, other, 'chooseCiv'), phase: 'setup' };
	const footer = footerView(setup, player, QUIET);
	assert.equal(footer.kind, 'setup');
	assert.equal(footer.tone, 'waiting');
	assert.equal(footer.label, 'Setting up');
	assert.equal(footer.heading, 'Waiting for the others to choose.');
});

test("on another player's turn the footer names them in their colour", () => {
	const { state, player } = readyTurn(2);
	const other = player === 1 ? 2 : 1;
	const game = view(state, other);
	const name = game.seats[player - 1].name;
	const footer = footerView(game, other, QUIET);
	assert.equal(footer.kind, 'waiting');
	assert.equal(footer.tone, 'waiting');
	assert.equal(footer.label, `${name}’s turn`);
	assert.equal(footer.labelColor, playerColor(/** @type {any} */ (player)));
	assert.equal(footer.heading, takingTurnWords(game, player, name));
});

test('while someone other than the turn’s player decides, the footer waits for them', () => {
	const { state, player } = readyTurn(2);
	const other = player === 1 ? 2 : 1;
	const game = asking(view(state, null), other, 'chooseResponse');
	const name = game.seats[other - 1].name;
	const footer = footerView(game, null, QUIET);
	assert.equal(footer.kind, 'waiting');
	assert.equal(footer.label, `Waiting for ${name}`);
	assert.equal(footer.labelColor, playerColor(/** @type {any} */ (other)));
	assert.equal(footer.heading, `${name} is deciding.`);
});

test('with no one to play, there is no footer', () => {
	const { game } = turnChoice();
	assert.deepEqual(
		footerView({ ...game, current: null, pending: [] }, null, QUIET),
		{ kind: 'none' }
	);
});

test('Game.svelte renders one TurnFooter and draws no footer of its own', () => {
	const source = readFileSync(
		fileURLToPath(new URL('../src/screens/Game.svelte', import.meta.url)),
		'utf8'
	);
	assert.match(source, /<TurnFooter\b/);
	assert.doesNotMatch(source, /<TurnBar\b|<OverviewCloseBar\b/);
	assert.doesNotMatch(source, /\{#snippet \w*(?:Income|Ask)\w*\(\)\}/);
	assert.doesNotMatch(
		source,
		/function priceSymbols|\/\*\* @type \{ComponentEvent\} \*\/ \(\s*\/\*\* @type \{unknown\} \*\//
	);
});

test('TurnBar has no income reveal of its own, and TurnFooter passes it an IncomeReveal (#122)', () => {
	const read = (/** @type {string} */ path) =>
		readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');
	const bar = read('../src/lib/components/prompts/TurnBar.svelte');
	assert.doesNotMatch(
		bar,
		/onTurnBarIncome|TurnBarIncome|income-reveal|income-access|showIncome/
	);
	assert.doesNotMatch(bar, /\bincome\s*=\s*null/);
	const footer = read('../src/screens/game/TurnFooter.svelte');
	assert.match(footer, /<IncomeReveal\b/);
	assert.match(footer, /reveal=/);
});
