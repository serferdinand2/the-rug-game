<!-- One pointed space on an advancement track: its name, benefit, bonus, landmark and number, with hover and the gold selected outline. -->
<script module>
	/**
	 * Properties of the TrackSpace component itself.
	 * @typedef {Object} TrackSpaceOwnProps
	 * @property {import('../../ui.js').TrackId} track - The track, which sets the colours
	 * @property {number} space - The space number, 1–12; space 1 has a flat left edge, space 12 a square finish line
	 * @property {string} name - The space's name, such as 'Ships'
	 * @property {string} [landmark] - The landmark the first player here takes, such as 'Lighthouse'
	 * @property {import('../../glyphs.js').Glyph[]} [benefit=[]] - The benefit's symbols, drawn under the name (#59)
	 * @property {import('../../glyphs.js').BonusGlyphs | null} [bonus=null] - The bonus's price and gain, drawn in a small box under the benefit
	 * @property {string} [words=''] - The benefit and bonus in words, for the label and the tooltip
	 * @property {boolean} [selected=false] - Draw the gold outline; sets aria-pressed
	 * @property {boolean} [available=false] - The viewer can advance to this space: a green outline, named in the label; selected wins visually
	 * @property {Function} [onTrackSpaceClick] - Callback fired with { track, space } when the space is chosen
	 * @property {Function} [onTrackSpaceHover] - Callback fired with { track, space, hovering } when the pointer or keyboard focus arrives or leaves
	 */

	/**
	 * Properties for the TrackSpace component, including any attributes for its root button.
	 * @typedef {TrackSpaceOwnProps & import('svelte/elements').HTMLButtonAttributes} TrackSpaceProps
	 *
	 * @example
	 * <TrackSpace
	 *   track="exploration"
	 *   space={4}
	 *   name="Navigation"
	 *   landmark="Lighthouse"
	 *   benefit={[{ kind: 'word', text: 'Tile', count: 1 }, { kind: 'word', text: 'Explore', count: 1 }]}
	 *   words="Gain 1 territory tile, then explore."
	 *   selected
	 *   onTrackSpaceClick={(event) => select(event.value)}
	 * />
	 */
</script>

<script>
	import { ComponentEvent } from '../../component-event.js';
	import { SPACE_COUNT, outlinePath } from '../../track-shape.js';
	import { artUrl, trackColor } from '../../ui.js';
	import CardSymbol from '../ui/CardSymbol.svelte';
	import ExplorationFace from './ExplorationFace.svelte';

	/** @type {TrackSpaceProps} */
	let {
		track,
		space,
		name,
		landmark,
		benefit = [],
		bonus = null,
		words = '',
		selected = false,
		available = false,
		onTrackSpaceClick,
		onTrackSpaceHover,
		...attr
	} = $props();

	// Whether keyboard focus announced a hover that its blur must end.
	let focusHovering = false;

	let width = $state(0);
	let height = $state(0);

	let first = $derived(space === 1);
	let last = $derived(space === SPACE_COUNT);
	let path = $derived(outlinePath(width, height, { first, last }));
	let label = $derived(
		`${name}, ${track} space ${space}${landmark ? `, landmark ${landmark}` : ''}${available ? ', available' : ''}${words ? `. ${words}` : ''}`
	);
	const militaryPlusBefore = /** @type {Record<number, number>} */ ({
		4: 1,
		5: 1,
		6: 1,
		9: 1,
		10: 3,
		12: 2,
	});
	let displayedBenefit = $derived(
		track === 'technology' &&
			benefit.some(
				(glyph) => glyph.kind === 'word' && glyph.text === 'May refresh'
			)
			? benefit.flatMap((glyph, index) =>
					index > 0 &&
					glyph.kind === 'word' &&
					glyph.text === 'May refresh'
						? [
								/** @type {import('../../glyphs.js').Glyph} */ ({
									kind: 'plus',
								}),
								glyph,
							]
						: [glyph]
				)
			: track === 'military' && militaryPlusBefore[space] !== undefined
				? benefit.flatMap((glyph, index) =>
						index === militaryPlusBefore[space]
							? [
									/** @type {import('../../glyphs.js').Glyph} */ ({
										kind: 'plus',
									}),
									glyph,
								]
							: [glyph]
					)
				: benefit
	);
	let hasTrackProgress = $derived(
		benefit.some(
			(glyph) =>
				glyph.kind === 'word' &&
				['Advance', 'May advance', 'Regress'].includes(glyph.text)
		)
	);

	/**
	 * @param {MouseEvent} event
	 */
	const clickHandler = (event) => {
		if (typeof onTrackSpaceClick === 'function') {
			const target = /** @type {HTMLButtonElement} */ (
				event.currentTarget
			);
			onTrackSpaceClick(
				new ComponentEvent({ track, space }, target, event)
			);
		}
	};

	/**
	 * @param {PointerEvent} event
	 */
	const pointerenterHandler = (event) => {
		reportHover(event, true);
	};

	/**
	 * @param {PointerEvent} event
	 */
	const pointerleaveHandler = (event) => {
		reportHover(event, false);
	};

	/**
	 * Keyboard focus previews like hovering; a click also focuses the button, but the pointer has already reported it.
	 * @param {FocusEvent} event
	 */
	const focusHandler = (event) => {
		const target = /** @type {HTMLButtonElement} */ (event.currentTarget);
		if (target.matches(':focus-visible')) {
			focusHovering = true;
			reportHover(event, true);
		}
	};

	/**
	 * @param {FocusEvent} event
	 */
	const blurHandler = (event) => {
		if (focusHovering) {
			focusHovering = false;
			reportHover(event, false);
		}
	};

	/**
	 * @param {Event} event
	 * @param {boolean} hovering
	 */
	function reportHover(event, hovering) {
		if (typeof onTrackSpaceHover === 'function') {
			const target = /** @type {HTMLButtonElement} */ (
				event.currentTarget
			);
			onTrackSpaceHover(
				new ComponentEvent({ track, space, hovering }, target, event)
			);
		}
	}

	/** @param {string} word */
	function iconForWord(word) {
		return (
			/** @type {Record<string, string>} */ ({
				Tile: 'territory-tile',
				Territory: 'territory-tile',
				'Space tile': 'space-tile',
				Tech: 'tech-card',
				Civilization: 'civilization-card',
				'Science die': 'science-die',
				Explore: 'explore',
				'Explore anywhere': 'explore-anywhere',
				'Explore space': 'explore-space',
				Tapestry: 'tapestry-card',
				'Play tapestry': 'tapestry-card',
				Conquer: 'piece/outpost',
				'Conquer anywhere': 'piece/outpost',
				Invent: 'invent',
			})[word] ?? ''
		);
	}
