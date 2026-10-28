// The prompt model (#28): what the decision panel draws for each open decision, from the viewer's own view.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
	DECISIONS,
	createGame,
	openDecisions,
	play,
	view,
} from '../src/lib/engine/game.js';
import { seededRandom } from '../src/lib/engine/random.js';
import { push } from '../src/lib/engine/stack.js';
import { run } from '../src/lib/engine/loop.js';
import { TRACKS } from '../src/lib/engine/data/tracks.js';
import {
	effectArt,
	incomeView,
	panelControls,
	paymentControls,
	promptFor,
} from '../src/lib/prompts.js';
import {
	exploreIndex,
	exploreTiles,
	hexScores,
} from '../src/lib/area/explore.js';
import { advanceOptions, myDecision } from '../src/lib/turn.js';
import {
	advanceModel,
	canPick,
	canPickItem,
	emptySelection,
	matchIndex,
	offerModel,
	toggleItem,
	togglePick,
} from '../src/lib/picks.js';
import { readyTurn, startedGame, newGame } from './helpers/engine.mjs';

/** The words a label must never show. */
const BAD_WORDS = ['undefined', '[object', 'Choose this option'];

/**
 * The layout the places of a prompt's options call for.
 * @param {{ place: string }[]} options
 */
function layoutOf(options) {
	const places = new Set(options.map((o) => o.place));
	if (places.has('capital')) {
		return 'capital';
	}
	if (places.has('map')) {
		return 'map';
	}
	return places.has('shelf') ? 'cards' : 'options';
}

/**
 * Whether a seat is in its own income turn by the state's own record: an `incomeSteps` operation of its is
 * pending, or its latest `incomeTurnStarted` is newer than the latest `turnStarted`.
 * @param {any} state
 * @param {number} seat
 */
function inIncomeTurn(state, seat) {
	const stacks = [
		state.pending,
		...state.pending
			.filter((/** @type {any} */ op) => op.kind === 'group')
			.flatMap((/** @type {any} */ g) =>
				g.lanes.map((/** @type {any} */ l) => l.stack)
			),
	];
	const pending = stacks.some((stack) =>
		stack.some(
			(/** @type {any} */ op) =>
				op.kind === 'incomeSteps' && op.player === seat
		)
	);
	const last = (/** @type {(e: any) => boolean} */ match) =>
		state.events.findLast(match)?.seq ?? -1;
	const income = last(
		(e) => e.type === 'incomeTurnStarted' && e.player === seat
	);
	return pending || income > last((e) => e.type === 'turnStarted');
}

/**
 * Answers open decisions with their first answers until one of a kind opens for a player.
 * @param {any} state
 * @param {any} random
 * @param {number} player
 * @param {string} kind
 */
function answerUntil(state, random, player, kind) {
	for (let step = 0; step < 50; step++) {
		const open = openDecisions(state);
		if (open.some((d) => d.kind === kind && d.player === player)) {
			return state;
		}
		const [first] = open;
		const answer = DECISIONS[first.kind].answers(state, first)[0];
		state = play(
			state,
			/** @type {number} */ (first.player),
			{ decision: first.id, ...answer },
			random
		);
	}
	throw new Error(`No ${kind} opened for seat ${player}.`);
}

