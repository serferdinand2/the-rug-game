<!-- One player's card in the players overview: name and VP, civilization and era, resources, tracks and public summary rows. -->
<script module>
	/** @typedef {'civilization' | 'capital' | 'tech'} PlayerCardRow - A summary row that opens a detail view */

	/**
	 * Properties of the PlayerCard component itself.
	 * @typedef {Object} PlayerCardOwnProps
	 * @property {string} name - The player's name, such as 'Ana'
	 * @property {import('../../ui.js').Seat} seat - Their seat, which sets the border colour
	 * @property {number} vp - Their victory points
	 * @property {boolean} [you=false] - This is the viewing player: the YOU badge and an extra ring in their colour
	 * @property {boolean} [host=false] - This player created the table: the HOST badge
	 * @property {string} civilization - Their civilization, such as 'Militants'
	 * @property {number} era - Their current era, 1–5, shown as a Roman numeral
	 * @property {Record<import('../../ui.js').ResourceId, number>} resources - How many of each resource they hold
	 * @property {Record<import('../../ui.js').TrackId, number>} tracks - The space they have reached on each track, 0–12
	 * @property {number} handSize - How many cards they hold; only the count is public
	 * @property {number} capitalPoints - Points their capital city has scored
	 * @property {number} tech - How many tech cards they have
	 * @property {string[]} [terrain=[]] - Terrain names, such as ['Mountain', 'Forest']
	 * @property {PlayerCardRow | null} [selected=null] - The summary row whose detail is open
	 * @property {Function} [onPlayerCardSelect] - Callback fired with the row id when a summary row is pressed
	 */

	/**
	 * Properties for the PlayerCard component, including any attributes for its root element.
	 * @typedef {PlayerCardOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} PlayerCardProps
	 *
	 * @example
	 * <PlayerCard
	 *   name="Ana"
	 *   seat={2}
	 *   vp={41}
	 *   civilization="Militants"
	 *   era={3}
	 *   resources={{ coin: 4, food: 2, worker: 1, culture: 0 }}
	 *   tracks={{ exploration: 2, science: 1, technology: 0, military: 6 }}
	 *   handSize={3}
	 *   capitalPoints={15}
	 *   tech={1}
	 *   terrain={['Desert', 'Grassland']}
	 *   selected={row}
	 *   onPlayerCardSelect={(event) => (row = event.value)}
	 * />
	 */
</script>

<script>
	import Badge from '../ui/Badge.svelte';
	import ResourceChip from './ResourceChip.svelte';
	import { ComponentEvent } from '../../component-event.js';
	import {
		RESOURCES,
		TRACKS,
		playerColor,
		roman,
		trackColor,
		trackTextColor,
	} from '../../ui.js';

	/** @type {PlayerCardProps} */
	let {
		name,
		seat,
		vp,
		you = false,
		host = false,
		civilization,
		era,
		resources,
		tracks,
		handSize,
		capitalPoints,
		tech,
		terrain = [],
		selected = null,
		onPlayerCardSelect,
		...attr
	} = $props();

	/**
	 * @param {MouseEvent} event
	 * @param {PlayerCardRow} row
	 */
	const rowClickHandler = (event, row) => {
		if (typeof onPlayerCardSelect === 'function') {
			const target = /** @type {HTMLButtonElement} */ (
				event.currentTarget
			);
			onPlayerCardSelect(new ComponentEvent(row, target, event));
		}
	};
</script>

