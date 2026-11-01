// The shelf draws card faces resolved once (#118): shelfFace and shelfCards in prompts.js, fitScale, TechDeckBack and CapitalMatFace.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { render } from 'svelte/server';
import { openDecisions, play, view } from '../src/lib/engine/game.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { push } from '../src/lib/engine/stack.js';
import { run } from '../src/lib/engine/loop.js';
import { CAPITAL_MATS } from '../src/lib/engine/data/capitals.js';
import { promptFor, shelfCards, shelfFace } from '../src/lib/prompts.js';
import { fitScale } from '../src/lib/cards/card-sizes.js';
import { tapestryCardData, techCardData } from '../src/lib/cards/game-cards.js';
import { matPlots } from '../src/lib/area/capital.js';
import { myDecision } from '../src/lib/turn.js';
import TechDeckBack from '../src/lib/components/player/TechDeckBack.svelte';
import CapitalMatFace from '../src/lib/components/player/CapitalMatFace.svelte';
import CardShelf from '../src/lib/components/prompts/CardShelf.svelte';
import { newGame, startedGame } from './helpers/engine.mjs';

/** @param {string} path - A path from the project root */
const source = (path) =>
	readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('fitScale fits the tallest card into the room left, between min and 1, and is 1 until both are measured', () => {
	const fit = { min: 0.75, room: 16 };
	assert.equal(fitScale(1000, 600, fit), 1);
	assert.equal(fitScale(616, 600, fit), 1);
	assert.equal(fitScale(466, 600, fit), 0.75);
	assert.equal(fitScale(496, 600, fit), 0.8);
	assert.equal(fitScale(100, 600, fit), 0.75);
	assert.equal(fitScale(0, 600, fit), 1);
	assert.equal(fitScale(500, 0, fit), 1);
});

test('shelfFace resolves each kind once: card data, the deck, a civilization id or a mat', () => {
	assert.deepEqual(
		shelfFace('tapestry', 'academia'),
		tapestryCardData('academia')
	);
	assert.deepEqual(shelfFace('tech', 'clocks'), techCardData('clocks'));
	assert.deepEqual(shelfFace('tech', 'deck', 21), {
		deck: 'tech',
		count: 21,
	});
	assert.deepEqual(shelfFace('tech', 'deck'), { deck: 'tech', count: 0 });
	assert.equal(shelfFace('civ', 'nomads'), 'nomads');
	const mat = CAPITAL_MATS[1];
	assert.deepEqual(shelfFace('mat', String(mat.number)), {
		mat: mat.number,
		name: mat.name,
		plots: matPlots(mat.number),
		biome: mat.id,
	});
	assert.equal(
		/** @type {any} */ (shelfFace('mat', 'none')).mat,
		CAPITAL_MATS[0].number
	);
});

test('shelfCards gives every setup choice on the shelf its index, label and face', () => {
	let { state, random } = newGame(2);
	const seen = new Set();
	while (state.phase === 'setup') {
		const open = openDecisions(state)[0];
		const game = view(state, open.player);
		const decision = /** @type {any} */ (myDecision(game, open.player));
		const prompt = promptFor(decision, game, open.player);
		assert.ok(prompt);
		if (prompt.shelf === 'civ' || prompt.shelf === 'mat') {
			seen.add(prompt.shelf);
			const cards = shelfCards(prompt, decision);
			const options = prompt.options.filter((o) => o.place === 'shelf');
			assert.deepEqual(
				cards.map((card) => [card.index, card.label]),
				options.map((o) => [o.index, o.label])
			);
			for (const card of cards) {
				const answer = decision.answers[card.index];
				assert.deepEqual(
					card.face,
					shelfFace(
						prompt.shelf,
						String(answer.civ ?? answer.capital)
					)
				);
			}
		}
		const answer = DECISIONS[open.kind].answers(state, open)[0];
		state = play(
			state,
			open.player,
			{ decision: open.id, ...answer },
			random
		);
	}
	assert.deepEqual([...seen].sort(), ['civ', 'mat']);
	assert.deepEqual(shelfCards(null, null), []);
});