test("every open decision of the viewer's own view gets a prompt with one option per answer, over random games", () => {
	let prompts = 0;
	let incomes = 0;
	let explores = 0;
	/** @type {Set<string>} */
	const kinds = new Set();
	for (let seed = 1; seed <= 30; seed++) {
		const random = seededRandom(seed);
		const players = 2 + (seed % 4);
		let state = createGame({
			players: Array.from({ length: players }, (_, i) => ({
				name: `P${i}`,
			})),
			version: seed % 2 ? 'current' : 'original',
			random,
		});
		for (let step = 0; step < 3000 && state.phase !== 'over'; step++) {
			const open = openDecisions(state);
			for (const decision of open) {
				const seat = /** @type {number} */ (decision.player);
				const game = view(state, seat);
				const mine = openDecisions(game).find(
					(d) => d.id === decision.id
				);
				if (!Array.isArray(mine?.answers)) {
					continue;
				}
				const where = `seed ${seed}, step ${step}, ${decision.kind}`;
				const prompt = promptFor(mine, game, seat);
				assert.ok(prompt, where);
				prompts++;
				kinds.add(decision.kind);
				assert.equal(prompt.kind, decision.kind, where);
				assert.ok(prompt.title.length > 0, where);
				assert.ok(prompt.instruction.length > 0, where);
				assert.ok(prompt.confirmLabel.length > 0, where);
				assert.equal(prompt.options.length, mine.answers.length, where);
				prompt.options.forEach((option, i) => {
					const answer = mine.answers[i];
					assert.equal(option.index, i, where);
					for (const bad of BAD_WORDS) {
						assert.ok(
							!option.label.includes(bad),
							`${where}: "${option.label}"`
						);
					}
					if (typeof answer.hex === 'string') {
						assert.equal(option.place, 'map', where);
						assert.equal(option.hex, answer.hex, where);
					}
					if (typeof answer.row === 'number') {
						assert.equal(option.place, 'capital', where);
						assert.equal(option.plot?.row, answer.row, where);
						assert.equal(option.plot?.col, answer.col, where);
					}
					for (const art of option.art) {
						assert.equal(typeof art.kind, 'string', where);
						if (art.kind !== 'vp') {
							assert.notEqual(art.id, undefined, where);
							assert.notEqual(art.id, null, where);
						}
					}
				});
				assert.equal(prompt.layout, layoutOf(prompt.options), where);
				// Every option can be reached, whatever the layout: a shelf option on a shelf of its kind, a map
				// option on a lit hex, a capital option with its plot.
				const places = new Set(prompt.options.map((o) => o.place));
				assert.equal(prompt.shelf !== null, places.has('shelf'), where);
				assert.deepEqual(
					prompt.mapHexes,
					[
						...new Set(
							prompt.options.flatMap((o) =>
								o.hex ? [o.hex] : []
							)
						),
					],
					where
				);
				if (decision.kind === 'chooseExplore') {
					explores++;
					const tiles = exploreTiles(mine);
					const hexes = Object.keys(hexScores(game, mine, tiles[0]));
					const hits = tiles.flatMap((tile) =>
						hexes.flatMap((hex) =>
							[0, 1, 2, 3, 4, 5].map((orient) =>
								exploreIndex(mine, { tile, hex, orient })
							)
						)
					);
					assert.ok(!hits.includes(-1), where);
					assert.deepEqual(
						[...hits].sort((a, b) => a - b),
						mine.answers.map((_, i) => i),
						where
					);
				}
				if (prompt.income) {
					incomes++;
					assert.ok(inIncomeTurn(state, seat), where);
					assert.ok(
						prompt.income.steps.length > 0 &&
							prompt.income.turn >= 1 &&
							prompt.income.turn <= 5,
						where
					);
				}
			}
			const decision = open[random(open.length)];
			const seat = /** @type {number} */ (decision.player);
			const answers = DECISIONS[decision.kind].answers(state, decision);
			const pick =
				decision.kind === 'chooseTurn' &&
				answers.length > 1 &&
				random(10) < 8
					? answers[1]
					: answers[random(answers.length)];
			state = play(
				state,
				seat,
				{ decision: decision.id, ...pick },
				random
			);
		}
	}
	assert.ok(prompts > 1000, `only ${prompts} prompts`);
	assert.ok(explores > 0, 'no explore checked');
	assert.ok(incomes > 100, `only ${incomes} prompts in an income turn`);
	for (const kind of [
		'chooseCapital',
		'chooseCiv',
		'chooseTapestry',
		'chooseExplore',
		'choosePlacement',
		'chooseBonus',
	]) {
		assert.ok(kinds.has(kind), `no ${kind} opened`);
	}
});

test('a choice of 1 resource of any kind gives 4 options, each with that one resource', () => {
	const { state } = startedGame(2);
	const player = /** @type {number} */ (state.current);
	state.pending.length = 0;
	push(state, state.pending, [
		{ player, kind: 'chooseResource', count: 1, from: 'any' },
	]);
	const game = view(state, player);
	const prompt = promptFor(myDecision(game, player), game, player);
	assert.ok(prompt);
	assert.equal(prompt.layout, 'options');
	assert.equal(prompt.options.length, 4);
	const ids = prompt.options.map((option) => {
		assert.equal(option.place, 'panel');
		assert.equal(option.art.length, 1);
		const [art] = option.art;
		assert.equal(art.kind, 'resource');
		assert.equal(/** @type {any} */ (art).count, 1);
		return /** @type {any} */ (art).id;
	});
	assert.deepEqual(ids.sort(), ['coin', 'culture', 'food', 'worker']);
});