<article
	aria-label="{name}, {vp} VP"
	{...attr}
	class="rg-player-card {attr.class ? attr.class : ''}"
	class:rg-player-card--you={you}
	style:--rg-player-card-color={playerColor(seat)}>
	<div class="rg-player-card--head">
		{#if you || host}
			<span class="rg-player-card--badges">
				{#if you}
					<Badge
						label="You"
						variant="caps" />
				{/if}
				{#if you && host}
					<span
						class="rg-player-card--separator"
						aria-hidden="true">·</span>
				{/if}
				{#if host}
					<Badge
						label="Host"
						variant="caps" />
				{/if}
			</span>
		{/if}
		<h2 class="rg-player-card--name">{name}</h2>
		<strong class="rg-player-card--vp">{vp} VP</strong>
	</div>

	<button
		type="button"
		class="rg-player-card--civilization rg-player-card--selectable"
		class:rg-player-card--selected={selected === 'civilization'}
		aria-pressed={selected === 'civilization'}
		onclick={(event) => rowClickHandler(event, 'civilization')}
		>{civilization}
		<span class="rg-player-card--era">· Era {roman(era)}</span></button>

	<section class="rg-player-card--section">
		<h3 class="rg-player-card--heading">Resources</h3>
		<div class="rg-player-card--resources">
			{#each RESOURCES as resource (resource.id)}
				<ResourceChip
					resource={resource.id}
					count={resources[resource.id]} />
			{/each}
		</div>
	</section>

	<section
		class="rg-player-card--section rg-player-card--tracks"
		aria-label="Tracks">
		{#each TRACKS as track (track.id)}
			<span
				class="rg-player-card--track"
				style:--rg-player-card-track={trackColor(track.id)}
				style:--rg-player-card-track-text={trackTextColor(track.id)}>
				<span class="rg-player-card--track-name">{track.name}</span>
				<i
					class="rg-player-card--track-rule"
					aria-hidden="true"></i>
				<b class="rg-player-card--track-space">{tracks[track.id]}</b>
			</span>
		{/each}
	</section>

	<div class="rg-player-card--public">
		<div class="rg-player-card--row">
			<span>Hand size</span>
			<b class="rg-player-card--value">{handSize}</b>
		</div>
		<button
			type="button"
			class="rg-player-card--row rg-player-card--selectable"
			class:rg-player-card--selected={selected === 'capital'}
			aria-pressed={selected === 'capital'}
			onclick={(event) => rowClickHandler(event, 'capital')}>
			<span>Capital</span>
			<b class="rg-player-card--value">{capitalPoints} points</b>
		</button>
		<button
			type="button"
			class="rg-player-card--row rg-player-card--selectable"
			class:rg-player-card--selected={selected === 'tech'}
			aria-pressed={selected === 'tech'}
			onclick={(event) => rowClickHandler(event, 'tech')}>
			<span>Tech</span>
			<b class="rg-player-card--value">{tech}</b>
		</button>
		<div class="rg-player-card--row">
			<span>Terrain</span>
			<span class="rg-player-card--tags">
				{#each terrain as name (name)}
					<i class="rg-player-card--tag">{name}</i>
				{/each}
			</span>
		</div>
	</div>
</article>

<style>
	.rg-player-card {
		display: flex;
		flex-direction: column;
		min-width: 0;
		padding: calc(var(--space-8) + var(--space-1));
		border: var(--border-thick) solid var(--rg-player-card-color);
		border-radius: var(--radius);
		background: var(--control);
		box-shadow: var(--shadow-card);
		color: var(--text);
	}

	.rg-player-card--you {
		box-shadow:
			0 0 0 1px
				color-mix(in srgb, var(--rg-player-card-color) 65%, transparent),
			var(--shadow-card);
	}

	.rg-player-card--selectable {
		position: relative;
		cursor: pointer;
	}

	.rg-player-card--selectable:hover,
	.rg-player-card--selectable:focus-visible {
		color: var(--gold);
	}

	.rg-player-card--selectable.rg-player-card--selected {
		z-index: 1;
		border-bottom-color: transparent;
		background: var(--raised);
		box-shadow: 0 0 0 var(--space-3) var(--raised);
		color: var(--text);
	}

	.rg-player-card--selected > span,
	.rg-player-card--selected > b {
		color: var(--text);
	}

	.rg-player-card--head {
		display: flex;
		align-items: center;
		gap: var(--space-5);
		padding-bottom: var(--space-7);
		border-bottom: var(--border) solid var(--line);
	}

	.rg-player-card--badges {
		display: inline-flex;
		flex: none;
		align-items: center;
		gap: var(--space-2);
	}

	.rg-player-card--separator {
		color: var(--text);
		font-size: var(--font-size-3xs);
		font-weight: var(--weight-bold);
		line-height: var(--leading-none);
	}

	.rg-player-card--name {
		min-width: 0;
		margin: 0;
		overflow: hidden;
		font: var(--weight-bold) var(--font-size-2xl) / var(--leading-none)
			var(--font-body);
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.rg-player-card--vp {
		flex: none;
		margin-left: auto;
		color: var(--text);
		font-size: var(--font-size-xl);
	}

	.rg-player-card--civilization {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		width: 100%;
		height: 34px;
		margin: var(--space-7) 0 var(--space-2);
		padding: 0;
		border: 0;
		border-radius: var(--radius);
		background: transparent;
		color: var(--gold);
		font: var(--weight-title) var(--font-size-lg) / var(--leading-tight)
			var(--font-title);
		letter-spacing: var(--letter-spacing-title);
		text-align: left;
	}

	.rg-player-card--era {
		color: var(--muted);
		font: var(--weight-bold) var(--font-size-xs) / var(--leading-none)
			var(--font-body);
		letter-spacing: var(--letter-spacing-caps);
		text-transform: uppercase;
	}

	.rg-player-card--section {
		margin-top: var(--space-6);
	}

	.rg-player-card--heading {
		margin: 0 0 var(--space-3);
		color: var(--muted);
		font: var(--weight-bold) var(--font-size-2xs) / var(--leading-none)
			var(--font-body);
		letter-spacing: var(--letter-spacing-wide);
		text-transform: uppercase;
	}

	.rg-player-card--resources {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: var(--space-2);
	}

	.rg-player-card--tracks {
		display: grid;
		gap: var(--space-2);
	}

	.rg-player-card--track {
		display: grid;
		grid-template-columns: auto minmax(20px, 1fr) auto;
		align-items: center;
		gap: var(--space-4);
		color: var(--rg-player-card-track-text);
	}

	.rg-player-card--track-name {
		font: var(--weight-title) var(--font-size-2xs) / var(--leading-none)
			var(--font-title);
		letter-spacing: var(--letter-spacing-title);
	}

	.rg-player-card--track-rule {
		height: 1px;
		background: color-mix(
			in srgb,
			var(--rg-player-card-track) 52%,
			var(--line)
		);
	}

	.rg-player-card--track-space {
		font-weight: var(--weight-bold);
		line-height: var(--leading-none);
	}

	.rg-player-card--public {
		display: grid;
		margin-top: var(--space-6);
		border-top: var(--border) solid var(--line);
	}

	.rg-player-card--row {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		width: 100%;
		height: 34px;
		padding: 0 var(--space-4);
		border: 0;
		border-bottom: var(--border) solid
			color-mix(in srgb, var(--line) 53%, transparent);
		border-radius: var(--radius);
		background: transparent;
		color: var(--muted);
		font: var(--weight-regular) var(--font-size-xs) / normal
			var(--font-body);
		text-align: left;
	}

	.rg-player-card--value {
		margin-left: auto;
		color: var(--text);
		font-size: var(--font-size-sm);
		font-weight: var(--weight-bold);
	}

	.rg-player-card--tags {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: var(--space-2);
		margin-left: auto;
	}

	.rg-player-card--tag {
		padding: var(--space-1) var(--space-3);
		border: var(--border) solid var(--line);
		border-radius: var(--radius);
		color: var(--text);
		font: var(--weight-title) var(--font-size-3xs) / var(--leading-none)
			var(--font-title);
		font-style: normal;
		letter-spacing: var(--letter-spacing-title);
	}
</style>
