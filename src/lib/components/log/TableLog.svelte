<!-- TableLog: the table's log, oldest first with the newest kept in view; a line between turns, each entry marked with its player's colour, and every turn but the last two folded to its main event (#174). -->
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
	import { foldTurns } from '../../log.js';
	import { playerColor } from '../../ui.js';

	/** @type {TableLogProps} */
	let { entries, empty = 'Nothing has happened yet.', ...attr } = $props();

	/** The folded turns the reader opened, by their divider's number; 0 for the lines before the first turn. */
	let opened = $state(/** @type {number[]} */ ([]));

	let turns = $derived(foldTurns(entries));

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

	/**
	 * Opens a folded turn.
	 * @param {number} key
	 */
	const openHandler = (key) => {
		following = false;
		opened = [...opened, key];
	};

	const scrollHandler = () => {
		if (list) {
			following =
				list.scrollHeight - list.scrollTop - list.clientHeight < 24;
		}
	};
</script>

{#snippet line(/** @type {import('../../log.js').LogEntry} */ entry)}
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
{/snippet}

<div
	bind:this={list}
	role="log"
	aria-label="Table log"
	{...attr}
	class="rg-table-log {attr.class ? attr.class : ''}"
	onscroll={scrollHandler}>
	<ol class="rg-table-log--list">
		{#each turns as turn (turn.head?.seq ?? 0)}
			{#if turn.head}
				{@render line(turn.head)}
			{/if}
			{#if turn.folded && !opened.includes(turn.head?.seq ?? 0) && turn.lead}
				<li
					class="rg-table-log--entry rg-table-log--fold"
					style:--rg-table-log-color={turn.lead.player
						? playerColor(/** @type {any} */ (turn.lead.player))
						: undefined}>
					<i
						class="rg-table-log--mark"
						aria-hidden="true"></i>
					<button
						type="button"
						class="rg-table-log--fold-button"
						aria-expanded="false"
						onclick={() => openHandler(turn.head?.seq ?? 0)}
						><span class="rg-table-log--fold-text"
							>{turn.lead.text}</span
						><span class="rg-table-log--more"
							>+{turn.lines.length - 1} more</span
						></button>
				</li>
			{:else}
				{#each turn.lines as entry (entry.seq)}
					{@render line(entry)}
				{/each}
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

	/* A folded turn: its main event and how many lines it hides, opened by a click. */
	.rg-table-log--fold-button {
		display: flex;
		align-items: baseline;
		gap: var(--space-4);
		min-width: 0;
		padding: 0;
		border: 0;
		background: none;
		color: var(--muted);
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.rg-table-log--fold-button:hover .rg-table-log--fold-text,
	.rg-table-log--fold-button:focus-visible .rg-table-log--fold-text {
		color: var(--text);
	}

	.rg-table-log--fold-text {
		flex: 1;
		min-width: 0;
		transition: color var(--duration-fast) var(--ease);
	}

	.rg-table-log--more {
		flex: none;
		color: var(--faint);
		font-size: var(--font-size-xs);
		white-space: nowrap;
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
