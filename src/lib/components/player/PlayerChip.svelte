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
	 * @property {boolean} [bump=false] - Their VP just rose (#29): the score pops once in gold, unless the system asks for reduced motion
	 * @property {string} [ability] - The civilization's full ability, which hovering the chip shows after its name (#42)
	 * @property {Function} [onPlayerChipClick] - Callback fired when the chip is pressed, to show that player's tabs in the player area (#145)
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
	 *   onPlayerChipClick={() => (viewing = seat)}
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
		bump = false,
		ability,
		onPlayerChipClick,
		...attr
	} = $props();

	let label = $derived(
		`${name}, ${civilization}, ${vp} VP${current ? ', current player' : ''}`
	);
	let tooltip = $derived(ability ? `${label}\n\n${ability}` : label);

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

<!-- Narrow chips drop the civilization name but keep the VP; the tooltip still names it. -->
<button
	type="button"
	aria-label={label}
	title={tooltip}
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
		><span class="rg-player-chip--civilization-name">{civilization}</span>
		<span
			class="rg-player-chip--score"
			class:rg-player-chip--bump={bump}
			><span class="rg-player-chip--separator">·</span>
			{vp} VP</span
		></small>
</button>

<style>
	/* 210px wide, shrinking with its neighbours when the header is narrower than five full chips. */
	.rg-player-chip {
		position: relative;
		display: grid;
		grid-template-columns: 29px auto auto;
		flex: 0 1 210px;
		align-items: center;
		gap: var(--space-4);
		width: 210px;
		min-width: 120px;
		container-type: inline-size;
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

	/*
	 * A full-width strip, slid left until only the 29px square shows. Filling slides it across
	 * the chip: a transform animates without laying out the page again (#72).
	 */
	.rg-player-chip--color {
		position: absolute;
		z-index: 0;
		top: 0;
		bottom: 0;
		left: 0;
		width: 100%;
		background: var(--rg-player-chip-color);
		transform: translateX(calc(29px - 100%));
		transition: transform var(--duration-slow) var(--ease-out);
	}

	.rg-player-chip--filled .rg-player-chip--color {
		transform: none;
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
		display: inline-block;
		color: var(--muted);
		font: var(--weight-regular) var(--font-size-2xs) / var(--leading-none)
			var(--font-body);
	}

	/* VP that just rose pops once in gold (#29). */
	.rg-player-chip--bump {
		animation: rg-player-chip-bump 0.7s var(--ease-out);
	}

	@keyframes rg-player-chip-bump {
		35% {
			color: var(--gold);
			transform: scale(1.3);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.rg-player-chip--bump {
			animation: none;
		}
	}

	.rg-player-chip--filled .rg-player-chip--name,
	.rg-player-chip--filled .rg-player-chip--civilization {
		visibility: hidden;
	}

	@container (max-width: 190px) {
		.rg-player-chip--civilization-name,
		.rg-player-chip--separator {
			display: none;
		}
	}
</style>