test("a track space's bonus shows its track, its price and a decline on the panel", () => {
	const { state, random } = startedGame(2);
	const player = /** @type {number} */ (state.current);
	const space = TRACKS.exploration.findIndex(
		(s) => s.bonus && Object.keys(s.bonus.pay).join() === 'any'
	);
	/** @type {any} */ (state.seats[player - 1]).resources = {
		coin: 1,
		worker: 1,
		food: 0,
		culture: 0,
	};
	state.pending.length = 0;
	push(state, state.pending, [
		{ player, kind: 'bonus', track: 'exploration', space },
	]);
	run(state, random);
	const game = view(state, player);
	const decision = myDecision(game, player);
	assert.equal(decision?.kind, 'chooseBonus');
	const prompt = promptFor(decision, game, player);
	assert.ok(prompt);
	assert.equal(prompt.track, 'exploration');
	assert.deepEqual(prompt.cost, ['any']);
	assert.equal(prompt.layout, 'options');
	const [decline, ...pays] = prompt.options;
	assert.equal(decline.place, 'panel');
	assert.equal(decline.label, 'No bonus');
	assert.deepEqual(decline.art, []);
	assert.deepEqual(
		pays.map((option) => [option.place, option.art]),
		[
			['panel', [{ kind: 'resource', id: 'coin', count: 1 }]],
			['panel', [{ kind: 'resource', id: 'worker', count: 1 }]],
		]
	);
});

test("income turn 2's tapestry card shows the turn's steps, with Tapestry the current one", () => {
	const ready = readyTurn(2, (seat, state) => {
		seat.hand = state.supply.tapestry.deck.splice(0, 2);
	});
	const { random, player } = ready;
	const turn = openDecisions(ready.state).find(
		(d) => d.kind === 'chooseTurn'
	);
	assert.ok(turn);
	let state = play(
		ready.state,
		player,
		{ decision: turn.id, turn: 'income' },
		random
	);
	state = answerUntil(state, random, player, 'chooseTapestry');
	const game = view(state, player);
	const decision = myDecision(game, player);
	assert.equal(decision?.kind, 'chooseTapestry');
	const prompt = promptFor(decision, game, player);
	assert.ok(prompt?.income);
	assert.equal(prompt.income.turn, 2);
	assert.equal(prompt.income.current, 'tapestry');
	assert.deepEqual(
		prompt.income.steps.map((s) => s.id),
		['civAbilities', 'tapestry', 'upgrade', 'score', 'income']
	);
	assert.deepEqual(
		prompt.income.steps.map((s) => s.label),
		['Ability', 'Tapestry', 'Upgrade', 'Score', 'Income']
	);
	assert.equal(prompt.layout, 'cards');
	assert.equal(prompt.shelf, 'tapestry');
	assert.equal(prompt.confirmLabel, 'Play card');
	assert.equal(
		prompt.instruction,
		'Choose a card above, then confirm it here.'
	);
	for (const option of prompt.options) {
		assert.equal(option.place, 'shelf');
		assert.deepEqual(option.art, [
			{ kind: 'tapestry', id: decision.answers[option.index].card },
		]);
	}
	// The other seat sees no income turn of its own.
	const other = player === 1 ? 2 : 1;
	assert.equal(incomeView(view(state, other), other), null);
});

test("a decision without answers, as another seat's view shows it, has no prompt", () => {
	const { state } = newGame(2);
	const game = view(state, 2);
	const theirs = openDecisions(game).find((d) => d.player === 1);
	assert.ok(theirs);
	assert.equal(theirs.answers, undefined);
	assert.equal(promptFor(theirs, game, 2), null);
	assert.equal(incomeView(game, 2), null);
});

