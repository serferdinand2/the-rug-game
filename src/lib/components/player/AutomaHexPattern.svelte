<!-- The complete small-map scan diagram, from the same canonical priority ordering the bot executes. -->
<script module>
	/**
	 * @typedef {Object} AutomaHexPatternOwnProps
	 * @property {number} pattern - The canonical hex-tiebreak pattern, 1–10.
	 * @property {boolean} [showOrder=false] - Show priority numbers for reviewing the canonical ordering.
	 */
	/**
	 * @typedef {AutomaHexPatternOwnProps & import('svelte/elements').SVGAttributes<SVGSVGElement>} AutomaHexPatternProps
	 * @example
	 * <AutomaHexPattern pattern={1} />
	 */
</script>

<script>
	import { hexesByPattern } from '../../engine/automa-map.js';
	import { hexCenter, hexCorner } from '../../hexmap.js';
	/** @type {AutomaHexPatternProps} */
	let { pattern, showOrder = false, ...attr } = $props();
	const markerId = $props.id();
	const radius = 15;
	const hexes = $derived(
		hexesByPattern(pattern).map((key, index) => ({
			key,
			order: index + 1,
			center: hexCenter(key, radius),
			polygon: Array.from({ length: 6 }, (_, corner) =>
				hexCorner(hexCenter(key, radius), corner, radius - 1).join(',')
			).join(' '),
		}))
	);
	const direction = $derived.by(() => {
		const [first, second] = hexes;
		const dx = second.center[0] - first.center[0];
		const dy = second.center[1] - first.center[1];
		const length = Math.hypot(dx, dy);
		return [dx / length, dy / length];
	});
	const rows = $derived.by(() => {
		/** @type {{ key: string, points: number[][] }[]} */
		const groups = [];
		for (const hex of hexes) {
			// A scan row is the line parallel to the first row through this exact map coordinate.
			const key = String(
				Math.round(
					(hex.center[0] * direction[1] -
						hex.center[1] * direction[0]) *
						10000
				) / 10000
			);
			if (groups.at(-1)?.key !== key) groups.push({ key, points: [] });
			groups[groups.length - 1].points.push(hex.center);
		}
		return groups;
	});
	const viewBox = $derived.by(() => {
		const xs = hexes.map((hex) => hex.center[0]);
		const ys = hexes.map((hex) => hex.center[1]);
		const left = Math.min(...xs) - radius * 2;
		const top = Math.min(...ys) - radius * 2;
		return `${left} ${top} ${Math.max(...xs) - left + radius * 2} ${Math.max(...ys) - top + radius * 2}`;
	});
	/** @param {number[][]} points @returns {string} */
	function arrowPoints(points) {
		const first = points[0];
		const last = points[points.length - 1];
		return `${first[0] - direction[0] * radius * 0.65},${first[1] - direction[1] * radius * 0.65} ${last[0] + direction[0] * radius * 0.65},${last[1] + direction[1] * radius * 0.65}`;
	}
</script>

<svg
	{...attr}
	class="rg-automa-hex-pattern {attr.class ?? ''}"
	{viewBox}
	role="img"
	aria-label={`Hex tiebreaker: pattern ${pattern}, starting at ${hexes[0].key}; black arrow first, grey arrows next`}>
	<title>Full small-map hex selection order, pattern {pattern}</title>
	<defs>
		<marker
			id={`${markerId}-first`}
			markerWidth="6"
			markerHeight="6"
			refX="5"
			refY="3"
			orient="auto"
			markerUnits="strokeWidth"
			><path
				d="M 0 0 L 6 3 L 0 6 Z"
				class="rg-automa-hex-pattern--first-fill" /></marker>
		<marker
			id={`${markerId}-next`}
			markerWidth="6"
			markerHeight="6"
			refX="5"
			refY="3"
			orient="auto"
			markerUnits="strokeWidth"
			><path
				d="M 0 0 L 6 3 L 0 6 Z"
				class="rg-automa-hex-pattern--next-fill" /></marker>
	</defs>
	{#each hexes as hex (hex.key)}<polygon
			points={hex.polygon}
			class="rg-automa-hex-pattern--hex"
			class:rg-automa-hex-pattern--start={hex.order === 1}
			><title>Priority {hex.order}: {hex.key}</title></polygon
		>{/each}
	{#if rows.length > 1}<polyline
			class="rg-automa-hex-pattern--next"
			points={rows.map((row) => row.points[0].join(',')).join(' ')}
			marker-end={`url(#${markerId}-next)`} />{/if}
	{#each rows as row, index (row.key)}<polyline
			class="rg-automa-hex-pattern--row"
			class:rg-automa-hex-pattern--first={index === 0}
			points={arrowPoints(row.points)}
			marker-end={`url(#${markerId}-${index === 0 ? 'first' : 'next'})`} />{/each}
	{#if showOrder}{#each hexes as hex (hex.key)}<text
				x={hex.center[0]}
				y={hex.center[1]}>{hex.order}</text
			>{/each}{/if}
</svg>

<style>
	.rg-automa-hex-pattern {
		display: block;
		width: 100%;
		max-width: 290px;
		overflow: visible;
	}
	.rg-automa-hex-pattern--hex {
		fill: var(--card-control);
		stroke: var(--card-line);
		stroke-width: var(--border);
	}
	.rg-automa-hex-pattern--start {
		fill: color-mix(in srgb, var(--card-title) 40%, var(--card-control));
	}
	.rg-automa-hex-pattern--row,
	.rg-automa-hex-pattern--next {
		fill: none;
		stroke: var(--card-slot-border);
		stroke-width: var(--border-thick);
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.rg-automa-hex-pattern--first {
		stroke: var(--card-text);
	}
	.rg-automa-hex-pattern--first-fill {
		fill: var(--card-text);
	}
	.rg-automa-hex-pattern--next-fill {
		fill: var(--card-slot-border);
	}
	.rg-automa-hex-pattern text {
		font: var(--weight-bold) var(--font-size-xs) var(--font-body);
		text-anchor: middle;
		dominant-baseline: central;
		fill: var(--card-text);
		stroke: var(--card-paper);
		stroke-width: var(--border-thick);
		paint-order: stroke;
	}
</style>
