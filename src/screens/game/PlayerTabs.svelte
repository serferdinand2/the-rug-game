<!-- The player area's tabs (#27 design §2): Capital, Hand, Income, Eras, Civ, Tech and Terrain, for the viewer's own seat. -->
<script module>
	/** @typedef {import('../../lib/area/placement-targets.js').PlacementOption} PlacementOption */

	/**
	 * A gained building or landmark waiting for a place, chosen on the Capital tab (#28).
	 * @typedef {Object} PlayerTabsPlacement
	 * @property {{ building?: string, landmark?: string }} piece - What is being placed
	 * @property {PlacementOption[]} options - The prompt's options; only those with a plot are on the capital
	 * @property {number | null} picked - The index of the option chosen so far, if any
	 */

	/**
	 * Properties of the PlayerTabs screen part itself.
	 * @typedef {Object} PlayerTabsOwnProps
	 * @property {any} game - The game as view() gives it to the viewer
	 * @property {number} seat - The viewer's seat
	 * @property {string} code - The table code, which seeds the capital's terrain tiles
	 * @property {string} [tab='capital'] - The tab on show; bindable
	 * @property {Function} [onPlayerTabsInspect] - Callback fired with { kind: 'tech' | 'tapestry', data } when a card is hovered or focused, and with null on leave, so the shared area shows it in full
	 * @property {PlayerTabsPlacement | null} [placement=null] - A building or landmark to place: the Capital tab lights a building's plots, or offers the landmark in the tray, and snaps it only to the options' places
	 * @property {{ plots: { row: number, col: number }[], landmarks: string[] }} [fresh] - What the viewer just built (#29): the plots glow and the landmarks shine on the Capital tab
	 * @property {Function} [onPlayerTabsPlace] - Callback fired with { index, confirm }: index is the option a building or landmark landed on, or null when the landmark went back to the tray; confirm is true when the landmark's own confirm control was pressed
	 * @property {{ tiles: number[], selected: number | null } | null} [tilePick=null] - While the viewer explores (#74): the territory tiles on offer, and the one picked, so In hand tiles can be picked here too
	 * @property {Function} [onPlayerTabsPick] - Callback fired with { tile } when an offered territory tile is pressed
	 */

	/**
	 * Properties for PlayerTabs, including any attributes for its root element.
	 * @typedef {PlayerTabsOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} PlayerTabsProps
	 *
	 * @example
	 * <PlayerTabs
	 *   {game}
	 *   {seat}
	 *   code={room.code}
	 *   bind:tab
	 *   placement={{ piece: { landmark: 'lighthouse' }, options: prompt.options, picked }}
	 *   onPlayerTabsInspect={show}
	 *   onPlayerTabsPlace={(event) => (event.value.confirm ? send(event.value.index) : (picked = event.value.index))}
	 * />
	 */
</script>

