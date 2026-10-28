<!-- ScoreBoard: the players by VP during play, each with where the VP came from and the tiebreak values. -->
<script module>
	/**
	 * Properties of the ScoreBoard component itself.
	 * @typedef {Object} ScoreBoardOwnProps
	 * @property {import('../../results.js').ScoreRow[]} rows - Best first, from scoreboard(game)
	 * @property {number | null} [you=null] - The viewer's seat, marked with their colour
	 */

	/**
	 * Properties for the ScoreBoard component, including any attributes for its root list.
	 * @typedef {ScoreBoardOwnProps & import('svelte/elements').HTMLAttributes<HTMLOListElement>} ScoreBoardProps
	 *
	 * @example
	 * <ScoreBoard rows={scoreboard(game)} you={seat} />
	 */
</script>

<script>
	import { playerColor } from '../../ui.js';
	import PlayerToken from '../player/PlayerToken.svelte';

	/** @type {ScoreBoardProps} */
	let { rows, you = null, ...attr } = $props();
</script>

<ol
	aria-label="Scores"
	{...attr}
	class="rg-score-board {attr.class ? attr.class : ''}">
	{#each rows as row (row.seat)}
		<li
			class="rg-score-board--row"
			class:rg-score-board--you={row.seat === you}
			style:--rg-score-board-color={playerColor(row.seat)}>
			<div class="rg-score-board--head">
				<span class="rg-score-board--place">{row.place}</span>
				<PlayerToken
					seat={row.seat}
					size={24}
					decorative />
				<span class="rg-score-board--who">
					<b>{row.name}</b>
					{#if row.civ}
						<span class="rg-score-board--civ">{row.civ}</span>
					{/if}
				</span>
				<strong class="rg-score-board--vp">{row.vp} VP</strong>
			</div>
			{#if row.sources.length}
				<dl class="rg-score-board--sources">
					{#each row.sources as source (source.id)}
						<div>
							<dt>{source.label}</dt>
							<dd>{source.vp} VP</dd>
						</div>
					{/each}
				</dl>
			{/if}
			<p class="rg-score-board--ties">
				{#if 'landmark' in row}
					Tallest landmark:
					{#if row.landmark}
						<span class="rg-score-board--landmark"
							>{row.landmark}</span>
					{:else}
						none
					{/if}
					·
				{/if}
				{row.resources}
				{row.resources === 1 ? 'resource' : 'resources'}
			</p>
		</li>
	{/each}
</ol>

<style>
	.rg-score-board {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.rg-score-board--row {
		padding: var(--space-5) var(--space-6);
		border: var(--border) solid var(--line);
		background: color-mix(in srgb, var(--raised) 82%, transparent);
	}

	.rg-score-board--you {
		box-shadow: inset 4px 0 var(--rg-score-board-color);
	}

	.rg-score-board--head {
		display: grid;
		grid-template-columns: 18px 24px minmax(0, 1fr) auto;
		align-items: center;
		gap: var(--space-4);
	}

	.rg-score-board--place {
		color: var(--muted);
		font-weight: var(--weight-bold);
	}

	.rg-score-board--who {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.rg-score-board--civ,
	.rg-score-board--landmark {
		color: var(--gold);
		font: var(--weight-title) var(--font-size-xs) / var(--leading-tight)
			var(--font-title);
	}

	.rg-score-board--vp {
		font-size: var(--font-size-lg);
		white-space: nowrap;
	}

	.rg-score-board--sources {
		display: grid;
		gap: var(--space-1);
		margin: var(--space-4) 0 0;
		font-size: var(--font-size-xs);
	}

	.rg-score-board--sources div {
		display: flex;
		justify-content: space-between;
		gap: var(--space-4);
	}

	.rg-score-board--sources dt {
		color: var(--muted);
	}

	.rg-score-board--sources dd {
		margin: 0;
		font-weight: var(--weight-bold);
	}

	.rg-score-board--ties {
		margin: var(--space-4) 0 0;
		color: var(--muted);
		font-size: var(--font-size-xs);
	}
</style>
