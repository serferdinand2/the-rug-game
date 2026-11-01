<!-- Issue #85 visual pass: a shared vertical rhythm for all twelve Exploration spaces. -->
<script module>
	/**
	 * @typedef {Object} ExplorationFaceOwnProps
	 * @property {number} space - Exploration space number, 1–12
	 * @property {string} name - Printed space name
	 * @property {string} [landmark] - Landmark shown at the bottom
	 * @property {import('../../glyphs.js').BonusGlyphs | null} [bonus] - Optional price and reward
	 * @property {boolean} [last=false] - The track's last space, which TrackSpace passes on from Track (#120)
	 */
	/**
	 * @typedef {ExplorationFaceOwnProps & import('svelte/elements').HTMLAttributes<HTMLSpanElement>} ExplorationFaceProps
	 * @example <ExplorationFace space={4} name="Navigation" landmark="Lighthouse" />
	 */
</script>

<script>
	import { artUrl } from '../../ui.js';
	import TrackLandmark from './TrackLandmark.svelte';

	/** @type {ExplorationFaceProps} */
	let {
		space,
		name,
		landmark,
		bonus = null,
		last = false,
		...attr
	} = $props();

	/** @type {Record<number, Array<{icon?: string, text?: string, count?: number, label?: string}>>} */
	const faces = {
		1: [{ icon: 'territory-tile', count: 2 }],
		2: [{ icon: 'explore' }],
		3: [{ icon: 'explore' }, { text: '/' }, { icon: 'building/farm' }],
		4: [{ icon: 'territory-tile' }, { text: '+' }, { icon: 'explore' }],
		5: [
			{ icon: 'victory-points' },
			{ text: '×' },
			{ icon: 'territory-tile', label: 'controlled' },
		],
		6: [
			{ icon: 'territory-tile' },
			{ text: '+' },
			{ icon: 'building/farm' },
		],
		7: [
			{ icon: 'territory-tile', count: 2 },
			{ text: '+' },
			{ icon: 'explore' },
		],
		8: [
			{ icon: 'building/farm' },
			{ text: '+' },
			{ icon: 'victory-points' },
			{ text: '×' },
			{ icon: 'building/farm' },
		],
		9: [
			{ icon: 'territory-tile', count: 2 },
			{ text: '+' },
			{ icon: 'explore-anywhere', label: 'anywhere' },
		],
		10: [
			{ icon: 'victory-points' },
			{ text: '×' },
			{ icon: 'track/technology' },
		],
		11: [
			{ icon: 'space-tile', count: 3 },
			{ text: '+' },
			{ icon: 'explore-space', label: 'one of these' },
		],
		12: [{ icon: 'explore-space' }],
	};

	/** @param {import('../../glyphs.js').Glyph} glyph */
	function iconFor(glyph) {
		if (glyph.kind === 'resource') return `resource-24/${glyph.id}`;
		if (glyph.kind === 'building') return `building/${glyph.id}`;
		if (glyph.kind === 'track') return `track/${glyph.id}`;
		if (glyph.kind === 'vp') return 'symbol/victory-points';
		if (glyph.kind !== 'word') return null;
		return (
			{
				Tile: 'symbol/territory-tile',
				Tapestry: 'symbol/tapestry-card',
				'Space tile': 'symbol/space-tile',
				Explore: 'symbol/explore',
				'Explore space': 'symbol/explore-space',
			}[glyph.text] ?? null
		);
	}

	/** @param {string} icon */
	function isTileIcon(icon) {
		return icon === 'territory-tile' || icon === 'space-tile';
	}
</script>