<script>
	import Tabs from '../../lib/components/ui/Tabs.svelte';
	import CapitalGrid from '../../lib/components/player/CapitalGrid.svelte';
	import CompletionCounters from '../../lib/components/player/CompletionCounters.svelte';
	import PlacementTray from '../../lib/components/player/PlacementTray.svelte';
	import CardFan from '../../lib/components/player/CardFan.svelte';
	import CivilizationCard from '../../lib/components/player/CivilizationCard.svelte';
	import EraSlots from '../../lib/components/player/EraSlots.svelte';
	import IncomeMat from '../../lib/components/player/IncomeMat.svelte';
	import ScaledTapestryCard from '../../lib/components/player/ScaledTapestryCard.svelte';
	import TechnologyCard from '../../lib/components/player/TechnologyCard.svelte';
	import TerritoryTile from '../../lib/components/player/TerritoryTile.svelte';
	import { ComponentEvent } from '../../lib/component-event.js';
	import { TABS } from '../../lib/area/tabs.js';
	import { capitalView } from '../../lib/area/capital.js';
	import { rotateFootprint } from '../../lib/capital.js';
	import {
		legalNear,
		nextRotation,
		placeNear,
		placingPiece,
		plotTargets,
	} from '../../lib/area/placement-targets.js';
	import { eraSlots, incomeRows } from '../../lib/area/income.js';
	import { terrainView } from '../../lib/area/terrain.js';
	import {
		tapestryCardData,
		techCardData,
	} from '../../lib/cards/game-cards.js';
	import { artUrl } from '../../lib/ui.js';
	import { tileWords } from '../../lib/area/explore.js';

	/** @type {PlayerTabsProps} */
	let {
		game,
		seat,
		code,
		tab = $bindable('capital'),
		onPlayerTabsInspect,
		placement = null,
		fresh = { plots: [], landmarks: [] },
		onPlayerTabsPlace,
		tilePick = null,
		onPlayerTabsPick,
		...attr
	} = $props();

	/** The tech rows, top first, as the mockup draws them. */
	const TECH_ROWS = /** @type {const} */ ([
		{ id: 'top', label: 'Top row', shape: 'square' },
		{ id: 'middle', label: 'Middle row', shape: 'circle' },
		{ id: 'bottom', label: 'Bottom row', shape: 'none' },
	]);

	/**
	 * Reports a pressed territory tile, so the explore's tile picker follows.
	 * @param {number} tile
	 * @param {MouseEvent} event
	 */
	const tileHandler = (tile, event) => {
		if (typeof onPlayerTabsPick === 'function') {
			onPlayerTabsPick(
				new ComponentEvent(
					{ tile },
					/** @type {HTMLElement} */ (event.currentTarget),
					event
				)
			);
		}
	};

	let player = $derived(game.seats[seat - 1]);
	let hand = $derived(/** @type {string[]} */ (player.hand ?? []));
	let capital = $derived(capitalView(player, code));
	/** @type {'rows' | 'columns' | 'districts' | null} */
	let highlight = $state(null);
	/** A placed landmark is being dragged, so the tray offers itself to take it back. */
	let dragging = $state(false);
	let building = $derived(placement?.piece.building ?? null);
	/** The landmark being placed, when it has a place on the capital; with none, nothing is offered there. */
	let landmark = $derived(
		placement?.piece.landmark &&
			placement.options.some((option) => option.plot)
			? placingPiece(placement.piece.landmark)
			: null
	);
	let picked = $derived(
		placement?.options.find(
			(option) => option.plot && option.index === placement?.picked
		)?.plot ?? null
	);
	let targets = $derived(
		building && placement ? plotTargets(placement.options) : []
	);
	let preview = $derived(
		building && picked
			? { row: picked.row, col: picked.col, building }
			: null
	);
	/** The landmark on the capital, unconfirmed, at the chosen place. */
	let placed = $derived(
		landmark && picked && picked.rotation !== null
			? {
					...landmark,
					row: picked.row,
					col: picked.col,
					rotation: picked.rotation,
				}
			: null
	);
	let pieces = $derived(
		(capital && placed
			? [...capital.pieces, placed]
			: (capital?.pieces ?? [])
		).map((piece) =>
			fresh.landmarks.includes(piece.id)
				? { ...piece, fresh: true }
				: piece
		)
	);
	/** The tray holds the landmark until it is on the capital; it always starts unturned. */
	let tray = $derived(
		landmark && !placed ? [{ ...landmark, rotation: 0 }] : []
	);
	let income = $derived(incomeRows(player));
	let eras = $derived(eraSlots(player));
	/** @type {number | null} */
	let eraShown = $state(null);
	/** The era whose card shows by default: the active one, otherwise the latest slot with a card. */
	let activeEra = $derived(
		eras.find((/** @type {any} */ s) => s.active)?.era ??
			eras.findLast((/** @type {any} */ s) => s.id !== null)?.era ??
			null
	);
	// A new era card, or another seat, goes back to the default (#27 review).
	$effect(() => {
		activeEra;
		seat;
		eraShown = null;
	});
	let eraCard = $derived(
		eras.find((/** @type {any} */ s) => s.era === (eraShown ?? activeEra))
			?.id ?? null
	);
	let terrain = $derived(terrainView(player));
	let era = $derived(Math.min(Math.max(player.incomeTurns, 1), 4));

	let tabs = $derived(
		TABS.map((t) =>
			t.id === 'hand' ? { ...t, count: hand.length } : { ...t }
		)
	);

	/**
	 * A lit plot was chosen for a building, or a plot for the landmark: it moves there, as near as it may go.
	 * @param {ComponentEvent} event - From CapitalGrid: { row, col }
	 */
	const plotClickHandler = (event) => {
		const { row, col } = event.value;
		if (building) {
			const target = targets.find(
				(plot) => plot.row === row && plot.col === col
			);
			if (target) {
				place(target.index, false, event);
			}
		} else if (landmark) {
			const rotation = placed ? placed.rotation : 0;
			const at = centred(row, col, rotation);
			land(
				placed
					? legalNear(
							placement?.options ?? [],
							at.row,
							at.col,
							rotation
						)
					: placeNear(placement?.options ?? [], at.row, at.col, 0),
				event
			);
		}
	};

	/**
	 * The top-left corner that puts the landmark's middle, in a turn, on a plot (#28 review): a 3×3 landmark asked for
	 * at the middle starts a plot up and to the left of it.
	 * @param {number} row
	 * @param {number} col
	 * @param {number} rotation
	 * @returns {{ row: number, col: number }}
	 */
	function centred(row, col, rotation) {
		const shape = landmark
			? rotateFootprint(landmark.footprint, rotation)
			: ['X'];
		return {
			row: row - Math.floor((shape.length - 1) / 2),
			col: col - Math.floor((shape[0].length - 1) / 2),
		};
	}

	/**
	 * The landmark was chosen in the tray, by pointer or key: it goes near the middle of the capital.
	 * @param {ComponentEvent} event
	 */
	const trayChooseHandler = (event) => {
		const at = centred(4, 4, 0);
		land(placeNear(placement?.options ?? [], at.row, at.col, 0), event);
	};

	/**
	 * The landmark was dropped from the tray; row and col are where its top-left corner landed.
	 * @param {ComponentEvent} event - From CapitalGrid: { id, row, col }
	 */
	const dropHandler = (event) => {
		land(
			placeNear(
				placement?.options ?? [],
				event.value.row,
				event.value.col,
				0
			),
			event
		);
	};

	/**
	 * The placed landmark was dragged or moved with the arrow keys.
	 * @param {ComponentEvent} event - From CapitalGrid: { id, row, col }
	 */
	const moveHandler = (event) => {
		if (placed) {
			land(
				legalNear(
					placement?.options ?? [],
					event.value.row,
					event.value.col,
					placed.rotation
				),
				event
			);
		}
	};

	/**
	 * The placed landmark was turned, by its control or the R key: the engine's next legal turn, not the grid's.
	 * @param {ComponentEvent} event
	 */
	const rotateHandler = (event) => {
		if (placement?.picked !== null && placement?.picked !== undefined) {
			land(nextRotation(placement.options, placement.picked), event);
		}
	};

	/**
	 * @param {ComponentEvent} event
	 */
	const confirmHandler = (event) => {
		if (
			placed &&
			placement?.picked !== null &&
			placement?.picked !== undefined
		) {
			place(placement.picked, true, event);
		}
	};

	/**
	 * The placed landmark went back to the tray, by its control, a key or a drop on the tray.
	 * @param {ComponentEvent} event
	 */
	const returnHandler = (event) => {
		dragging = false;
		place(null, false, event);
	};

	/**
	 * Moves the landmark to a legal place, unless it is already there.
	 * @param {number | null} index - The option it lands on; null when there is none
	 * @param {ComponentEvent} event
	 */
	function land(index, event) {
		if (index !== null && index !== placement?.picked) {
			place(index, false, event);
		}
	}

	/**
	 * Tells the screen which place is chosen.
	 * @param {number | null} index - The option's index; null when the landmark went back to the tray
	 * @param {boolean} confirm - The landmark's confirm control was pressed
	 * @param {ComponentEvent} event - The event that caused it
	 */
	function place(index, confirm, event) {
		if (typeof onPlayerTabsPlace === 'function') {
			onPlayerTabsPlace(
				new ComponentEvent(
					{ index, confirm },
					event.target,
					event.originalEvent
				)
			);
		}
	}

	/**
	 * Tells the shared area which card to show in full, or none.
	 * @param {'tech' | 'tapestry'} kind
	 * @param {string | null} id
	 * @param {Event} [event]
	 */
	function inspect(kind, id, event) {
		if (typeof onPlayerTabsInspect !== 'function') {
			return;
		}
		onPlayerTabsInspect(
			new ComponentEvent(
				id === null
					? null
					: {
							kind,
							data:
								kind === 'tech'
									? techCardData(id)
									: tapestryCardData(id),
						},
				/** @type {HTMLElement} */ (
					event?.currentTarget ?? document.body
				),
				event
			)
		);
	}
