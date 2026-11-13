<!-- Only a bot's public facts: no fabricated human resources, capital or income mat. -->
<script module>
	/** @typedef {import('../../area/players.js').BotPlayerCardFacts} BotPlayerCardOwnProps */
	/**
	 * @typedef {BotPlayerCardOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} BotPlayerCardProps
	 * @example
	 * <BotPlayerCard {...facts} />
	 */
</script>

<script>
	import { artUrl, playerColor } from '../../ui.js';
	import {
		trackName,
		techName,
		tapestryName,
		masterpieceName,
	} from '../../game-names.js';
	/** @type {BotPlayerCardProps} */
	let {
		seat,
		name,
		vp,
		botKind,
		civilization,
		tracks,
		landmarks,
		territories,
		incomeTurns,
		favouriteTrack,
		huckstersPool,
		faceUpCharms,
		trendyTrack,
		finished,
		...attr
	} = $props();
</script>

<article
	{...attr}
	class="rg-bot-player-card {attr.class ?? ''}"
	style:--rg-bot-player-colour={playerColor(seat)}
	aria-label={`${name} Automa public overview`}>
	<header class="rg-bot-player-card--header">
		<h2>{name} <span>(Automa)</span></h2>
		{#if botKind === 'automa'}<strong>{vp} VP</strong>{/if}
	</header>
	<h3>{civilization}</h3>
	{#if huckstersPool && Object.values(huckstersPool).some((items) => items.length)}
		<section
			class="rg-bot-player-card--pool"
			aria-label="Hucksters pool">
			<h4>Hucksters pool</h4>
			{#each Object.entries(huckstersPool) as [kind, items]}
				{#each items as item}
					<span
						>{kind === 'tech'
							? techName(String(item))
							: kind === 'tapestry'
								? tapestryName(String(item))
								: kind === 'masterpiece'
									? masterpieceName(String(item))
									: `${kind === 'space' ? 'Space' : 'Territory'} tile ${item}`}</span>
				{/each}
			{/each}
		</section>
	{/if}
	{#if faceUpCharms?.length}
		<section
			class="rg-bot-player-card--pool"
			aria-label="Face-up charms">
			<h4>Face-up charms</h4>
			{#each faceUpCharms as card}<span>{tapestryName(card)}</span>{/each}
		</section>
	{/if}
	<div class="rg-bot-player-card--tracks">
		{#each Object.entries(tracks) as [track, progress] (track)}<div
				style:--rg-bot-track-colour={`var(--${track})`}>
				<img
					src={artUrl(`track/${track}`)}
					alt="" /><span
					>{track === favouriteTrack ? '★ ' : ''}{trackName(
						track
					)}</span
				><strong>{progress}</strong>
			</div>{/each}
	</div>
	<dl>
		{#if trendyTrack}<div>
				<dt>Trendy track</dt>
				<dd>{trackName(trendyTrack)}</dd>
			</div>{/if}
		<div>
			<dt>Landmarks in box</dt>
			<dd>{landmarks}</dd>
		</div>
		<div>
			<dt>Controlled territories</dt>
			<dd>{territories}</dd>
		</div>
		{#if botKind === 'automa'}<div>
				<dt>Income turns</dt>
				<dd>{incomeTurns} / 5</dd>
			</div>{:else}<div>
				<dt>Scoring</dt>
				<dd>Does not score</dd>
			</div>{/if}
	</dl>
	{#if finished}<p>Finished</p>{/if}
</article>

<style>
	.rg-bot-player-card--pool {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		margin-bottom: var(--space-4);
	}
	.rg-bot-player-card--pool h4 {
		flex-basis: 100%;
		margin: 0;
		color: var(--gold);
		font-family: var(--font-title);
	}
	.rg-bot-player-card--pool span {
		padding: var(--space-1) var(--space-2);
		background: var(--surface);
	}
	.rg-bot-player-card {
		padding: var(--space-8);
		border: var(--border-thick) solid var(--rg-bot-player-colour);
		background: var(--texture) var(--chrome);
		color: var(--text);
	}
	.rg-bot-player-card--header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-4);
	}
	.rg-bot-player-card h2 {
		margin: 0;
		font-size: var(--font-size-xl);
	}
	.rg-bot-player-card h2 span,
	.rg-bot-player-card h3 {
		font-family: var(--font-title);
	}
	.rg-bot-player-card h3 {
		color: var(--gold);
		font-size: var(--font-size-xl);
	}
	.rg-bot-player-card--tracks {
		display: grid;
		gap: var(--space-3);
	}
	.rg-bot-player-card--tracks div {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		color: var(--rg-bot-track-colour);
	}
	.rg-bot-player-card--tracks img {
		width: 28px;
		height: 28px;
	}
	.rg-bot-player-card--tracks strong {
		margin-left: auto;
	}
	.rg-bot-player-card dl {
		margin: var(--space-6) 0 0;
		border-top: var(--border) solid var(--line);
		padding-top: var(--space-4);
		display: grid;
		gap: var(--space-3);
	}
	.rg-bot-player-card dl div {
		display: flex;
		justify-content: space-between;
		gap: var(--space-4);
	}
	.rg-bot-player-card dd {
		margin: 0;
	}
</style>
