<!-- The hot-seat pass screen (#30): it names the next player and hides every hand until that player takes the screen. -->
<script module>
	/**
	 * Properties of the PassScreen component itself.
	 * @typedef {Object} PassScreenOwnProps
	 * @property {string} name - The player the screen passes to, such as 'Vera'
	 * @property {import('../../ui.js').Seat} seat - Their seat; sets the token and the colour
	 * @property {string} reason - Why the screen passes, from the public view, such as "It's Vera's turn."
	 * @property {number | null} [clockMs=null] - The player's clock in milliseconds when the table has a turn timer
	 * @property {boolean} [clockRunning=true] - false shows the clock paused
	 * @property {number} [armMs=600] - How long the button waits before it answers, so a click or key meant for the
	 *   last player's Confirm can't open the next player's view
	 * @property {boolean} [taking=false] - The player has taken the screen and their view is on its way
	 * @property {boolean} [announce=true] - Move the focus to the heading when the screen appears, so a screen reader
	 *   announces the hand-over; the library turns it off
	 * @property {Function} [onPassScreenTake] - Callback fired when the named player takes the screen; the value is
	 *   their seat
	 */

	/**
	 * Properties for the PassScreen component, including any attributes for its root section.
	 * @typedef {PassScreenOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} PassScreenProps
	 *
	 * @example
	 * <PassScreen
	 *   name="Vera"
	 *   seat={2}
	 *   reason="It's Vera's turn."
	 *   onPassScreenTake={() => store.takeSeat()} />
	 */
</script>

<script>
	import { onMount } from 'svelte';
	import { ComponentEvent } from '../../component-event.js';
	import { playerColor } from '../../ui.js';
	import PlayerToken from '../player/PlayerToken.svelte';
	import Button from './Button.svelte';
	import TurnClock from './TurnClock.svelte';

	/** @type {PassScreenProps} */
	let {
		name,
		seat,
		reason,
		clockMs = null,
		clockRunning = true,
		armMs = 600,
		taking = false,
		announce = true,
		onPassScreenTake,
		...attr
	} = $props();

	const uid = $props.id();
	/** Whether the button answers yet. */
	let armed = $state(false);
	/** @type {HTMLHeadingElement | undefined} */
	let heading = $state();

	// Each new player gets the wait again.
	$effect(() => {
		seat;
		armed = false;
		const timer = setTimeout(() => {
			armed = true;
		}, armMs);
		return () => clearTimeout(timer);
	});

	// The heading takes the focus, so a screen reader announces the hand-over; the button is never focused for the
	// player, so a key press can't take the screen by accident.
	onMount(() => {
		if (announce) {
			heading?.focus();
		}
	});

	/** @param {import('../../component-event.js').ComponentEvent} event */
	const takeHandler = (event) => {
		if (!armed || taking) {
			return;
		}
		if (typeof onPassScreenTake === 'function') {
			onPassScreenTake(
				new ComponentEvent(seat, event.target, event.originalEvent)
			);
		}
	};
</script>

<section
	{...attr}
	class="rg-pass-screen {attr.class ? attr.class : ''}"
	style:--rg-pass-screen-color={playerColor(seat)}
	aria-labelledby="{uid}-heading">
	<h1
		id="{uid}-heading"
		class="rg-pass-screen--heading"
		tabindex="-1"
		bind:this={heading}>
		<span class="rg-pass-screen--lead">Pass the screen to</span>
		<span class="rg-pass-screen--who">
			<PlayerToken
				{seat}
				size={48}
				decorative />
			<span class="rg-pass-screen--name">{name}</span>
		</span>
	</h1>
	<p class="rg-pass-screen--reason">{reason}</p>
	{#if clockMs !== null}
		<TurnClock
			{seat}
			{name}
			ms={clockMs}
			running={clockRunning} />
	{/if}
	<Button
		mode="gold"
		size="large"
		class="rg-pass-screen--take"
		aria-disabled={!armed || taking}
		onButtonClick={takeHandler}>
		I'm {name}
	</Button>
	<p
		class="rg-pass-screen--note"
		aria-live="polite">
		{taking
			? `Opening ${name}'s view…`
			: `${name}'s hand and cards stay hidden until ${name} opens them.`}
	</p>
</section>

<style>
	.rg-pass-screen {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-7);
		width: min(100%, var(--launch-width));
		padding: var(--space-11) var(--space-10);
		border: var(--border) solid var(--line-soft);
		border-top: var(--border-thick) solid var(--rg-pass-screen-color);
		border-radius: var(--radius);
		background: var(--chrome);
		box-shadow: var(--shadow-float);
		text-align: center;
		animation: rg-pass-screen-in var(--duration-medium) var(--ease-out);
	}

	.rg-pass-screen--heading {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-5);
		margin: 0;
		outline: none;
	}

	.rg-pass-screen--lead {
		color: var(--muted);
		font: var(--weight-bold) var(--font-size-sm) / var(--leading-tight)
			var(--font-body);
		letter-spacing: var(--letter-spacing-caps);
		text-transform: uppercase;
	}

	.rg-pass-screen--who {
		display: inline-flex;
		align-items: center;
		gap: var(--space-5);
	}

	.rg-pass-screen--name {
		color: var(--gold);
		font: var(--weight-title) var(--font-size-6xl) / var(--leading-none)
			var(--font-title);
		letter-spacing: var(--letter-spacing-title);
		text-shadow: var(--text-glow-gold);
		overflow-wrap: anywhere;
	}

	.rg-pass-screen--reason {
		margin: 0;
		color: var(--text);
		font: var(--weight-regular) var(--font-size-lg) / var(--leading-snug)
			var(--font-body);
	}

	.rg-pass-screen--note {
		margin: 0;
		color: var(--muted);
		font: var(--weight-regular) var(--font-size-sm) / var(--leading-normal)
			var(--font-body);
	}

	.rg-pass-screen :global(.rg-pass-screen--take[aria-disabled='true']) {
		opacity: 0.6;
		cursor: default;
	}

	@keyframes rg-pass-screen-in {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.rg-pass-screen {
			animation: none;
		}
	}
</style>
