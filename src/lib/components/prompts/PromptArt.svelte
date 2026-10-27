<!-- PromptArt: one picture in a decision prompt: a resource, track, building, landmark, terrain, civilization, tile, card art or a VP badge. -->
<script module>
	/**
	 * One picture a prompt shows.
	 * @typedef {{ kind: 'resource', id: import('../../ui.js').CostSymbol, count: number }
	 *   | { kind: 'track', id: import('../../ui.js').TrackId }
	 *   | { kind: 'building', id: 'market' | 'house' | 'farm' | 'armory' }
	 *   | { kind: 'landmark', id: string }
	 *   | { kind: 'terrain', id: string }
	 *   | { kind: 'civ', id: string }
	 *   | { kind: 'tapestry', id: string }
	 *   | { kind: 'tech', id: string }
	 *   | { kind: 'deck', id: 'tech', count: number }
	 *   | { kind: 'space-tile', id: number }
	 *   | { kind: 'territory', id: number, orient: number }
	 *   | { kind: 'mat', id: number }
	 *   | { kind: 'vp', count: number }} PromptArtItem
	 */

	/**
	 * Properties of the PromptArt component itself.
	 * @typedef {Object} PromptArtOwnProps
	 * @property {PromptArtItem} item - What to draw
	 * @property {'medium' | 'large'} [size='large'] - medium: 24px; large: 48px
	 */

	/**
	 * Properties for the PromptArt component, including any attributes for its root element.
	 * @typedef {PromptArtOwnProps & import('svelte/elements').HTMLAttributes<HTMLSpanElement>} PromptArtProps
	 *
	 * @example
	 * <PromptArt item={{ kind: 'resource', id: 'food', count: 2 }} />
	 * <PromptArt item={{ kind: 'vp', count: 5 }} size="medium" />
	 */
</script>

<script>
	import ResourceIcon from '../ui/ResourceIcon.svelte';
	import TerritoryTile from '../player/TerritoryTile.svelte';
	import { CAPITAL_MATS } from '../../engine/data/capitals.js';
	import { TERRITORY_TILES } from '../../engine/data/territory-tiles.js';
	import { turned } from '../../engine/game.js';
	import { artUrl } from '../../ui.js';

	/** @type {PromptArtProps} */
	let { item, size = 'large', ...attr } = $props();

	let pixels = $derived(size === 'large' ? 48 : 24);

	/** The URL of an item drawn as an image, or null. */
	let source = $derived.by(() => {
		switch (item.kind) {
			case 'track':
			case 'building':
			case 'landmark':
			case 'terrain':
			case 'civ':
			case 'tapestry':
			case 'tech':
			case 'space-tile':
				return artUrl(`${item.kind}/${item.id}`);
			case 'mat':
				return artUrl(
					`capital-mat/${CAPITAL_MATS[item.id - 1].id.toLowerCase()}`
				);
			default:
				return null;
		}
	});

	let tile = $derived(
		item.kind === 'territory' ? TERRITORY_TILES[item.id - 1] : null
	);
</script>

<span
	aria-hidden="true"
	{...attr}
	class="rg-prompt-art rg-prompt-art--{item.kind} rg-prompt-art--{size} {attr.class
		? attr.class
		: ''}">
	{#if item.kind === 'resource'}
		<ResourceIcon
			symbol={item.id}
			size={size === 'large' ? 'large' : 'medium'}
			decorative />
		{#if item.count > 1}
			<b class="rg-prompt-art--count">×{item.count}</b>
		{/if}
	{:else if item.kind === 'territory' && tile}
		<TerritoryTile
			id={item.id}
			corners={turned(tile.corners, item.orient)}
			island={[...tile.island]}
			size={pixels * 0.75} />
	{:else if item.kind === 'vp'}
		<b class="rg-prompt-art--badge">{item.count} VP</b>
	{:else if item.kind === 'deck'}
		<b class="rg-prompt-art--back">Deck · {item.count}</b>
	{:else if source}
		<img
			src={source}
			width={pixels}
			height={pixels}
			alt=""
			draggable="false" />
	{/if}
</span>

<style>
	.rg-prompt-art {
		position: relative;
		display: inline-flex;
		flex: none;
		align-items: center;
		justify-content: center;
	}

	.rg-prompt-art img {
		object-fit: contain;
		image-rendering: pixelated;
	}

	.rg-prompt-art--count {
		position: absolute;
		right: -6px;
		bottom: -4px;
		padding: 0 var(--space-1);
		border: var(--border) solid var(--line);
		border-radius: var(--radius);
		background: var(--ink);
		color: var(--text);
		font-size: var(--font-size-xs);
		line-height: var(--leading-tight);
	}

	.rg-prompt-art--badge {
		padding: var(--space-1) var(--space-3);
		border: var(--border) solid var(--gold);
		border-radius: var(--radius);
		background: color-mix(in srgb, var(--gold) 17%, var(--surface));
		color: var(--gold);
		font-size: var(--font-size-sm);
		white-space: nowrap;
	}

	.rg-prompt-art--back {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-1) var(--space-3);
		border: var(--border) solid var(--card-line);
		border-radius: var(--radius);
		background: var(--card-band-start);
		color: var(--card-title);
		font: var(--weight-title) var(--font-size-sm) / var(--leading-tight)
			var(--font-title);
		white-space: nowrap;
	}

	.rg-prompt-art--large .rg-prompt-art--back {
		min-width: 48px;
		min-height: 48px;
	}
</style>
