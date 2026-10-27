<!-- TableLog: the table's log, oldest first with the newest kept in view; a line between turns, and each entry marked with its player's colour. -->
<script module>
	/**
	 * One line of the log.
	 * @typedef {Object} TableLogEntry
	 * @property {number} seq - The event's number, which keys the line
	 * @property {number | null} player - The seat it is about, for its colour; null for the whole table
	 * @property {'turn' | 'income' | 'line' | 'notice'} kind - turn: a divider; income: an income turn starting; notice: a timeout, an undo or the end
	 * @property {string} text - One sentence
	 */

	/**
	 * Properties of the TableLog component itself.
	 * @typedef {Object} TableLogOwnProps
	 * @property {TableLogEntry[]} entries - Oldest first
	 * @property {string} [empty='Nothing has happened yet.'] - Shown while there are no entries
	 */

	/**
	 * Properties for the TableLog component, including any attributes for its root element, the log region.
	 * @typedef {TableLogOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} TableLogProps
	 *
	 * @example
	 * <TableLog entries={logEntries(liveEvents(game.events), game)} />
	 */
</script>

<script>
	import { playerColor } from '../../ui.js';

	/** @type {TableLogProps} */
	let { entries, empty = 'Nothing has happened yet.', ...attr } = $props();

	/** @type {HTMLDivElement | undefined} */
	let list = $state();
	/** Whether the reader is at the newest entry, so new ones scroll into view; reading back up stops that. */
	let following = true;

	$effect(() => {
		entries.length;
		if (list && following) {
			list.scrollTop = list.scrollHeight;
		}
	});

	const scrollHandler = () => {
		if (list) {
			following =
				list.scrollHeight - list.scrollTop - list.clientHeight < 24;
		}
	};
</script>

<div
	bind:this={list}
	role="log"
	aria-label="Table log"
	{...attr}
	class="rg-table-log {attr.class ? attr.class : ''}"
	onscroll={scrollHandler}>
	<ol class="rg-table-log--list">
		{#each entries as entry (entry.seq)}
			{#if entry.kind === 'turn'}
				<li
					class="rg-table-log--turn"
					style:--rg-table-log-color={entry.player
						? playerColor(/** @type {any} */ (entry.player))
						: undefined}>
					<span>{entry.text.replace(/\.$/, '')}</span>
				</li>
			{:else}
				<li
					class="rg-table-log--entry rg-table-log--{entry.kind}"
					style:--rg-table-log-color={entry.player
						? playerColor(/** @type {any} */ (entry.player))
						: undefined}>
					<i
						class="rg-table-log--mark"
						aria-hidden="true"></i>
					<span>{entry.text}</span>
				</li>
			{/if}
		{:else}
			<li class="rg-table-log--empty">{empty}</li>
		{/each}
	</ol>
</div>

<style>
	.rg-table-log {
		--rg-table-log-color: var(--line);
		min-height: 0;
		overflow-y: auto;
		scrollbar-width: thin;
	}

	.rg-table-log--list {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.rg-table-log--entry {
		display: grid;
		grid-template-columns: 8px minmax(0, 1fr);
		align-items: baseline;
		gap: var(--space-4);
		padding: var(--space-1) 0;
		color: var(--text);
		font-size: var(--font-size-sm);
		line-height: var(--leading-snug);
	}

	.rg-table-log--mark {
		width: 8px;
		height: 8px;
		background: var(--rg-table-log-color);
	}

	.rg-table-log--income {
		color: var(--gold);
		font-weight: var(--weight-bold);
	}

	.rg-table-log--notice {
		color: var(--muted);
		font-style: italic;
	}

	/* A turn is a thin rule with the player's name in their colour. */
	.rg-table-log--turn {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		margin-top: var(--space-5);
		color: color-mix(in srgb, var(--rg-table-log-color) 55%, var(--text));
		font: var(--weight-title) var(--font-size-xs) / var(--leading-tight)
			var(--font-title);
		letter-spacing: var(--letter-spacing-title);
	}

	.rg-table-log--turn::after {
		content: '';
		flex: 1;
		height: var(--border);
		background: color-mix(
			in srgb,
			var(--rg-table-log-color) 45%,
			var(--line)
		);
	}

	.rg-table-log--empty {
		color: var(--muted);
		font-size: var(--font-size-sm);
	}
</style>
