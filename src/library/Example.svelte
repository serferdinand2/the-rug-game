<!-- One state of a component on the library page: the component on its own surface, labelled with its props. -->
<script module>
	/**
	 * Properties of the Example component itself.
	 * @typedef {Object} ExampleOwnProps
	 * @property {string} label - The props that produce this state, such as 'mode="gold" selected'
	 * @property {'surface' | 'chrome' | 'ink'} [surface='surface'] - The background the component sits on in the game
	 * @property {number} [width] - The component's real width at the 1920×1080 reference, in pixels
	 * @property {boolean} [wide=false] - Take a full row, for wide components
	 * @property {import('svelte').Snippet} children - The component in this state
	 */

	/**
	 * Properties for the Example component, including any attributes for its root element.
	 * @typedef {ExampleOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} ExampleProps
	 *
	 * @example
	 * <Example label='mode="primary"' surface="chrome">
	 *   <Button mode="primary">Advance here</Button>
	 * </Example>
	 */
</script>

<script>
	/** @type {ExampleProps} */
	let {
		label,
		surface = 'surface',
		width,
		wide = false,
		children,
		...attr
	} = $props();
</script>

<figure
	{...attr}
	class="rg-library-example {attr.class ? attr.class : ''}"
	class:rg-library-example--wide={wide}>
	<div
		class="rg-library-example--stage rg-library-example--{surface}"
		style:width={width ? `${width}px` : undefined}>
		{@render children()}
	</div>
	<figcaption class="rg-library-example--label">{label}</figcaption>
</figure>

<style>
	.rg-library-example {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		max-width: 100%;
		margin: 0;
	}

	.rg-library-example--wide {
		flex-basis: 100%;
	}

	/* The width is the component's own, so the padding and border go outside it. */
	.rg-library-example--stage {
		box-sizing: content-box;
		position: relative;
		max-width: 100%;
		padding: var(--space-8);
		border: var(--border) dashed var(--line-soft);
	}

	.rg-library-example--surface {
		background: var(--texture) var(--surface);
	}

	.rg-library-example--chrome {
		background: var(--chrome);
	}

	.rg-library-example--ink {
		background: var(--ink);
	}

	.rg-library-example--label {
		align-self: flex-start;
		padding: var(--space-1) var(--space-3);
		background: var(--control);
		color: var(--muted);
		font-size: var(--font-size-xs);
		white-space: pre-wrap;
	}
</style>
