<!-- A track space's symbols in a row (#115): resources, buildings and tracks as their art, the game symbols as their shapes or short words, VP and the joints. -->
<script module>
	/**
	 * Properties of the SpaceGlyphs component itself.
	 * @typedef {Object} SpaceGlyphsOwnProps
	 * @property {import('../../glyphs.js').Glyph[]} glyphs - The symbols, in order, from src/lib/glyphs.js
	 * @property {'benefit' | 'dense' | 'bonus'} [variant='benefit'] - Where they are drawn: a benefit; a dense benefit, Glass's, Steel's and Plastic's beside their bonus (18px pictures but buildings and VP, shorter joints); or a bonus rule (18px pictures, gold words, joints and VP without a box)
	 */

	/**
	 * Properties for the SpaceGlyphs component, including any attributes for its root span. The root is
	 * `display: contents`, so each glyph lays out as an item of the element it is drawn in.
	 * @typedef {SpaceGlyphsOwnProps & import('svelte/elements').HTMLAttributes<HTMLSpanElement>} SpaceGlyphsProps
	 *
	 * @example
	 * <SpaceGlyphs
	 *   glyphs={[{ kind: 'resource', id: 'coin', count: 2 }, { kind: 'or' }, { kind: 'vp', count: 5 }]}
	 *   variant="bonus" />
	 */
</script>

<script>
	import { artUrl } from '../../ui.js';
	import CardSymbol from '../ui/CardSymbol.svelte';

	/** @type {SpaceGlyphsProps} */
	let { glyphs, variant = 'benefit', ...attr } = $props();

	/** The words drawn as a symbol's art, by the art's id under symbol/ or its own path. */
	const WORD_ICONS = /** @type {Record<string, string>} */ ({
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
	});

	/** The words whose picture repeats once per count instead of showing ×N. */
	const REPEATED = ['Tile', 'Space tile', 'Invent'];

	/** The words drawn as a card symbol, by its kind. */
	const CARD_KINDS =
		/** @type {Record<string, 'tech' | 'tapestry' | 'civilization'>} */ ({
			Tech: 'tech',
			Invent: 'tech',
			Tapestry: 'tapestry',
			'Play tapestry': 'tapestry',
			Civilization: 'civilization',
		});

	/**
	 * The art a word's symbol draws.
	 * @param {string} word
	 * @returns {string}
	 */
	function wordArt(word) {
		const icon = WORD_ICONS[word];
		return icon.includes('/') ? icon : `symbol/${icon}`;
	}
</script>

