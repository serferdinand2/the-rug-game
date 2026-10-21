<!-- One open table on the launch page: Join, the table code over five seat boxes, then its rules and expansion. -->
<script module>
	/**
	 * An expansion the table plays with.
	 * @typedef {Object} OpenTableExpansion
	 * @property {string} name - Its name, such as 'Arts & Architecture'
	 * @property {string} color - Its colour token, such as 'var(--arts-architecture)'
	 */

	/**
	 * Properties of the OpenTableRow component itself.
	 * @typedef {Object} OpenTableRowOwnProps
	 * @property {string} code - The 8-character table code
	 * @property {number} [players=0] - Seats taken, 0–5; the boxes fill from the left in the seats' player colours
	 * @property {string} rules - The rules version, such as 'Current rules' or 'Original 2019 rules'
	 * @property {OpenTableExpansion | null} [expansion=null] - The expansion badge, or none for the base game
	 * @property {Function} [onOpenTableRowJoin] - Callback fired with { code } when Join is pressed
	 */

	/**
	 * Properties for the OpenTableRow component, including any attributes for its root element.
	 * @typedef {OpenTableRowOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} OpenTableRowProps
	 *
	 * @example
	 * <OpenTableRow
	 *   code="DAWN2048"
	 *   players={2}
	 *   rules="Current rules"
	 *   expansion={{ name: 'Arts & Architecture', color: 'var(--arts-architecture)' }}
	 *   onOpenTableRowJoin={(event) => join(event.value.code)} />
	 */
</script>

<script>
	import Badge from '../ui/Badge.svelte';
	import Button from '../ui/Button.svelte';
	import { ComponentEvent } from '../../component-event.js';
	import { SEATS, playerColor } from '../../ui.js';

	/** @type {OpenTableRowProps} */
	let {
		code,
		players = 0,
		rules,
		expansion = null,
		onOpenTableRowJoin,
		...attr
	} = $props();

	let taken = $derived(Math.max(0, Math.min(SEATS.length, players)));

	/**
	 * @param {import('../../component-event.js').ComponentEvent} event
	 */
	const joinButtonClickHandler = (event) => {
		if (typeof onOpenTableRowJoin === 'function') {
			onOpenTableRowJoin(
				new ComponentEvent({ code }, event.target, event.originalEvent)
			);
		}
	};
</script>

<div
	{...attr}
	class="rg-open-table-row {attr.class ? attr.class : ''}">
	<Button
		aria-label="Join {code}"
		onButtonClick={joinButtonClickHandler}>Join</Button>
	<div class="rg-open-table-row--table">
		<span class="rg-open-table-row--code">{code}</span>
		<span
			class="rg-open-table-row--seats"
			role="img"
			aria-label="{taken} of {SEATS.length} players">
			{#each SEATS as seat (seat)}
				<i
					class="rg-open-table-row--seat"
					class:rg-open-table-row--filled={seat <= taken}
					style:--rg-open-table-row-color={playerColor(seat)}></i>
			{/each}
		</span>
	</div>
	<div class="rg-open-table-row--details">
		<span>{rules}</span>
		{#if expansion}
			<Badge
				label={expansion.name}
				color={expansion.color} />
		{/if}
	</div>
</div>

<style>
	.rg-open-table-row {
		display: grid;
		grid-template-columns: auto minmax(110px, 1fr) minmax(150px, 1.2fr);
		align-items: center;
		gap: var(--space-4) var(--space-6);
		min-height: 66px;
		padding: var(--space-4) var(--space-5);
		border: var(--border) solid var(--line-soft);
		border-radius: var(--radius);
		background: var(--control);
	}

	.rg-open-table-row--table {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-2);
		min-width: 0;
	}

	.rg-open-table-row--code {
		font-size: var(--font-size-lg);
		font-weight: var(--weight-bold);
		line-height: var(--leading-snug);
	}

	.rg-open-table-row--seats {
		display: flex;
		gap: var(--space-2);
	}

	.rg-open-table-row--seat {
		width: 17px;
		height: 9px;
		border: var(--border) solid var(--line-strong);
		background: color-mix(in srgb, var(--line-soft) 60%, var(--line));
	}

	.rg-open-table-row--filled {
		border-color: var(--rg-open-table-row-color);
		background: var(--rg-open-table-row-color);
	}

	.rg-open-table-row--details {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
		color: var(--muted);
		font-size: var(--font-size-sm);
		line-height: var(--leading-normal);
		text-align: center;
	}
</style>
