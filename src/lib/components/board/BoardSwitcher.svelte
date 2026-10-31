<!-- The shared-area selector between the Advancement Tracks and the World Map: an icon each, the chosen one titled and coloured. -->
<script module>
	/** @typedef {import('../../board-icons.js').BoardView} BoardView */

	/**
	 * Properties of the BoardSwitcher component itself.
	 * @typedef {Object} BoardSwitcherOwnProps
	 * @property {BoardView} [value='tracks'] - The board on show; bindable
	 * @property {readonly import('../../ui.js').TrackId[]} [tracks] - The tracks on the board, one band each in the icon; the base game's four by default (#120)
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
	import { boardChoices } from '../../board-icons.js';
	import { ComponentEvent } from '../../component-event.js';
	import { TRACKS } from '../../ui.js';

	/** @type {BoardSwitcherProps} */
	let {
		value = $bindable('tracks'),
		tracks = TRACKS.map((track) => track.id),
		onBoardSwitcherChange,
		...attr
	} = $props();

	let choices = $derived(boardChoices(tracks));

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
	{#each choices as choice (choice.value)}
		{@const active = value === choice.value}
		{@const bands = choice.value === 'tracks'}
		<button
			type="button"
			class="rg-board-switcher--choice"
			class:rg-board-switcher--active={active}
			aria-pressed={active}
			title={active ? undefined : choice.title}
			onclick={(event) => choiceClickHandler(event, choice.value)}>
			<!-- The track bands stretch into the narrower tracks icon; the hexes keep their shape. -->
			<svg
				class="rg-board-switcher--icon"
				class:rg-board-switcher--tracks-icon={bands}
				viewBox={choice.viewBox}
				preserveAspectRatio={bands ? 'none' : undefined}
				aria-hidden="true">
				{#each choice.marks as mark, index (index)}
					<polygon
						class:rg-board-switcher--track-mark={bands}
						class:rg-board-switcher--hex-mark={!bands}
						points={mark.points}
						style:--rg-board-switcher-mark={mark.color} />
				{/each}
			</svg>
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
		background: color-mix(in srgb, var(--raised) 50%, transparent);
		color: var(--faint);
		transition:
			background var(--duration-fast) var(--ease),
			color var(--duration-fast) var(--ease);
	}

	/* Keep the hover glow inside the two board controls. */
	.rg-board-switcher--choice:not(.rg-board-switcher--active):is(
			:hover,
			:focus-visible
		) {
		box-shadow: inset 0 0 12px
			color-mix(in srgb, var(--gold) 48%, transparent);
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