test("shelfCards draws the top of the tech deck with the deck's count", () => {
	const { state, random } = startedGame(2);
	const player = /** @type {number} */ (state.current);
	state.pending.length = 0;
	push(state, state.pending, [
		{ player, kind: 'effects', effects: [{ invent: { refresh: true } }] },
	]);
	run(state, random);
	const game = view(state, player);
	const decision = /** @type {any} */ (myDecision(game, player));
	const prompt = promptFor(decision, game, player);
	assert.ok(prompt);
	const cards = shelfCards(prompt, decision);
	const deck = cards.find(
		(card) => decision.answers[card.index].card === 'deck'
	);
	assert.deepEqual(deck?.face, {
		deck: 'tech',
		count: game.supply.tech.deck,
	});
	const shown = cards.filter((card) => card !== deck);
	assert.ok(shown.length > 0);
	for (const card of shown) {
		assert.deepEqual(
			card.face,
			techCardData(decision.answers[card.index].card)
		);
	}
	// A refresh is answered on the panel, never on the shelf.
	assert.ok(
		cards.every((card) => decision.answers[card.index].refresh !== true)
	);
});

test('TechDeckBack draws the deck as a card or a chip', () => {
	const card = render(TechDeckBack, { props: { count: 21 } }).body;
	assert.match(card, /class="rg-tech-deck-back rg-tech-deck-back--card/);
	assert.match(card, /<b[^>]*>Deck · 21<\/b>/);
	const chip = render(TechDeckBack, {
		props: { count: 3, size: 'chip', class: 'extra' },
	}).body;
	assert.match(
		chip,
		/<b class="rg-tech-deck-back rg-tech-deck-back--chip extra[ "]/
	);
	assert.match(chip, />Deck · 3<\/b>/);
});

test('CapitalMatFace draws the name on a band over the 9×9 grid', () => {
	const mat = CAPITAL_MATS[0];
	const html = render(CapitalMatFace, {
		props: {
			name: mat.name,
			plots: matPlots(mat.number),
			biome: /** @type {any} */ (mat.id),
			terrainSeed: 7,
		},
	}).body;
	assert.match(html, /class="rg-capital-mat-face/);
	assert.match(
		html,
		new RegExp(`<b class="rg-capital-mat-face--name[^"]*">${mat.name}</b>`)
	);
	assert.match(html, /rg-capital-grid/);
});

test('CardShelf draws the faces it is handed', () => {
	const tech = render(CardShelf, {
		props: {
			kind: 'tech',
			cards: [
				{ index: 0, label: 'Clocks', face: techCardData('clocks') },
				{
					index: 1,
					label: 'Top of the deck',
					face: { deck: 'tech', count: 12 },
				},
			],
		},
	}).body;
	assert.match(tech, /rg-tech-deck-back--card/);
	assert.match(tech, /Deck · 12/);
	assert.match(tech, new RegExp(techCardData('clocks').title));
	const mats = render(CardShelf, {
		props: {
			kind: 'mat',
			cards: [{ index: 0, label: 'Mat', face: shelfFace('mat', '1') }],
		},
	}).body;
	assert.match(mats, /rg-capital-mat-face/);
	assert.match(mats, new RegExp(CAPITAL_MATS[0].name));
});

test('CardShelf imports no engine data, and only TechDeckBack draws the deck back', () => {
	const shelf = source('src/lib/components/prompts/CardShelf.svelte');
	assert.doesNotMatch(shelf, /engine\//);
	assert.doesNotMatch(shelf, /game-cards|area\/capital|CAPITAL_MATS/);
	assert.doesNotMatch(shelf, /civFit|matOf|biomeOf/);
	for (const path of [
		'src/lib/components/prompts/CardShelf.svelte',
		'src/lib/components/prompts/PromptArt.svelte',
	]) {
		assert.doesNotMatch(source(path), /Deck ·/, path);
		assert.doesNotMatch(source(path), /--back\b/, path);
	}
});
