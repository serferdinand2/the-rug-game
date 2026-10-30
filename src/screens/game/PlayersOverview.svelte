<!-- The players overview (#27 design §4): a card per player in the left 3/4, and on the right the capital, civilization or tech of the row chosen. -->
<script module>
	/**
	 * Properties of the PlayersOverview screen part itself.
	 * @typedef {Object} PlayersOverviewOwnProps
	 * @property {any} game - The game as view() gives it to the viewer
	 * @property {number | null} seat - The viewer's seat
	 * @property {number | null} host - The host's seat
	 * @property {string} code - The table code, which seeds the capital's terrain tiles
	 * @property {number | null} [player=null] - A seat whose capital opens on the right, as the 1 to 5 keys choose it (#83)
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
	import CapitalCity from '../../lib/components/player/CapitalCity.svelte';
	import CivilizationCard from '../../lib/components/player/CivilizationCard.svelte';
	import PlayerCard from '../../lib/components/player/PlayerCard.svelte';
	import TechRows from '../../lib/components/player/TechRows.svelte';
	import { capitalView } from '../../lib/area/capital.js';
	import { playerCards } from '../../lib/area/players.js';
	import { CARD_CIVS, civCardView } from '../../lib/civ-card.js';

	/** @typedef {import('../../lib/component-event.js').ComponentEvent} ComponentEvent */

	/** @type {PlayersOverviewProps} */
	let { game, seat, host, code, player = null, ...attr } = $props();

	let cards = $derived(playerCards(game, seat, host));
	let open = $state(
		/** @type {{ seat: number, row: 'civilization' | 'capital' | 'tech' } | null} */ (
			null
		)
	);
	// A player chosen by the keys opens on their capital, and again whenever another is chosen (#83).
	$effect(() => {
		if (player !== null) {
			open = { seat: player, row: 'capital' };
		}
	});
	let openSeat = $derived(open ? game.seats[open.seat - 1] : null);
	let capital = $derived(
		open?.row === 'capital' && openSeat ? capitalView(openSeat, code) : null
	);
</script>

<div
	{...attr}
	class="rg-players-overview {attr.class ? attr.class : ''}">
	<div class="rg-players-overview--cards">
		{#each cards as card, index (card.seat)}
			<!-- Opening the overview takes the focus to its first card (#27 review). -->
			<PlayerCard
				{...card}
				autofocus={index === 0}
				selected={open?.seat === card.seat ? open.row : null}
				onPlayerCardSelect={(/** @type {ComponentEvent} */ event) => {
					open =
						open?.seat === card.seat && open.row === event.value
							? null
							: { seat: card.seat, row: event.value };
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
				<!-- Another seat's capital starts with nothing lit, as a new choice of row does. -->
				{#key openSeat.seat}
					<CapitalCity
						{capital}
						owner={openSeat.name}
						label="{openSeat.name}'s capital city" />
				{/key}
			{:else}
				<p class="rg-players-overview--waiting">No capital mat yet</p>
			{/if}
		{:else if open.row === 'civilization'}
			{#each openSeat.civs as civ (civ)}
				<!-- Each player's card as it stands, to look at only (#78). -->
				<CivilizationCard
					id={civ}
					seat={openSeat.seat}
					live={CARD_CIVS.includes(civ)
						? civCardView(game, openSeat.seat, civ)
						: null} />
			{:else}
				<p class="rg-players-overview--waiting">No civilization yet</p>
			{/each}
		{:else}
			<h2 class="rg-players-overview--title">
				{openSeat.name}'s technology
			</h2>
			<TechRows
				tech={openSeat.tech}
				layout="wrap" />
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

	/* The detail's grid gap spaces the capital's title from its grid. */
	.rg-players-overview--detail {
		--rg-capital-city-title-gap: 0;
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
</style>
