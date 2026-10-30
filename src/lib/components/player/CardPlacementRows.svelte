<!-- CardPlacementRows: a card's row of placement squares, in five reviewed layouts: a collection, covered rewards, rolled tracks, once-only track choices and covered history squares (#106). -->
<script module>
	/**
	 * One square in the row. Which fields an item uses depends on the kind:
	 * - collection: `name`, `picture` (greyed until `collected`), `placed` (drawn instead once collected), `large`,
	 *   `facedown` and `gain`;
	 * - covered: `id`, `gain` or `vp` under an outpost, shown when `exposed`;
	 * - tracks: `name` and `picture`, a token on it when `rolled`;
	 * - leaders: `id`, `name` and `picture`, in the player's colour when `used`;
	 * - history: `id`, `gain` or `vp` under the player's token, shown when `exposed`.
	 * @typedef {Object} CardPlacement
	 * @property {string} [id] - Its spot id, for a decision's choices
	 * @property {string} [name] - Its label
	 * @property {string} [picture] - Its artwork URL
	 * @property {string} [placed] - Its artwork once collected
	 * @property {boolean} [large] - A larger piece: an outpost
	 * @property {boolean} [facedown] - A card or tile, lying face down once collected
	 * @property {import('../../ui.js').CostSymbol} [gain] - A resource reward
	 * @property {number} [vp] - A VP reward
	 * @property {boolean} [collected] - Collected (collection)
	 * @property {boolean} [exposed] - Its reward is uncovered (covered, history)
	 * @property {boolean} [rolled] - Rolled this activation (tracks)
	 * @property {boolean} [used] - Already used (leaders)
	 */
	/**
	 * @typedef {Object} CardPlacementRowsOwnProps
	 * @property {'collection' | 'covered' | 'tracks' | 'leaders' | 'history'} kind - The layout
	 * @property {readonly CardPlacement[]} items - The squares, in reading order
	 * @property {number} [perRow=4] - Covered rewards: the squares in a row, with a rule between rows
	 * @property {import('../../ui.js').Seat} [seat] - Whose tokens cover the history squares, for their colour
	 * @property {readonly string[]} [choices=[]] - The spot ids the open decision offers, drawn as buttons
	 * @property {string | null} [picked=null] - The offered spot the player has picked, in gold
	 * @property {Function} [onCardPlacementRowsPick] - Callback fired with the spot id when an offered square is pressed
	 */
	/**
	 * @typedef {CardPlacementRowsOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} CardPlacementRowsProps
	 * @example
	 * <CardPlacementRows
	 *   kind="collection"
	 *   items={[{ name: 'House', picture: '/art/building/house.svg', gain: 'any', collected: true }]} />
	 * <CardPlacementRows
	 *   kind="leaders"
	 *   items={[{ id: 'science', name: 'Science', picture: '/art/track/science.svg', used: true }]}
	 *   choices={['science']}
	 *   onCardPlacementRowsPick={(event) => pick(event.value)} />
	 */
</script>

<script>
	import CardResource from './CardResource.svelte';
	import CardSlot from './CardSlot.svelte';
	import PlayerToken from './PlayerToken.svelte';
	import { ComponentEvent } from '../../component-event.js';
	import { spotChoice } from '../../card-spots.js';
	/** @type {CardPlacementRowsProps} */
	let {
		kind,
		items,
		perRow = 4,
		seat,
		choices = [],
		picked = null,
		onCardPlacementRowsPick,
		...attr
	} = $props();

	/**
	 * A square's pick, reported as the rows' own.
	 * @param {ComponentEvent} event - Its value is the spot id
	 */
	const squarePickHandler = (event) => {
		if (typeof onCardPlacementRowsPick === 'function') {
			onCardPlacementRowsPick(
				new ComponentEvent(
					event.value,
					event.target,
					event.originalEvent
				)
			);
		}
	};

	/**
	 * The CardSlot choice props of an item.
	 * @param {CardPlacement} item
	 */
	function choice(item) {
		return item.id === undefined
			? {}
			: spotChoice(item.id, choices, picked, squarePickHandler);
	}
</script>