</script>

{#snippet symbol(/** @type {import('../../glyphs.js').Glyph} */ glyph)}
	{#if glyph.kind === 'resource' || glyph.kind === 'building'}
		<span class="rg-track-space--art rg-track-space--{glyph.kind}">
			<img
				src={artUrl(
					glyph.kind === 'resource'
						? `resource-24/${glyph.id}`
						: `building/${glyph.id}`
				)}
				alt=""
				draggable="false" />
			{#if glyph.count > 1}
				<b class="rg-track-space--count">×{glyph.count}</b>
			{/if}
		</span>
	{:else if glyph.kind === 'track'}
		<img
			class="rg-track-space--track"
			src={artUrl(`track/${glyph.id}`)}
			alt=""
			draggable="false" />
	{:else if glyph.kind === 'word'}
		{#if glyph.text === 'Advance' || glyph.text === 'May advance' || glyph.text === 'Regress'}
			<span
				class="rg-track-space--direction"
				class:rg-track-space--crossed={glyph.cross}
				>{glyph.text === 'Regress' ? '↶' : '↷'}{#if glyph.count > 1}<b
						>×{glyph.count}</b
					>{/if}{#if glyph.text === 'May advance'}<small>may</small
					>{/if}</span>
		{:else if glyph.text === 'Upgrade'}
			<span
				class="rg-track-space--upgrade"
				aria-label="Upgrade technology"
				><svg
					class="rg-track-space--up-arrow"
					viewBox="0 0 18 24"
					aria-hidden="true"
					><path
						fill="currentColor"
						d="M9 1 17 10h-5v13H6V10H1z" /></svg
				><CardSymbol
					kind="tech"
					class="rg-track-space--symbol-icon rg-track-space--card-icon"
					decorative /></span>
		{:else if glyph.text === 'Circle benefit' || glyph.text === 'Square benefit'}
			<span
				class="rg-track-space--benefit-shape"
				class:rg-track-space--benefit-shape--circle={glyph.text ===
					'Circle benefit'}
				aria-label={glyph.text}></span>
		{:else if glyph.text === 'Score capital'}
			<span
				class="rg-track-space--capital-score"
				aria-label="Score capital"
				><img
					src={artUrl('symbol/victory-points')}
					alt="" /><span>×</span><img
					src={artUrl('symbol/capital-city')}
					alt="" /></span>
		{:else if glyph.text === 'Restart' || glyph.text === 'Repeat'}
			{#if glyph.text === 'Restart'}<img
					class="rg-track-space--restart-icon"
					src={artUrl('symbol/restart')}
					alt="Restart" />{:else}<span
					class="rg-track-space--repeat"
					aria-label="Repeat a track space"
					><span class="rg-track-space--direction">⟳</span><svg
						viewBox="0 0 24 24"
						aria-hidden="true"
						><path d="M2 3h14l6 9-6 9H2l6-9z" /></svg
					></span
				>{/if}
		{:else if glyph.text === 'May refresh'}
			<span
				class="rg-track-space--refresh"
				aria-label="May refresh">↔</span>
		{:else if iconForWord(glyph.text)}
			<span
				class="rg-track-space--symbol-group"
				class:rg-track-space--invent-stack={glyph.text === 'Invent' &&
					glyph.count > 1}
				class:rg-track-space--crossed={glyph.cross}>
				{#each Array.from( { length: glyph.text === 'Tile' || glyph.text === 'Space tile' || glyph.text === 'Invent' ? glyph.count : 1 } ) as _}
					{#if glyph.text === 'Tech' || glyph.text === 'Invent' || glyph.text === 'Tapestry' || glyph.text === 'Play tapestry' || glyph.text === 'Civilization'}
						<CardSymbol
							kind={glyph.text === 'Tech' ||
							glyph.text === 'Invent'
								? 'tech'
								: glyph.text === 'Civilization'
									? 'civilization'
									: 'tapestry'}
							class="rg-track-space--symbol-icon rg-track-space--card-icon"
							decorative />
					{:else}
						<img
							class="rg-track-space--symbol-icon"
							class:rg-track-space--outpost-icon={glyph.text ===
								'Conquer' || glyph.text === 'Conquer anywhere'}
							src={artUrl(
								iconForWord(glyph.text).includes('/')
									? iconForWord(glyph.text)
									: `symbol/${iconForWord(glyph.text)}`
							)}
							alt=""
							draggable="false" />
					{/if}
				{/each}
				{#if glyph.count > 1 && glyph.text !== 'Tile' && glyph.text !== 'Space tile' && glyph.text !== 'Invent'}<b
						class="rg-track-space--count">×{glyph.count}</b
					>{/if}
			</span>
		{:else}
			<span
				class="rg-track-space--word"
				class:rg-track-space--small-note={glyph.text === 'Both dice' ||
					glyph.text === 'Both dice vs. opponent'}
				class:rg-track-space--crossed={glyph.cross}
				>{glyph.text}{glyph.count > 1 ? ` ×${glyph.count}` : ''}</span>
		{/if}
	{:else if glyph.kind === 'vp'}
		<span class="rg-track-space--vp"
			><img
				src={artUrl('symbol/victory-points')}
				alt=""
				draggable="false" />{#if glyph.count !== null}<b
					>{glyph.count}</b
				>{/if}</span>
	{:else}
		<span
			class="rg-track-space--joint"
			class:rg-track-space--or={glyph.kind === 'or'}
			>{glyph.kind === 'or'
				? '/'
				: glyph.kind === 'plus'
					? '+'
					: '×'}</span>
	{/if}
{/snippet}

<button
	type="button"
	aria-pressed={selected}
	aria-label={label}
	title={words || undefined}
	{...attr}
	class="rg-track-space {attr.class ? attr.class : ''}"
	class:rg-track-space--first={first}
	class:rg-track-space--last={last}
	class:rg-track-space--has-landmark={Boolean(landmark)}
	class:rg-track-space--has-bonus={Boolean(bonus)}
	class:rg-track-space--exploration={track === 'exploration'}
	class:rg-track-space--military={track === 'military'}
	class:rg-track-space--dense={track === 'technology' &&
		[5, 6, 8].includes(space)}
	class:rg-track-space--track-progress={hasTrackProgress}
	class:rg-track-space--drone-assassins={track === 'military' &&
		name === 'Drone Assassins'}
	class:rg-track-space--mechs={track === 'military' && name === 'Mechs'}
	class:rg-track-space--computers={track === 'technology' &&
		name === 'Computers'}
	class:rg-track-space--tech-combo={track === 'technology' &&
		(name === 'Electronics' || name === 'Nanotech')}
	class:rg-track-space--ai-singularity={track === 'technology' &&
		name === 'AI Singularity'}
	class:rg-track-space--alien-biology={track === 'science' &&
		name === 'Alien Biology'}
	class:rg-track-space--selected={selected}
	class:rg-track-space--available={available}
	style:--rg-track-space-color={trackColor(track)}
	style:--rg-track-space-step={space}
	bind:clientWidth={width}
	bind:clientHeight={height}
	onclick={clickHandler}
	onpointerenter={pointerenterHandler}
	onpointerleave={pointerleaveHandler}
	onfocus={focusHandler}
	onblur={blurHandler}>
	<i class="rg-track-space--shell"></i>
	<i class="rg-track-space--fill"></i>
	{#if bonus}<i class="rg-track-space--bonus-band"></i>{/if}
	<svg
		class="rg-track-space--outline"
		aria-hidden="true"><path d={path} /></svg>
	<span class="rg-track-space--body">
		{#if track === 'exploration'}
			<ExplorationFace
				{space}
				{name}
				{landmark}
				{bonus} />
		{:else}
			<span class="rg-track-space--name">{name}</span>
			{#if benefit.length}
				<span
					class="rg-track-space--benefit"
					aria-hidden="true">
					{#if track === 'technology' && name === 'Computers'}
						<span class="rg-track-space--effect-row"
							>{#each displayedBenefit.slice(0, 3) as glyph, index (index)}{@render symbol(
									glyph
								)}{/each}</span>
						<span
							class="rg-track-space--joint rg-track-space--effect-plus"
							>+</span>
						<span class="rg-track-space--effect-row"
							>{#each displayedBenefit.slice(3) as glyph, index (index)}{@render symbol(
									glyph
								)}{/each}</span>
					{:else if track === 'science' && name === 'Alien Biology'}
						<span class="rg-track-space--alien-choice"
							><span class="rg-track-space--alien-rolls"
								>{#each [1, 2, 3, 4] as roll}<img
										src={artUrl('symbol/science-die')}
										alt="" />{/each}</span
							><span class="rg-track-space--alien-no-benefit"
								>×</span
							><span class="rg-track-space--joint">/</span><span
								class="rg-track-space--vp"
								><img
									src={artUrl('symbol/victory-points')}
									alt="" /><b>5</b></span
							></span>
					{:else if track === 'science' && (space === 9 || space === 10)}
						{#each space === 10 ? [0, 1] : [0] as group}
							<span class="rg-track-space--progress-group">
								{@render symbol(displayedBenefit[group * 4])}
								<span class="rg-track-space--progress-tracks">
									{#each displayedBenefit.slice(group * 4 + 1, group * 4 + (space === 10 ? 4 : 3)) as glyph, index (index)}{@render symbol(
											glyph
										)}{/each}
								</span>
							</span>
						{/each}
					{:else if track === 'technology' && (name === 'Electronics' || name === 'Nanotech')}
						{#each displayedBenefit as glyph, index (index)}
							{#if index === 1}<span class="rg-track-space--joint"
									>+</span
								>{/if}
							{@render symbol(glyph)}
						{/each}
					{:else if track === 'technology' && name === 'AI Singularity'}
						<span class="rg-track-space--ai-resources"
							>{#each displayedBenefit.slice(0, 4) as glyph, index (index)}{@render symbol(
									glyph
								)}{/each}</span>
						<span class="rg-track-space--joint">+</span>
						<span class="rg-track-space--ai-restart"
							><img
								src={artUrl('symbol/restart')}
								alt="" /><span
								>{#each ['exploration', 'science', 'technology', 'military'] as id}<img
										src={artUrl(`track/${id}`)}
										alt="" />{/each}</span
							></span>
					{:else}
						{#each displayedBenefit as glyph, index (index)}{@render symbol(
								glyph
							)}{/each}
					{/if}
				</span>
			{/if}
			{#if bonus}
				<span
					class="rg-track-space--bonus"
					aria-hidden="true">
					<span class="rg-track-space--bonus-rule">
						{#each bonus.pay as glyph, index (index)}{@render symbol(
								glyph
							)}{/each}
						<strong class="rg-track-space--then">:</strong>
						{#each bonus.gain as glyph, index (index)}{@render symbol(
								glyph
							)}{/each}
					</span>
				</span>
			{/if}
			<span class="rg-track-space--landmark"
				>{#if landmark}<img
						src={artUrl(
							`landmark/${landmark.toLowerCase().replaceAll(' ', '-')}`
						)}
						alt=""
						draggable="false" />{landmark}{/if}</span>
		{/if}
	</span>
	<span
		class="rg-track-space--number"
		aria-hidden="true">{space}</span>
</button>

<style>
	/* The body is about square; the arrow tip reaches --track-tip past it and lies in the next space's inlet. */
	.rg-track-space {
		--rg-vp-cup-size: 23px;
		--rg-track-space-border: color-mix(
			in srgb,
			var(--rg-track-space-color) 65%,
			var(--line)
		);
		--rg-track-space-body: color-mix(
			in srgb,
			var(--rg-track-space-color) 14%,
			var(--raised)
		);
		position: relative;
		z-index: var(--rg-track-space-step);
		display: block;
		width: calc(100% + 1px);
		height: var(--rg-track-space-height, auto);
		margin-left: -1px;
		/* About square; a board with height to spare makes it taller through these two (TrackBoard, #59). */
		aspect-ratio: var(--rg-track-space-aspect, 1 / 1);
		/* Its contents shrink when it is short (below). */
		container-type: size;
		padding: 3px;
		border: 0;
		border-radius: var(--radius);
		background: var(--rg-track-space-body);
		color: var(--text);
		text-align: left;
		cursor: pointer;
		clip-path: polygon(
			0 0,
			100% 0,
			calc(100% + var(--track-tip)) 50%,
			100% 100%,
			0 100%,
			var(--track-tip) 50%
		);
	}

	.rg-track-space--first {
		width: 100%;
		margin-left: 0;
		clip-path: polygon(
			0 0,
			100% 0,
			calc(100% + var(--track-tip)) 50%,
			100% 100%,
			0 100%
		);
	}

	.rg-track-space--last {
		clip-path: polygon(
			0 0,
			100% 0,
			100% 100%,
			0 100%,
			var(--track-tip) 50%
		);
	}

	/* The finish line: a diagonally dashed right edge. */
	.rg-track-space--last::after {
		content: '';
		position: absolute;
		z-index: 3;
		top: 0;
		right: 0;
		bottom: 0;
		width: 3px;
		background: repeating-linear-gradient(
			135deg,
			color-mix(in srgb, var(--rg-track-space-color) 25%, var(--text)) 0
				4px,
			transparent 4px 8px
		);
	}

	.rg-track-space:hover,
	.rg-track-space:focus-visible {
		--rg-track-space-body: color-mix(
			in srgb,
			var(--rg-track-space-color) 24%,
			var(--raised)
		);
	}

	/* The clip-path would hide the usual focus ring, so focus draws a dashed outline instead (below). */
	.rg-track-space:focus-visible {
		z-index: 20;
		outline: none;
	}

	/* Above every other space, so the whole outline shows. */
	.rg-track-space--selected {
		z-index: 20;
	}

	.rg-track-space--shell {
		position: absolute;
		inset: 0 calc(-1 * var(--track-tip)) 0 0;
		background: var(--rg-track-space-border);
		clip-path: polygon(
			0 0,
			calc(100% - var(--track-tip)) 0,
			100% 50%,
			calc(100% - var(--track-tip)) 100%,
			0 100%,
			var(--track-tip) 50%
		);
	}

	.rg-track-space--first .rg-track-space--shell {
		clip-path: polygon(
			0 0,
			calc(100% - var(--track-tip)) 0,
			100% 50%,
			calc(100% - var(--track-tip)) 100%,
			0 100%
		);
	}

	.rg-track-space--last .rg-track-space--shell {
		right: 0;
		clip-path: polygon(
			0 0,
			100% 0,
			100% 100%,
			0 100%,
			var(--track-tip) 50%
		);
	}

	.rg-track-space--available .rg-track-space--shell {
		background: var(--ok);
	}

	.rg-track-space--selected .rg-track-space--shell {
		background: transparent;
	}

	.rg-track-space--fill {
		position: absolute;
		inset: 3px calc(3px - var(--track-tip)) 3px 3px;
		background: var(--rg-track-space-body);
		clip-path: polygon(
			0 0,
			calc(100% - var(--track-tip)) 0,
			100% 50%,
			calc(100% - var(--track-tip)) 100%,
			0 100%,
			var(--track-tip) 50%
		);
		transition: background var(--duration-fast) var(--ease);
	}

	.rg-track-space--first .rg-track-space--fill {
		clip-path: polygon(
			0 0,
			calc(100% - var(--track-tip)) 0,
			100% 50%,
			calc(100% - var(--track-tip)) 100%,
			0 100%
		);
	}

	.rg-track-space--last .rg-track-space--fill {
		right: 3px;
		clip-path: polygon(
			0 0,
			100% 0,
			100% 100%,
			0 100%,
			var(--track-tip) 50%
		);
	}

	/* A darker track-coloured bottom third under the landmark's name. */
	.rg-track-space--has-landmark .rg-track-space--fill::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(
			to bottom,
			transparent 60%,
			color-mix(in srgb, var(--rg-track-space-color) 30%, var(--ink)) 100%
		);
	}

	.rg-track-space--outline {
		position: absolute;
		z-index: 4;
		top: 0;
		left: 0;
		display: block;
		width: calc(100% + var(--track-tip));
		height: 100%;
		overflow: visible;
		pointer-events: none;
	}

	.rg-track-space--last .rg-track-space--outline {
		width: 100%;
	}

	.rg-track-space--outline path {
		fill: none;
		stroke: var(--rg-track-space-border);
		stroke-width: 3;
		stroke-linejoin: miter;
	}
	.rg-track-space--selected .rg-track-space--outline path {
		stroke: var(--gold);
	}
	.rg-track-space--available:not(.rg-track-space--selected)
		.rg-track-space--outline
		path {
		stroke: var(--ok);
	}

	.rg-track-space:focus-visible:not(.rg-track-space--selected)
		.rg-track-space--outline
		path {
		stroke-dasharray: 5 3;
	}

	/* The name at the top, the benefit under it, the bonus box, then the landmark at the bottom (#59). The space's
	   clip-path keeps everything inside its arrow; a benefit too big for the space is cut off at its own edge. */
	.rg-track-space--body {
		position: absolute;
		z-index: 1;
		inset: 4px 5px 4px 9px;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		pointer-events: none;
	}

	/* The last space's number sits inside it, not in a tip. */
	/* Every track uses the same interior and keeps the bottom line for a landmark. */

	.rg-track-space--last .rg-track-space--name {
		margin-right: -14px;
	}

	/* A long name, such as Nanotechnology, may run on to the space's right edge. */
	.rg-track-space--name {
		flex: none;
		display: block;
		margin-right: calc(3px - var(--track-tip));
		font: var(--weight-title)
			var(--rg-track-space-text, var(--font-size-3xs)) /
			var(--leading-tight) var(--font-title);
		text-align: left;
		padding-right: 15px;
	}

	.rg-track-space--benefit,
	.rg-track-space--bonus {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		align-content: center;
		text-align: center;
		gap: var(--space-1) 3px;
		min-width: 0;
	}

	.rg-track-space--benefit {
		flex: 1 1 auto;
		align-content: safe center;
		min-height: 0;
		overflow: hidden;
		translate: calc(var(--track-tip) / 2 - 2px) 0;
	}
	.rg-track-space--effect-row {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 1px;
		white-space: nowrap;
	}
	.rg-track-space--computers .rg-track-space--benefit {
		flex-direction: column;
		flex-wrap: nowrap;
		gap: 0;
	}
	.rg-track-space--computers .rg-track-space--effect-plus {
		height: 15px;
	}
	.rg-track-space:not(.rg-track-space--has-bonus) .rg-track-space--benefit {
		position: absolute;
		top: 50%;
		left: 0;
		right: 0;
		transform: translateY(-50%);
		flex: none;
		justify-content: center;
		align-items: center;
		max-height: calc(100% - 20px);
		translate: calc(var(--track-tip) - 2px) 0;
	}
	.rg-track-space--first .rg-track-space--benefit {
		translate: calc(var(--track-tip) / 4 - 6px) 0;
	}
	.rg-track-space--last .rg-track-space--benefit {
		translate: calc(var(--track-tip) / 2 - 2px) 0;
	}
	.rg-track-space--military .rg-track-space--benefit {
		justify-content: center;
		align-items: center;
		align-content: safe center;
		gap: 2px;
	}
	.rg-track-space--mechs .rg-track-space--benefit {
		display: grid;
		grid-template-columns: 32px 12px 24px;
		grid-template-rows: 32px 10px;
		justify-content: center;
		align-content: center;
		column-gap: 3px;
		row-gap: 0;
	}
	.rg-track-space--mechs .rg-track-space--benefit > :first-child {
		grid-column: 1;
		grid-row: 1;
	}
	.rg-track-space--mechs .rg-track-space--benefit > :nth-child(2) {
		grid-column: 1;
		grid-row: 2;
		justify-self: center;
		text-align: center;
		width: max-content;
	}
	.rg-track-space--mechs .rg-track-space--benefit > :nth-child(3) {
		grid-column: 2;
		grid-row: 1;
		align-self: center;
	}
	.rg-track-space--mechs .rg-track-space--benefit > :nth-child(4) {
		grid-column: 3;
		grid-row: 1;
		align-self: center;
	}
	.rg-track-space--mechs .rg-track-space--small-note {
		white-space: nowrap;
		font-size: var(--font-size-3xs);
	}
	.rg-track-space--tech-combo .rg-track-space--benefit {
		flex-wrap: nowrap;
		gap: 1px;
	}
	.rg-track-space--ai-singularity .rg-track-space--benefit {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		gap: 2px;
	}
	.rg-track-space--ai-resources,
	.rg-track-space--ai-restart {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1px;
	}
	.rg-track-space--ai-singularity .rg-track-space--ai-resources img {
		width: 17px;
		height: 17px;
	}
	.rg-track-space--ai-restart > img {
		width: 26px;
		height: 14px;
	}
	.rg-track-space--ai-restart > span {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1px;
	}
	.rg-track-space--ai-restart > span img {
		width: 18px;
		height: 18px;
	}
	.rg-track-space--alien-biology .rg-track-space--benefit {
		flex-direction: row;
		flex-wrap: nowrap;
		gap: 1px;
	}
	.rg-track-space--alien-choice {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 2px;
		white-space: nowrap;
	}
	.rg-track-space--alien-rolls {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0;
	}
	.rg-track-space--alien-rolls img {
		width: 17px;
		height: 17px;
	}
	.rg-track-space--alien-no-benefit {
		color: var(--danger);
		font: var(--weight-bold) var(--font-size-xl) / 1 var(--font-body);
	}
	.rg-track-space--track-progress .rg-track-space--benefit {
		flex-direction: column;
		flex-wrap: nowrap;
		justify-content: center;
		align-items: center;
		align-content: center;
	}
	.rg-track-space--track-progress
		.rg-track-space--benefit:has(.rg-track-space--progress-group) {
		flex-direction: row;
		gap: 4px;
	}
	.rg-track-space--progress-group {
		display: inline-flex;
		align-items: center;
		gap: 2px;
	}
	.rg-track-space--progress-tracks {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		gap: 1px;
	}
	.rg-track-space--has-bonus .rg-track-space--benefit {
		flex: 0 1 calc(50% - 16px);
		max-height: calc(50% - 16px);
	}
	.rg-track-space--dense .rg-track-space--benefit {
		gap: 0 1px;
	}
	.rg-track-space--dense
		.rg-track-space--benefit
		img:not(.rg-track-space--card-icon) {
		width: 18px;
		height: 18px;
	}
	.rg-track-space--dense .rg-track-space--benefit .rg-track-space--vp img {
		width: var(--rg-vp-cup-size, 23px);
		height: var(--rg-vp-cup-size, 23px);
	}
	.rg-track-space--dense
		.rg-track-space--benefit
		.rg-track-space--building
		img {
		width: 24px;
		height: 24px;
	}
	.rg-track-space--dense .rg-track-space--benefit .rg-track-space--joint {
		height: 18px;
		font-size: var(--font-size-xs);
	}

	/* The track-colour gradient is clipped by the tile; its sides are the tile borders. */
	.rg-track-space--bonus-band {
		position: absolute;
		z-index: 1;
		inset: 50% calc(-1 * var(--track-tip)) 28px 0;
		--rg-bonus-top: color-mix(
			in srgb,
			var(--rg-track-space-color) 70%,
			var(--raised)
		);
		background: linear-gradient(
			180deg,
			var(--rg-bonus-top) 0%,
			transparent 100%
		);
		pointer-events: none;
	}
	.rg-track-space--bonus {
		position: absolute;
		top: 50%;
		bottom: 24px;
		left: 0;
		right: 0;
		display: flex;
		flex-direction: column;
		flex-wrap: nowrap;
		align-items: center;
		justify-content: center;
		gap: 1px;
		padding: 0 2px;
		border: 0;
		background: transparent;
		color: var(--gold);
	}
	.rg-track-space--bonus-rule {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1px;
		white-space: nowrap;
		translate: calc(var(--track-tip) / 2 + 1px) 0;
	}
	.rg-track-space--first .rg-track-space--bonus-rule,
	.rg-track-space--last .rg-track-space--bonus-rule {
		translate: calc(var(--track-tip) / 4 + 1px) 0;
	}
	.rg-track-space--bonus-rule .rg-track-space--then {
		margin-inline: 3px;
	}

	.rg-track-space--bonus .rg-track-space--word,
	.rg-track-space--bonus .rg-track-space--then,
	.rg-track-space--bonus .rg-track-space--joint {
		color: var(--gold);
	}
	.rg-track-space--bonus .rg-track-space--word,
	.rg-track-space--bonus .rg-track-space--vp {
		padding: 0;
		border: 0;
		background: transparent;
	}

	.rg-track-space--symbol-group {
		display: inline-flex;
		align-items: center;
		gap: 1px;
	}
	.rg-track-space--invent-stack {
		flex-direction: column;
		gap: 0;
	}

	.rg-track-space--symbol-icon {
		display: block;
		width: 24px;
		height: 24px;
		object-fit: contain;
		image-rendering: pixelated;
	}
	.rg-track-space .rg-track-space--outpost-icon {
		width: 32px;
		height: 32px;
	}
	.rg-track-space--repeat {
		display: inline-flex;
		align-items: center;
		gap: 2px;
	}
	.rg-track-space--repeat svg {
		width: 17px;
		height: 17px;
		fill: none;
		stroke: var(--gold);
		stroke-width: 3;
		stroke-linejoin: miter;
	}
	.rg-track-space--card-icon {
		min-width: 24px;
		min-height: 24px;
	}

	.rg-track-space--landmark {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		flex: none;
		margin-top: auto;
		min-height: 14px;
		color: var(--gold);
		font: var(--weight-title) var(--font-size-3xs) / 1 var(--font-title);
		text-align: left;
	}
	.rg-track-space--landmark img {
		width: 13px;
		height: 13px;
		object-fit: contain;
		image-rendering: pixelated;
	}

	.rg-track-space--art {
		display: inline-flex;
		flex: none;
		align-items: flex-end;
	}

	.rg-track-space--art img,
	.rg-track-space--track {
		display: block;
		flex: none;
		object-fit: contain;
		image-rendering: pixelated;
	}

	.rg-track-space--resource img {
		width: 24px;
		height: 24px;
	}

	.rg-track-space--building img {
		width: 24px;
		height: 24px;
	}

	.rg-track-space--track {
		width: 24px;
		height: 24px;
	}
	.rg-track-space--bonus-rule img,
	.rg-track-space--bonus-rule .rg-track-space--symbol-icon {
		width: 18px;
		height: 18px;
	}

	.rg-track-space--count {
		margin-inline: 2px;
		font: var(--weight-bold)
			var(--rg-track-space-text, var(--font-size-3xs)) /
			var(--leading-none) var(--font-body);
	}

	/* The game symbols without art yet are short words (#5). */
	.rg-track-space--word {
		padding: 1px 3px;
		border-radius: var(--radius);
		font: var(--weight-bold)
			var(--rg-track-space-text, var(--font-size-3xs)) /
			var(--leading-tight) var(--font-body);
	}

	.rg-track-space--word {
		background: color-mix(in srgb, var(--ink) 50%, transparent);
		color: var(--text);
	}
	.rg-track-space--small-note {
		font: var(--weight-regular) var(--font-size-3xs) / 1 var(--font-body);
		background: transparent;
		color: var(--muted);
	}
	.rg-track-space--upgrade {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 1px;
		color: var(--gold);
		font: var(--weight-bold) var(--font-size-2xl) / 1 var(--font-body);
	}
	.rg-track-space--up-arrow {
		width: 16px;
		height: 24px;
		flex: none;
	}
	.rg-track-space--benefit-shape {
		width: 23px;
		height: 23px;
		flex: none;
		border: 4px solid var(--gold);
	}
	.rg-track-space--benefit-shape--circle {
		border-radius: 50%;
	}
	.rg-track-space--restart-icon {
		display: block;
		width: 38px;
		height: 19px;
		object-fit: contain;
	}
	.rg-track-space--capital-score {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		color: var(--gold);
		font: var(--weight-bold) var(--font-size-sm) / 1 var(--font-body);
	}
	.rg-track-space--capital-score img {
		width: 24px;
		height: 24px;
	}
	.rg-track-space--capital-score img:first-child {
		width: var(--rg-vp-cup-size, 23px);
		height: var(--rg-vp-cup-size, 23px);
	}

	.rg-track-space--vp {
		display: inline-flex;
		align-items: center;
		gap: 1px;
		color: var(--gold);
		white-space: nowrap;
	}
	.rg-track-space--vp img {
		display: block;
		width: var(--rg-vp-cup-size, 23px);
		height: var(--rg-vp-cup-size, 23px);
		object-fit: contain;
		image-rendering: pixelated;
	}
	.rg-track-space--vp b {
		font: var(--weight-bold) var(--font-size-3xs) / 1 var(--font-body);
	}
	.rg-track-space--bonus-rule .rg-track-space--vp img {
		width: var(--rg-vp-cup-size, 23px);
		height: var(--rg-vp-cup-size, 23px);
	}

	/* A benefit taken without its own benefit carries the board's red X. */
	.rg-track-space--crossed {
		position: relative;
		padding-right: 13px;
	}

	.rg-track-space--crossed::after {
		content: '';
		position: absolute;
		top: 50%;
		right: 3px;
		width: 8px;
		height: 8px;
		transform: translateY(-50%);
		background:
			linear-gradient(
				45deg,
				transparent 40%,
				var(--danger) 40% 60%,
				transparent 60%
			),
			linear-gradient(
				-45deg,
				transparent 40%,
				var(--danger) 40% 60%,
				transparent 60%
			);
	}

	.rg-track-space--joint,
	.rg-track-space--then {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 24px;
		color: var(--gold);
		font: var(--weight-bold) var(--font-size-md) / 1 var(--font-body);
	}
	.rg-track-space--joint {
		margin-inline: 2px;
	}
	.rg-track-space--refresh {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		color: var(--gold);
		font: var(--weight-bold) var(--font-size-3xl) / 1 var(--font-body);
	}
	.rg-track-space--bonus-rule .rg-track-space--then {
		height: 18px;
	}

	.rg-track-space--or {
		font-style: normal;
		font-weight: var(--weight-bold);
	}
	.rg-track-space--direction {
		display: inline-flex;
		align-items: center;
		gap: 1px;
		color: var(--gold);
		font: var(--weight-bold) var(--font-size-3xl) / 1 var(--font-body);
	}
	.rg-track-space--direction b,
	.rg-track-space--direction small {
		font: var(--weight-bold) var(--font-size-3xs) / 1 var(--font-body);
	}

	/* A short space, on a short screen, draws its symbols smaller and its words tighter; its tooltip and label keep
	   the full words. */
	@container (max-height: 112px) {
		.rg-track-space--body {
			--rg-vp-cup-size: 24px;
			inset-block: 4px;
			gap: var(--space-1);
		}
		.rg-track-space--landmark {
			font-size: var(--font-size-3xs);
		}

		.rg-track-space--word {
			padding: 0 2px;
			line-height: var(--leading-none);
		}

		.rg-track-space--crossed {
			padding-right: 11px;
		}

		.rg-track-space--crossed::after {
			right: 2px;
			width: 7px;
			height: 7px;
		}

		.rg-track-space--bonus {
			padding: 0 2px;
		}
	}

	/* A large space, on a large screen, grows its words and symbols with it (#69). At the 1920×1080 reference a
	   space is about 110px wide, so it keeps the smallest text; at 2560×1440 it is about 150px. */
	@container (min-width: 125px) and (min-height: 135px) {
		.rg-track-space--body,
		.rg-track-space--number {
			--rg-track-space-text: var(--font-size-2xs);
		}
		.rg-track-space--body {
			--rg-vp-cup-size: 27px;
		}

		.rg-track-space--resource img,
		.rg-track-space--building img,
		.rg-track-space--track,
		.rg-track-space--symbol-icon {
			width: 27px;
			height: 27px;
		}
	}

	/* The number stays at the step below, so it still fits the arrow tip. */
	@container (min-width: 145px) and (min-height: 160px) {
		.rg-track-space--body {
			--rg-track-space-text: var(--font-size-xs);
			--rg-vp-cup-size: 29px;
		}

		.rg-track-space--resource img,
		.rg-track-space--building img,
		.rg-track-space--track,
		.rg-track-space--symbol-icon,
		.rg-track-space--vp img {
			width: 29px;
			height: 29px;
		}
		.rg-track-space--bonus-rule img,
		.rg-track-space--bonus-rule .rg-track-space--symbol-icon {
			width: 20px;
			height: 20px;
		}

		.rg-track-space--crossed {
			padding-right: 15px;
		}

		.rg-track-space--crossed::after {
			width: 10px;
			height: 10px;
		}
	}

	/* The small number sits in the arrow tip. */
	.rg-track-space--number {
		position: absolute;
		z-index: 5;
		top: 7px;
		right: 5px;
		width: 12px;
		color: var(--muted);
		font: var(--weight-bold)
			var(--rg-track-space-text, var(--font-size-3xs)) /
			var(--leading-none) var(--font-body);
		text-align: center;
	}

	.rg-track-space--last .rg-track-space--number {
		right: 5px;
	}
</style>
