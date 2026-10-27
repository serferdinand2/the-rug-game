<!-- The player area's tabs (#27 design §2): Capital, Hand, Income, Eras, Civ, Tech and Terrain, for the viewer's own seat. -->
<script module>
	/**
	 * Properties of the PlayerTabs screen part itself.
	 * @typedef {Object} PlayerTabsOwnProps
	 * @property {any} game - The game as view() gives it to the viewer
	 * @property {number} seat - The viewer's seat
	 * @property {string} code - The table code, which seeds the capital's terrain tiles
	 * @property {string} [tab='capital'] - The tab on show; bindable
	 * @property {Function} [onPlayerTabsInspect] - Callback fired with { kind: 'tech' | 'tapestry', data } when a card is hovered or focused, and with null on leave, so the shared area shows it in full
	 */

	/**
	 * Properties for PlayerTabs, including any attributes for its root element.
	 * @typedef {PlayerTabsOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} PlayerTabsProps
	 *
	 * @example
	 * <PlayerTabs {game} {seat} code={room.code} bind:tab onPlayerTabsInspect={show} />
	 */
</script>

<script>
	import Tabs from '../../lib/components/ui/Tabs.svelte';
	import CapitalGrid from '../../lib/components/player/CapitalGrid.svelte';
	import CompletionCounters from '../../lib/components/player/CompletionCounters.svelte';
	import CardFan from '../../lib/components/player/CardFan.svelte';
	import CivilizationCard from '../../lib/components/player/CivilizationCard.svelte';
	import EraSlots from '../../lib/components/player/EraSlots.svelte';
	import IncomeMat from '../../lib/components/player/IncomeMat.svelte';
	import TapestryCard from '../../lib/components/player/TapestryCard.svelte';
	import TechnologyCard from '../../lib/components/player/TechnologyCard.svelte';
	import TerritoryTile from '../../lib/components/player/TerritoryTile.svelte';
	import { ComponentEvent } from '../../lib/component-event.js';
	import { TABS } from '../../lib/area/tabs.js';
	import { capitalView } from '../../lib/area/capital.js';
	import { eraSlots, incomeRows } from '../../lib/area/income.js';
	import { terrainView } from '../../lib/area/terrain.js';
	import {
		tapestryCardData,
		techCardData,
	} from '../../lib/cards/game-cards.js';
	import { artUrl } from '../../lib/ui.js';

	/** @type {PlayerTabsProps} */
	let {
		game,
		seat,
		code,
		tab = $bindable('capital'),
		onPlayerTabsInspect,
		...attr
	} = $props();

	/** The tech rows, top first, as the mockup draws them. */
	const TECH_ROWS = /** @type {const} */ ([
		{ id: 'top', label: 'Top row', shape: 'square' },
		{ id: 'middle', label: 'Middle row', shape: 'circle' },
		{ id: 'bottom', label: 'Bottom row', shape: 'none' },
	]);

	let player = $derived(game.seats[seat - 1]);
	let hand = $derived(/** @type {string[]} */ (player.hand ?? []));
	let capital = $derived(capitalView(player, code));
	/** @type {'rows' | 'columns' | 'districts' | null} */
	let highlight = $state(null);
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
					pieces={capital.pieces}
					{highlight}
					room />
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
						<div
							class="rg-player-tabs--scale"
							style:--rg-player-tabs-scale="0.42"
							style:--rg-player-tabs-width="319px"
							style:--rg-player-tabs-height="560px">
							<div class="rg-player-tabs--scaled">
								<TapestryCard data={tapestryCardData(id)} />
							</div>
						</div>
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
				<div
					class="rg-player-tabs--scale rg-player-tabs--era-card"
					style:--rg-player-tabs-scale="0.6"
					style:--rg-player-tabs-width="319px"
					style:--rg-player-tabs-height="560px">
					<div class="rg-player-tabs--scaled">
						<TapestryCard data={tapestryCardData(eraCard)} />
					</div>
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
						<TerritoryTile
							id={tile.id}
							corners={tile.corners}
							island={tile.island} />
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
	.rg-player-tabs {
		display: grid;
		grid-template-rows: auto minmax(0, 1fr);
		min-height: 0;
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