{#snippet reward(
	/** @type {CardPlacement} */ item
)}{#if item.vp !== undefined}{`${item.vp} VP`}{:else if item.gain}+ <CardResource
			symbol={item.gain} />{/if}{/snippet}

{#if kind === 'collection'}
	<ol
		{...attr}
		class="rg-card-placement-rows rg-card-placement-rows--collection {attr.class ??
			''}">
		{#each items as item, index (index)}
			<li
				class="rg-card-placement-rows--spot"
				class:rg-card-placement-rows--collected={item.collected}>
				<CardSlot
					size={62}
					class="rg-card-placement-rows--item"
					label={item.name}
					tabindex={0}
					>{#if item.facedown}<span
							class="rg-card-placement-rows--card"
							><img
								class="rg-card-placement-rows--piece"
								src={item.picture}
								alt="" /></span
						>{:else}<img
							class="rg-card-placement-rows--piece"
							class:rg-card-placement-rows--large={item.large}
							class:rg-card-placement-rows--printed={item.placed}
							src={item.picture}
							alt="" />{#if item.placed}<img
								class="rg-card-placement-rows--piece rg-card-placement-rows--large rg-card-placement-rows--played"
								src={item.placed}
								alt="" />{/if}{/if}</CardSlot
				><span class="rg-card-placement-rows--name">{item.name}</span
				>{#if item.gain}<span class="rg-card-placement-rows--gain"
						>+<CardResource symbol={item.gain} /></span
					>{/if}
			</li>
		{/each}
	</ol>
{:else if kind === 'covered'}
	<div
		{...attr}
		class="rg-card-placement-rows rg-card-placement-rows--covered {attr.class ??
			''}"
		style:grid-template-columns={`repeat(${perRow}, 1fr)`}>
		{#each items as item, index (index)}
			{#if index && index % perRow === 0}
				<div
					class="rg-card-placement-rows--divider"
					aria-hidden="true">
				</div>
			{/if}
			<div
				class="rg-card-placement-rows--cover"
				class:rg-card-placement-rows--exposed={item.exposed}>
				<CardSlot
					size={62}
					filled={item.exposed}
					{...choice(item)}
					class="rg-card-placement-rows--space"
					><span
						class="rg-card-placement-rows--reward"
						class:rg-card-placement-rows--vp={item.vp !== undefined}
						>{@render reward(item)}</span
					><img
						class="rg-card-placement-rows--outpost"
						src="/art/piece/outpost.svg"
						alt="" /></CardSlot>
			</div>
		{/each}
	</div>
{:else if kind === 'tracks'}
	<div
		{...attr}
		class="rg-card-placement-rows rg-card-placement-rows--tracks {attr.class ??
			''}">
		{#each items as item, index (index)}
			<div
				class="rg-card-placement-rows--track"
				class:rg-card-placement-rows--rolled={item.rolled}>
				<CardSlot
					size={75}
					class="rg-card-placement-rows--die"
					><img
						class="rg-card-placement-rows--icon"
						src={item.picture}
						alt="" /><PlayerToken
						decorative
						class="rg-card-placement-rows--token" /></CardSlot
				><span>{item.name}</span>
			</div>
		{/each}
	</div>
{:else if kind === 'leaders'}
	<ol
		{...attr}
		class="rg-card-placement-rows rg-card-placement-rows--leaders {attr.class ??
			''}">
		{#each items as item, index (index)}
			<li
				class="rg-card-placement-rows--leader"
				class:rg-card-placement-rows--used={item.used}>
				<CardSlot
					size={75}
					label="{item.id} placement"
					{...choice(item)}
					class="rg-card-placement-rows--choice {item.id !==
						undefined && choices.includes(item.id)
						? 'rg-card-placement-rows--offered'
						: ''}"
					><img
						class="rg-card-placement-rows--fill"
						src={item.picture}
						alt="" /></CardSlot
				><span>{item.name}</span>
			</li>
		{/each}
	</ol>
{:else}
	<div
		{...attr}
		class="rg-card-placement-rows rg-card-placement-rows--history {attr.class ??
			''}">
		{#each items as item, index (index)}<CardSlot
				size={75}
				filled={item.exposed}
				{...choice(item)}
				class="rg-card-placement-rows--square {item.exposed
					? 'rg-card-placement-rows--uncovered'
					: ''}"
				>{@render reward(item)}<PlayerToken
					{seat}
					color="blue"
					class="rg-card-placement-rows--holder"
					decorative /></CardSlot
			>{/each}
	</div>
{/if}

<style>
	/* The collection: six squares, each with its name and gain beneath. */
	.rg-card-placement-rows--collection {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 5px;
		margin: 0;
		padding: 0 12px;
		list-style: none;
	}
	.rg-card-placement-rows--spot {
		display: grid;
		justify-items: center;
		gap: var(--space-2);
	}
	/* CardSlot draws the squares; each layout sets their look and marks. */
	.rg-card-placement-rows--spot :global(.rg-card-placement-rows--item) {
		width: 100%;
		height: auto;
		border: 1px solid var(--card-slot-border);
		background-color: var(--card-slot);
		background-image: url('../../../styles/card-paper-noise.svg');
		background-size: 256px 256px;
		filter: grayscale(1);
		opacity: 0.72;
		transition:
			opacity var(--duration-medium) var(--ease),
			filter var(--duration-medium) var(--ease),
			transform var(--duration-medium) var(--ease-out);
	}
	.rg-card-placement-rows--collected :global(.rg-card-placement-rows--item) {
		border: var(--border) solid var(--player-1);
		box-shadow: var(--glow-current);
		background: color-mix(in srgb, var(--player-1) 12%, var(--ink));
		filter: none;
		opacity: 1;
	}
	.rg-card-placement-rows--piece {
		width: 44px;
		height: 44px;
	}
	.rg-card-placement-rows--large {
		width: 48px;
		height: 48px;
	}
	.rg-card-placement-rows--played,
	.rg-card-placement-rows--collected .rg-card-placement-rows--printed {
		display: none;
	}
	.rg-card-placement-rows--collected .rg-card-placement-rows--played {
		display: block;
	}
	.rg-card-placement-rows--card {
		position: relative;
		display: block;
		width: 38px;
		height: 50px;
		padding: 3px 3px 0;
		background: var(--ink);
		box-shadow: 0 0 0 1px var(--line-strong);
	}
	/* Cards and tiles on the mat lie face down; the owner may look at them (hover or focus). */
	.rg-card-placement-rows--card::after {
		content: '';
		position: absolute;
		inset: 0;
		opacity: 0;
		pointer-events: none;
		background: repeating-linear-gradient(
			45deg,
			color-mix(in srgb, var(--bronze) 42%, var(--ink)) 0 3px,
			var(--control) 3px 6px
		);
		box-shadow: inset 0 0 0 2px
			color-mix(in srgb, var(--bronze) 70%, var(--ink));
		transition: opacity var(--duration-fast) var(--ease);
	}
	.rg-card-placement-rows--collected .rg-card-placement-rows--card::after {
		opacity: 1;
	}
	.rg-card-placement-rows--collected
		:global(
			.rg-card-placement-rows--item:is(:hover, :focus-visible)
				.rg-card-placement-rows--card::after
		) {
		opacity: 0;
	}
	.rg-card-placement-rows--name {
		display: grid;
		place-items: center;
		min-height: 2.3em;
		color: var(--muted);
		font-size: var(--font-size-3xs);
		font-weight: var(--weight-bold);
		line-height: 1.15;
		letter-spacing: 0.03em;
		text-align: center;
		text-transform: uppercase;
	}
	.rg-card-placement-rows--gain {
		--card-resource-center: 0px;
		display: flex;
		align-items: center;
		gap: 4px;
		min-height: 24px;
		padding: 0;
		background-image: url('../../../styles/card-paper-noise.svg');
		background-size: 256px 256px;
		color: var(--muted);
		font-size: var(--font-size-3xs);
		font-weight: var(--weight-bold);
	}

	/* Covered rewards: rows of outposts, each lifted to show its reward. */
	.rg-card-placement-rows--covered {
		display: grid;
		gap: 9px 5px;
		margin: 4px 12px 0;
		padding: 9px 0;
		border-top: 1px solid var(--line-soft);
		border-bottom: 1px solid var(--line-soft);
	}
	.rg-card-placement-rows--divider {
		grid-column: 1 / -1;
		height: 1px;
		margin: 0 7px;
		background: var(--line-soft);
	}
	.rg-card-placement-rows--cover {
		display: grid;
		place-items: center;
		min-width: 0;
	}
	.rg-card-placement-rows--exposed :global(.rg-card-placement-rows--space) {
		background: var(--raised);
	}
	.rg-card-placement-rows--outpost {
		position: relative;
		z-index: 1;
		display: block;
		width: 48px;
		height: 48px;
		image-rendering: pixelated;
	}
	.rg-card-placement-rows--exposed .rg-card-placement-rows--outpost {
		display: none;
	}
	.rg-card-placement-rows--reward {
		--card-resource-height: 24px;
		--card-resource-center: 12px;
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 2px;
		visibility: hidden;
		color: var(--text);
		font: var(--weight-regular) var(--font-size-2xs) / 1.15 var(--font-body);
		text-align: center;
		white-space: nowrap;
	}
	.rg-card-placement-rows--vp {
		font-weight: var(--weight-bold);
	}
	.rg-card-placement-rows--exposed .rg-card-placement-rows--reward {
		visibility: visible;
	}

	/* Rolled tracks: four die faces, a token on each rolled one. */
	.rg-card-placement-rows--tracks {
		display: grid;
		grid-template-columns: repeat(4, 75px);
		justify-content: space-between;
		margin: 4px 12px 12px;
	}
	.rg-card-placement-rows--track {
		display: grid;
		justify-items: center;
		gap: 5px;
		color: var(--muted);
		font: var(--weight-bold) var(--font-size-3xs) / 1.2 var(--font-body);
		text-align: center;
		text-transform: uppercase;
	}
	.rg-card-placement-rows--track
		:global(.rg-card-placement-rows--die::after) {
		content: '×';
		position: absolute;
		right: 5px;
		bottom: 1px;
		color: var(--card-die-number);
		font: var(--weight-bold) var(--font-size-card-die) / var(--leading-none)
			var(--font-body);
	}
	.rg-card-placement-rows--icon {
		width: 43px;
		height: 43px;
		filter: grayscale(1);
		opacity: 0.7;
	}
	/* The reviewed token is the track icon's size and grey, as the icon's rule always drew it. */
	.rg-card-placement-rows--track :global(.rg-card-placement-rows--token) {
		display: none;
		position: absolute;
		z-index: 1;
		width: 43px;
		height: 43px;
		filter: grayscale(1);
		opacity: 0.7;
	}
	.rg-card-placement-rows--rolled :global(.rg-card-placement-rows--token) {
		display: block;
	}

	/* Once-only track choices: greyed until used. */
	.rg-card-placement-rows--leaders {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 6px;
		margin: 0;
		padding: 0 12px;
		list-style: none;
	}
	.rg-card-placement-rows--leader {
		display: grid;
		justify-items: center;
		align-content: start;
		gap: 6px;
		min-width: 0;
		color: var(--muted);
		font: var(--weight-bold) var(--font-size-3xs) / 1.1 var(--font-body);
		text-align: center;
		text-transform: uppercase;
	}
	.rg-card-placement-rows--leader :global(.rg-card-placement-rows--choice) {
		width: 100%;
		aspect-ratio: 1;
		padding: 12px;
		background: var(--card-slot);
		border: 1px solid var(--card-slot-border);
		filter: grayscale(1);
		opacity: 0.72;
		image-rendering: pixelated;
	}
	/* A track the decision offers drops the unused grey, which would grey its green outline too (#78). */
	.rg-card-placement-rows--leader :global(.rg-card-placement-rows--offered) {
		filter: none;
		opacity: 1;
	}
	.rg-card-placement-rows--used :global(.rg-card-placement-rows--choice) {
		background: var(--card-filled-slot);
		border: 2px solid var(--player-1);
		filter: none;
		opacity: 1;
		box-shadow: var(--glow-current);
	}
	.rg-card-placement-rows--fill {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	/* History squares: rewards under the player's tokens, uncovered as they are given away. */
	.rg-card-placement-rows--history {
		display: grid;
		grid-template-columns: repeat(2, 75px);
		justify-content: center;
		gap: 8px;
		margin: 2px 12px 12px;
	}
	.rg-card-placement-rows--history :global(.rg-card-placement-rows--square) {
		--card-resource-height: 24px;
		--card-resource-center: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 2px;
		color: var(--card-text);
		font: var(--weight-bold) var(--font-size-base) / var(--leading-none)
			var(--font-body);
	}
	.rg-card-placement-rows--history
		:global(.rg-card-placement-rows--uncovered) {
		background: var(--card-filled-slot);
	}
	.rg-card-placement-rows--history :global(.rg-card-placement-rows--holder) {
		position: absolute;
		width: 35px;
		height: 35px;
	}
	.rg-card-placement-rows--history
		:global(
			.rg-card-placement-rows--uncovered .rg-card-placement-rows--holder
		) {
		display: none;
	}
</style>