test('effect art shows resources with their counts and tracks', () => {
	assert.deepEqual(
		effectArt([{ gain: { coin: 2 } }, { advance: { track: 'science' } }]),
		[
			{ kind: 'resource', id: 'coin', count: 2 },
			{ kind: 'track', id: 'science' },
		]
	);
	assert.deepEqual(effectArt([{ advance: { tracks: ['military'] } }]), [
		{ kind: 'track', id: 'military' },
	]);
	assert.deepEqual(effectArt([{ building: 'farm' }, { vp: 3 }]), [
		{ kind: 'building', id: 'farm' },
		{ kind: 'vp', count: 3 },
	]);
	assert.deepEqual(
		effectArt([{ vp: { per: 'territory' } }, { explore: {} }]),
		[]
	);
});

test('inventing offers the top of the deck on the shelf with the deck count, and refreshing on the panel', () => {
	const { state, random } = startedGame(2);
	const player = /** @type {number} */ (state.current);
	state.pending.length = 0;
	push(state, state.pending, [
		{ player, kind: 'effects', effects: [{ invent: { refresh: true } }] },
	]);
	run(state, random);
	const game = view(state, player);
	const decision = myDecision(game, player);
	assert.equal(decision?.kind, 'chooseInvent');
	const prompt = promptFor(decision, game, player);
	assert.ok(prompt);
	assert.equal(prompt.layout, 'cards');
	assert.equal(prompt.shelf, 'tech');
	assert.equal(prompt.confirmLabel, 'Invent');
	assert.equal(prompt.income, null);
	const deck = prompt.options.find(
		(o) => decision.answers[o.index].card === 'deck'
	);
	assert.equal(deck?.place, 'shelf');
	assert.deepEqual(deck?.art, [
		{ kind: 'deck', id: 'tech', count: game.supply.tech.deck },
	]);
	const refresh = prompt.options.find(
		(o) => decision.answers[o.index].refresh === true
	);
	assert.equal(refresh?.place, 'panel');
});

test('placing a landmark asks for it on the capital, with the landmark sentence', () => {
	const { state, random } = startedGame(2);
	const player = /** @type {number} */ (state.current);
	state.pending.length = 0;
	push(state, state.pending, [
		{ player, kind: 'choosePlacement', landmark: 'lighthouse' },
	]);
	run(state, random);
	const game = view(state, player);
	const prompt = promptFor(myDecision(game, player), game, player);
	assert.ok(prompt);
	assert.equal(prompt.layout, 'capital');
	assert.equal(prompt.confirmLabel, 'Place');
	assert.equal(
		prompt.instruction,
		'Place the landmark in your capital: drag it, turn it with R, then confirm.'
	);
	for (const option of prompt.options) {
		if (option.place === 'capital') {
			assert.equal(typeof option.plot?.rotation, 'number');
		} else {
			assert.deepEqual(option.art, [
				{ kind: 'landmark', id: 'lighthouse' },
			]);
		}
	}
});

test('the Nomads place a gained building in their capital or on a lit territory: the capital leads, the map stays lit', () => {
	const { state: started, random } = startedGame(2);
	const state = structuredClone(started);
	state.pending.length = 0;
	/** @type {any} */ (state.seats[0]).civs = ['nomads'];
	push(state, state.pending, [
		{ player: 1, kind: 'effects', effects: [{ building: 'farm' }] },
	]);
	run(state, random);
	const game = view(state, 1);
	const prompt = promptFor(myDecision(game, 1), game, 1);
	assert.ok(prompt);
	assert.equal(prompt.kind, 'choosePlacement');
	assert.equal(prompt.layout, 'capital');
	assert.ok(prompt.options.some((o) => o.place === 'capital'));
	assert.ok(prompt.mapHexes.length > 0);
	assert.equal(
		prompt.instruction,
		'Choose a lit plot in your capital, or a lit territory on the map.'
	);
});

/** The resources in the order rows list them. */
const ROW_ORDER = ['coin', 'food', 'worker', 'culture'];

/**
 * Checks a pick model: every candidate can be built by allowed picks and matches back to itself, and random walks
 * of allowed picks always end on an answer (#75).
 * @param {import('../src/lib/picks.js').PickModel} model
 * @param {(n: number) => number} random
 * @param {string} where
 */
