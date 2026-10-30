<!-- The compact summary at the foot of the player area, for the shown player's era, VP, counts and resources. -->
<script module>
	/**
	 * Properties of the SelfSummary component itself.
	 * @typedef {Object} SelfSummaryOwnProps
	 * @property {import('../../ui.js').Seat} seat - The shown player's seat, which sets the colour mark
	 * @property {string} name - The shown player's name
	 * @property {number} era - 1 to 4, shown as I–IV
	 * @property {number} vp
	 * @property {{ coin: number, worker: number, food: number, culture: number }} resources
	 * @property {string[]} [changed=[]] - Resources whose count shows a prompt's choices so far, drawn gold (#75)
	 * @property {boolean} [inspected=false] - The summary belongs to another player's inspected area (#157)
	 * @property {number} hand - Tapestry cards in hand
	 * @property {number} tech - Tech cards in all rows
	 * @property {number} territories - Territories controlled
	 * @property {number} lines - Complete rows and columns in the capital
	 */

	/**
	 * Properties for the SelfSummary component, including any attributes for its root element.
	 * @typedef {SelfSummaryOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} SelfSummaryProps
	 *
	 * @example
	 * <SelfSummary {...selfSummary(view, seat)} />
	 */
</script>

<script>
	import ResourceChip from './ResourceChip.svelte';
	import { playerColor, RESOURCES } from '../../ui.js';
	import { roman } from '../../game-names.js';

	/** @type {SelfSummaryProps} */
	let {
		seat,
		name,
		era,
		vp,
		resources,
		changed = [],
		inspected = false,
		hand,
		tech,
		territories,
		lines,
		...attr
	} = $props();
</script>

<section
	aria-label={inspected
		? `${name}'s resources and game summary`
		: 'Your resources and game summary'}
	{...attr}
	class="rg-self-summary {attr.class ? attr.class : ''}"
	class:rg-self-summary--inspecting={inspected}
	style:--rg-self-summary-color={playerColor(seat)}>
	<div class="rg-self-summary--head">
		<strong
			><i
				class="rg-self-summary--mark"
				aria-hidden="true"></i
			>{name} <span>· Era {roman(era)}</span></strong>
		<b>{vp} VP</b>
	</div>
	<div class="rg-self-summary--facts">
		<span>Hand <b>{hand}</b></span>
		<span>Tech <b>{tech}</b></span>
		<span>Territories <b>{territories}</b></span>
		<span>Lines <b>{lines}</b></span>
	</div>
	<div
		class="rg-self-summary--resources"
		aria-label={inspected ? `${name}'s resources` : 'Your resources'}>
		{#each RESOURCES as resource (resource.id)}
			<ResourceChip
				class="rg-self-summary--resource"
				resource={resource.id}
				count={resources[resource.id]}
				changed={changed.includes(resource.id)}
				size="medium" />
		{/each}
	</div>
</section>

<style>
	.rg-self-summary {
		display: grid;
		gap: var(--space-3);
		padding: 9px var(--space-8) 11px;
		border-top: var(--border-thick) solid var(--ink);
		background: color-mix(in srgb, var(--chrome) 72%, var(--surface));
	}

	.rg-self-summary--inspecting {
		box-shadow: inset 0 0 0 var(--border-thick) var(--rg-self-summary-color);
	}

	.rg-self-summary--head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-4);
		font: var(--weight-bold) var(--font-size-sm) / var(--leading-tight)
			var(--font-body);
	}

	.rg-self-summary--head strong {
		display: flex;
		align-items: baseline;
		gap: var(--space-3);
		min-width: 0;
		overflow: hidden;
		color: var(--text);
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.rg-self-summary--head strong span {
		color: var(--gold);
	}

	.rg-self-summary--mark {
		flex: none;
		width: 10px;
		height: 10px;
		background: var(--rg-self-summary-color);
	}

	.rg-self-summary--head > b {
		flex: none;
		color: var(--gold);
		font-size: var(--font-size-md);
	}

	.rg-self-summary--facts {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: var(--space-2);
		color: var(--muted);
		font-size: var(--font-size-2xs);
	}

	.rg-self-summary--facts span {
		white-space: nowrap;
	}

	.rg-self-summary--facts b {
		color: var(--text);
	}

	.rg-self-summary--resources {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: var(--space-3);
	}
</style>
