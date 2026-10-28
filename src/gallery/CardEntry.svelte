<!-- One catalog item in its available game card frame or a labelled art/text slot. -->
<script module>
	/** @typedef {{asset:import('../lib/art/catalog.js').Asset}} CardEntryProps */
</script>

<script>
	import CivilizationCard from '../lib/components/player/CivilizationCard.svelte';
	import TechnologyCard from '../lib/components/player/TechnologyCard.svelte';
	import TapestryCard from '../lib/components/player/TapestryCard.svelte';
	import MasterpieceCard from '../lib/components/player/MasterpieceCard.svelte';
	import LandmarkCard from '../lib/components/player/LandmarkCard.svelte';
	import { FOOTPRINTS } from '../lib/art/footprints.js';
	import { TECH_CARDS } from '../lib/engine/data/tech-cards.js';
	import { TAPESTRY_CARDS } from '../lib/engine/data/tapestry-cards.js';
	import { SPACE_TILES } from '../lib/engine/data/space-tiles.js';
	import { techCardData, tapestryCardData } from '../lib/cards/game-cards.js';
	import { describeEffects } from '../lib/describe.js';
	import { EXPANSIONS } from '../lib/art/catalog.js';
	import { CARD_GROUPS } from './gallery-data.js';

	/** @type {CardEntryProps} */
	let { asset } = $props();
	const slug = $derived(asset.id.slice(asset.group.length + 1));
	const art = $derived(`/art/${asset.id}.svg`);
	const edition = $derived(
		EXPANSIONS.find((item) => item.code === asset.expansion)?.name ??
			asset.expansion
	);
	const techIds = new Set(TECH_CARDS.map((card) => card.id));
	const tapestryIds = new Set(TAPESTRY_CARDS.map((card) => card.id));
	const spaceTile = $derived(
		asset.group === 'space-tile'
			? SPACE_TILES.find((tile) => String(tile.id) === slug)
			: undefined
	);
	let artState = $state('loading');
</script>

<figure
	class="rg-gallery-entry"
	data-group={asset.group}>
	<img
		class="rg-gallery-entry__probe"
		src={art}
		alt=""
		aria-hidden="true"
		onload={() => (artState = 'drawn')}
		onerror={() => (artState = 'missing')} />
	{#if artState === 'loading'}
		<div
			class="rg-gallery-entry__slot"
			aria-label={`${asset.name} artwork loading`}>
			{asset.name}
		</div>
	{:else if artState === 'missing'}
		<div
			class="rg-gallery-entry__slot"
			role="img"
			aria-label={`${asset.name} artwork not drawn yet`}>
			<strong>{asset.name}</strong><span>Artwork not drawn yet</span>
		</div>
	{:else if asset.group === 'civ'}
		<CivilizationCard id={slug} />
	{:else if asset.group === 'tech' && techIds.has(slug)}
		<TechnologyCard data={techCardData(slug)} />
	{:else if asset.group === 'tapestry' && tapestryIds.has(slug)}
		<TapestryCard data={tapestryCardData(slug)} />
	{:else if asset.group === 'masterpiece'}
		<MasterpieceCard
			title={asset.name}
			artwork={art}
			artworkAlt={`${asset.name} artwork`}>
			{#snippet effects()}<p class="rg-gallery-entry__pending">
					Rules text pending
				</p>{/snippet}
		</MasterpieceCard>
	{:else if asset.group === 'landmark-card'}
		<LandmarkCard
			title={asset.name}
			artwork={art}
			footprint={FOOTPRINTS[slug] ?? []}
			{edition} />
	{:else if CARD_GROUPS.includes(asset.group)}
		<article
			class="rg-gallery-entry__frame"
			aria-label={`${asset.name} card`}>
			<h3>{asset.name}</h3>
			<div class="rg-gallery-entry__body">
				<img
					src={art}
					alt={`${asset.name} artwork`}
					loading="lazy" />
				<p>
					{spaceTile
						? describeEffects(spaceTile.benefit)
						: 'Rules text pending'}
				</p>
			</div>
			<div class="rg-gallery-entry__foot"><span>{edition}</span></div>
		</article>
	{:else}
		<div class="rg-gallery-entry__asset">
			<img
				src={art}
				alt={`${asset.name} artwork`}
				loading="lazy" />
		</div>
	{/if}
	<figcaption>
		<strong>{asset.name}</strong><span>{edition} · {asset.id}</span>
	</figcaption>
</figure>

<style>
	.rg-gallery-entry {
		min-width: 0;
		margin: 0;
		display: grid;
		justify-items: start;
		align-content: start;
		gap: 10px;
	}
	.rg-gallery-entry__probe {
		position: absolute;
		width: 1px;
		height: 1px;
		opacity: 0;
		pointer-events: none;
	}
	.rg-gallery-entry__slot {
		width: min(100%, 319px);
		min-height: 180px;
		display: grid;
		place-content: center;
		gap: 8px;
		padding: 20px;
		text-align: center;
		color: var(--muted);
		background: var(--control);
		border: 1px solid var(--line-strong);
	}
	.rg-gallery-entry__slot strong {
		color: var(--text);
		font: 700 19px/1.2 var(--font-title);
	}
	.rg-gallery-entry__pending {
		margin: 0;
		color: var(--card-note);
		font-size: 14px;
	}
	.rg-gallery-entry__frame {
		width: 319px;
		max-width: 100%;
		margin: 0;
		color: var(--card-text);
		background: var(--card-paper) url('../styles/card-paper-noise.svg')
			repeat;
		border: 2px solid var(--card-line-strong);
		box-shadow: 0 10px 26px var(--card-shadow-strong);
	}
	.rg-gallery-entry__frame h3 {
		margin: 0;
		min-height: 49px;
		display: flex;
		align-items: center;
		padding: 8px 12px;
		color: var(--card-title);
		font: 700 21px/1 var(--font-title);
		background-image:
			url('../styles/card-paper-noise.svg'),
			linear-gradient(
				90deg,
				var(--card-band-start),
				var(--card-band-middle) 57%,
				var(--card-band-end)
			);
		border-bottom: 1px solid var(--card-line-strong);
	}
	.rg-gallery-entry__body {
		display: grid;
		gap: 12px;
		padding: 12px;
	}
	.rg-gallery-entry__body img {
		display: block;
		width: 160px;
		height: 160px;
		image-rendering: pixelated;
		box-shadow:
			0 0 0 1px var(--card-line),
			0 0 0 3px var(--card-text);
	}
	.rg-gallery-entry__body p {
		margin: 0;
		padding: 10px 8px;
		background: var(--card-raised);
		border: 1px solid var(--card-line-soft);
		font: 400 15px/1.4 var(--font-body);
	}
	.rg-gallery-entry__foot {
		min-height: 38px;
		display: flex;
		align-items: center;
		padding: 7px 12px;
		border-top: 1px solid var(--card-line);
	}
	.rg-gallery-entry__foot span {
		padding: 2px 6px;
		border: 1px solid var(--card-expansion);
		font: 700 10px/1 var(--font-body);
	}
	.rg-gallery-entry__asset {
		width: min(100%, 220px);
		min-height: 180px;
		display: grid;
		place-items: center;
		padding: 16px;
		background: var(--control);
	}
	.rg-gallery-entry__asset img {
		display: block;
		max-width: 100%;
		max-height: 180px;
		image-rendering: pixelated;
	}
	figcaption {
		display: grid;
		gap: 2px;
		max-width: 425px;
		color: var(--muted);
		font-size: 12px;
	}
	figcaption strong {
		color: var(--text);
		font-size: 14px;
	}
</style>