function checkPicks(model, random, where) {
	const free = model.rows.flatMap((row, i) =>
		row.fixed === null ? [i] : []
	);
	for (const candidate of model.candidates) {
		/** @type {Record<string, number>} */
		const left = { ...candidate.resources };
		if (model.mode === 'pay') {
			for (const row of model.rows) {
				if (row.fixed) {
					left[row.fixed] = (left[row.fixed] ?? 0) - 1;
				}
			}
		}
		const queue = ROW_ORDER.flatMap((id) =>
			Array(Math.max(0, left[id] ?? 0)).fill(id)
		);
		while (model.mode === 'convert' && queue.length < free.length) {
			queue.push('food');
		}
		assert.equal(
			queue.length,
			free.length,
			`${where}: candidate ${candidate.index} fits the rows`
		);
		let selection = emptySelection(model);
		free.forEach((row, i) => {
			assert.ok(
				canPick(model, selection, row, queue[i]),
				`${where}: ${queue[i]} in row ${row}`
			);
			selection = togglePick(model, selection, row, queue[i]);
		});
		for (const id of candidate.items) {
			assert.ok(
				canPickItem(model, selection, id),
				`${where}: item ${id}`
			);
			selection = toggleItem(model, selection, id);
		}
		assert.equal(
			matchIndex(model, selection),
			candidate.index,
			`${where}: candidate ${candidate.index}`
		);
	}
	for (let walk = 0; walk < 5; walk++) {
		let selection = emptySelection(model);
		for (;;) {
			/** @type {(() => typeof selection)[]} */
			const moves = [];
			for (const row of free) {
				if (selection.rows[row] === null) {
					for (const id of model.rows[row].offers) {
						if (canPick(model, selection, row, id)) {
							moves.push(() =>
								togglePick(model, selection, row, id)
							);
						}
					}
				}
			}
			for (const id of model.items?.ids ?? []) {
				if (
					!selection.items.includes(id) &&
					canPickItem(model, selection, id)
				) {
					moves.push(() => toggleItem(model, selection, id));
				}
			}
			if (moves.length === 0) {
				break;
			}
			selection = moves[random(moves.length)]();
		}
		assert.notEqual(
			matchIndex(model, selection),
			-1,
			`${where}: walk ${walk} ended on an answer`
		);
	}
}

test('every answer of a pick prompt can be built by allowed picks and matches back to itself, over random games', () => {
	/** @type {Record<string, number>} */
	const checked = {};
	for (let seed = 1; seed <= 60; seed++) {
		const random = seededRandom(seed);
		const walks = seededRandom(seed * 31);
		const players = 1 + (seed % 5);
		let state = createGame({
			players: Array.from({ length: players }, (_, i) => ({
				name: `P${i}`,
			})),
			version: seed % 2 ? 'current' : 'original',
			random,
		});
		for (let step = 0; step < 3000 && state.phase !== 'over'; step++) {
			const open = openDecisions(state);
			for (const decision of open) {
				const seat = /** @type {number} */ (decision.player);
				const game = view(state, seat);
				const mine = openDecisions(game).find(
					(d) => d.id === decision.id
				);
				if (!Array.isArray(mine?.answers)) {
					continue;
				}
				const where = `seed ${seed}, step ${step}, ${decision.kind}`;
				const prompt = promptFor(mine, game, seat);
				assert.ok(prompt, where);
				/** @type {[string, import('../src/lib/picks.js').PickModel | null][]} */
				const models = [[decision.kind, prompt.picks]];
				for (const offer of prompt.trade ?? []) {
					if (offer.enabled) {
						models.push([
							`chooseTrade offer ${offer.offer}`,
							offerModel(mine, offer.offer, game, seat),
						]);
					}
				}
				if (
					decision.kind === 'chooseTurn' ||
					decision.kind === 'chooseAdvance'
				) {
					for (const option of advanceOptions(game, seat)) {
						models.push(['advance', advanceModel(option, game)]);
					}
				}
				for (const [name, model] of models) {
					if (model) {
						checked[name.split(' ')[0]] =
							(checked[name.split(' ')[0]] ?? 0) + 1;
						checkPicks(model, walks, `${where} (${name})`);
					}
				}
			}
			const decision = open[random(open.length)];
			const seat = /** @type {number} */ (decision.player);
			const answers = DECISIONS[decision.kind].answers(state, decision);
			const pick =
				decision.kind === 'chooseTurn' &&
				answers.length > 1 &&
				random(10) < 8
					? answers[1]
					: answers[random(answers.length)];
			state = play(
				state,
				seat,
				{ decision: decision.id, ...pick },
				random
			);
		}
	}
	for (const kind of ['chooseResource', 'chooseBonus', 'advance']) {
		assert.ok(
			(checked[kind] ?? 0) > 0,
			`no ${kind} pick model checked: ${JSON.stringify(checked)}`
		);
	}
	const total = Object.values(checked).reduce((a, b) => a + b, 0);
	assert.ok(total > 100, `only ${total} pick models checked`);
});

