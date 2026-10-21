<!-- The shared-area selector between the Advancement Tracks and the World Map: an icon each, the chosen one titled and coloured. -->
<script module>
	/** @typedef {'tracks' | 'map'} BoardView */

	/**
	 * Properties of the BoardSwitcher component itself.
	 * @typedef {Object} BoardSwitcherOwnProps
	 * @property {BoardView} [value='tracks'] - The board on show; bindable
	 * @property {Function} [onBoardSwitcherChange] - Callback fired with the new view when the player picks the other board
	 */

	/**
	 * Properties for the BoardSwitcher component, including any attributes for its root nav.
	 * @typedef {BoardSwitcherOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} BoardSwitcherProps
	 *
	 * @example
	 * <BoardSwitcher bind:value={board} />
	 */
</script>

<script>
	import { ComponentEvent } from '../../component-event.js';
	import { TRACKS, terrainColor, trackColor } from '../../ui.js';

	/** @type {BoardSwitcherProps} */
	let {
		value = $bindable('tracks'),
		onBoardSwitcherChange,
		...attr
	} = $props();

	/** @type {readonly { value: BoardView, title: string }[]} */
	const CHOICES = [
		{ value: 'tracks', title: 'Advancement Tracks' },
		{ value: 'map', title: 'World Map' },
	];
	// Four short right-pointing bands, coloured like the tracks when chosen.
	const TRACK_MARKS = [
		'1,2 44,2 53,5.5 44,9 1,9',
		'1,9.5 44,9.5 53,13 44,16.5 1,16.5',
		'1,17 44,17 53,20.5 44,24 1,24',
		'1,24.5 44,24.5 53,28 44,31.5 1,31.5',
	].map((points, index) => ({ points, color: trackColor(TRACKS[index].id) }));
	// Seven point-up hexagons, 2 / 3 / 2, coloured like terrain when chosen.
	const HEX_MARKS = [
		['21,1 26.2,4 26.2,10 21,13 15.8,10 15.8,4', terrainColor('forest')],
		['33,1 38.2,4 38.2,10 33,13 27.8,10 27.8,4', terrainColor('grassland')],
		['15,10 20.2,13 20.2,19 15,22 9.8,19 9.8,13', terrainColor('desert')],
		[
			'27,10 32.2,13 32.2,19 27,22 21.8,19 21.8,13',
			terrainColor('mountain'),
		],
		['39,10 44.2,13 44.2,19 39,22 33.8,19 33.8,13', terrainColor('sea')],
		['21,19 26.2,22 26.2,28 21,31 15.8,28 15.8,22', terrainColor('forest')],
		['33,19 38.2,22 38.2,28 33,31 27.8,28 27.8,22', 'var(--bronze)'],
	].map(([points, color]) => ({ points, color }));

	/**
	 * @param {MouseEvent} event
	 * @param {BoardView} view
	 */
	const choiceClickHandler = (event, view) => {
		if (view === value) {
			return;
		}
		value = view;
		if (typeof onBoardSwitcherChange === 'function') {
			const target = /** @type {HTMLButtonElement} */ (
				event.currentTarget
			);
			onBoardSwitcherChange(new ComponentEvent(value, target, event));
		}
	};
</script>

<nav
	aria-label="Shared board view"
	{...attr}
	class="rg-board-switcher {attr.class ? attr.class : ''}">
	{#each CHOICES as choice (choice.value)}
		{@const active = value === choice.value}
		<button
			type="button"
			class="rg-board-switcher--choice"
			class:rg-board-switcher--active={active}
			aria-pressed={active}
			title={active ? undefined : choice.title}
			onclick={(event) => choiceClickHandler(event, choice.value)}>
			{#if choice.value === 'tracks'}
				<svg
					class="rg-board-switcher--icon rg-board-switcher--tracks-icon"
					viewBox="0 0 54 32"
					preserveAspectRatio="none"
					aria-hidden="true">
					{#each TRACK_MARKS as mark (mark.points)}
						<polygon
							class="rg-board-switcher--track-mark"
							points={mark.points}
							style:--rg-board-switcher-mark={mark.color} />
					{/each}
				</svg>
			{:else}
				<svg
					class="rg-board-switcher--icon"
					viewBox="0 0 54 32"
					aria-hidden="true">
					{#each HEX_MARKS as mark (mark.points)}
						<polygon
							class="rg-board-switcher--hex-mark"
							points={mark.points}
							style:--rg-board-switcher-mark={mark.color} />
					{/each}
				</svg>
			{/if}
			<strong class="rg-board-switcher--title">{choice.title}</strong>
		</button>
	{/each}
</nav>

<style>
	.rg-board-switcher {
		display: flex;
		align-items: center;
		gap: var(--space-4);
	}

	.rg-board-switcher--choice {
		position: relative;
		display: flex;
		align-items: center;
		gap: var(--space-4);
		min-height: var(--control-size);
		padding: var(--space-2) var(--space-4);
		border: 0;
		border-radius: var(--radius);
		background: transparent;
		color: var(--faint);
		transition:
			background var(--duration-fast) var(--ease),
			color var(--duration-fast) var(--ease);
	}

	/* Not in the mockup: a faint hover, so the icon-only choice reads as a button. */
	.rg-board-switcher--choice:hover {
		background: color-mix(in srgb, var(--raised) 50%, transparent);
	}

	/* The chosen board keeps the raised highlight without hover. */
	.rg-board-switcher--active,
	.rg-board-switcher--active:hover {
		background: var(--raised);
		color: var(--text);
	}

	.rg-board-switcher--icon {
		flex: none;
		width: 54px;
		height: 32px;
		overflow: visible;
	}

	.rg-board-switcher--tracks-icon {
		width: 43.2px;
	}

	.rg-board-switcher--track-mark,
	.rg-board-switcher--hex-mark {
		fill: var(--faint);
		stroke: var(--surface);
		stroke-linejoin: miter;
		transition: fill var(--duration-fast) var(--ease);
	}

	.rg-board-switcher--track-mark {
		stroke-width: 0.75;
	}

	.rg-board-switcher--hex-mark {
		stroke-width: 1;
	}

	.rg-board-switcher--active .rg-board-switcher--track-mark,
	.rg-board-switcher--active .rg-board-switcher--hex-mark {
		fill: var(--rg-board-switcher-mark);
	}

	.rg-board-switcher--title {
		font: var(--weight-bold) var(--font-size-base) / var(--leading-none)
			var(--font-body);
		letter-spacing: var(--letter-spacing-button);
		white-space: nowrap;
	}

	/* Collapsed but still the button's accessible name. */
	.rg-board-switcher--choice:not(.rg-board-switcher--active)
		.rg-board-switcher--title {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
	}
</style>
