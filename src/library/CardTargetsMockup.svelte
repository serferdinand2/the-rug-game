<!-- The #184 mockup: A&A's places on cards as lit targets, drawn with the production components over a screenshot of the running game. -->
<script>
	import CapitalGrid from '../lib/components/player/CapitalGrid.svelte';
	import DecisionPanel from '../lib/components/prompts/DecisionPanel.svelte';
	import TapestryCard from '../lib/components/player/TapestryCard.svelte';
	import TechnologyCard from '../lib/components/player/TechnologyCard.svelte';
	import ScaledCard from '../lib/components/player/ScaledCard.svelte';
	import LandmarkShape from '../lib/components/player/LandmarkShape.svelte';
	import EraSlots from '../lib/components/player/EraSlots.svelte';
	import { matPlots } from '../lib/area/capital.js';
	import { tapestryCardData, techCardData } from '../lib/cards/game-cards.js';
	import { CARD_SIZES } from '../lib/cards/card-sizes.js';
	import { FOOTPRINTS } from '../lib/art/footprints.js';
	import { PLOT_CARDS } from '../lib/engine/data/tapestry-cards.js';
	import { artUrl } from '../lib/ui.js';

	/** @typedef {{ row: number, col: number }} Square */
	/** @typedef {{ row: number, col: number, building: string }} Held */
	/** @typedef {{ card: string, row: number, col: number }} OnCard */

	const BACKDROP = '/docs/ui/screens/issue-35/backdrop-tracks.png';
	const SHOTS = '/docs/ui/screens';

	/** Ana's Mountain capital, as the backdrop shows it, with a few buildings. */
	const CAPITAL = matPlots(1).map((kind, index) =>
		index === 4
			? 'farm'
			: index === 35 || index === 62
				? 'market'
				: index === 64
					? 'house'
					: kind
	);
	const OPEN_PLOTS = CAPITAL.flatMap((kind, index) =>
		kind === 'empty' ? [{ row: Math.floor(index / 9), col: index % 9 }] : []
	);

	/** What the plot cards already hold. */
	/** @type {Record<string, Held[]>} */
	const HELD = {
		'commercial-center': [{ row: 0, col: 0, building: 'house' }],
		monuments: [
			{ row: 2, col: 0, building: 'market' },
			{ row: 2, col: 1, building: 'armory' },
		],
		'star-chamber': [],
	};

	/** Commercial Center's printed benefits, square by square in reading order (#37's call). */
	const PRINTED = [
		'resource-24/coin',
		'symbol/tapestry-card',
		'symbol/invent',
		'symbol/science-die',
	];
	const PRINTED_WORDS = [
		'1 coin',
		'1 tapestry card',
		'invent',
		'a science-die roll',
	];

	const NAMES = /** @type {Record<string, string>} */ ({
		'commercial-center': 'Commercial Center',
		monuments: 'Monuments',
		'star-chamber': 'Star Chamber',
	});

	/** Which look the owner is trying: the cards on the shelf (a) or their squares in the Capital tab (b). */
	let look = $state(/** @type {'a' | 'b'} */ ('b'));

	/**
	 * The squares of a plot card, in reading order.
	 * @param {string} card
	 * @returns {Square[]}
	 */
	function squaresOf(card) {
		return PLOT_CARDS[card].grid.flatMap((line, row) =>
			[...line].flatMap((mark, col) =>
				mark === 'X' ? [{ row, col }] : []
			)
		);
	}

	/**
	 * A footprint's covered cells, turned clockwise.
	 * @param {readonly string[]} footprint
	 * @param {number} rotation
	 * @returns {Square[]}
	 */
	function cellsOf(footprint, rotation) {
		let rows = footprint.map((line) => [...line]);
		for (let turn = 0; turn < rotation; turn++) {
			rows = rows[0].map((_, col) =>
				rows.map((line) => line[col]).reverse()
			);
		}
		return rows.flatMap((line, row) =>
			line.flatMap((mark, col) => (mark === 'X' ? [{ row, col }] : []))
		);
	}

	/**
	 * Whether a square is on a card's shape.
	 * @param {string} card
	 * @param {number} row
	 * @param {number} col
	 */
	function onCard(card, row, col) {
		return PLOT_CARDS[card].grid[row]?.[col] === 'X';
	}

	/**
	 * Where a landmark may go on a plot card: it covers at least one open square and nothing held, and may hang off (03 §2).
	 * @param {string} card
	 * @param {string} landmark
	 * @returns {Square[]}
	 */
	function anchorsOn(card, landmark) {
		const cells = cellsOf(FOOTPRINTS[landmark], 0);
		const { grid } = PLOT_CARDS[card];
		/** @type {Square[]} */
		const anchors = [];
		for (let row = -2; row < grid.length; row++) {
			for (let col = -2; col < grid[0].length; col++) {
				const covered = cells.map((c) => ({
					row: row + c.row,
					col: col + c.col,
				}));
				const onIt = covered.filter((c) => onCard(card, c.row, c.col));
				const blocked = onIt.some((c) =>
					HELD[card].some((h) => h.row === c.row && h.col === c.col)
				);
				if (onIt.length > 0 && !blocked) {
					anchors.push({ row, col });
				}
			}
		}
		return anchors;
	}

	/**
	 * The squares a placed landmark covers on its card.
	 * @param {OnCard | null} placed
	 * @param {string} landmark
	 * @returns {Square[]}
	 */
	function coveredBy(placed, landmark) {
		if (!placed) {
			return [];
		}
		return cellsOf(FOOTPRINTS[landmark], 0)
			.map((c) => ({ row: placed.row + c.row, col: placed.col + c.col }))
			.filter((c) => onCard(placed.card, c.row, c.col));
	}

	/**
	 * A square's name, counted from 1 as players read it.
	 * @param {Square} square
	 */
	function squareName({ row, col }) {
		return `row ${row + 1}, column ${col + 1}`;
	}

	// 1 · A Farm.
	let farm = $state(
		/** @type {{ capital: Square } | { card: string, square: Square } | null} */ (
			null
		)
	);
	let farmStatus = $derived.by(() => {
		if (!farm) {
			return 'Choose an open plot of your capital, or a lit square on Commercial Center or Monuments.';
		}
		if ('capital' in farm) {
			return `Farm on your capital, ${squareName(farm.capital)}.`;
		}
		const words = `Farm on ${NAMES[farm.card]}, ${squareName(farm.square)}`;
		if (farm.card === 'commercial-center') {
			const index = squaresOf(farm.card).findIndex(
				(s) =>
					farm &&
					'square' in farm &&
					s.row === farm.square.row &&
					s.col === farm.square.col
			);
			return `${words}: then ${PRINTED_WORDS[index]} or 3 VP.`;
		}
		return `${words}: it fills Monuments' last square but one.`;
	});

	// 2 · The Forge on a plot card.
	const FORGE = 'forge';
	let forge = $state(
		/** @type {OnCard | null} */ ({ card: 'monuments', row: 1, col: 2 })
	);
	let forgeStatus = $derived.by(() => {
		if (!forge) {
			return 'Drag the Forge onto your capital, or click a lit square on a card.';
		}
		const covered = coveredBy(forge, FORGE);
		const hangs = covered.length < cellsOf(FOOTPRINTS[FORGE], 0).length;
		return `The Forge on ${NAMES[forge.card]}, covering ${covered.map(squareName).join(' and ')}${hangs ? '; it hangs off the card' : ''}.`;
	});

	/**
	 * Moves the Forge onto a card so that it covers the square clicked, as close to where it was as it can go.
	 * @param {string} card
	 * @param {number} row
	 * @param {number} col
	 */
	function moveForge(card, row, col) {
		const cells = cellsOf(FOOTPRINTS[FORGE], 0);
		const fits = anchorsOn(card, FORGE).filter((a) =>
			cells.some((c) => a.row + c.row === row && a.col + c.col === col)
		);
		const from = forge?.card === card ? forge : { row, col };
		fits.sort(
			(a, b) =>
				Math.abs(a.row - from.row) +
				Math.abs(a.col - from.col) -
				(Math.abs(b.row - from.row) + Math.abs(b.col - from.col))
		);
		if (fits[0]) {
			forge = { card, ...fits[0] };
		}
	}

	// 3 · The Forge on a whole card.
	const WHOLE = [
		{
			id: 'space-race',
			kind: 'tapestry',
			where: 'Era III · Active',
			words: 'The Forge on Space Race: then gain 1 space tile and explore a space tile.',
		},
		{
			id: 'astrolabe',
			kind: 'tech',
			where: 'Tech · bottom row',
			words: 'The Forge on Astrolabe: it moves up to the middle row at once (R126).',
		},
		{
			id: 'calculus',
			kind: 'tech',
			where: 'Tech · middle row',
			words: 'The Forge on Calculus: it moves up to the top row at once (R126).',
		},
	];
	let whole = $state(/** @type {string | null} */ (null));
	let wholeStatus = $derived(
		WHOLE.find((card) => card.id === whole)?.words ??
			'Drag the Forge onto your capital, or click a lit card.'
	);

	// 5 · The Eras tab.
	const ERA_SLOTS = [
		{
			era: 1,
			card: 'Maker of Fire',
			faceDown: false,
			active: false,
			id: null,
			heading: 'Era I',
			text: 'Maker of Fire',
			pieces: [],
		},
		{
			era: 2,
			card: 'Commercial Center',
			faceDown: false,
			active: false,
			id: 'commercial-center',
			heading: 'Era II',
			text: 'Commercial Center',
			pieces: ['a House'],
		},
		{
			era: 3,
			card: 'Monuments',
			faceDown: false,
			active: true,
			id: 'monuments',
			heading: 'Era III · Active',
			text: 'Monuments',
			pieces: ['a Market', 'an Armory', 'the Forge'],
		},
		{
			era: 4,
			card: null,
			faceDown: false,
			active: false,
			id: null,
			heading: 'Era IV',
			text: 'Not yet chosen',
			pieces: [],
		},
	];
	let era = $state(/** @type {number | null} */ (3));
