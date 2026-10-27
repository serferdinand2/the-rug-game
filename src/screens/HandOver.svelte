<!-- The hand-over between hot-seat players (#30): the pass screen for the player the store names, with their clock. -->
<script module>
	/**
	 * Properties of the HandOver screen itself.
	 * @typedef {Object} HandOverOwnProps
	 * @property {any} store - The client's store, while it names a player to pass to
	 */

	/**
	 * Properties for the HandOver screen, including any attributes for its root element.
	 * @typedef {HandOverOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} HandOverProps
	 *
	 * @example
	 * <HandOver {store} />
	 */
</script>

<script>
	import PassScreen from '../lib/components/ui/PassScreen.svelte';
	import { timeLeft } from '../lib/clock.js';
	import { passReason } from '../lib/pass.js';

	/** @type {HandOverProps} */
	let { store, ...attr } = $props();

	let room = $derived(store.room);
	let seat = $derived(
		/** @type {import('../lib/ui.js').Seat} */ (store.passing)
	);
	let name = $derived(room.game.seats[seat - 1]?.name ?? `Player ${seat}`);

	// The named player's clock keeps running while the screen waits for them, as in the game header.
	let now = $state(Date.now());
	let clock = $derived(
		room.clocks?.find((/** @type {any} */ c) => c.seat === seat) ?? null
	);
	$effect(() => {
		if (!clock) {
			return;
		}
		const timer = setInterval(() => {
			now = Date.now();
		}, 250);
		return () => clearInterval(timer);
	});
</script>

<main
	{...attr}
	class="rg-hand-over {attr.class ? attr.class : ''}">
	{#key seat}
		<PassScreen
			{name}
			{seat}
			reason={passReason(room.game, seat)}
			clockMs={clock
				? timeLeft(clock, room.now, store.receivedAt, now)
				: null}
			clockRunning={clock
				? clock.ends !== undefined && !clock.expired
				: true}
			taking={store.taking}
			onPassScreenTake={() => store.takeSeat()} />
	{/key}
</main>

<style>
	.rg-hand-over {
		display: grid;
		flex: 1;
		place-items: center;
		padding: var(--space-11) var(--space-9);
		background: var(--texture) var(--surface);
	}
</style>