/**
 * A prompt as panelControls reads it: its instruction, its confirm label, its options' labels, its cost and its trade.
 * @param {Record<string, any>} [fields]
 * @returns {any}
 */
function panelPrompt(fields = {}) {
	return {
		instruction: 'Choose one.',
		confirmLabel: 'Confirm choice',
		options: [
			{ index: 0, label: 'Gain 1 coin' },
			{ index: 1, label: 'Gain 1 food' },
		],
		cost: null,
		trade: null,
		...fields,
	};
}

/**
 * What the viewer has chosen, nothing by default.
 * @param {Record<string, any>} [fields]
 * @returns {import('../src/lib/prompts.js').PanelChoice}
 */
function panelChoice(fields = {}) {
	return {
		picked: null,
		pick: null,
		pickStatus: null,
		pickIndex: -1,
		offering: false,
		offered: false,
		tradeAnswer: -1,
		decline: -1,
		exploring: false,
		docked: false,
		hex: null,
		options: true,
		sending: false,
		...fields,
	};
}

/** A pick of 2 tapestry cards to pay, as picks.js models it. */
const CARD_PICK = /** @type {any} */ ({
	mode: 'pay',
	rows: [],
	items: { kind: 'tapestry', ids: ['a', 'b', 'c'], count: 2 },
	decline: 3,
});

test('an options prompt gives its instruction until an answer is picked, then that answer, and Confirm waits for it', () => {
	const prompt = panelPrompt();
	assert.deepEqual(panelControls(prompt, panelChoice()), {
		status: 'Choose one.',
		warn: false,
		confirmLabel: 'Confirm choice',
		confirmDisabled: true,
		cancelLabel: undefined,
		cancel: null,
		confirm: 'answer',
		content: true,
	});
	const picked = panelControls(prompt, panelChoice({ picked: 1 }));
	assert.equal(picked.status, 'Gain 1 food');
	assert.equal(picked.confirmDisabled, false);
	assert.equal(
		panelControls(prompt, panelChoice({ picked: 1, sending: true }))
			.confirmDisabled,
		true
	);
});

test('a prompt with nothing of its own in the panel, such as cards on the shelf, has no content area', () => {
	const prompt = panelPrompt({ confirmLabel: 'Keep card' });
	const controls = panelControls(prompt, panelChoice({ options: false }));
	assert.equal(controls.content, false);
	assert.equal(controls.confirmLabel, 'Keep card');
	assert.equal(
		panelControls(
			panelPrompt({ cost: ['coin'] }),
			panelChoice({ options: false })
		).content,
		true
	);
});

test('a pick of cards says how many to pay, Confirm waits for a match, and Decline declines when it may (#75)', () => {
	const prompt = panelPrompt();
	const status = { text: 'Choose 2 more cards.', warn: false };
	const controls = panelControls(
		prompt,
		panelChoice({ pick: CARD_PICK, pickStatus: status, decline: 3 })
	);
	assert.equal(controls.status, 'Choose 2 more cards.');
	assert.equal(controls.confirmLabel, 'Pay 2 cards');
	assert.equal(controls.confirmDisabled, true);
	assert.equal(controls.cancelLabel, 'Decline');
	assert.equal(controls.cancel, 'decline');
	assert.equal(controls.confirm, 'pick');
	assert.equal(controls.content, true);
	const matched = panelControls(
		prompt,
		panelChoice({ pick: CARD_PICK, pickStatus: status, pickIndex: 0 })
	);
	assert.equal(matched.confirmDisabled, false);
	assert.equal(matched.cancel, null);
});

