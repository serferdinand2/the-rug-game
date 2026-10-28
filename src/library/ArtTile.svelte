<!-- One picture on the library page: a drawing at 2× and 4× (landmarks under their plot grid), drawn once it comes near the view, or an empty slot naming the issue that draws it. -->
<script module>
	/**
	 * Properties of the ArtTile component itself.
	 * @typedef {Object} ArtTileOwnProps
	 * @property {string} name - The caption, such as 'Lighthouse' or 'sky: night'
	 * @property {string} [id] - The asset id, such as 'landmark/lighthouse'; scene parts have none
	 * @property {() => Promise<import('./art.js').Picture>} [load] - Draws the picture, called once the tile comes near the view; undefined when the asset isn't drawn yet
	 * @property {import('./art.js').Picture} [picture] - A picture already drawn, shown at once instead of loading one
	 * @property {import('./art.js').PictureSize | null} [size=null] - The picture's size, where it is known before it is drawn, so its placeholder takes the same room
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
	 * <ArtTile name="Lighthouse" id="landmark/lighthouse" load={() => loadPicture('landmark/lighthouse')} size={pictureSize('landmark/lighthouse')} plots={32} />
	 */

	/** Each drawing is shown at these scales. */
	const SCALES = [2, 4];

	/** A tile starts drawing about one screen before it scrolls into view, above or below. */
	const NEAR = '100% 0px';

	/** What each tile waiting for the view does once it comes near. @type {Map<Element, () => void>} */
	const waiting = new Map();

	/** The one observer every waiting tile shares. @type {IntersectionObserver | undefined} */
	let observer;

	/**
	 * Stops waiting for an element.
	 * @param {Element} element
	 */
	function stopWaiting(element) {
		waiting.delete(element);
		observer?.unobserve(element);
	}

	/**
	 * Calls back once, when an element comes near the view.
	 * @param {Element} element
	 * @param {() => void} near
	 * @returns {() => void} Stops waiting
	 */
	function whenNear(element, near) {
		observer ??= new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					const callback = waiting.get(entry.target);
					if (entry.isIntersecting && callback) {
						stopWaiting(entry.target);
						callback();
					}
				}
			},
			{ rootMargin: NEAR }
		);
		waiting.set(element, near);
		observer.observe(element);
		return () => stopWaiting(element);
	}
</script>

<script>
	/** @type {ArtTileProps} */
	let {
		name,
		id,
		load,
		picture,
		size = null,
		plots = null,
		expansion,
		issue,
		example = false,
		...attr
	} = $props();

	/** @type {HTMLElement | undefined} */
	let element = $state();
	/** @type {import('./art.js').Picture | undefined} */
	let loaded = $state();

	let shown = $derived(picture ?? loaded);
	let drawn = $derived(Boolean(load || picture));

	// The picture is drawn only once its tile comes near the view, so the page opens without drawing the art.
	$effect(() => {
		if (!element || !load || shown) {
			return;
		}
		const draw = load;
		let mounted = true;
		const stop = whenNear(element, () => {
			draw().then((result) => {
				if (mounted) {
					loaded = result;
				}
			});
		});
		return () => {
			mounted = false;
			stop();
		};
	});
</script>

<figure
	{...attr}
	bind:this={element}
	class="rg-library-art-tile {attr.class ? attr.class : ''}"
	data-id={id}
	data-drawn={drawn ? 'yes' : 'no'}
	data-loaded={shown ? 'yes' : undefined}>
	{#if shown && 'url' in shown}
		<div class="rg-library-art-tile--pictures">
			{#each SCALES as scale (scale)}
				<span
					class="rg-library-art-tile--picture"
					class:rg-library-art-tile--plots={plots}
					style:--rg-library-art-tile-plot={plots
						? `${plots * scale}px`
						: undefined}>
					<img
						src={shown.url}
						alt={scale === SCALES[0] ? name : ''}
						width={shown.w * scale}
						height={shown.h * scale} />
				</span>
			{/each}
		</div>
	{:else if shown}
		<div class="rg-library-art-tile--slot rg-library-art-tile--broken">
			<b>{name}</b>
			<span>{shown.error}</span>
		</div>
	{:else if drawn && size}
		<div class="rg-library-art-tile--pictures">
			{#each SCALES as scale (scale)}
				<span
					class="rg-library-art-tile--waiting"
					style:width="{size.w * scale}px"
					style:height="{size.h * scale}px"></span>
			{/each}
		</div>
	{:else if drawn}
		<div class="rg-library-art-tile--slot rg-library-art-tile--waiting">
		</div>
	{:else}
		<div class="rg-library-art-tile--slot">
			<span>{id}</span>
			<b>{name}</b>
			{#if expansion}<span>{expansion}</span>{/if}
			{#if issue}<i>#{issue}</i>{/if}
		</div>
	{/if}
	{#if drawn && !(shown && 'error' in shown)}
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

	/* The room a picture takes until it is drawn. */
	.rg-library-art-tile--waiting {
		display: block;
		flex: none;
		background: var(--raised);
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

	.rg-library-art-tile--slot.rg-library-art-tile--waiting {
		border-style: solid;
		border-color: var(--line-soft);
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