</script>

{#snippet printedMark(/** @type {string} */ card, /** @type {number} */ index)}
	{#if card === 'commercial-center'}
		<img
			class="mk-plots--printed"
			src={artUrl(PRINTED[index])}
			alt="" />
	{/if}
{/snippet}

<!--
	A plot card's squares at a plot size: the printed squares, what they hold, and the lit ones a decision can choose.
	`pick` makes the open squares targets; `chosen` and `preview` draw the chosen building faintly; `landmark` draws a placed landmark,
	hanging off where it does, inside `room` kept around the grid.
-->
{#snippet plotGrid(
	/** @type {{ card: string, size: number, room?: number, pick?: ((row: number, col: number) => void) | null, chosen?: Square | null, preview?: string | null, landmark?: OnCard | null }} */ o
)}
	{@const grid = PLOT_CARDS[o.card].grid}
	{@const covered =
		o.landmark?.card === o.card ? coveredBy(o.landmark, FORGE) : []}
	<div
		class="mk-plots"
		style="--plot: {o.size}px; --rows: {grid.length}; --cols: {grid[0]
			.length}; --room: {o.room ?? 0}px">
		<div class="mk-plots--grid">
			{#each squaresOf(o.card) as square, index (index)}
				{@const held = HELD[o.card].find(
					(h) => h.row === square.row && h.col === square.col
				)}
				{@const under = covered.some(
					(c) => c.row === square.row && c.col === square.col
				)}
				{@const isChosen =
					o.chosen?.row === square.row &&
					o.chosen?.col === square.col}
				{#if o.pick && !held && (!under || o.landmark)}
					<button
						type="button"
						class="mk-plots--square mk-plots--target"
						class:mk-plots--chosen={isChosen}
						style="grid-row: {square.row +
							1}; grid-column: {square.col + 1}"
						aria-pressed={isChosen}
						aria-label="{NAMES[o.card]}, {squareName(square)}"
						onclick={() => o.pick?.(square.row, square.col)}>
						{@render printedMark(o.card, index)}
						{#if isChosen && o.preview}
							<img
								class="mk-plots--piece mk-plots--preview"
								src={artUrl(`building/${o.preview}`)}
								alt="" />
						{/if}
					</button>
				{:else}
					<span
						class="mk-plots--square"
						style="grid-row: {square.row +
							1}; grid-column: {square.col + 1}">
						{@render printedMark(o.card, index)}
						{#if held}
							<img
								class="mk-plots--piece"
								src={artUrl(`building/${held.building}`)}
								alt="" />
						{/if}
					</span>
				{/if}
			{/each}
		</div>
		{#if o.landmark?.card === o.card}
			<div
				class="mk-plots--landmark"
				style="top: calc(var(--room) + {o.landmark
					.row} * var(--plot)); left: calc(var(--room) + {o.landmark
					.col} * var(--plot))">
				<LandmarkShape
					id={FORGE}
					footprint={FOOTPRINTS[FORGE]}
					plotSize={o.size} />
			</div>
		{/if}
	</div>
{/snippet}

<!-- A plot card on the shelf (look A): the whole card, its squares drawn over its picture. -->
{#snippet shelfCard(
	/** @type {string} */ card,
	/** @type {string} */ where,
	/** @type {any} */ grid
)}
	<figure class="mk-shelf--card">
		<ScaledCard
			scale={0.62}
			{...CARD_SIZES.tapestry}>
			<TapestryCard data={tapestryCardData(card)} />
		</ScaledCard>
		<div class="mk-shelf--plate">{@render plotGrid(grid)}</div>
		<figcaption>{where}</figcaption>
	</figure>
{/snippet}

