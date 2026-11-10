<!-- AutomaDecisionCard: the canonical decision deck, using the shared playable-card paper and gold title. -->
<script module>
	/** @typedef {import('../../engine/data/automa-cards.js').AutomaCard} AutomaCard */
	/**
	 * @typedef {Object} AutomaDecisionCardOwnProps
	 * @property {AutomaCard} [card] - The exact printed record; id is an alternative.
	 * @property {number} [id=1] - Canonical decision-card number.
	 * @property {'full' | 'track' | 'hex'} [role='full'] - Full deck face or the half read in a report.
	 * @property {import('../../engine/data/ids.js').BoardTrackId} [favouriteTrack='exploration'] - The actor's current favourite, marked by a star in its row.
	 */
	/**
	 * @typedef {AutomaDecisionCardOwnProps & Omit<import('svelte/elements').HTMLAttributes<HTMLElement>, 'id' | 'role' | 'title'>} AutomaDecisionCardProps
	 * @example
	 * <AutomaDecisionCard id={4} role="track" favouriteTrack="science" />
	 */
</script>

<script>
	import CardFrame from './CardFrame.svelte';
	import CardBand from './CardBand.svelte';
	import { automaPatternName } from '../../automa-patterns.js';
	import { AUTOMA_CARDS } from '../../engine/data/automa-cards.js';
	import { artUrl } from '../../ui.js';
	import { trackName } from '../../game-names.js';

	/** @type {AutomaDecisionCardProps} */
	let {
		card,
		id = 1,
		role = 'full',
		favouriteTrack = 'exploration',
		...attr
	} = $props();
	const face = $derived(
		card ?? AUTOMA_CARDS.find((item) => item.id === id) ?? AUTOMA_CARDS[0]
	);
	// The printed favourite entry resolves to its track; its ordinary entry is not repeated.
	const tracks = $derived([
		...new Set(
			face.trackTiebreakers.map((track) =>
				track === 'favourite' ? favouriteTrack : track
			)
		),
	]);
	const title = $derived(
		role === 'full'
			? 'Track / Income · Hex / Topple'
			: role === 'track'
				? 'Track / Income'
				: 'Hex / Topple'
	);
</script>

<CardFrame
	plain
	{...attr}
	class="rg-automa-decision-card {attr.class ?? ''}"
	aria-label={`Automa decision card ${face.id}`}>
	<CardBand
		{title}
		size="small"
		class="rg-automa-decision-card--band" />
	<div class="rg-automa-decision-card--body">
		{#if role !== 'hex'}
			<div class="rg-automa-decision-card--metric">
				<span>Automa track</span><strong>{face.automaTrack}</strong>
			</div>
			<div class="rg-automa-decision-card--metric">
				<span>Shadow Empire track</span><strong
					>{face.shadowEmpireTrack}</strong>
			</div>
			<div class="rg-automa-decision-card--metric">
				<span>Income</span><span class="rg-automa-decision-card--value"
					>{#if face.income}<img
							src={artUrl('building/house')}
							alt="Income" /><strong>+</strong>{:else}<span
							aria-label="No income icon">—</span
						>{/if}</span>
			</div>
		{/if}
		{#if role !== 'track'}
			<button
				type="button"
				class="rg-automa-decision-card--metric rg-automa-decision-card--pattern"
				data-automa-pattern={face.hexPattern}
				title={`Hex pattern: ${automaPatternName(face.hexPattern)}`}>
				<span>Hex pattern</span><strong
					>{automaPatternName(face.hexPattern)}</strong>
			</button>
			<div class="rg-automa-decision-card--metric">
				<span>Topple</span><span class="rg-automa-decision-card--value"
					>{#if face.topple}<img
							src={artUrl('piece/outpost-toppled')}
							alt="Topple outpost" />{:else}<span
							aria-label="No topple icon">—</span
						>{/if}</span>
			</div>
		{/if}
		<ol
			class="rg-automa-decision-card--tracks"
			aria-label="Track tie-break order">
			{#each tracks as track (track)}
				<li
					class="rg-automa-decision-card--track"
					style:--rg-automa-track-colour={`var(--${track})`}>
					<img
						src={artUrl(`track/${track}`)}
						alt="" /><span
						class="rg-automa-decision-card--star"
						aria-label={track === favouriteTrack
							? 'Favourite'
							: undefined}
						>{track === favouriteTrack ? '★' : ''}</span
					><span>{trackName(track)}</span>
				</li>
			{/each}
		</ol>
	</div>
	<footer class="rg-automa-decision-card--footer">
		<span
			class="rg-automa-decision-card--deck"
			class:rg-automa-decision-card--deck-circle={face.deck ===
				'decision'}
			aria-label={face.deck === 'decision'
				? 'Decision deck'
				: 'Progress deck'}></span>
		Automa #{face.id}
	</footer>
</CardFrame>

<style>
	:global(.rg-card-frame.rg-automa-decision-card) {
		--card-band-start: var(--science);
		--card-band-middle: color-mix(
			in srgb,
			var(--science) 70%,
			var(--surface)
		);
		--card-band-end: color-mix(in srgb, var(--science) 35%, var(--surface));
		width: 290px;
		display: flex;
		flex-direction: column;
	}
	:global(.rg-automa-decision-card--band) {
		min-height: 49px;
		padding: var(--space-4) var(--space-6);
	}
	.rg-automa-decision-card--body {
		padding: var(--space-4);
		flex: 1;
		display: grid;
		gap: var(--space-3);
		font-size: var(--font-size-sm);
	}
	.rg-automa-decision-card--metric {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-3);
		min-height: 34px;
		border-bottom: 1px solid var(--card-line-soft);
		padding-bottom: var(--space-2);
	}
	.rg-automa-decision-card--pattern {
		width: 100%;
		padding: 0 0 var(--space-2);
		border: 0;
		border-bottom: var(--border) solid var(--card-line-soft);
		background: transparent;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: help;
	}
	.rg-automa-decision-card--pattern strong {
		text-align: right;
	}
	.rg-automa-decision-card--value {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
	}
	.rg-automa-decision-card--value img,
	.rg-automa-decision-card--track img {
		width: 30px;
		height: 30px;
		object-fit: contain;
	}
	.rg-automa-decision-card--tracks {
		margin: 0;
		padding: 0;
		list-style: none;
		display: grid;
		gap: var(--space-2);
	}
	.rg-automa-decision-card--track {
		font-family: var(--font-title);
		display: grid;
		grid-template-columns: 30px 14px 1fr;
		align-items: center;
		gap: var(--space-2);
		color: var(--rg-automa-track-colour);
		font-weight: var(--weight-bold);
	}
	.rg-automa-decision-card--star {
		color: var(--card-path);
	}
	.rg-automa-decision-card--footer {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		border-top: 1px solid var(--card-line);
		background: var(--science);
		color: var(--text);
		font-size: var(--font-size-xs);
	}
	.rg-automa-decision-card--deck {
		width: 10px;
		height: 10px;
		border: 1px solid currentColor;
	}
	.rg-automa-decision-card--deck-circle {
		border-radius: 50%;
	}
</style>
