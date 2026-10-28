<!-- StandingRow: one player's line in the final standings, as Lazar's end screen draws it: place, token, name, civilization and VP, and the name opens where the VP came from. -->
<script module>
	/**
	 * Properties of the StandingRow component itself.
	 * @typedef {Object} StandingRowOwnProps
	 * @property {import('../../results.js').StandingRow} row - From standings(game)
	 * @property {boolean} [you=false] - The viewer's row: a bar in their colour on the left
	 * @property {boolean} [expanded=false] - Where the VP came from is open; bindable
	 * @property {Function} [onStandingRowToggle] - Callback fired with the new expanded state when the name is pressed
	 */

	/**
	 * Properties for the StandingRow component, including any attributes for its root element.
	 * @typedef {StandingRowOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} StandingRowProps
	 *
	 * @example
	 * <StandingRow row={rows[0]} you bind:expanded />
	 */
</script>

<script>
	import { ComponentEvent } from '../../component-event.js';
	import { ordinal } from '../../results.js';
	import { playerColor } from '../../ui.js';
	import PlayerToken from '../player/PlayerToken.svelte';

	/** @type {StandingRowProps} */
	let {
		row,
		you = false,
		expanded = $bindable(false),
		onStandingRowToggle,
		...attr
	} = $props();

	const uid = $props.id();

	/**
	 * @param {MouseEvent} event
	 */
	const toggleClickHandler = (event) => {
		expanded = !expanded;
		if (typeof onStandingRowToggle === 'function') {
			onStandingRowToggle(
				new ComponentEvent(
					expanded,
					/** @type {HTMLElement} */ (event.currentTarget),
					event
				)
			);
		}
	};
</script>

<article
	aria-label="{ordinal(row.place)}, {row.name}, {row.vp} VP"
	{...attr}
	class="rg-standing-row {attr.class ? attr.class : ''}"
	class:rg-standing-row--winner={row.winner}
	class:rg-standing-row--you={you}
	style:--rg-standing-row-color={playerColor(row.seat)}>
	<div class="rg-standing-row--line">
		<span class="rg-standing-row--place">{row.place}</span>
		<div class="rg-standing-row--person">
			<PlayerToken
				seat={row.seat}
				size={36}
				decorative />
			<div>
				<button
					type="button"
					class="rg-standing-row--name"
					aria-expanded={expanded}
					aria-controls="{uid}-sources"
					onclick={toggleClickHandler}
					>{row.name}<span
						class="rg-standing-row--chevron"
						aria-hidden="true"></span
					></button>
				{#if row.civ}
					<span class="rg-standing-row--civ">{row.civ}</span>
				{/if}
			</div>
		</div>
		<strong class="rg-standing-row--score">{row.vp} VP</strong>
	</div>
	<div
		id="{uid}-sources"
		class="rg-standing-row--sources"
		role="group"
		aria-label="{row.name}'s VP breakdown"
		hidden={!expanded}>
		<div class="rg-standing-row--heading">
			<strong>Where the VP came from</strong>
			<span>Already awarded during play</span>
		</div>
		{#if row.sources.length}
			<dl class="rg-standing-row--list">
				{#each row.sources as source (source.id)}
					<div>
						<dt>{source.label}</dt>
						<dd>{source.vp} VP</dd>
					</div>
				{/each}
			</dl>
		{:else}
			<p class="rg-standing-row--none">No VP this game.</p>
		{/if}
	</div>
</article>

<style>
	.rg-standing-row {
		border: var(--border) solid var(--line);
		background: color-mix(in srgb, var(--raised) 82%, transparent);
	}

	.rg-standing-row--winner {
		border-color: var(--card-line);
		background: color-mix(in srgb, var(--gold) 12%, var(--raised));
	}

	.rg-standing-row--you {
		box-shadow: inset 4px 0 var(--rg-standing-row-color);
	}

	.rg-standing-row--line {
		display: grid;
		grid-template-columns: 63px minmax(0, 1fr) auto;
		align-items: center;
		gap: 18px;
		min-height: 86px;
		padding: var(--space-6) 18px;
	}

	.rg-standing-row--place {
		color: var(--muted);
		font-size: var(--font-size-5xl);
		font-weight: var(--weight-bold);
		line-height: var(--leading-none);
	}

	.rg-standing-row--winner .rg-standing-row--place,
	.rg-standing-row--winner .rg-standing-row--score {
		color: var(--gold);
	}

	.rg-standing-row--person {
		display: flex;
		align-items: center;
		gap: 14px;
		min-width: 0;
	}

	.rg-standing-row--name {
		display: inline-flex;
		align-items: center;
		gap: var(--space-4);
		padding: 0;
		border: 0;
		background: transparent;
		color: var(--text);
		font: var(--weight-bold) var(--font-size-xl) / var(--leading-tight)
			var(--font-body);
		text-align: left;
		cursor: pointer;
	}

	.rg-standing-row--name:hover {
		color: var(--gold);
	}

	.rg-standing-row--chevron {
		width: 7px;
		height: 7px;
		border-right: 1.5px solid currentColor;
		border-bottom: 1.5px solid currentColor;
		transform: rotate(45deg) translateY(-2px);
		transition: transform var(--duration-fast) var(--ease);
	}

	.rg-standing-row--name[aria-expanded='true'] .rg-standing-row--chevron {
		transform: rotate(225deg) translate(-2px, -1px);
	}

	.rg-standing-row--civ {
		display: block;
		margin-top: 5px;
		color: var(--gold);
		font: var(--weight-title) var(--font-size-sm) / var(--leading-snug)
			var(--font-title);
	}

	.rg-standing-row--score {
		color: var(--text);
		font-size: var(--font-size-4xl);
		font-weight: var(--weight-bold);
		white-space: nowrap;
	}

	.rg-standing-row--sources {
		padding: 15px 20px 17px 99px;
		border-top: var(--border) solid var(--line);
		background: color-mix(in srgb, var(--ink) 28%, transparent);
	}

	.rg-standing-row--sources[hidden] {
		display: none;
	}

	.rg-standing-row--heading {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-6);
		margin-bottom: var(--space-6);
		color: var(--muted);
		font-size: var(--font-size-sm);
	}

	.rg-standing-row--heading strong {
		color: var(--text);
	}

	.rg-standing-row--list {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--space-4) 30px;
		margin: 0;
	}

	.rg-standing-row--list div {
		display: flex;
		justify-content: space-between;
		gap: var(--space-6);
		min-width: 0;
	}

	.rg-standing-row--list dt,
	.rg-standing-row--none {
		margin: 0;
		color: var(--muted);
	}

	.rg-standing-row--list dd {
		margin: 0;
		font-weight: var(--weight-bold);
		white-space: nowrap;
	}
</style>