<!-- The capital in the Capital tab, redrawn over the backdrop's with lit plots. -->
{#snippet capital(
	/** @type {Square[]} */ targets,
	/** @type {Square | null} */ chosen,
	/** @type {boolean} */ awaiting
)}
	<div class="mk-capital">
		<CapitalGrid
			plots={CAPITAL}
			biome="mountain"
			terrainSeed={3}
			{targets}
			awaitingPlacement={awaiting}
			preview={chosen ? { ...chosen, building: 'farm' } : null}
			onCapitalGridPlotClick={(/** @type {any} */ event) =>
				(farm = {
					capital: { row: event.value.row, col: event.value.col },
				})} />
	</div>
{/snippet}

<!-- The footer while the decision is open. -->
{#snippet footer(/** @type {string} */ line)}
	<div class="mk-footer">
		<span class="mk-footer--who">Your decision</span>
		<span class="mk-footer--line">{line}</span>
	</div>
{/snippet}

<!-- The landmark waiting to be placed, under the capital; in look B the cards it may go on sit in the same box. -->
{#snippet tray(
	/** @type {boolean} */ placed,
	/** @type {import('svelte').Snippet | null} */ cards
)}
	<div class="mk-tray">
		<span class="mk-tray--title">To be placed</span>
		<div class="mk-tray--row">
			{#if placed}
				<span class="mk-tray--empty">On a card</span>
			{:else}
				<LandmarkShape
					id={FORGE}
					footprint={FOOTPRINTS[FORGE]}
					plotSize={20} />
			{/if}
			<span class="mk-tray--name">Forge</span>
			{#if placed}
				<button
					type="button"
					class="mk-button"
					onclick={() => {
						forge = null;
						whole = null;
					}}>Return</button>
			{/if}
		</div>
		{#if cards}
			<span class="mk-oncards--title">Or on a card</span>
			{@render cards()}
		{/if}
	</div>
{/snippet}

<!-- Look B, scene 2: the plot cards' squares the Forge may cover. -->
{#snippet forgeCards()}
	<div class="mk-oncards--row mk-oncards--tight">
		{#each ['commercial-center', 'monuments'] as card (card)}
			<div class="mk-oncard">
				{@render plotGrid({
					card,
					size: 30,
					room: 30,
					pick: (row, col) => moveForge(card, row, col),
					landmark: forge,
				})}
				<span class="mk-oncard--name"
					>{NAMES[card]} · {card === 'monuments'
						? 'Era III'
						: 'Era II'}</span>
			</div>
		{/each}
	</div>
{/snippet}

<!-- Look B, scene 3: the whole cards the Forge may go on, small; hovering one would show it whole. -->
{#snippet wholeCards()}
	<div class="mk-oncards--row mk-oncards--whole">
		{#each WHOLE as card (card.id)}
			<button
				type="button"
				class="mk-whole mk-whole--small"
				aria-pressed={whole === card.id}
				onclick={() => (whole = card.id)}>
				{#if card.kind === 'tapestry'}
					<ScaledCard
						scale={0.2}
						{...CARD_SIZES.tapestry}>
						<TapestryCard data={tapestryCardData(card.id)} />
					</ScaledCard>
				{:else}
					<ScaledCard
						scale={0.26}
						{...CARD_SIZES.tech}>
						<TechnologyCard data={techCardData(card.id)} />
					</ScaledCard>
				{/if}
				<span class="mk-oncard--name">{card.where}</span>
			</button>
		{/each}
	</div>
{/snippet}

<div class="mk-page">
	<header class="mk-head">
		<h1>
			#184 · <span
				>Places on Arts &amp; Architecture's cards as lit targets</span>
		</h1>
		<p class="mk-lead">
			Today a gained building or landmark that may go on a card is offered
			as worded buttons in the prompt's panel ("On Commercial Center, row
			1, column 2"). This mockup lights those places as the capital's
			plots are lit. Click the lit squares and cards: each screen answers
			as the game would. The prompt, the capital and the cards are the
			production components; the board behind is a screenshot of the
			running game.
		</p>
		<div class="mk-controls">
			<span class="mk-control--label"
				>Where the cards' squares show:</span>
			<button
				type="button"
				class="mk-choice"
				aria-pressed={look === 'a'}
				onclick={() => (look = 'a')}
				><b>A</b> · The whole cards on the prompt's shelf, their squares on
				the card</button>
			<button
				type="button"
				class="mk-choice"
				aria-pressed={look === 'b'}
				onclick={() => (look = 'b')}
				><b>B</b> · Their squares in the Capital tab, under the capital</button>
		</div>
		<p class="mk-option-note">
			{#if look === 'a'}
				<b>A:</b> every card the piece may go on stands whole on the shelf
				above the prompt, as card choices do, its squares drawn in the card's
				blank lower half, under its rule, as the printed card has them. The
				capital stays in the Capital tab.
			{:else}
				<b>B:</b> the cards' squares sit in the Capital tab under the capital,
				in the box that holds the piece to be placed, so every place is in
				one tab; each card is named, and hovering it would show the whole
				card. The prompt keeps no shelf.
			{/if}
		</p>
	</header>

	<!-- 1 · A building -->
	<section class="mk-step">
		<h2>1 · <span>A Farm: the capital or a card's square</span></h2>
		<p>
			Ana gains a Farm while Commercial Center tops her era II slot and
			Monuments her era III slot (both work while they are on top). The
			open plots of her capital and the open squares of both cards are
			lit. A square already holding a piece is not lit. Commercial Center
			shows what each square pays.
		</p>
		<div class="mk-screen">
			<img
				src={BACKDROP}
				alt="" />
			{@render capital(
				OPEN_PLOTS,
				farm && 'capital' in farm ? farm.capital : null,
				true
			)}
			{#if look === 'b'}
				<div class="mk-oncards">
					<span class="mk-oncards--title">Or on a card</span>
					<div class="mk-oncards--row">
						{#each ['commercial-center', 'monuments'] as card (card)}
							<div class="mk-oncard">
								{@render plotGrid({
									card,
									size: 40,
									pick: (row, col) =>
										(farm = { card, square: { row, col } }),
									chosen:
										farm &&
										'card' in farm &&
										farm.card === card
											? farm.square
											: null,
									preview: 'farm',
								})}
								<span class="mk-oncard--name"
									>{NAMES[card]}<em
										>{card === 'monuments'
											? 'Era III'
											: 'Era II'}</em
									></span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
			<div class="mk-board">
				<DecisionPanel
					title="Where does the Farm go?"
					status={farmStatus}
					confirmLabel="Place Farm"
					confirmDisabled={farm === null}>
					{#snippet shelf()}
						{#if look === 'a'}
							<div class="mk-shelf">
								{#each ['commercial-center', 'monuments'] as card (card)}
									{@render shelfCard(
										card,
										card === 'monuments'
											? 'Era III · Active'
											: 'Era II',
										{
											card,
											size: 30,
											pick: (
												/** @type {number} */ row,
												/** @type {number} */ col
											) =>
												(farm = {
													card,
													square: { row, col },
												}),
											chosen:
												farm &&
												'card' in farm &&
												farm.card === card
													? farm.square
													: null,
											preview: 'farm',
										}
									)}
								{/each}
							</div>
						{/if}
					{/snippet}
				</DecisionPanel>
			</div>
			{@render footer('Your turn · Place your Farm')}
		</div>
	</section>

	<!-- 2 · A landmark on a plot card -->
	<section class="mk-step">
		<h2>2 · <span>The Forge on a card's squares, hanging off</span></h2>
		<p>
			Ana advanced to Metallurgy and gains the Forge. It may go on her
			capital, dragged from the tray as today, or on either card: the
			squares it could cover are lit, and a click moves it to cover the
			square clicked, as near to where it was as it fits. It may hang off
			a card, but never covers a piece already there. Here it covers
			Monuments' two right-hand squares and hangs off to the right.
		</p>
		<div class="mk-screen">
			<img
				src={BACKDROP}
				alt="" />
			{@render capital([], null, true)}
			<div class="mk-under">
				{@render tray(forge !== null, look === 'b' ? forgeCards : null)}
			</div>
			<div class="mk-board">
				<DecisionPanel
					title="Where does the Forge go?"
					status={forgeStatus}
					confirmLabel="Place"
					confirmDisabled={forge === null}>
					{#snippet shelf()}
						{#if look === 'a'}
							<div class="mk-shelf">
								{#each ['commercial-center', 'monuments'] as card (card)}
									{@render shelfCard(
										card,
										card === 'monuments'
											? 'Era III · Active'
											: 'Era II',
										{
											card,
											size: 30,
											pick: (
												/** @type {number} */ row,
												/** @type {number} */ col
											) => moveForge(card, row, col),
											landmark: forge,
										}
									)}
								{/each}
							</div>
						{/if}
					{/snippet}
				</DecisionPanel>
			</div>
			{@render footer('Your turn · Advance to Metallurgy')}
		</div>
	</section>

	<!-- 3 · A landmark on a whole card -->
	<section class="mk-step">
		<h2>
			3 · <span>The Forge on Space Race or a landmark tech card</span>
		</h2>
		<p>
			This time Space Race is Ana's era III card, and two of her tech
			cards want a landmark: Astrolabe in the bottom row and Calculus in
			the middle row (a top-row card is never offered, R126). Trade Routes
			would show the same way. Each card the Forge may go on is lit as a
			whole; the one chosen turns gold.
		</p>
		<div class="mk-screen">
			<img
				src={BACKDROP}
				alt="" />
			{@render capital([], null, true)}
			<div class="mk-under">
				{@render tray(whole !== null, look === 'b' ? wholeCards : null)}
			</div>
			<div class="mk-board">
				<DecisionPanel
					title="Where does the Forge go?"
					status={wholeStatus}
					confirmLabel="Place"
					confirmDisabled={whole === null}>
					{#snippet shelf()}
						{#if look === 'a'}
							<div class="mk-shelf">
								{#each WHOLE as card (card.id)}
									<button
										type="button"
										class="mk-whole"
										aria-pressed={whole === card.id}
										onclick={() => (whole = card.id)}>
										{#if card.kind === 'tapestry'}
											<ScaledCard
												scale={0.62}
												{...CARD_SIZES.tapestry}>
												<TapestryCard
													data={tapestryCardData(
														card.id
													)} />
											</ScaledCard>
										{:else}
											<ScaledCard
												scale={0.62}
												{...CARD_SIZES.tech}>
												<TechnologyCard
													data={techCardData(
														card.id
													)} />
											</ScaledCard>
										{/if}
										<span class="mk-whole--where"
											>{card.where}</span>
									</button>
								{/each}
							</div>
						{/if}
					{/snippet}
				</DecisionPanel>
			</div>
			{@render footer('Your turn · Advance to Metallurgy')}
		</div>
	</section>

	<!-- 4 · National Parks and the civilization mats -->
	<section class="mk-step">
		<h2>
			4 · <span
				>National Parks' territories and the civilizations' mats</span>
		</h2>
		<p>
			These two reuse looks the game already has, so they need no new
			design. With <b>National Parks</b> this era, the territories where
			Ana holds only her one outpost light on the map as an explore's
			hexes do (left), while her capital's plots stay lit in the Capital
			tab: the board switches to the Map by itself, and the prompt docks
			at the right. The
			<b>Urban Planners'</b> mat (a landmark kept for later) and the
			<b>Collectors'</b> mat (one item of each type) light their spot on the
			civilization card in the Civ tab, as a choice on the card does today (right).
		</p>
		<div class="mk-refs">
			<figure>
				<img
					src="{SHOTS}/game-prompt-explore.png"
					alt="An explore in the running game: the open hexes lit on the map, the prompt docked at the right." />
				<figcaption>
					Lit hexes on the map, as National Parks would light Ana's
					territories
				</figcaption>
			</figure>
			<figure>
				<img
					src="{SHOTS}/game-civ-card-choice.png"
					alt="A choice on the civilization card in the Civ tab, its spots lit." />
				<figcaption>
					Lit spots on the civilization card, as the Urban Planners'
					and Collectors' mats would light
				</figcaption>
			</figure>
		</div>
	</section>

	<!-- 5 · The Eras tab -->
	<section class="mk-step">
		<h2>5 · <span>The Eras tab: the pieces drawn on the card</span></h2>
		<p>
			Today the Eras tab lists a card's pieces under it ("On this card: a
			Market, an Armory and the Forge."). Instead they are drawn where
			they stand, in the chosen look: on the card's squares in its lower
			half (A), or on its squares beside the card (B). Space Race and
			Trade Routes draw their landmarks the same way, side by side in the
			card's lower half.
		</p>
		<div class="mk-eras">
			<span class="mk-eras--title">Eras</span>
			<div class="mk-eras--card">
				<div class="mk-eras--face">
					<ScaledCard
						scale={0.6}
						{...CARD_SIZES.tapestry}>
						<TapestryCard data={tapestryCardData('monuments')} />
					</ScaledCard>
					{#if look === 'a'}
						<div class="mk-shelf--plate">
							{@render plotGrid({
								card: 'monuments',
								size: 30,
								landmark: { card: 'monuments', row: 1, col: 2 },
							})}
						</div>
					{/if}
				</div>
				{#if look === 'b'}
					<div class="mk-eras--squares">
						{@render plotGrid({
							card: 'monuments',
							size: 40,
							room: 40,
							landmark: { card: 'monuments', row: 1, col: 2 },
						})}
					</div>
				{/if}
			</div>
			<EraSlots
				slots={ERA_SLOTS}
				bind:selected={era} />
		</div>
	</section>
</div>

<style>
	.mk-page {
		display: grid;
		gap: var(--space-11);
		width: 1920px;
		padding: var(--space-10) 0 var(--space-11);
	}

	.mk-head,
	.mk-step > *:not(.mk-screen) {
		margin-inline: var(--space-10);
	}

	.mk-head {
		display: grid;
		gap: var(--space-6);
	}

	h1 {
		margin: 0;
		font: var(--weight-bold) var(--font-size-3xl) / 1.2 var(--font-body);
	}

	h1 span,
	h2 span {
		color: var(--gold);
	}

	h2 {
		margin: 0;
		font-size: var(--font-size-xl);
	}

	.mk-lead,
	.mk-step > p,
	.mk-option-note {
		max-width: 1100px;
		margin: 0;
		color: var(--muted);
		font-size: var(--font-size-base);
		line-height: 1.5;
	}

	.mk-option-note b,
	.mk-step > p b {
		color: var(--gold);
	}

	.mk-controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-6);
		padding: var(--space-6) var(--space-8);
		border: var(--border) solid var(--line-soft);
		background: var(--chrome);
	}

	.mk-control--label {
		color: var(--muted);
		font-size: var(--font-size-sm);
	}

	.mk-choice {
		padding: var(--space-3) var(--space-6);
		border: var(--border) solid var(--line);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--text);
		font: inherit;
		font-size: var(--font-size-sm);
		cursor: pointer;
	}

	.mk-choice[aria-pressed='true'] {
		border-color: var(--gold);
		box-shadow: var(--glow-gold);
		color: var(--gold);
	}

	.mk-step {
		display: grid;
		gap: var(--space-6);
	}

	.mk-screen {
		position: relative;
		width: 1920px;
		height: 1080px;
		overflow: hidden;
	}

	.mk-screen > img {
		display: block;
		width: 1920px;
		height: 1080px;
	}

	/* The shared area, where the game puts a decision panel. */
	.mk-board {
		position: absolute;
		top: 58px;
		left: 0;
		width: 1440px;
		height: 964px;
	}

	/* The Capital tab's grid, over the backdrop's. */
	.mk-capital {
		position: absolute;
		top: 145px;
		left: 1462px;
		width: 438px;
		background: var(--chrome);
	}

	/* What the Capital tab shows under the capital's counters. */
	.mk-under,
	.mk-oncards {
		position: absolute;
		top: 640px;
		left: 1462px;
		width: 438px;
	}

	.mk-under {
		display: grid;
		gap: var(--space-5);
	}

	.mk-oncards {
		display: grid;
		gap: var(--space-4);
		padding: var(--space-5) var(--space-6);
		border: var(--border) solid var(--line-soft);
		background: var(--surface);
	}

	.mk-oncards--title,
	.mk-tray--title {
		color: var(--text);
		font-size: var(--font-size-sm);
		font-weight: var(--weight-bold);
	}

	.mk-oncards--row {
		display: flex;
		align-items: flex-end;
		gap: var(--space-8);
	}

	.mk-oncards--tight {
		gap: var(--space-2);
	}

	.mk-oncard {
		display: grid;
		justify-items: center;
		gap: var(--space-2);
	}

	.mk-oncard--name {
		color: var(--text);
		font-size: var(--font-size-xs);
		text-align: center;
	}

	.mk-oncard--name em {
		display: block;
		color: var(--muted);
		font-style: normal;
	}

	/* A plot card's squares: printed squares on card paper, pieces on them, the open ones lit as the capital's plots are. */
	/* The mockup's squares take the light card paper; the built grid joins tokens.css's dark-cards rule as a card root. */
	.mk-plots {
		--mk-paper: var(--card-paper);
		position: relative;
		padding: var(--room);
	}

	.mk-plots--grid {
		display: grid;
		grid-template-rows: repeat(var(--rows), var(--plot));
		grid-template-columns: repeat(var(--cols), var(--plot));
	}

	.mk-plots--square {
		position: relative;
		display: grid;
		place-items: center;
		box-sizing: border-box;
		padding: 0;
		border: 1px solid color-mix(in srgb, var(--card-text) 45%, transparent);
		background: var(--mk-paper);
		color: inherit;
		font: inherit;
	}

	.mk-plots--printed {
		width: 45%;
		height: 45%;
		opacity: 0.55;
		image-rendering: pixelated;
	}

	.mk-plots--piece {
		position: absolute;
		inset: 8%;
		width: 84%;
		height: 84%;
		image-rendering: pixelated;
	}

	.mk-plots--preview {
		opacity: 0.6;
	}

	/* Lit: the capital's green ring, with a green wash and a dark inner edge so it reads on the card's light paper. */
	.mk-plots--target {
		background: color-mix(in srgb, var(--ok) 45%, var(--mk-paper));
		cursor: pointer;
	}

	.mk-plots--target::before {
		content: '';
		position: absolute;
		z-index: 1;
		inset: 0;
		border: 3px solid var(--ok);
		border-radius: var(--radius);
		box-shadow: inset 0 0 0 1px var(--card-text);
		pointer-events: none;
	}

	.mk-plots--target:hover::before,
	.mk-plots--chosen::before {
		box-shadow:
			inset 0 0 0 1px var(--card-text),
			var(--glow-ok-strong);
	}

	.mk-plots--landmark {
		position: absolute;
		z-index: 2;
		pointer-events: none;
	}

	/* Look A: the card on the shelf, its squares over its picture. */
	.mk-shelf {
		display: flex;
		align-items: flex-start;
		gap: var(--space-9);
		margin-bottom: var(--space-8);
	}

	.mk-shelf--card,
	.mk-eras--face {
		position: relative;
		margin: 0;
	}

	.mk-shelf--card figcaption,
	.mk-whole--where {
		display: block;
		margin-top: var(--space-3);
		color: var(--text);
		font-size: var(--font-size-sm);
		text-align: center;
	}

	/* In the card's blank lower half, under its rule, where the printed card has its squares. */
	.mk-shelf--plate {
		position: absolute;
		top: 226px;
		left: 50%;
		display: grid;
		place-items: center;
		width: 176px;
		height: 100px;
		transform: translateX(-50%);
	}

	/* A whole card lit as a target, gold once chosen. */
	.mk-whole {
		padding: 0;
		border: 0;
		background: none;
		color: inherit;
		font: inherit;
		cursor: pointer;
	}

	.mk-whole :global(.rg-scaled-card),
	.mk-whole > :first-child {
		outline: var(--border-thick) solid var(--ok);
		outline-offset: 3px;
		border-radius: var(--radius);
	}

	.mk-whole:hover > :first-child {
		box-shadow: var(--glow-ok);
	}

	.mk-whole[aria-pressed='true'] > :first-child {
		outline-color: var(--gold);
		box-shadow: var(--glow-gold);
	}

	.mk-whole--small {
		display: grid;
		justify-items: center;
		gap: var(--space-3);
	}

	.mk-oncards--whole {
		align-items: flex-start;
	}

	/* The tray under the capital, as the game draws it. */
	.mk-tray {
		display: grid;
		gap: var(--space-3);
		padding: var(--space-5) var(--space-6);
		border: var(--border) solid var(--gold);
		background: var(--surface);
	}

	.mk-tray--row {
		display: flex;
		align-items: center;
		gap: var(--space-5);
	}

	.mk-tray--name {
		color: var(--text);
		font-family: var(--font-title);
		font-size: var(--font-size-md);
	}

	.mk-tray--empty {
		color: var(--muted);
		font-size: var(--font-size-xs);
	}

	.mk-button {
		margin-left: auto;
		padding: var(--space-2) var(--space-5);
		border: var(--border) solid var(--line);
		border-radius: var(--radius);
		background: var(--chrome);
		color: var(--text);
		font: inherit;
		font-size: var(--font-size-sm);
		cursor: pointer;
	}

	.mk-footer {
		position: absolute;
		bottom: 0;
		left: 0;
		display: flex;
		align-items: center;
		gap: var(--space-8);
		box-sizing: border-box;
		width: 1920px;
		height: 58px;
		padding-left: 26px;
		border-top: var(--border) solid var(--line);
		background: var(--chrome);
	}

	.mk-footer--who {
		color: var(--gold);
		font-family: var(--font-title);
		font-size: var(--font-size-xl);
		font-style: italic;
		text-transform: uppercase;
	}

	.mk-footer--line {
		color: var(--text);
		font-size: var(--font-size-sm);
		font-weight: var(--weight-bold);
	}

	.mk-refs {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-8);
	}

	.mk-refs figure {
		margin: 0;
	}

	.mk-refs img {
		display: block;
		width: 100%;
		border: var(--border) solid var(--line-soft);
	}

	.mk-refs figcaption {
		margin-top: var(--space-3);
		color: var(--muted);
		font-size: var(--font-size-sm);
	}

	/* The Eras tab, as the player area's right column draws it. */
	.mk-eras {
		display: grid;
		gap: var(--space-6);
		box-sizing: border-box;
		width: 480px;
		padding: var(--space-8);
		border: var(--border) solid var(--line-soft);
		background: var(--chrome);
	}

	.mk-eras--title {
		color: var(--text);
		font-size: var(--font-size-xl);
		font-weight: var(--weight-bold);
	}

	.mk-eras--card {
		display: flex;
		align-items: center;
		gap: var(--space-6);
	}
</style>
