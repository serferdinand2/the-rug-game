<!-- One pointed space on an advancement track: its name, benefit, bonus, landmark and number, with hover and the gold selected outline. -->
<script module>
	/** @typedef {import('../../glyphs.js').Glyph} Glyph */

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
	import { TRACK_IDS } from '../../engine/data/ids.js';
	import { SPACE_COUNT, outlinePath } from '../../track-shape.js';
	import { artUrl, trackColor } from '../../ui.js';
	import ExplorationFace from './ExplorationFace.svelte';
	import SpaceGlyphs from './SpaceGlyphs.svelte';

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
	/** The board's + between two of a benefit's glyphs. */
	const PLUS = /** @type {Glyph} */ ({ kind: 'plus' });
	/** On these military spaces, the board prints a + before the benefit's glyph at this place. */
	const MILITARY_PLUS_BEFORE = /** @type {Record<number, number>} */ ({
		4: 1,
		5: 1,
		6: 1,
		9: 1,
		10: 3,
		12: 2,
	});
	/** Alien Biology's other choice, after the four crossed dice. */
	const ALIEN_CHOICE = /** @type {Glyph[]} */ ([
		{ kind: 'or' },
		{ kind: 'vp', count: 5 },
	]);

	let techCombo = $derived(
		track === 'technology' &&
			(name === 'Electronics' || name === 'Nanotech')
	);
	let dense = $derived(track === 'technology' && [5, 6, 8].includes(space));
	let displayedBenefit = $derived(
		benefit.flatMap((glyph, index) =>
			plusBefore(glyph, index) ? [PLUS, glyph] : [glyph]
		)
	);
	let hasTrackProgress = $derived(
		benefit.some(
			(glyph) =>
				glyph.kind === 'word' &&
				['Advance', 'May advance', 'Regress'].includes(glyph.text)
		)
	);
	// Science's Physics, Neuroscience and Quantum Physics: the arrow beside a column of the tracks it moves on, once per move.
	let progressGroups = $derived.by(() => {
		const [arrow, ...tracks] = benefit;
		if (
			track !== 'science' ||
			arrow?.kind !== 'word' ||
			!['Advance', 'Regress'].includes(arrow.text) ||
			!tracks.length ||
			!tracks.every((glyph) => glyph.kind === 'track')
		) {
			return [];
		}
		return Array.from({ length: arrow.count }, () => ({
			arrow: { ...arrow, count: 1 },
			tracks,
		}));
	});

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

	/**
	 * Whether the board prints a + before this glyph of the benefit: before Metallurgy's and Rubber's May refresh,
	 * between Electronics' two glyphs, and on the military spaces that list one.
	 * @param {Glyph} glyph
	 * @param {number} index
	 * @returns {boolean}
	 */
	function plusBefore(glyph, index) {
		if (techCombo) {
			return index === 1;
		}
		if (track === 'technology') {
			return (
				index > 0 &&
				glyph.kind === 'word' &&
				glyph.text === 'May refresh'
			);
		}
		return track === 'military' && index === MILITARY_PLUS_BEFORE[space];
	}
