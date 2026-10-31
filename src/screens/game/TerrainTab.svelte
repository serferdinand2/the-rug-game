<!-- The Terrain tab's territory tiles in hand and space tiles. -->
<script module>
	/** @typedef {import('../../lib/area/terrain.js').HeldTerritory} HeldTerritory */
	/** @typedef {import('../../lib/area/terrain.js').SpaceEntry} SpaceEntry */

	/**
	 * What the Terrain tab draws.
	 * @typedef {Object} TerrainTabView
	 * @property {HeldTerritory[]} territories - Territory tiles in hand
	 * @property {SpaceEntry[]} space - Space tiles held or explored
	 */

	/**
	 * A territory tile choice in the player's area.
	 * @typedef {Object} TerrainTabPick
	 * @property {number[]} tiles - Tile ids the player may pick
	 * @property {number | number[] | null} selected - The selected tile or tiles
	 * @property {number[]} [disabled] - Tiles that cannot currently be chosen
	 */

	/**
	 * Properties of the TerrainTab screen part itself.
	 * @typedef {Object} TerrainTabOwnProps
	 * @property {TerrainTabView} terrain - The player's terrain and tiles
	 * @property {TerrainTabPick | null} [tilePick=null] - An active choice for offered territory tiles
	 * @property {Function} [onTerrainTabPick] - Callback fired with the selected tile id
	 */

	/**
	 * Properties for TerrainTab, including any attributes for its root element.
	 * @typedef {TerrainTabOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} TerrainTabProps
	 *
	 * @example
	 * <TerrainTab {terrain} {tilePick} onTerrainTabPick={pick} />
	 */
</script>

<script>
	import { ComponentEvent } from '../../lib/component-event.js';
	import { artUrl } from '../../lib/ui.js';
	import { tileWords } from '../../lib/area/explore.js';
	import TilePicker from '../../lib/components/prompts/TilePicker.svelte';

	/** @type {TerrainTabProps} */
	let { terrain, tilePick = null, onTerrainTabPick, ...attr } = $props();

	let territories = $derived(
		terrain.territories.map((tile) => ({
			...tile,
			label: tileWords(tile.id),
		}))
	);

	/**
	 * Reports a pressed territory tile, so the explore's tile picker follows.
	 * @param {ComponentEvent} event
	 */
	const tilePickerSelectHandler = (event) => {
		if (typeof onTerrainTabPick === 'function') {
			onTerrainTabPick(
				new ComponentEvent(
					{ tile: event.value.tile },
					event.target,
					event.originalEvent
				)
			);
		}
	};
</script>

<div
	{...attr}
	class="rg-terrain-tab {attr.class ? attr.class : ''}">
	<h2 class="rg-player-tabs--title">Territory tiles</h2>
	{#if territories.length}
		<!-- While exploring (#74) or paying tiles (#75), the tiles on offer can be pressed. -->
		<TilePicker
			class="rg-player-tabs--tiles"
			aria-label="Territory tiles in hand"
			size="large"
			tiles={territories}
			pickable={tilePick?.tiles ?? []}
			selected={tilePick?.selected ?? null}
			disabled={tilePick?.disabled ?? []}
			dataIdPrefix="terrain-tile"
			onTilePickerSelect={tilePickerSelectHandler} />
	{:else}
		<p class="rg-player-tabs--note">No territory tiles in hand.</p>
	{/if}
	<h2 class="rg-player-tabs--title">Space tiles</h2>
	{#if terrain.space.length}
		<div class="rg-player-tabs--tiles">
			{#each terrain.space as tile (tile.id)}
				<figure class="rg-player-tabs--space">
					<img
						src={artUrl(tile.art)}
						alt="Space tile {tile.id}"
						width="64"
						height="64" />
					<figcaption>
						{tile.explored ? 'Explored' : 'In hand'}
					</figcaption>
				</figure>
			{/each}
		</div>
	{:else}
		<p class="rg-player-tabs--note">No space tiles.</p>
	{/if}
</div>

<style>
	.rg-terrain-tab {
		display: contents;
	}

	.rg-terrain-tab :global(.rg-player-tabs--tiles) {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-5);
		margin-bottom: var(--space-9);
	}

	.rg-player-tabs--space {
		display: grid;
		justify-items: center;
		gap: var(--space-2);
		margin: 0;
		color: var(--muted);
		font-size: var(--font-size-2xs);
	}

	.rg-player-tabs--space img {
		image-rendering: pixelated;
	}
</style>
