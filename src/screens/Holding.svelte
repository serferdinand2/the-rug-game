<!-- The page after Start until the game screen exists (#25 design §6.5): the table, its players, and a way out. -->
<script module>
	/**
	 * Properties of the Holding screen itself.
	 * @typedef {Object} HoldingOwnProps
	 * @property {import('../lib/game.svelte.js').GameStore} store - Its room is the table shown
	 */

	/**
	 * Properties for Holding, including any attributes for its root element.
	 * @typedef {HoldingOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} HoldingProps
	 *
	 * @example
	 * <Holding {store} />
	 */
</script>

<script>
	import Button from '../lib/components/ui/Button.svelte';
	import Panel from '../lib/components/ui/Panel.svelte';
	import { playerColor } from '../lib/ui.js';

	/** @type {HoldingProps} */
	let { store, ...attr } = $props();

	let room = $derived(store.room);
</script>

<main
	{...attr}
	class="rg-holding {attr.class ? attr.class : ''}">
	<Panel
		padding="large"
		class="rg-holding--panel"
		aria-label="Game in progress">
		<p class="rg-holding--lead">The game has begun.</p>
		<p class="rg-holding--text">The game screen comes with #26.</p>
		<ol class="rg-holding--players">
			{#each room.seats as seat (seat.seat)}
				<li style:--rg-holding-color={playerColor(seat.seat)}>
					{seat.name}{#if seat.away}
						<span class="rg-holding--away"> · away</span>{/if}
				</li>
			{/each}
		</ol>
		<p class="rg-holding--text">Table {room.code}</p>
		<Button
			mode="danger"
			onButtonClick={() => store.leaveTable()}>Leave table</Button>
	</Panel>
</main>

<style>
	.rg-holding {
		flex: 1;
		display: grid;
		place-items: center;
		padding: var(--space-9);
		background: var(--texture) var(--surface);
	}

	.rg-holding :global(.rg-holding--panel) {
		display: grid;
		justify-items: center;
		gap: var(--space-6);
		width: min(var(--launch-width), 100%);
		text-align: center;
	}

	.rg-holding--lead {
		margin: 0;
		color: var(--gold);
		font: var(--weight-title) var(--font-size-3xl) / var(--leading-tight)
			var(--font-title);
	}

	.rg-holding--text {
		margin: 0;
		color: var(--muted);
	}

	.rg-holding--players {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--space-4);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.rg-holding--players li {
		padding: var(--space-3) var(--space-5);
		border: var(--border-thick) solid var(--rg-holding-color);
		background: var(--control);
		font-weight: var(--weight-bold);
	}

	.rg-holding--away {
		color: var(--muted);
		font-weight: var(--weight-regular);
	}
</style>