</script>

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
	class:rg-track-space--dense={dense}
	class:rg-track-space--track-progress={hasTrackProgress}
	class:rg-track-space--drone-assassins={track === 'military' &&
		name === 'Drone Assassins'}
	class:rg-track-space--mechs={track === 'military' && name === 'Mechs'}
	class:rg-track-space--computers={track === 'technology' &&
		name === 'Computers'}
	class:rg-track-space--tech-combo={techCombo}
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
							><SpaceGlyphs
								glyphs={displayedBenefit.slice(0, 3)} /></span>
						<SpaceGlyphs
							class="rg-track-space--effect-plus"
							glyphs={[PLUS]} />
						<span class="rg-track-space--effect-row"
							><SpaceGlyphs
								glyphs={displayedBenefit.slice(3)} /></span>
					{:else if track === 'science' && name === 'Alien Biology'}
						<span class="rg-track-space--alien-choice"
							><span class="rg-track-space--alien-rolls"
								>{#each [1, 2, 3, 4] as roll}<img
										src={artUrl('symbol/science-die')}
										alt="" />{/each}</span
							><span class="rg-track-space--alien-no-benefit"
								>×</span
							><SpaceGlyphs glyphs={ALIEN_CHOICE} /></span>
					{:else if progressGroups.length}
						{#each progressGroups as group, index (index)}
							<span class="rg-track-space--progress-group">
								<SpaceGlyphs glyphs={[group.arrow]} />
								<span class="rg-track-space--progress-tracks">
									<SpaceGlyphs glyphs={group.tracks} />
								</span>
							</span>
						{/each}
					{:else if track === 'technology' && name === 'AI Singularity'}
						<span class="rg-track-space--ai-resources"
							><SpaceGlyphs
								glyphs={displayedBenefit.slice(0, 4)} /></span>
						<SpaceGlyphs glyphs={[PLUS]} />
						<span class="rg-track-space--ai-restart"
							><img
								src={artUrl('symbol/restart')}
								alt="" /><span
								>{#each TRACK_IDS as id}<img
										src={artUrl(`track/${id}`)}
										alt="" />{/each}</span
							></span>
					{:else}
						<SpaceGlyphs
							glyphs={displayedBenefit}
							variant={dense ? 'dense' : 'benefit'} />
					{/if}
				</span>
			{/if}
			{#if bonus}
				<span
					class="rg-track-space--bonus"
					aria-hidden="true">
					<span class="rg-track-space--bonus-rule">
						<SpaceGlyphs
							glyphs={bonus.pay}
							variant="bonus" />
						<strong class="rg-track-space--then">:</strong>
						<SpaceGlyphs
							glyphs={bonus.gain}
							variant="bonus" />
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
		/* The shell and the fill reach --track-tip past the space, into the tip, and clip to this shape. */
		--rg-track-space-shape: polygon(
			0 0,
			calc(100% - var(--track-tip)) 0,
			100% 50%,
			calc(100% - var(--track-tip)) 100%,
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
		--rg-track-space-shape: polygon(
			0 0,
			calc(100% - var(--track-tip)) 0,
			100% 50%,
			calc(100% - var(--track-tip)) 100%,
			0 100%
		);
	}

	.rg-track-space--last {
		--rg-track-space-shape: polygon(
			0 0,
			100% 0,
			100% 100%,
			0 100%,
			var(--track-tip) 50%
		);
		clip-path: var(--rg-track-space-shape);
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
		clip-path: var(--rg-track-space-shape);
	}

	.rg-track-space--last .rg-track-space--shell {
		right: 0;
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
		clip-path: var(--rg-track-space-shape);
		transition: background var(--duration-fast) var(--ease);
	}

	.rg-track-space--last .rg-track-space--fill {
		right: 3px;
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
		/* The glyphs' counts and words follow the space's text size. */
		--rg-space-glyphs-text: var(
			--rg-track-space-text,
			var(--font-size-3xs)
		);
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
	/* The special spaces place SpaceGlyphs' glyphs, reaching them by position, as its root draws no box (#115). */
	.rg-track-space--computers :global(.rg-track-space--effect-plus > *) {
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
	/* Mechs: Conquer over Both dice, then + and the civilization card. */
	.rg-track-space--mechs .rg-track-space--benefit {
		display: grid;
		grid-template-columns: 32px 12px 24px;
		grid-template-rows: 32px 10px;
		justify-content: center;
		align-content: center;
		column-gap: 3px;
		row-gap: 0;
	}
	.rg-track-space--mechs
		.rg-track-space--benefit
		> :global(* > :first-child) {
		grid-column: 1;
		grid-row: 1;
	}
	.rg-track-space--mechs
		.rg-track-space--benefit
		> :global(* > :nth-child(2)) {
		grid-column: 1;
		grid-row: 2;
		justify-self: center;
		text-align: center;
		width: max-content;
		white-space: nowrap;
	}
	.rg-track-space--mechs
		.rg-track-space--benefit
		> :global(* > :nth-child(3)) {
		grid-column: 2;
		grid-row: 1;
		align-self: center;
	}
	.rg-track-space--mechs
		.rg-track-space--benefit
		> :global(* > :nth-child(4)) {
		grid-column: 3;
		grid-row: 1;
		align-self: center;
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
	.rg-track-space--ai-singularity .rg-track-space--ai-resources :global(img) {
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
	.rg-track-space--then {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 18px;
		margin-inline: 3px;
		color: var(--gold);
		font: var(--weight-bold) var(--font-size-md) / 1 var(--font-body);
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

	/* A short space, on a short screen, draws its symbols smaller and its words tighter; its tooltip and label keep
	   the full words. SpaceGlyphs answers to the same three steps. */
	@container (max-height: 112px) {
		.rg-track-space--body {
			--rg-vp-cup-size: 24px;
			inset-block: 4px;
			gap: var(--space-1);
		}
		.rg-track-space--landmark {
			font-size: var(--font-size-3xs);
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
	}

	/* The number stays at the step below, so it still fits the arrow tip. */
	@container (min-width: 145px) and (min-height: 160px) {
		.rg-track-space--body {
			--rg-track-space-text: var(--font-size-xs);
			--rg-vp-cup-size: 29px;
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