<span
	{...attr}
	class="rg-exploration-face {attr.class ? attr.class : ''}"
	class:rg-exploration-face--space-sequence={space === 11}
	class:rg-exploration-face--compact-main={space === 8}
	class:rg-exploration-face--tight-main={space === 7 || space === 9}
	class:rg-exploration-face--dense-bonus={space === 10}
	class:rg-exploration-face--plain={!bonus}
	class:rg-exploration-face--first={space === 1}
	class:rg-exploration-face--last={last}>
	<span class="rg-exploration-face--name">{name}</span>
	<span
		class="rg-exploration-face--main"
		aria-hidden="true">
		{#each faces[space] ?? [] as item, index (index)}
			{#if item.icon}
				<span class="rg-exploration-face--unit">
					{#each Array.from( { length: isTileIcon(item.icon) ? (item.count ?? 1) : 1 } ) as _}
						<img
							class:rg-exploration-face--cup={item.icon ===
								'victory-points'}
							src={artUrl(
								item.icon.includes('/')
									? item.icon
									: `symbol/${item.icon}`
							)}
							alt=""
							draggable="false" />
					{/each}
					{#if item.count && !isTileIcon(item.icon)}<b
							class="rg-exploration-face--count">×{item.count}</b
						>{/if}
					{#if item.label}<small>{item.label}</small>{/if}
				</span>
			{:else}
				<span class="rg-exploration-face--operator">{item.text}</span>
			{/if}
		{/each}
	</span>
	<span
		class="rg-exploration-face--bonus"
		class:rg-exploration-face--bonus--empty={!bonus}
		aria-hidden="true">
		{#if bonus}
			<span class="rg-exploration-face--bonus-rule">
				{#each bonus.pay as glyph, index (index)}
					{@const icon = iconFor(glyph)}
					{#if icon}
						<span class="rg-exploration-face--bonus-unit"
							>{#each Array.from( { length: glyph.kind === 'word' && (glyph.text === 'Tile' || glyph.text === 'Space tile') ? glyph.count : 1 } ) as _}<img
									class:rg-exploration-face--cup={icon ===
										'symbol/victory-points'}
									src={artUrl(icon)}
									alt=""
									draggable="false" />{/each}{#if 'count' in glyph && typeof glyph.count === 'number' && glyph.count > 1 && !(glyph.kind === 'word' && (glyph.text === 'Tile' || glyph.text === 'Space tile'))}<b
									>×{glyph.count}</b
								>{/if}</span>
					{:else if glyph.kind === 'word'}<span>{glyph.text}</span
						>{/if}
				{/each}
				<strong class="rg-exploration-face--bonus-separator">:</strong>
				{#each bonus.gain as glyph, index (index)}
					{@const icon = iconFor(glyph)}
					{#if icon}
						<span class="rg-exploration-face--bonus-unit"
							>{#each Array.from( { length: glyph.kind === 'word' && (glyph.text === 'Tile' || glyph.text === 'Space tile') ? glyph.count : 1 } ) as _}<img
									class:rg-exploration-face--cup={icon ===
										'symbol/victory-points'}
									src={artUrl(icon)}
									alt=""
									draggable="false" />{/each}{#if 'count' in glyph && typeof glyph.count === 'number' && glyph.count > 1 && glyph.kind !== 'vp' && !(glyph.kind === 'word' && (glyph.text === 'Tile' || glyph.text === 'Space tile'))}<b
									>×{glyph.count}</b
								>{/if}{#if glyph.kind === 'vp'}<b
									>{glyph.count}</b
								>{/if}</span>
					{:else if glyph.kind === 'word'}<span>{glyph.text}</span
						>{/if}
				{/each}
			</span>
		{/if}
	</span>
	{#if landmark}
		<TrackLandmark
			id={landmark.toLowerCase().replaceAll(' ', '-')}
			name={landmark}
			class="rg-exploration-face--landmark" />
	{/if}
</span>

<style>
	.rg-exploration-face {
		position: relative;
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		grid-template-rows: 16px minmax(30px, 1fr) 29px 25px;
		gap: 1px;
		width: 100%;
		height: 100%;
		min-width: 0;
		font-family: var(--font-body);
	}
	.rg-exploration-face--name {
		align-self: start;
		padding-right: 15px;
		font: var(--weight-title)
			var(--rg-track-space-text, var(--font-size-3xs)) /
			var(--leading-tight) var(--font-title);
	}
	.rg-exploration-face--main {
		display: flex;
		justify-content: center;
		align-content: center;
		align-items: flex-start;
		text-align: center;
		gap: 2px;
		min-width: 0;
		color: var(--text);
		translate: calc(var(--track-tip) / 2 - 2px) 0;
	}
	.rg-exploration-face--plain .rg-exploration-face--main {
		position: absolute;
		top: 50%;
		left: 0;
		right: 0;
		transform: translateY(-50%);
		align-items: center;
		translate: calc(var(--track-tip) - 2px) 0;
	}
	.rg-exploration-face--first .rg-exploration-face--main {
		translate: calc(var(--track-tip) / 4 - 2px) 0;
	}
	.rg-exploration-face--last .rg-exploration-face--main {
		translate: calc(var(--track-tip) / 2 - 2px) 0;
	}
	.rg-exploration-face:not(.rg-exploration-face--plain)
		.rg-exploration-face--main {
		position: absolute;
		top: calc(25% + 5px);
		left: 0;
		right: 0;
		transform: translateY(-50%);
		align-items: center;
	}
	.rg-exploration-face--tight-main .rg-exploration-face--main,
	.rg-exploration-face--compact-main .rg-exploration-face--main {
		gap: 0;
	}
	.rg-exploration-face--space-sequence .rg-exploration-face--main {
		display: grid;
		top: 22%;
		bottom: 15px;
		transform: none;
		grid-template-rows: minmax(24px, 1fr) 24px minmax(34px, 1fr);
		justify-items: center;
		align-items: center;
		gap: 0;
	}
	.rg-exploration-face--space-sequence
		.rg-exploration-face--unit:first-child {
		width: 100%;
		gap: 1px;
	}
	.rg-exploration-face--space-sequence
		.rg-exploration-face--unit:first-child
		img {
		width: 23px;
		height: 23px;
	}
	.rg-exploration-face--space-sequence .rg-exploration-face--operator {
		grid-row: 2;
		margin: 0;
	}
	.rg-exploration-face--space-sequence .rg-exploration-face--unit:last-child {
		grid-row: 3;
		flex-direction: column;
		gap: 1px;
	}
	.rg-exploration-face--space-sequence
		.rg-exploration-face--unit:last-child
		small {
		position: static;
		transform: none;
	}
	.rg-exploration-face--space-sequence .rg-exploration-face--bonus {
		display: none;
	}
	.rg-exploration-face--unit {
		display: inline-flex;
		gap: 1px;
		align-items: center;
		justify-content: center;
		position: relative;
		flex: none;
		min-width: 18px;
	}
	.rg-exploration-face--unit img {
		display: block;
		width: 23px;
		height: 23px;
		object-fit: contain;
		image-rendering: pixelated;
	}
	.rg-exploration-face--unit .rg-exploration-face--cup,
	.rg-exploration-face--bonus-unit .rg-exploration-face--cup {
		width: var(--rg-vp-cup-size, 23px);
		height: var(--rg-vp-cup-size, 23px);
	}
	.rg-exploration-face--unit img + img {
		margin-left: -2px;
	}
	.rg-exploration-face--unit small {
		position: absolute;
		top: calc(100% + 1px);
		left: 50%;
		transform: translateX(-50%);
		white-space: nowrap;
		font: var(--weight-regular) var(--font-size-3xs) / 1 var(--font-body);
		color: var(--muted);
	}
	.rg-exploration-face--count {
		position: absolute;
		right: -8px;
		bottom: -3px;
		color: var(--text);
		font: var(--weight-bold) var(--font-size-3xs) / 1 var(--font-body);
	}
	.rg-exploration-face--operator {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: none;
		height: 24px;
		color: var(--gold);
		font: var(--weight-bold) var(--font-size-md) / 1 var(--font-body);
		margin-inline: 2px;
	}
	.rg-exploration-face--bonus {
		position: absolute;
		top: 50%;
		bottom: 24px;
		left: 0;
		right: 0;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 1px;
		padding-inline: 2px;
		background: transparent;
		color: var(--gold);
	}
	.rg-exploration-face--bonus--empty {
		display: none;
	}
	.rg-exploration-face--bonus-rule {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 2px;
		white-space: nowrap;
		font: var(--weight-bold) var(--font-size-3xs) / 1 var(--font-body);
		translate: calc(var(--track-tip) / 2 + 1px) 0;
	}
	.rg-exploration-face--first .rg-exploration-face--bonus-rule,
	.rg-exploration-face--last .rg-exploration-face--bonus-rule {
		translate: calc(var(--track-tip) / 4 + 1px) 0;
	}
	.rg-exploration-face--bonus-unit {
		display: inline-flex;
		align-items: center;
		gap: 1px;
	}
	.rg-exploration-face--bonus-unit img {
		display: block;
		width: 20px;
		height: 20px;
		object-fit: contain;
		image-rendering: pixelated;
	}
	.rg-exploration-face--dense-bonus .rg-exploration-face--bonus-rule {
		gap: 1px;
	}
	.rg-exploration-face--dense-bonus .rg-exploration-face--bonus-unit img {
		width: 17px;
		height: 17px;
	}
	.rg-exploration-face--dense-bonus
		.rg-exploration-face--bonus-unit
		img
		+ img {
		margin-left: -3px;
	}
	.rg-exploration-face--bonus-unit b {
		font: var(--weight-bold) var(--font-size-3xs) / 1 var(--font-body);
	}
	.rg-exploration-face--bonus-separator {
		color: var(--gold);
		font: var(--weight-bold) var(--font-size-2xs) / 1 var(--font-body);
		margin-inline: 3px;
	}
	:global(.rg-exploration-face--landmark) {
		grid-row: 4;
	}
	@container (max-height: 112px) {
		.rg-exploration-face {
			grid-template-rows: 16px minmax(30px, 1fr) 29px 25px;
		}
		.rg-exploration-face--unit img {
			width: 24px;
			height: 24px;
		}
		.rg-exploration-face--compact-main .rg-exploration-face--unit img {
			width: 18px;
			height: 18px;
		}
		.rg-exploration-face--bonus-unit img {
			width: 19px;
			height: 19px;
		}
	}
	@container (min-width: 125px) and (min-height: 135px) {
		.rg-exploration-face--unit img {
			width: 27px;
			height: 27px;
		}
		.rg-exploration-face--bonus-unit img {
			width: 24px;
			height: 24px;
		}
	}
	.rg-exploration-face--bonus-unit img.rg-exploration-face--cup {
		width: var(--rg-vp-cup-size, 23px);
		height: var(--rg-vp-cup-size, 23px);
	}
</style>
