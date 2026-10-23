<!-- One picture on the library page: a drawing at 2× and 4× (landmarks under their plot grid), or an empty slot naming the issue that draws it. -->
<script module>
	/**
	 * Properties of the ArtTile component itself.
	 * @typedef {Object} ArtTileOwnProps
	 * @property {string} name - The caption, such as 'Lighthouse' or 'sky: night'
	 * @property {string} [id] - The asset id, such as 'landmark/lighthouse'; scene parts have none
	 * @property {import('./art.js').Picture} [picture] - The drawing; undefined when the asset isn't drawn yet
	 * @property {number | null} [plots=null] - Pixels per capital plot, to lay the plot grid over a landmark
	 * @property {string} [expansion] - The expansion's name, for lists that mix them
	 * @property {number} [issue] - The art issue that draws it, shown on an empty slot
	 * @property {boolean} [example=false] - This picture demonstrates a composition rather than a fixed game mat
	 */

	/**
	 * Properties for the ArtTile component, including any attributes for its root element.
	 * @typedef {ArtTileOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} ArtTileProps
	 *
	 * @example
	 * <ArtTile name="Lighthouse" id="landmark/lighthouse" picture={PICTURES.get('landmark/lighthouse')} plots={32} />
	 */

	/** Each drawing is shown at these scales. */
	const SCALES = [2, 4];
</script>

<script>
	/** @type {ArtTileProps} */
	let {
		name,
		id,
		picture,
		plots = null,
		expansion,
		issue,
		example = false,
		...attr
	} = $props();
</script>

<figure
	{...attr}
	class="rg-library-art-tile {attr.class ? attr.class : ''}"
	data-id={id}
	data-drawn={picture && 'url' in picture ? 'yes' : 'no'}>
	{#if picture && 'url' in picture}
		<div class="rg-library-art-tile--pictures">
			{#each SCALES as scale (scale)}
				<span
					class="rg-library-art-tile--picture"
					class:rg-library-art-tile--plots={plots}
					style:--rg-library-art-tile-plot={plots
						? `${plots * scale}px`
						: undefined}>
					<img
						src={picture.url}
						alt={scale === SCALES[0] ? name : ''}
						width={picture.w * scale}
						height={picture.h * scale} />
				</span>
			{/each}
		</div>
	{:else if picture}
		<div class="rg-library-art-tile--slot rg-library-art-tile--broken">
			<b>{name}</b>
			<span>{picture.error}</span>
		</div>
	{:else}
		<div class="rg-library-art-tile--slot">
			<span>{id}</span>
			<b>{name}</b>
			{#if expansion}<span>{expansion}</span>{/if}
			{#if issue}<i>#{issue}</i>{/if}
		</div>
	{/if}
	{#if picture && 'url' in picture}
		<figcaption class="rg-library-art-tile--caption">
			<b>{name}</b>
			{#if expansion}<span>{expansion}</span>{/if}
			{#if id}<span>{id}</span>{/if}
			{#if example}<span
					>Example composition. Generate actual mats from terrain
					tiles for each game.</span
				>{/if}
		</figcaption>
	{/if}
</figure>

<style>
	.rg-library-art-tile {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		max-width: 100%;
		margin: 0;
		padding: var(--space-5);
		border: var(--border) solid var(--line-soft);
		background: var(--chrome);
	}

	.rg-library-art-tile--pictures {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: var(--space-5);
	}

	.rg-library-art-tile--picture {
		position: relative;
		display: block;
		/* A checkerboard shows which pixels are transparent. */
		background: repeating-conic-gradient(
				var(--raised) 0 25%,
				var(--control) 0 50%
			)
			0 0 / 16px 16px;
	}

	.rg-library-art-tile--picture img {
		display: block;
		max-width: none;
		image-rendering: pixelated;
	}

	.rg-library-art-tile--plots {
		outline: var(--border) solid
			color-mix(in srgb, var(--gold) 55%, transparent);
	}

	.rg-library-art-tile--plots::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		background-image:
			linear-gradient(
				color-mix(in srgb, var(--gold) 40%, transparent) 1px,
				transparent 1px
			),
			linear-gradient(
				90deg,
				color-mix(in srgb, var(--gold) 40%, transparent) 1px,
				transparent 1px
			);
		background-size: var(--rg-library-art-tile-plot)
			var(--rg-library-art-tile-plot);
	}

	.rg-library-art-tile--caption {
		display: flex;
		flex-direction: column;
		color: var(--text);
		font-size: var(--font-size-sm);
	}

	.rg-library-art-tile--caption span {
		color: var(--muted);
		font-size: var(--font-size-xs);
	}

	.rg-library-art-tile--slot {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		width: 128px;
		height: 128px;
		padding: var(--space-3);
		border: var(--border-thick) dashed var(--line);
		color: var(--muted);
		font-size: var(--font-size-3xs);
		text-align: center;
		overflow-wrap: anywhere;
	}

	.rg-library-art-tile--slot b {
		color: var(--text);
		font-size: var(--font-size-xs);
		font-weight: var(--weight-regular);
	}

	.rg-library-art-tile--slot i {
		color: var(--gold);
		font-style: normal;
	}

	.rg-library-art-tile--broken {
		width: 256px;
		border-color: var(--danger);
		color: color-mix(in srgb, var(--danger) 60%, var(--text));
	}
</style>
