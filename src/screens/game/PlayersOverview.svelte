<!-- The players overview (#27 design §4): a card per player in the left 3/4, and on the right the capital, civilization or tech of the row chosen. -->
<script module>
	/**
	 * Properties of the PlayersOverview screen part itself.
	 * @typedef {Object} PlayersOverviewOwnProps
	 * @property {any} game - The game as view() gives it to the viewer
	 * @property {number | null} seat - The viewer's seat
	 * @property {number | null} host - The host's seat
	 * @property {string} code - The table code, which seeds the capital's terrain tiles
	 */

	/**
	 * Properties for PlayersOverview, including any attributes for its root element.
	 * @typedef {PlayersOverviewOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} PlayersOverviewProps
	 *
	 * @example
	 * <PlayersOverview {game} {seat} host={room.host} code={room.code} />
	 */
</script>

<script>
	import CapitalGrid from '../../lib/components/player/CapitalGrid.svelte';
	import CompletionCounters from '../../lib/components/player/CompletionCounters.svelte';
	import CivilizationCard from '../../lib/components/player/CivilizationCard.svelte';
	import PlayerCard from '../../lib/components/player/PlayerCard.svelte';
	import TechnologyCard from '../../lib/components/player/TechnologyCard.svelte';
	import { capitalView } from '../../lib/area/capital.js';
	import { playerCards } from '../../lib/area/players.js';
	import { techCardData } from '../../lib/cards/game-cards.js';
	import { REVIEWED_CIVILIZATIONS } from '../../lib/cards/reviewed-civilizations.js';
	import { civilizationName } from '../../lib/describe.js';
	import { artUrl } from '../../lib/ui.js';

	/** @typedef {import('../../lib/component-event.js').ComponentEvent} ComponentEvent */

	/** @type {PlayersOverviewProps} */
	let { game, seat, host, code, ...attr } = $props();

	const REVIEWED = new Set(
		REVIEWED_CIVILIZATIONS.map((/** @type {{ id: string }} */ c) => c.id)
	);

	let cards = $derived(playerCards(game, seat, host));
	let open = $state(
		/** @type {{ seat: number, row: 'civilization' | 'capital' | 'tech' } | null} */ (
			null
		)
	);
	let openSeat = $derived(open ? game.seats[open.seat - 1] : null);
	let capital = $derived(
		open?.row === 'capital' && openSeat ? capitalView(openSeat, code) : null
	);
	/** @type {'rows' | 'columns' | 'districts' | null} */
	let highlight = $state(null);
</script>

<div
	{...attr}
	class="rg-players-overview {attr.class ? attr.class : ''}">
	<div class="rg-players-overview--cards">
		{#each cards as card (card.seat)}
			<PlayerCard
				{...card}
				selected={open?.seat === card.seat ? open.row : null}
				onPlayerCardSelect={(/** @type {ComponentEvent} */ event) => {
					open =
						open?.seat === card.seat && open.row === event.value
							? null
							: { seat: card.seat, row: event.value };
					highlight = null;
				}} />
		{/each}
	</div>
	<aside
		class="rg-players-overview--detail"
		aria-label="Overview detail">
		{#if !open || !openSeat}
			<p class="rg-players-overview--waiting">Waiting for overview</p>
		{:else if open.row === 'capital'}
			{#if capital}
				<h2 class="rg-players-overview--title">
					{openSeat.name} ·
					<span class="rg-players-overview--name"
						>{capital.name}</span>
				</h2>
				<CapitalGrid
					plots={capital.plots}
					biome={capital.biome}
					terrainSeed={capital.terrainSeed}
					pieces={capital.pieces}
					{highlight}
					label="{openSeat.name}'s capital city" />
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
			{:else}
				<p class="rg-players-overview--waiting">No capital mat yet</p>
			{/if}
		{:else if open.row === 'civilization'}
			{#each openSeat.civs as civ (civ)}
				{#if REVIEWED.has(civ)}
					<CivilizationCard
						id={civ}
						state="empty" />
				{:else}
					<article class="rg-players-overview--civ">
						<img
							src={artUrl(`civ/${civ}`)}
							alt=""
							width="128"
							height="128" />
						<h2 class="rg-players-overview--name">
							{civilizationName(civ)}
						</h2>
						<p>Card text comes with #47.</p>
					</article>
				{/if}
			{:else}
				<p class="rg-players-overview--waiting">No civilization yet</p>
			{/each}
		{:else}
			<h2 class="rg-players-overview--title">
				{openSeat.name}'s technology
			</h2>
			{#each ['top', 'middle', 'bottom'] as row (row)}
				<h3 class="rg-players-overview--row">
					{row === 'top'
						? 'Top'
						: row === 'middle'
							? 'Middle'
							: 'Bottom'} row
				</h3>
				<div class="rg-players-overview--tech">
					{#each openSeat.tech[row] as id (id)}
						<div class="rg-players-overview--scale">
							<div class="rg-players-overview--scaled">
								<TechnologyCard data={techCardData(id)} />
							</div>
						</div>
					{:else}
						<p class="rg-players-overview--empty">No cards</p>
					{/each}
				</div>
			{/each}
		{/if}
	</aside>
</div>

<style>
	.rg-players-overview {
		position: absolute;
		inset: 0;
		z-index: var(--layer-popover);
		display: grid;
		grid-template-columns: var(--play-columns);
		gap: var(--play-gap);
		background: var(--ink);
	}

	.rg-players-overview--cards {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		align-content: center;
		gap: var(--space-8);
		padding: var(--space-10);
		background: var(--chrome);
	}

	.rg-players-overview--detail {
		display: grid;
		align-content: start;
		justify-items: center;
		gap: var(--space-6);
		min-height: 0;
		overflow: auto;
		padding: var(--space-9);
		border-left: var(--border-thick) solid var(--ink);
		background: var(--chrome);
	}

	.rg-players-overview--waiting {
		align-self: center;
		margin: auto;
		color: var(--faint);
		font-weight: var(--weight-bold);
		letter-spacing: var(--letter-spacing-caps);
		text-transform: uppercase;
	}

	.rg-players-overview--title {
		margin: 0;
		font: var(--weight-bold) var(--font-size-xl) / var(--leading-tight)
			var(--font-body);
	}

	.rg-players-overview--name {
		color: var(--gold);
		font-family: var(--font-title);
		font-weight: var(--weight-title);
	}

	.rg-players-overview--civ {
		display: grid;
		justify-items: center;
		gap: var(--space-4);
		color: var(--muted);
	}

	.rg-players-overview--civ img {
		image-rendering: pixelated;
	}

	.rg-players-overview--row {
		justify-self: start;
		margin: var(--space-4) 0 0;
		font-size: var(--font-size-sm);
	}

	.rg-players-overview--tech {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		justify-self: start;
	}

	.rg-players-overview--scale {
		position: relative;
		width: calc(425px * 0.4);
		height: calc(286px * 0.4);
	}

	.rg-players-overview--scaled {
		position: absolute;
		inset: 0 auto auto 0;
		transform: scale(0.4);
		transform-origin: top left;
	}

	.rg-players-overview--empty {
		margin: 0;
		color: var(--muted);
		font-size: var(--font-size-sm);
	}
</style>
