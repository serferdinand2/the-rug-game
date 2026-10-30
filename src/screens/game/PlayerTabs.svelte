<!-- The player area's tabs (#27 design §2): Capital, Hand, Income, Eras, Civ, Tech and Terrain, for the viewer's own seat, or read-only for another player's (#145). -->
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
	 * @property {number} seat - The seat whose tabs show: the viewer's own, or another player's (#145)
	 * @property {number | null} [viewer] - The viewer's seat, null for the public view; left out, `seat` is the viewer's own. Another seat's tabs are read-only, bordered in its colour and draw nothing private
	 * @property {Function} [onPlayerTabsBack] - Callback fired when Back to your area is pressed over another player's tabs
	 * @property {string} code - The table code, which seeds the capital's terrain tiles
	 * @property {string} [tab='capital'] - The tab on show; bindable
	 * @property {Function} [onPlayerTabsInspect] - Callback fired with { kind: 'tech' | 'tapestry', data } when a card is hovered or focused, and with null on leave, so the shared area shows it in full
	 * @property {PlayerTabsPlacement | null} [placement=null] - A building or landmark to place: the Capital tab lights a building's plots, or offers the landmark in the tray, and snaps it only to the options' places
	 * @property {{ plots: { row: number, col: number }[], landmarks: string[] }} [fresh] - What the viewer just built (#29): the plots glow and the landmarks shine on the Capital tab
	 * @property {Function} [onPlayerTabsPlace] - Callback fired with { index, confirm }: index is the option a building or landmark landed on, or null when the landmark went back to the tray; confirm is true when the landmark's own confirm control was pressed
	 * @property {{ tiles: number[], selected: number | number[] | null, disabled?: number[] } | null} [tilePick=null] - While the viewer explores (#74) or pays tiles (#75): the territory tiles on offer and the one or ones picked, so In hand tiles can be picked here too; `disabled` can't be pressed now
	 * @property {Function} [onPlayerTabsPick] - Callback fired with { tile } when an offered territory tile is pressed
	 * @property {{ civ: string, view: import('../../lib/civ-card.js').CivCardView, selected: string | null } | null} [civPick=null] - While the viewer's own civilization decision is made on its card (#78): the card's spots on offer and the one picked
	 * @property {Function} [onPlayerTabsSpot] - Callback fired with the spot id when a spot on offer is pressed on the Civ tab's card
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
	import CapitalCity from '../../lib/components/player/CapitalCity.svelte';
	import PlacementTray from '../../lib/components/player/PlacementTray.svelte';
	import CardFan from '../../lib/components/player/CardFan.svelte';
	import CivilizationCard from '../../lib/components/player/CivilizationCard.svelte';
	import EraSlots from '../../lib/components/player/EraSlots.svelte';
	import IncomeMat from '../../lib/components/player/IncomeMat.svelte';
	import ScaledCard from '../../lib/components/player/ScaledCard.svelte';
	import TapestryCard from '../../lib/components/player/TapestryCard.svelte';
	import TechnologyCard from '../../lib/components/player/TechnologyCard.svelte';
	import TechRows from '../../lib/components/player/TechRows.svelte';
	import TilePicker from '../../lib/components/prompts/TilePicker.svelte';
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
	import { selfSummary } from '../../lib/overview.js';
	import { terrainView } from '../../lib/area/terrain.js';
	import {
		tapestryCardData,
		techCardData,
	} from '../../lib/cards/game-cards.js';
	import { CARD_SIZES } from '../../lib/cards/card-sizes.js';
	import { artUrl } from '../../lib/ui.js';
	import { CARD_CIVS, civCardView } from '../../lib/civ-card.js';
	import { tileWords } from '../../lib/area/explore.js';
	import InspectBar from '../../lib/components/player/InspectBar.svelte';
	import {
		areaWords,
		handCount,
		publicSeat,
	} from '../../lib/area/inspect.js';
	import { playerColor } from '../../lib/ui.js';

	/** @type {PlayerTabsProps} */
	let {
		game,
		seat,
		viewer,
		code,
		tab = $bindable('capital'),
		onPlayerTabsInspect,
		placement: placementProp = null,
		fresh: freshProp = { plots: [], landmarks: [] },
		onPlayerTabsPlace,
		tilePick: tilePickProp = null,
		onPlayerTabsPick,
		civPick: civPickProp = null,
		onPlayerTabsSpot,
		onPlayerTabsBack,
		...attr
	} = $props();

	/** The viewer's seat: `seat` itself unless another is given. */
	let viewerSeat = $derived(viewer === undefined ? seat : viewer);
	let own = $derived(viewerSeat === seat);
	let words = $derived(areaWords(game, seat, viewerSeat));
	/** The seat as a table seat, which sets the border's colour. */
	let colorSeat = $derived(
		/** @type {import('../../lib/ui.js').Seat} */ (seat)
	);
	// Another player's tabs are read-only (#145): no placement, tile pick or card spot, and none of the viewer's fresh highlights.
	let placement = $derived(own ? placementProp : null);
	let fresh = $derived(own ? freshProp : { plots: [], landmarks: [] });
	let tilePick = $derived(own ? tilePickProp : null);
	let civPick = $derived(own ? civPickProp : null);

	/**
	 * Reports a spot pressed on the Civ tab's card (#78).
	 * @param {ComponentEvent} event - From CivilizationCard: the spot id
	 */
	const spotHandler = (event) => {
		if (own && typeof onPlayerTabsSpot === 'function') {
			onPlayerTabsSpot(event);
		}
	};

	/**
	 * Reports a pressed territory tile, so the explore's tile picker follows.
	 * @param {ComponentEvent} event - From TilePicker: { tile }
	 */
	const tilePickerSelectHandler = (event) => {
		if (own && typeof onPlayerTabsPick === 'function') {
			onPlayerTabsPick(
				new ComponentEvent(
					{ tile: event.value.tile },
					event.target,
					event.originalEvent
				)
			);
		}
	};

	// Only what the viewer may see: another seat's hand and picks never reach the tabs (#145).
	let player = $derived(publicSeat(game.seats[seat - 1], viewerSeat));
	let hand = $derived(
		/** @type {string[]} */ (own ? (player.hand ?? []) : [])
	);
	let capital = $derived(capitalView(player, code));
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
	/** The territory tiles in hand, with their words for the ones on offer. */
	let territories = $derived(
		terrain.territories.map((tile) => ({
			...tile,
			label: tileWords(tile.id),
		}))
	);
	let era = $derived(selfSummary(game, seat)?.era ?? 1);

	let tabs = $derived(
		TABS.map((t) =>
			t.id === 'hand' ? { ...t, count: handCount(player) } : { ...t }
		)
	);

	/**
	 * A lit plot was chosen for a building, or a plot for the landmark: it moves there, as near as it may go.
	 * @param {ComponentEvent} event - From CapitalCity: { row, col }
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
	 * @param {ComponentEvent} event - From CapitalCity: { id, row, col }
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
	 * @param {ComponentEvent} event - From CapitalCity: { id, row, col }
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
	 * The placed landmark was turned, by its control or the . and , keys: the engine's next legal turn, not the grid's.
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
		if (own && typeof onPlayerTabsPlace === 'function') {
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
	class="rg-player-tabs {attr.class ? attr.class : ''}"
	class:rg-player-tabs--inspecting={!own}
	style:--rg-player-tabs-color={own ? null : playerColor(colorSeat)}>
	{#if !own}
		<InspectBar
			text={words.viewing}
			seat={colorSeat}
			back={viewerSeat !== null}
			onInspectBarBack={(/** @type {ComponentEvent} */ event) =>
				onPlayerTabsBack?.(event)} />
	{/if}
	<Tabs
		class="rg-player-tabs--tabs"
		panelClass="rg-player-tabs--body"
		{tabs}
		bind:value={tab}
		label={words.tabs}>
		{#if tab === 'capital'}
			{#if capital}
				<CapitalCity
					{capital}
					owner="Capital City"
					{pieces}
					{targets}
					{preview}
					fresh={fresh.plots}
					awaitingPlacement={placement !== null}
					onCapitalCityPlotClick={plotClickHandler}
					onCapitalCityDrop={dropHandler}
					onCapitalCityMove={moveHandler}
					onCapitalCityRotate={rotateHandler}
					onCapitalCityConfirm={confirmHandler}
					onCapitalCityReturn={returnHandler}
					onCapitalCityDragStart={() => (dragging = true)}
					onCapitalCityDragEnd={() => (dragging = false)} />
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
				<p class="rg-player-tabs--note">{words.capitalSoon}</p>
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
						<ScaledCard
							scale={0.42}
							{...CARD_SIZES.tapestry}>
							<TapestryCard data={tapestryCardData(id)} />
						</ScaledCard>
					{/snippet}
				</CardFan>
			{:else}
				<p class="rg-player-tabs--note">
					{words.hand(handCount(player))}
				</p>
			{/if}
		{:else if tab === 'income'}
			<IncomeMat
				rows={income}
				{era} />
		{:else if tab === 'eras'}
			<h2 class="rg-player-tabs--title">{words.eras}</h2>
			{#if eraCard}
				<div class="rg-player-tabs--era-card">
					<ScaledCard
						scale={0.6}
						{...CARD_SIZES.tapestry}>
						<TapestryCard data={tapestryCardData(eraCard)} />
					</ScaledCard>
				</div>
			{/if}
			<EraSlots
				slots={eras}
				bind:selected={eraShown} />
		{:else if tab === 'civ'}
			{#if player.civs.length === 0}
				<p class="rg-player-tabs--note">{words.civSoon}</p>
			{/if}
			{#each player.civs as civ (civ)}
				<div class="rg-player-tabs--civ">
					<!-- The six civilizations with spots of their own show where their pieces are, and take their choices (#78). -->
					<CivilizationCard
						id={civ}
						seat={player.seat}
						live={CARD_CIVS.includes(civ)
							? civPick && civPick.civ === civ
								? civPick.view
								: civCardView(game, seat, civ)
							: null}
						selected={civPick && civPick.civ === civ
							? civPick.selected
							: null}
						onCivilizationCardPick={spotHandler} />
				</div>
			{/each}
		{:else if tab === 'tech'}
			<h2 class="rg-player-tabs--title">{words.tech}</h2>
			<TechRows
				tech={player.tech}
				onTechRowsInspect={(/** @type {ComponentEvent} */ event) =>
					inspect('tech', event.value, event.originalEvent)} />
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
						<ScaledCard
							scale={0.42}
							{...CARD_SIZES.tech}>
							<TechnologyCard data={techCardData(id)} />
						</ScaledCard>
					{/snippet}
				</CardFan>
			</section>
		{:else if tab === 'terrain'}
			<h2 class="rg-player-tabs--title">Territory tiles</h2>
			{#if territories.length}
				<!-- While exploring (#74) or paying tiles (#75), the tiles on offer can be pressed. -->
				<TilePicker
					class="rg-player-tabs--tiles"
					aria-label="Territory tiles in hand"
					size="large"
					tiles={territories}
					pickable={tilePick?.tiles ?? []}
					selected={tilePick?.selected ?? null}
					disabled={tilePick?.disabled ?? []}
					dataIdPrefix="terrain-tile"
					onTilePickerSelect={tilePickerSelectHandler} />
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
	</Tabs>
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

	/* Another player's tabs (issue 145): their line on top, and a border in their colour, drawn inside so nothing moves. */
	.rg-player-tabs--inspecting {
		grid-template-rows: auto auto minmax(0, 1fr);
		outline: var(--border-thick) solid var(--rg-player-tabs-color);
		outline-offset: calc(-1 * var(--border-thick));
	}

	/* Under 420px (windows under 1680px wide) the tabs tighten, so all seven still show at 1366×768 (#64); narrower
	   still, the row scrolls. Tabs' root, reached through its class prop. */
	@container rg-player-tabs (max-width: 419px) {
		.rg-player-tabs :global(.rg-player-tabs--tabs) {
			--rg-tabs-padding: var(--space-2);
			--rg-tabs-gap: var(--space-1);
		}
	}

	/* Tabs' panel, reached through its panelClass prop. */
	.rg-player-tabs :global(.rg-player-tabs--body) {
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

	.rg-player-tabs--note {
		margin: var(--space-6) 0;
		color: var(--muted);
	}

	/* PlacementTray's root, reached through its class prop. */
	.rg-player-tabs :global(.rg-player-tabs--tray) {
		margin-top: var(--space-6);
	}

	/* A civilization card at full size, unscaled: its box is as wide as the card and positioned, as before #92. */
	.rg-player-tabs--civ {
		position: relative;
		flex: none;
		width: fit-content;
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

	/* Also TilePicker's root, reached through its class prop. */
	.rg-player-tabs :global(.rg-player-tabs--tiles) {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-5);
		margin-bottom: var(--space-9);
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
