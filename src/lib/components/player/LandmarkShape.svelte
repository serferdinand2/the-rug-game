<!-- A landmark's footprint drawn as an SVG shape: its picture clipped to the covered plots and outlined, or the plain plots as a card prints them (#110). -->
<script module>
	/**
	 * Properties of the LandmarkShape component itself.
	 * @typedef {Object} LandmarkShapeOwnProps
	 * @property {string} [id] - The landmark's slug, such as 'lighthouse'; picks its picture, so a shape with its picture needs it
	 * @property {readonly string[]} footprint - Its footprint as printed, such as ['XX', 'XX']
	 * @property {number} [rotation=0] - Quarter turns clockwise, 0–3
	 * @property {number} [plotSize] - The size of one plot in pixels; without it the shape fills its box
	 * @property {number} [gap=0] - Space between neighbouring plots in pixels, with plotSize; for a shape without its picture
	 * @property {boolean} [picture=true] - Draw the landmark's picture inside the shape; false leaves the plain plots
	 * @property {boolean} [plots=false] - Outline every plot rather than only the shape's border, so the plots can be counted
	 * @property {string} [color='var(--gold)'] - The outline colour, as a token reference
	 * @property {SVGSVGElement} [element] - Bindable: the drawn svg, such as for a drag image
	 * @property {string} [tint] - The colour under the picture, as a token reference; by default a quarter of the outline colour over the raised surface
	 */

	/**
	 * Properties for the LandmarkShape component, including any attributes for its root svg.
	 * @typedef {LandmarkShapeOwnProps & import('svelte/elements').SVGAttributes<SVGSVGElement>} LandmarkShapeProps
	 *
	 * @example
	 * <LandmarkShape
	 *   id="academy"
	 *   footprint={FOOTPRINTS.academy}
	 *   rotation={1}
	 *   plotSize={20}
	 *   color="var(--science)"
	 * />
	 */
</script>

<script>
	import { rotateFootprint } from '../../capital.js';
	import {
		fillPath,
		outlinePath,
		pictureTransform,
	} from '../../placement.js';
	import { artUrl } from '../../ui.js';

	/** @type {LandmarkShapeProps} */
	let {
		id,
		footprint,
		rotation = 0,
		plotSize,
		gap = 0,
		picture = true,
		plots = false,
		color = 'var(--gold)',
		tint,
		element = $bindable(),
		...attr
	} = $props();

	const uid = $props.id();

	let shape = $derived(rotateFootprint(footprint, rotation));
	let rows = $derived(shape.length);
	let cols = $derived(shape[0].length);
	let spacing = $derived(plotSize ? gap / plotSize : 0);
	let fill = $derived(fillPath(shape, spacing));
	let outline = $derived(plots ? fill : outlinePath(shape));
</script>

<svg
	bind:this={element}
	aria-hidden="true"
	{...attr}
	class="rg-landmark-shape {attr.class ? attr.class : ''}"
	viewBox="0 0 {cols + (cols - 1) * spacing} {rows + (rows - 1) * spacing}"
	preserveAspectRatio="none"
	style:width={plotSize
		? `${cols * plotSize + (cols - 1) * gap}px`
		: undefined}
	style:height={plotSize
		? `${rows * plotSize + (rows - 1) * gap}px`
		: undefined}
	style:--rg-landmark-shape-color={color}
	style:--rg-landmark-shape-tint={tint}>
	<defs>
		<clipPath id="{uid}-clip">
			<path d={fill} />
		</clipPath>
	</defs>
	<path
		class="rg-landmark-shape--fill"
		d={fill} />
	{#if picture && id}
		<image
			class="rg-landmark-shape--picture"
			href={artUrl(`landmark/${id}`)}
			width={footprint[0].length}
			height={footprint.length}
			preserveAspectRatio="none"
			transform={pictureTransform(footprint, rotation)} />
	{/if}
	<path
		class="rg-landmark-shape--outline"
		d={outline}
		clip-path="url(#{uid}-clip)"
		vector-effect="non-scaling-stroke" />
</svg>

<style>
	.rg-landmark-shape {
		display: block;
		flex: none;
		width: 100%;
		height: 100%;
		overflow: visible;
		pointer-events: none;
	}

	/* The fill takes the pointer, so a piece on the capital can be grabbed by its plots only. */
	.rg-landmark-shape--fill {
		fill: var(
			--rg-landmark-shape-tint,
			color-mix(
				in srgb,
				var(--rg-landmark-shape-color) 25%,
				var(--raised)
			)
		);
		pointer-events: auto;
	}

	.rg-landmark-shape--picture {
		image-rendering: pixelated;
		pointer-events: none;
	}

	/* Twice the border, clipped to the plots, leaves the border inside the shape. */
	.rg-landmark-shape--outline {
		fill: none;
		stroke: var(--rg-landmark-shape-color);
		stroke-width: calc(var(--border-thick) * 2);
		stroke-linecap: square;
		pointer-events: none;
		transition: stroke var(--duration-fast) var(--ease);
	}
</style>