test('a pick of one tile pays 1 tile, and a pick of resource rows confirms with Confirm and its warning (#75)', () => {
	const tiles = /** @type {any} */ ({
		...CARD_PICK,
		items: { kind: 'territory', ids: [3, 7], count: 1 },
	});
	assert.equal(
		panelControls(
			panelPrompt(),
			panelChoice({ pick: tiles, pickStatus: { text: '', warn: false } })
		).confirmLabel,
		'Pay 1 tile'
	);
	const rows = /** @type {any} */ ({
		mode: 'gain',
		rows: [{ fixed: null, offers: ['coin', 'food'] }],
		items: null,
		decline: null,
	});
	const lost = {
		text: 'You gain 1 coin. You can hold 8 of each: 1 coin would be lost.',
		warn: true,
	};
	const controls = panelControls(
		panelPrompt(),
		panelChoice({ pick: rows, pickStatus: lost, pickIndex: 0 })
	);
	assert.equal(controls.confirmLabel, 'Confirm');
	assert.equal(controls.status, lost.text);
	assert.equal(controls.warn, true);
	assert.equal(controls.confirmDisabled, false);
});

test("a trade's offers wait for one to be chosen, and a chosen offer goes Back or confirms its one answer (#75)", () => {
	const prompt = panelPrompt({
		trade: [{ offer: 0 }, { offer: 1 }],
		options: [
			{ index: 0, label: 'Pay 1 culture: gain 1 VP' },
			{ index: 1, label: 'Decline' },
		],
	});
	const offers = panelControls(
		prompt,
		panelChoice({ offering: true, decline: 1, options: false })
	);
	assert.equal(offers.status, 'Choose a trade.');
	assert.equal(offers.confirmDisabled, true);
	assert.equal(offers.cancelLabel, 'Decline');
	assert.equal(offers.cancel, 'decline');
	assert.equal(offers.content, true);
	const chosen = panelControls(
		prompt,
		panelChoice({ offered: true, tradeAnswer: 0, options: false })
	);
	assert.equal(chosen.status, 'Pay 1 culture: gain 1 VP');
	assert.equal(chosen.confirmLabel, 'Confirm');
	assert.equal(chosen.confirmDisabled, false);
	assert.equal(chosen.cancelLabel, 'Back');
	assert.equal(chosen.cancel, 'back');
	assert.equal(chosen.confirm, 'pick');
	assert.equal(
		panelControls(
			prompt,
			panelChoice({
				offered: true,
				tradeAnswer: 0,
				options: false,
				sending: true,
			})
		).confirmDisabled,
		true
	);
});

test("an explore's status line stays empty, and only a docked choice on the map with a hex offers another territory", () => {
	const explore = panelControls(
		panelPrompt({ confirmLabel: 'Explore' }),
		panelChoice({
			exploring: true,
			docked: true,
			hex: '0,0',
			picked: 1,
			options: false,
		})
	);
	assert.equal(explore.status, '');
	assert.equal(explore.cancel, null);
	assert.equal(explore.content, true);
	assert.equal(explore.confirmDisabled, false);
	const conquer = panelControls(
		panelPrompt({ confirmLabel: 'Conquer' }),
		panelChoice({ docked: true, hex: '1,0', picked: 0 })
	);
	assert.equal(conquer.status, 'Gain 1 coin');
	assert.equal(conquer.cancelLabel, 'Choose another territory');
	assert.equal(conquer.cancel, 'clear');
	assert.equal(
		panelControls(
			panelPrompt(),
			panelChoice({ docked: false, hex: '1,0', picked: 0 })
		).cancel,
		null
	);
});

test("an advance's payment says what is still missing, and Advance waits for a payment that matches (#75)", () => {
	const model = advanceModel(
		{
			track: 'exploration',
			from: 0,
			to: 1,
			payments: [{ coin: 1 }, { food: 1 }, { worker: 1 }, { culture: 1 }],
		},
		null
	);
	assert.ok(model);
	const empty = emptySelection(model);
	assert.deepEqual(paymentControls(model, empty, {}, false), {
		status: 'Pick a resource.',
		warn: false,
		confirmLabel: 'Advance',
		confirmDisabled: true,
		cancelLabel: 'Cancel',
	});
	const coin = togglePick(model, empty, 0, 'coin');
	const paid = paymentControls(model, coin, { coin: 2 }, false);
	assert.equal(paid.confirmDisabled, false);
	assert.equal(
		paymentControls(model, coin, { coin: 2 }, true).confirmDisabled,
		true
	);
});