<span
	{...attr}
	class="rg-space-glyphs {attr.class ? attr.class : ''}"
	class:rg-space-glyphs--dense={variant === 'dense'}
	class:rg-space-glyphs--bonus={variant === 'bonus'}>
	{#each glyphs as glyph, index (index)}
		{#if glyph.kind === 'resource' || glyph.kind === 'building'}
			<span class="rg-space-glyphs--art rg-space-glyphs--{glyph.kind}">
				<img
					src={artUrl(
						glyph.kind === 'resource'
							? `resource-24/${glyph.id}`
							: `building/${glyph.id}`
					)}
					alt=""
					draggable="false" />
				{#if glyph.count > 1}
					<b class="rg-space-glyphs--count">×{glyph.count}</b>
				{/if}
			</span>
		{:else if glyph.kind === 'track'}
			<img
				class="rg-space-glyphs--track"
				src={artUrl(`track/${glyph.id}`)}
				alt=""
				draggable="false" />
		{:else if glyph.kind === 'word'}
			{#if glyph.text === 'Advance' || glyph.text === 'May advance' || glyph.text === 'Regress'}
				<span
					class="rg-space-glyphs--direction"
					class:rg-space-glyphs--crossed={glyph.cross}
					>{glyph.text === 'Regress'
						? '↶'
						: '↷'}{#if glyph.count > 1}<b>×{glyph.count}</b
						>{/if}{#if glyph.text === 'May advance'}<small
							>may</small
						>{/if}</span>
			{:else if glyph.text === 'Upgrade'}
				<span
					class="rg-space-glyphs--upgrade"
					aria-label="Upgrade technology"
					><svg
						class="rg-space-glyphs--up-arrow"
						viewBox="0 0 18 24"
						aria-hidden="true"
						><path
							fill="currentColor"
							d="M9 1 17 10h-5v13H6V10H1z" /></svg
					><CardSymbol
						kind="tech"
						class="rg-space-glyphs--symbol-icon rg-space-glyphs--card-icon"
						decorative /></span>
			{:else if glyph.text === 'Circle benefit' || glyph.text === 'Square benefit'}
				<span
					class="rg-space-glyphs--benefit-shape"
					class:rg-space-glyphs--benefit-shape--circle={glyph.text ===
						'Circle benefit'}
					aria-label={glyph.text}></span>
			{:else if glyph.text === 'Score capital'}
				<span
					class="rg-space-glyphs--capital-score"
					aria-label="Score capital"
					><img
						src={artUrl('symbol/victory-points')}
						alt="" /><span>×</span><img
						src={artUrl('symbol/capital-city')}
						alt="" /></span>
			{:else if glyph.text === 'Restart'}
				<img
					class="rg-space-glyphs--restart-icon"
					src={artUrl('symbol/restart')}
					alt="Restart" />
			{:else if glyph.text === 'Repeat'}
				<span
					class="rg-space-glyphs--repeat"
					aria-label="Repeat a track space"
					><span class="rg-space-glyphs--direction">⟳</span><svg
						viewBox="0 0 24 24"
						aria-hidden="true"
						><path d="M2 3h14l6 9-6 9H2l6-9z" /></svg
					></span>
			{:else if glyph.text === 'May refresh'}
				<span
					class="rg-space-glyphs--refresh"
					aria-label="May refresh">↔</span>
			{:else if WORD_ICONS[glyph.text]}
				<span
					class="rg-space-glyphs--symbol-group"
					class:rg-space-glyphs--invent-stack={glyph.text ===
						'Invent' && glyph.count > 1}
					class:rg-space-glyphs--crossed={glyph.cross}>
					{#each Array.from( { length: REPEATED.includes(glyph.text) ? glyph.count : 1 } ) as _}
						{#if CARD_KINDS[glyph.text]}
							<CardSymbol
								kind={CARD_KINDS[glyph.text]}
								class="rg-space-glyphs--symbol-icon rg-space-glyphs--card-icon"
								decorative />
						{:else}
							<img
								class="rg-space-glyphs--symbol-icon"
								class:rg-space-glyphs--outpost-icon={glyph.text ===
									'Conquer' ||
									glyph.text === 'Conquer anywhere'}
								src={artUrl(wordArt(glyph.text))}
								alt=""
								draggable="false" />
						{/if}
					{/each}
					{#if glyph.count > 1 && !REPEATED.includes(glyph.text)}<b
							class="rg-space-glyphs--count">×{glyph.count}</b
						>{/if}
				</span>
			{:else}
				<span
					class="rg-space-glyphs--word"
					class:rg-space-glyphs--small-note={glyph.text ===
						'Both dice' || glyph.text === 'Both dice vs. opponent'}
					class:rg-space-glyphs--crossed={glyph.cross}
					>{glyph.text}{glyph.count > 1
						? ` ×${glyph.count}`
						: ''}</span>
			{/if}
		{:else if glyph.kind === 'vp'}
			<span class="rg-space-glyphs--vp"
				><img
					src={artUrl('symbol/victory-points')}
					alt=""
					draggable="false" />{#if glyph.count !== null}<b
						>{glyph.count}</b
					>{/if}</span>
		{:else}
			<span
				class="rg-space-glyphs--joint"
				class:rg-space-glyphs--or={glyph.kind === 'or'}
				>{glyph.kind === 'or'
					? '/'
					: glyph.kind === 'plus'
						? '+'
						: '×'}</span>
		{/if}
	{/each}
</span>

<style>
	/* No box of its own: each glyph is an item of the row, grid or column it is drawn in. */
	.rg-space-glyphs {
		display: contents;
	}

	/* The bonus rule's words, joints and VP are gold, without a box. */
	.rg-space-glyphs--bonus .rg-space-glyphs--word,
	.rg-space-glyphs--bonus .rg-space-glyphs--joint {
		color: var(--gold);
	}
	.rg-space-glyphs--bonus .rg-space-glyphs--word,
	.rg-space-glyphs--bonus .rg-space-glyphs--vp {
		padding: 0;
		border: 0;
		background: transparent;
	}

	.rg-space-glyphs--symbol-group {
		display: inline-flex;
		align-items: center;
		gap: 1px;
	}
	.rg-space-glyphs--invent-stack {
		flex-direction: column;
		gap: 0;
	}

	.rg-space-glyphs--symbol-icon {
		display: block;
		width: 24px;
		height: 24px;
		object-fit: contain;
		image-rendering: pixelated;
	}
	.rg-space-glyphs .rg-space-glyphs--outpost-icon {
		width: 32px;
		height: 32px;
	}
	.rg-space-glyphs--repeat {
		display: inline-flex;
		align-items: center;
		gap: 2px;
	}
	.rg-space-glyphs--repeat svg {
		width: 17px;
		height: 17px;
		fill: none;
		stroke: var(--gold);
		stroke-width: 3;
		stroke-linejoin: miter;
	}

	.rg-space-glyphs--art {
		display: inline-flex;
		flex: none;
		align-items: flex-end;
	}

	.rg-space-glyphs--art img,
	.rg-space-glyphs--track {
		display: block;
		flex: none;
		object-fit: contain;
		image-rendering: pixelated;
	}

	.rg-space-glyphs--resource img {
		width: 24px;
		height: 24px;
	}

	.rg-space-glyphs--building img {
		width: 24px;
		height: 24px;
	}

	.rg-space-glyphs--track {
		width: 24px;
		height: 24px;
	}
	.rg-space-glyphs--bonus img,
	.rg-space-glyphs--bonus .rg-space-glyphs--symbol-icon {
		width: 18px;
		height: 18px;
	}

	.rg-space-glyphs--count {
		margin-inline: 2px;
		font: var(--weight-bold)
			var(--rg-space-glyphs-text, var(--font-size-3xs)) /
			var(--leading-none) var(--font-body);
	}

	/* The game symbols without art yet are short words (#5). */
	.rg-space-glyphs--word {
		padding: 1px 3px;
		border-radius: var(--radius);
		font: var(--weight-bold)
			var(--rg-space-glyphs-text, var(--font-size-3xs)) /
			var(--leading-tight) var(--font-body);
	}

	.rg-space-glyphs--word {
		background: color-mix(in srgb, var(--ink) 50%, transparent);
		color: var(--text);
	}
	.rg-space-glyphs--small-note {
		font: var(--weight-regular) var(--font-size-3xs) / 1 var(--font-body);
		background: transparent;
		color: var(--muted);
	}
	.rg-space-glyphs--upgrade {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 1px;
		color: var(--gold);
		font: var(--weight-bold) var(--font-size-2xl) / 1 var(--font-body);
	}
	.rg-space-glyphs--up-arrow {
		width: 16px;
		height: 24px;
		flex: none;
	}
	.rg-space-glyphs--benefit-shape {
		width: 23px;
		height: 23px;
		flex: none;
		border: 4px solid var(--gold);
	}
	.rg-space-glyphs--benefit-shape--circle {
		border-radius: 50%;
	}
	.rg-space-glyphs--restart-icon {
		display: block;
		width: 38px;
		height: 19px;
		object-fit: contain;
	}
	.rg-space-glyphs--capital-score {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		color: var(--gold);
		font: var(--weight-bold) var(--font-size-sm) / 1 var(--font-body);
	}
	.rg-space-glyphs--capital-score img {
		width: 24px;
		height: 24px;
	}
	.rg-space-glyphs--capital-score img:first-child {
		width: var(--rg-vp-cup-size, 23px);
		height: var(--rg-vp-cup-size, 23px);
	}

	.rg-space-glyphs--vp {
		display: inline-flex;
		align-items: center;
		gap: 1px;
		color: var(--gold);
		white-space: nowrap;
	}
	.rg-space-glyphs--vp img {
		display: block;
		width: var(--rg-vp-cup-size, 23px);
		height: var(--rg-vp-cup-size, 23px);
		object-fit: contain;
		image-rendering: pixelated;
	}
	.rg-space-glyphs--vp b {
		font: var(--weight-bold) var(--font-size-3xs) / 1 var(--font-body);
	}
	.rg-space-glyphs--bonus .rg-space-glyphs--vp img {
		width: var(--rg-vp-cup-size, 23px);
		height: var(--rg-vp-cup-size, 23px);
	}

	/* A benefit taken without its own benefit carries the board's red X. */
	.rg-space-glyphs--crossed {
		position: relative;
		padding-right: 13px;
	}

	.rg-space-glyphs--crossed::after {
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

	.rg-space-glyphs--joint {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 24px;
		margin-inline: 2px;
		color: var(--gold);
		font: var(--weight-bold) var(--font-size-md) / 1 var(--font-body);
	}
	.rg-space-glyphs--refresh {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		color: var(--gold);
		font: var(--weight-bold) var(--font-size-3xl) / 1 var(--font-body);
	}

	.rg-space-glyphs--or {
		font-style: normal;
		font-weight: var(--weight-bold);
	}
	/* The arrow glyphs come from a fallback font whose line box is taller than its em box; clipping to the em box
	   keeps every ink pixel and stops the extra box from overflowing the space's benefit (track-text test). */
	.rg-space-glyphs--direction {
		display: inline-flex;
		align-items: center;
		gap: 1px;
		overflow: hidden;
		color: var(--gold);
		font: var(--weight-bold) var(--font-size-3xl) / 1 var(--font-body);
	}
	.rg-space-glyphs--direction b,
	.rg-space-glyphs--direction small {
		font: var(--weight-bold) var(--font-size-3xs) / 1 var(--font-body);
	}

	/* A dense benefit, sharing its space with a bonus, draws its pictures and joints smaller. Last, so it wins the
	   ties it won when TrackSpace wrote it with one more class. */
	.rg-space-glyphs--dense img:not(.rg-space-glyphs--card-icon) {
		width: 18px;
		height: 18px;
	}
	.rg-space-glyphs--dense .rg-space-glyphs--vp img {
		width: var(--rg-vp-cup-size, 23px);
		height: var(--rg-vp-cup-size, 23px);
	}
	.rg-space-glyphs--dense .rg-space-glyphs--building img {
		width: 24px;
		height: 24px;
	}
	.rg-space-glyphs--dense .rg-space-glyphs--joint {
		height: 18px;
		font-size: var(--font-size-xs);
	}

	/* These answer to the TrackSpace around the glyphs, the nearest size container, and use its three steps: a short
	   space tightens its words and its X; a large one grows its pictures. */
	@container (max-height: 112px) {
		.rg-space-glyphs--word {
			padding: 0 2px;
			line-height: var(--leading-none);
		}

		.rg-space-glyphs--crossed {
			padding-right: 11px;
		}

		.rg-space-glyphs--crossed::after {
			right: 2px;
			width: 7px;
			height: 7px;
		}
	}

	@container (min-width: 125px) and (min-height: 135px) {
		.rg-space-glyphs--resource img,
		.rg-space-glyphs--building img,
		.rg-space-glyphs--track,
		.rg-space-glyphs--symbol-icon {
			width: 27px;
			height: 27px;
		}
		/* A bonus's pictures stay between the 18px below and the 20px above this step, not the benefit's 27px. */
		.rg-space-glyphs--bonus img,
		.rg-space-glyphs--bonus .rg-space-glyphs--symbol-icon {
			width: 19px;
			height: 19px;
		}
	}

	@container (min-width: 145px) and (min-height: 160px) {
		.rg-space-glyphs--resource img,
		.rg-space-glyphs--building img,
		.rg-space-glyphs--track,
		.rg-space-glyphs--symbol-icon,
		.rg-space-glyphs--vp img {
			width: 29px;
			height: 29px;
		}
		.rg-space-glyphs--bonus img,
		.rg-space-glyphs--bonus .rg-space-glyphs--symbol-icon {
			width: 20px;
			height: 20px;
		}

		.rg-space-glyphs--crossed {
			padding-right: 15px;
		}

		.rg-space-glyphs--crossed::after {
			width: 10px;
			height: 10px;
		}
	}
</style>
