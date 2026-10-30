<!-- CardPathGrid: a grid of 75 px reward squares joined by the legal links a token may follow, column by column, from a start token beneath (#106). -->
<script module>
	/**
	 * One reward square: a resource after its +, a picture with its name, or words.
	 * @typedef {Object} CardPathSpace
	 * @property {string} id - Its spot id, such as 'c2r1'
	 * @property {import('../../ui.js').CostSymbol} [gain] - A resource
	 * @property {string} [picture] - An artwork URL, drawn above `text`
	 * @property {string} [text] - Words
	 */
	/**
	 * @typedef {Object} CardPathGridOwnProps
	 * @property {readonly string[]} heads - Each column's heading, left to right; their number is the grid's width
	 * @property {readonly CardPathSpace[]} spaces - The squares row by row, top left first
	 * @property {readonly (readonly [string, string])[]} [links=[]] - The legal moves, each from a square to one in the next column
	 * @property {string | null} [current=null] - Where the token is: a square's id, 'start', or null on the unmarked card;
	 *   on a square, that square takes the player's colour and the start token fades
	 * @property {string} [start=''] - The words beside the start token
	 * @property {import('../../ui.js').Seat} [seat] - Whose token it is, for its colour
	 * @property {readonly string[]} [choices=[]] - The squares the open decision offers, drawn as buttons
	 * @property {string | null} [picked=null] - The offered square the player has picked, in gold
	 * @property {Function} [onCardPathGridPick] - Callback fired with the square's id when an offered square is pressed
	 */
	/**
	 * @typedef {CardPathGridOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} CardPathGridProps
	 * @example
	 * <CardPathGrid
	 *   heads={['1st move', '2nd']}
	 *   spaces={[{ id: 'c1r1', gain: 'worker' }, { id: 'c2r1', picture: '/art/building/farm.svg', text: 'Farm' }]}
	 *   links={[['c1r1', 'c2r1']]}
	 *   current="c1r1"
	 *   start="Start at the left."
	 *   choices={['c2r1']}
	 *   onCardPathGridPick={(event) => pick(event.value)} />
	 */
</script>

<script>
	import CardResource from './CardResource.svelte';
	import CardSlot from './CardSlot.svelte';
	import PlayerToken from './PlayerToken.svelte';
	import { ComponentEvent } from '../../component-event.js';
	import { spotChoice } from '../../card-spots.js';
	/** @type {CardPathGridProps} */
	let {
		heads,
		spaces,
		links = [],
		current = null,
		start = '',
		seat,
		choices = [],
		picked = null,
		onCardPathGridPick,
		...attr
	} = $props();

	/** The links' drawing is 401 units wide, the squares 75 and 7 apart, as the grid lays them out. */
	const WIDTH = 401;
	const SQUARE = 75;
	const ROW_STEP = 82;
	const columns = $derived(heads.length);
	const rows = $derived(Math.ceil(spaces.length / columns));
	/** One path per gap between columns, each joining the squares its links leave from and reach. */
	const paths = $derived(
		Array.from({ length: columns - 1 }, (_, gap) =>
			links
				.filter(([from]) => columnOf(from) === gap)
				.map(([from, to]) => {
					const step = (WIDTH - SQUARE) / (columns - 1);
					const x1 = round(SQUARE + gap * step);
					const x2 = round((gap + 1) * step);
					return `M${x1} ${centre(from)}L${x2} ${centre(to)}`;
				})
				.join(' ')
		)
	);

	/**
	 * A square's pick, reported as the grid's own.
	 * @param {ComponentEvent} event - Its value is the square's id
	 */
	const spacePickHandler = (event) => {
		if (typeof onCardPathGridPick === 'function') {
			onCardPathGridPick(
				new ComponentEvent(
					event.value,
					event.target,
					event.originalEvent
				)
			);
		}
	};

	/**
	 * A square's column, from 0.
	 * @param {string} id
	 * @returns {number}
	 */
	function columnOf(id) {
		return spaces.findIndex((space) => space.id === id) % columns;
	}

	/**
	 * The height of a square's middle in the links' drawing.
	 * @param {string} id
	 * @returns {number}
	 */
	function centre(id) {
		const row = Math.floor(
			spaces.findIndex((space) => space.id === id) / columns
		);
		return SQUARE / 2 + row * ROW_STEP;
	}

	/**
	 * A coordinate to two decimals.
	 * @param {number} value
	 * @returns {number}
	 */
	function round(value) {
		return Math.round(value * 100) / 100;
	}
</script>

<div
	{...attr}
	class="rg-card-path-grid {attr.class ?? ''}">
	<div
		class="rg-card-path-grid--head"
		style:grid-template-columns={`repeat(${columns}, 75px)`}>
		{#each heads as head, index (index)}<span>{head}</span>{/each}
	</div>
	<div
		class="rg-card-path-grid--grid"
		style:grid-template-columns={`repeat(${columns}, 75px)`}
		style:grid-template-rows={`repeat(${rows}, 75px)`}>
		<svg
			class="rg-card-path-grid--links"
			viewBox="0 0 {WIDTH} {rows * ROW_STEP - 7}"
			preserveAspectRatio="none"
			aria-hidden="true">
			{#each paths as d, index (index)}
				<path {d}></path>
			{/each}
		</svg>
		{#each spaces as space (space.id)}
			<CardSlot
				size={75}
				filled={current === space.id}
				{...spotChoice(space.id, choices, picked, spacePickHandler)}
				class="rg-card-path-grid--space {space.gain
					? 'rg-card-path-grid--gain'
					: ''} {current === space.id
					? 'rg-card-path-grid--current'
					: ''}"
				>{#if space.gain}+ <CardResource
						symbol={space.gain} />{:else if space.picture}<img
						src={space.picture}
						alt="" /><span>{space.text}</span
					>{:else}{space.text}{/if}</CardSlot>
		{/each}
	</div>
	<div class="rg-card-path-grid--start">
		<PlayerToken
			{seat}
			decorative
			class="rg-card-path-grid--token {current !== null &&
			current !== 'start'
				? 'rg-card-path-grid--away'
				: ''}" />
		{start}
	</div>
</div>

<style>
	.rg-card-path-grid {
		margin: 4px 12px 0;
	}
	.rg-card-path-grid--head {
		display: grid;
		justify-content: space-between;
		margin-bottom: 6px;
		color: var(--muted);
		font: var(--weight-bold) var(--font-size-3xs) / 1.2 var(--font-body);
		text-align: center;
		text-transform: uppercase;
	}
	.rg-card-path-grid--grid {
		position: relative;
		display: grid;
		justify-content: space-between;
		gap: 7px 0;
	}
	.rg-card-path-grid--links {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}
	.rg-card-path-grid--links path {
		fill: none;
		stroke: var(--line-strong);
		stroke-width: 2;
	}
	/* CardSlot draws the square; the grid sets its type and its marks. */
	.rg-card-path-grid--grid :global(.rg-card-path-grid--space) {
		--card-resource-height: 24px;
		--card-resource-center: 12px;
		padding: 5px;
		color: var(--text);
		font: var(--weight-regular) var(--font-size-2xs) / 1.15 var(--font-body);
		text-align: center;
	}
	.rg-card-path-grid--grid :global(.rg-card-path-grid--gain) {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 2px;
		white-space: nowrap;
	}
	.rg-card-path-grid--grid :global(.rg-card-path-grid--space > img) {
		width: 32px;
		height: 32px;
		image-rendering: pixelated;
	}
	.rg-card-path-grid--grid :global(.rg-card-path-grid--current) {
		box-shadow: var(--glow-current);
	}
	.rg-card-path-grid--start {
		display: flex;
		align-items: center;
		gap: 7px;
		margin-top: 8px;
		color: var(--muted);
		font: var(--weight-bold) var(--font-size-2xs) / 1.2 var(--font-body);
	}
	.rg-card-path-grid--start :global(.rg-card-path-grid--token) {
		width: 32px;
		height: 32px;
	}
	.rg-card-path-grid--start :global(.rg-card-path-grid--away) {
		opacity: 0.38;
	}
</style>