</script>

<div
	{...attr}
	class="rg-player-tabs {attr.class ? attr.class : ''}">
	<Tabs
		class="rg-player-tabs--tabs"
		{tabs}
		bind:value={tab}
		label="Your city and cards" />
	<div
		class="rg-player-tabs--body"
		id="{tab}-panel"
		role="tabpanel"
		tabindex="0"
		aria-labelledby="{tab}-tab">
		{#if tab === 'capital'}
			{#if capital}
				<h2 class="rg-player-tabs--title">
					Capital City · <span class="rg-player-tabs--name"
						>{capital.name}</span>
				</h2>
				<CapitalGrid
					plots={capital.plots}
					biome={capital.biome}
					terrainSeed={capital.terrainSeed}
					{pieces}
					{highlight}
					{targets}
					{preview}
					fresh={fresh.plots}
					awaitingPlacement={placement !== null}
					room
					onCapitalGridPlotClick={plotClickHandler}
					onCapitalGridDrop={dropHandler}
					onCapitalGridMove={moveHandler}
					onCapitalGridRotate={rotateHandler}
					onCapitalGridConfirm={confirmHandler}
					onCapitalGridReturn={returnHandler}
					onCapitalGridDragStart={() => (dragging = true)}
					onCapitalGridDragEnd={() => (dragging = false)} />
				<CompletionCounters
					counts={capital.counts}
					active={highlight}
					onCompletionCountersHover={(
						/** @type {ComponentEvent} */ event
					) => (highlight = event.value)}
					onCompletionCountersToggle={(
						/** @type {ComponentEvent} */ event
					) =>
						(highlight =
							highlight === event.value ? null : event.value)} />
				<PlacementTray
					class="rg-player-tabs--tray"
					items={tray}
					returnTarget={dragging && placed !== null}
					onPlacementTraySelect={trayChooseHandler}
					onPlacementTrayPlace={trayChooseHandler}
					onPlacementTrayReturn={returnHandler} />
				{#if capital.besideMat.length}
					<p class="rg-player-tabs--note">
						Beside the mat: {capital.besideMat.join(', ')}
					</p>
				{/if}
			{:else}
				<p class="rg-player-tabs--note">
					Your capital mat is dealt as the game starts.
				</p>
			{/if}
		{:else if tab === 'hand'}
			<h2 class="rg-player-tabs--title">Hand</h2>
			{#if hand.length}
				<CardFan
					items={hand}
					overlap={70}
					label="Tapestry cards in hand"
					onCardFanInspect={(/** @type {ComponentEvent} */ event) =>
						inspect(
							'tapestry',
							event.value.index === null
								? null
								: hand[event.value.index],
							event.originalEvent
						)}>
					{#snippet card(/** @type {string} */ id)}
						<ScaledTapestryCard
							data={tapestryCardData(id)}
							scale={0.42} />
					{/snippet}
				</CardFan>
			{:else}
				<p class="rg-player-tabs--note">No tapestry cards in hand.</p>
			{/if}
		{:else if tab === 'income'}
			<IncomeMat
				rows={income}
				{era} />
		{:else if tab === 'eras'}
			<h2 class="rg-player-tabs--title">Your eras</h2>
			{#if eraCard}
				<div class="rg-player-tabs--era-card">
					<ScaledTapestryCard
						data={tapestryCardData(eraCard)}
						scale={0.6} />
				</div>
			{/if}
			<EraSlots
				slots={eras}
				bind:selected={eraShown} />
		{:else if tab === 'civ'}
			{#if player.civs.length === 0}
				<p class="rg-player-tabs--note">
					You choose your civilization as the game starts.
				</p>
			{/if}
			{#each player.civs as civ (civ)}
				<div
					class="rg-player-tabs--scale"
					style:--rg-player-tabs-scale="1"
					style:--rg-player-tabs-width="425px"
					style:--rg-player-tabs-height="auto">
					<CivilizationCard
						id={civ}
						state="empty" />
				</div>
			{/each}
		{:else if tab === 'tech'}
			<h2 class="rg-player-tabs--title">Your technology</h2>
			{#each TECH_ROWS as row (row.id)}
				<section class="rg-player-tabs--row">
					<h3 class="rg-player-tabs--row-title">
						<i
							class="rg-player-tabs--shape rg-player-tabs--shape-{row.shape}"
							aria-hidden="true"></i
						>{row.label}
					</h3>
					{#if player.tech[row.id].length}
						<CardFan
							items={player.tech[row.id]}
							overlap={120}
							label="{row.label} tech cards"
							onCardFanInspect={(
								/** @type {ComponentEvent} */ event
							) =>
								inspect(
									'tech',
									event.value.index === null
										? null
										: player.tech[row.id][
												event.value.index
											],
									event.originalEvent
								)}>
							{#snippet card(/** @type {string} */ id)}
								<div
									class="rg-player-tabs--scale"
									style:--rg-player-tabs-scale="0.42"
									style:--rg-player-tabs-width="425px"
									style:--rg-player-tabs-height="286px">
									<div class="rg-player-tabs--scaled">
										<TechnologyCard
											data={techCardData(id)} />
									</div>
								</div>
							{/snippet}
						</CardFan>
					{:else}
						<div class="rg-player-tabs--empty-row">
							No cards yet
						</div>
					{/if}
				</section>
			{/each}
			<section class="rg-player-tabs--row">
				<h3 class="rg-player-tabs--row-title">
					The display · {game.supply.tech.deck} in the deck
				</h3>
				<CardFan
					items={game.supply.tech.faceUp}
					overlap={120}
					label="Face-up tech cards"
					onCardFanInspect={(/** @type {ComponentEvent} */ event) =>
						inspect(
							'tech',
							event.value.index === null
								? null
								: game.supply.tech.faceUp[event.value.index],
							event.originalEvent
						)}>
					{#snippet card(/** @type {string} */ id)}
						<div
							class="rg-player-tabs--scale"
							style:--rg-player-tabs-scale="0.42"
							style:--rg-player-tabs-width="425px"
							style:--rg-player-tabs-height="286px">
							<div class="rg-player-tabs--scaled">
								<TechnologyCard data={techCardData(id)} />
							</div>
						</div>
					{/snippet}
				</CardFan>
			</section>
		{:else if tab === 'terrain'}
			<h2 class="rg-player-tabs--title">Territory tiles</h2>
			{#if terrain.territories.length}
				<div class="rg-player-tabs--tiles">
					{#each terrain.territories as tile (tile.id)}
						{#snippet territory()}
							<TerritoryTile
								id={tile.id}
								corners={tile.corners}
								island={tile.island}
								clouds={tile.clouds}
								volcano={tile.volcano} />
						{/snippet}
						{#if tilePick?.tiles.includes(tile.id)}
							<button
								type="button"
								class="rg-player-tabs--pick"
								aria-pressed={tilePick.selected === tile.id}
								aria-label={tileWords(tile.id)}
								data-id="terrain-tile-{tile.id}"
								onclick={(event) =>
									tileHandler(tile.id, event)}>
								{@render territory()}
							</button>
						{:else}
							{@render territory()}
						{/if}
					{/each}
				</div>
			{:else}
				<p class="rg-player-tabs--note">No territory tiles in hand.</p>
			{/if}
			<h2 class="rg-player-tabs--title">Space tiles</h2>
			{#if terrain.space.length}
				<div class="rg-player-tabs--tiles">
					{#each terrain.space as tile (tile.id)}
						<figure class="rg-player-tabs--space">
							<img
								src={artUrl(`space-tile/${tile.id}`)}
								alt="Space tile {tile.id}"
								width="64"
								height="64" />
							<figcaption>
								{tile.explored ? 'Explored' : 'In hand'}
							</figcaption>
						</figure>
					{/each}
				</div>
			{:else}
				<p class="rg-player-tabs--note">No space tiles.</p>
			{/if}
		{/if}
	</div>
</div>

<style>
	/* A named container, so the tab row can tighten when the player area is narrow. */
	.rg-player-tabs {
		container: rg-player-tabs / inline-size;
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		grid-template-rows: auto minmax(0, 1fr);
		min-height: 0;
	}

	/* Under 420px (windows under 1680px wide) the tabs tighten, so all seven still show at 1366×768 (#64); narrower
	   still, the row scrolls. Tabs' root, reached through its class prop. */
	@container rg-player-tabs (max-width: 419px) {
		.rg-player-tabs :global(.rg-player-tabs--tabs) {
			--rg-tabs-padding: var(--space-2);
			--rg-tabs-gap: var(--space-1);
		}
	}

	.rg-player-tabs--body {
		min-height: 0;
		overflow: auto;
		padding: var(--space-9) 22px;
	}

	.rg-player-tabs--title {
		margin: 0 0 var(--space-6);
		color: var(--text);
		font: var(--weight-bold) var(--font-size-xl) / var(--leading-tight)
			var(--font-body);
	}

	.rg-player-tabs--name {
		color: var(--gold);
		font-family: var(--font-title);
		font-weight: var(--weight-title);
	}

	.rg-player-tabs--note {
		margin: var(--space-6) 0;
		color: var(--muted);
	}

	/* PlacementTray's root, reached through its class prop. */
	.rg-player-tabs--body :global(.rg-player-tabs--tray) {
		margin-top: var(--space-6);
	}

	.rg-player-tabs--scale {
		position: relative;
		flex: none;
		width: calc(var(--rg-player-tabs-width) * var(--rg-player-tabs-scale));
		height: calc(
			var(--rg-player-tabs-height) * var(--rg-player-tabs-scale)
		);
	}

	.rg-player-tabs--scaled {
		position: absolute;
		inset: 0 auto auto 0;
		transform: scale(var(--rg-player-tabs-scale));
		transform-origin: top left;
	}

	.rg-player-tabs--era-card {
		margin-bottom: var(--space-8);
	}

	.rg-player-tabs--row {
		margin-bottom: var(--space-8);
	}

	.rg-player-tabs--row-title {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		margin: 0 0 var(--space-4);
		color: var(--text);
		font: var(--weight-bold) var(--font-size-sm) / var(--leading-tight)
			var(--font-body);
	}

	.rg-player-tabs--shape {
		width: 14px;
		height: 14px;
		border: 3px solid var(--text);
	}

	.rg-player-tabs--shape-circle {
		border-radius: 50%;
	}

	.rg-player-tabs--shape-none {
		display: none;
	}

	.rg-player-tabs--empty-row {
		display: grid;
		place-items: center;
		height: 60px;
		border: var(--border) solid var(--line);
		color: var(--muted);
		font-size: var(--font-size-sm);
	}

	.rg-player-tabs--tiles {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-5);
		margin-bottom: var(--space-9);
	}

	/* An offered tile while exploring (#74): a plain button round the tile, outlined in gold when picked. */
	.rg-player-tabs--pick {
		padding: var(--space-2);
		border: var(--border) solid var(--line);
		border-radius: var(--radius);
		background: transparent;
		cursor: pointer;
	}

	.rg-player-tabs--pick:hover,
	.rg-player-tabs--pick:focus-visible {
		border-color: var(--gold);
		background: color-mix(in srgb, var(--gold) 10%, transparent);
	}

	.rg-player-tabs--pick[aria-pressed='true'] {
		border-color: var(--gold);
		background: color-mix(in srgb, var(--gold) 17%, var(--surface));
		outline: var(--border-thick) solid var(--gold);
	}

	/* Focus on the picked tile: its solid ring turns dashed and stands off, so focus reads apart from the pick. */
	.rg-player-tabs--pick[aria-pressed='true']:focus-visible {
		outline-style: dashed;
		outline-offset: var(--focus-offset);
	}

	.rg-player-tabs--space {
		display: grid;
		justify-items: center;
		gap: var(--space-2);
		margin: 0;
		color: var(--muted);
		font-size: var(--font-size-2xs);
	}

	.rg-player-tabs--space img {
		image-rendering: pixelated;
	}
</style>
