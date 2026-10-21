<!-- A header chip for one player: their colour, name, civilization and VP, and the colour fill while the players overview is open. -->
<script module>
	/**
	 * Properties of the PlayerChip component itself.
	 * @typedef {Object} PlayerChipOwnProps
	 * @property {string} name - The player's name, such as 'Ana'
	 * @property {string} civilization - Their civilization, such as 'Militants'
	 * @property {number} vp - Their victory points
	 * @property {import('../../ui.js').Seat} seat - Their seat, which sets the colour
	 * @property {boolean} [current=false] - It is this player's turn: the green glow and an outline in their colour
	 * @property {boolean} [filled=false] - The players overview is open: the colour slides across the chip and its text hides, at the same size
	 * @property {Function} [onPlayerChipClick] - Callback fired when the chip is pressed, to open or close the players overview
	 */

	/**
	 * Properties for the PlayerChip component, including any attributes for its root button.
	 * @typedef {PlayerChipOwnProps & import('svelte/elements').HTMLButtonAttributes} PlayerChipProps
	 *
	 * @example
	 * <PlayerChip
	 *   name="Ana"
	 *   civilization="Militants"
	 *   vp={41}
	 *   seat={2}
	 *   current
	 *   filled={overviewOpen}
	 *   onPlayerChipClick={() => (overviewOpen = !overviewOpen)}
	 * />
	 */
</script>

<script>
	import { ComponentEvent } from '../../component-event.js';
	import { playerColor } from '../../ui.js';

	/** @type {PlayerChipProps} */
	let {
		name,
		civilization,
		vp,
		seat,
		current = false,
		filled = false,
		onPlayerChipClick,
		...attr
	} = $props();

	let label = $derived(
		`${name}, ${civilization}, ${vp} VP${current ? ', current player' : ''}`
	);

	/**
	 * @param {MouseEvent} event
	 */
	const clickHandler = (event) => {
		if (typeof onPlayerChipClick === 'function') {
			const target = /** @type {HTMLButtonElement} */ (
				event.currentTarget
			);
			onPlayerChipClick(new ComponentEvent({ seat }, target, event));
		}
	};
</script>

<button
	type="button"
	aria-label={label}
	aria-expanded={filled}
	{...attr}
	class="rg-player-chip {attr.class ? attr.class : ''}"
	class:rg-player-chip--current={current}
	class:rg-player-chip--filled={filled}
	style:--rg-player-chip-color={playerColor(seat)}
	onclick={clickHandler}>
	<i
		class="rg-player-chip--color"
		aria-hidden="true"></i>
	<b class="rg-player-chip--name">{name}</b>
	<small class="rg-player-chip--civilization"
		>{civilization}
		<span class="rg-player-chip--score">· {vp} VP</span></small>
</button>

<style>
	.rg-player-chip {
		position: relative;
		display: grid;
		grid-template-columns: 29px auto auto;
		flex: 0 0 210px;
		align-items: center;
		gap: var(--space-4);
		width: 210px;
		min-width: 210px;
		padding: var(--space-4) var(--space-5) var(--space-4) 0;
		overflow: hidden;
		border: 0;
		border-radius: var(--radius);
		background: var(--control);
		color: var(--muted);
		text-align: left;
		transition:
			background var(--duration-fast) var(--ease),
			outline-color var(--duration-fast) var(--ease);
	}

	.rg-player-chip:hover {
		background: var(--raised);
		outline: var(--border) solid var(--rg-player-chip-color);
	}

	.rg-player-chip--current,
	.rg-player-chip--current:hover {
		outline: var(--border-thick) solid var(--rg-player-chip-color);
		color: var(--text);
		box-shadow: var(--glow-current);
	}

	.rg-player-chip:focus-visible {
		background: var(--raised);
		outline: var(--focus-outline);
		outline-offset: var(--focus-offset);
	}

	.rg-player-chip--filled,
	.rg-player-chip--filled:hover {
		background: transparent;
	}

	.rg-player-chip--color {
		position: absolute;
		z-index: 0;
		top: 0;
		bottom: 0;
		left: 0;
		width: 29px;
		background: var(--rg-player-chip-color);
		transition: width var(--duration-slow) var(--ease-out);
	}

	.rg-player-chip--filled .rg-player-chip--color {
		width: 100%;
	}

	.rg-player-chip--name {
		position: relative;
		z-index: 1;
		grid-column: 2;
		overflow: hidden;
		color: var(--text);
		font-weight: var(--weight-bold);
		line-height: var(--leading-none);
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.rg-player-chip--civilization {
		position: relative;
		z-index: 1;
		grid-column: 3;
		margin-left: auto;
		color: var(--gold);
		font: var(--weight-title) var(--font-size-2xs) / var(--leading-none)
			var(--font-title);
		white-space: nowrap;
	}

	.rg-player-chip--score {
		color: var(--muted);
		font: var(--weight-regular) var(--font-size-2xs) / var(--leading-none)
			var(--font-body);
	}

	.rg-player-chip--filled .rg-player-chip--name,
	.rg-player-chip--filled .rg-player-chip--civilization {
		visibility: hidden;
	}
</style>
