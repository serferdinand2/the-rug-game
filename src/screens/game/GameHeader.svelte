<!-- The game's header (#90): the player chips, the turn clock, Undo and the log button with its dot for unseen entries, then sound and the game's menu. -->
<script module>
	/**
	 * Properties of the GameHeader screen part itself.
	 * @typedef {Object} GameHeaderOwnProps
	 * @property {import('../../lib/game.svelte.js').GameStore} store - The client's store: its table, its clocks and Undo
	 * @property {any} game - The game view on show
	 * @property {number | null} seat - The viewer's seat, whose own clock warns in its last seconds
	 * @property {boolean} [overviewOpen=false] - The players overview is open: the chips fill with colour
	 * @property {boolean} [logOpen=false] - The log and scores are open
	 * @property {boolean} [logUnread=false] - The log has entries the viewer hasn't seen: a gold dot on its button
	 * @property {number[]} [bumped=[]] - The seats whose VP just rose, whose chips bump
	 * @property {Function} [onGameHeaderChip] - Callback fired with the seat of the chip pressed
	 * @property {Function} [onGameHeaderLog] - Callback fired when the log button is pressed
	 * @property {Function} [onGameHeaderMenu] - Callback fired with the chosen menu entry's id, for all but Leave table and the card gallery
	 */

	/**
	 * Properties for GameHeader, including any attributes for its header but `title`, which is PageHeader's own sentence.
	 * @typedef {GameHeaderOwnProps & Omit<import('svelte/elements').HTMLAttributes<HTMLElement>, 'title'>} GameHeaderProps
	 *
	 * @example
	 * <GameHeader
	 *   {store}
	 *   {game}
	 *   {seat}
	 *   {logUnread}
	 *   onGameHeaderChip={(event) => (viewing = nextInspected(viewing, event.value, seat))}
	 *   onGameHeaderLog={() => (logOpen = !logOpen)}
	 *   onGameHeaderMenu={(event) => choose(event.value)} />
	 */
</script>

<script>
	import IconButton from '../../lib/components/ui/IconButton.svelte';
	import PlayerChip from '../../lib/components/player/PlayerChip.svelte';
	import TurnClock from '../../lib/components/ui/TurnClock.svelte';
	import PageHeader from '../PageHeader.svelte';
	import { ComponentEvent } from '../../lib/component-event.js';
	import { playerChips } from '../../lib/area/players.js';
	import { seatName } from '../../lib/game-names.js';
	import { isRunning, shownClock, timeLeft } from '../../lib/clock.js';
	import { clockTime } from '../../lib/now.svelte.js';

	/** @type {GameHeaderProps} */
	let {
		store,
		game,
		seat,
		overviewOpen = false,
		logOpen = false,
		logUnread = false,
		bumped = [],
		onGameHeaderChip,
		onGameHeaderLog,
		onGameHeaderMenu,
		...attr
	} = $props();

	let room = $derived(store.room);
	let chips = $derived(playerChips(game));
	// The turn clock: the running one, the viewer's own first; a paused one only when none runs (#26 spec §4).
	let clock = $derived(shownClock(room, seat));
	let clockMs = $derived(
		clock ? timeLeft(clock, room.now, store.receivedAt, clockTime.now) : 0
	);

	/**
	 * @param {ComponentEvent} event
	 */
	const logClickHandler = (event) => {
		if (typeof onGameHeaderLog === 'function') {
			onGameHeaderLog(event);
		}
	};

	/**
	 * @param {ComponentEvent} event
	 */
	const menuHandler = (event) => {
		if (typeof onGameHeaderMenu === 'function') {
			onGameHeaderMenu(event);
		}
	};

	/**
	 * Reports a chip's press with its seat.
	 * @param {number} chipSeat
	 * @returns {(event: ComponentEvent) => void}
	 */
	function chipClick(chipSeat) {
		return (event) => {
			if (typeof onGameHeaderChip === 'function') {
				onGameHeaderChip(
					new ComponentEvent(
						chipSeat,
						event.target,
						event.originalEvent
					)
				);
			}
		};
	}
</script>

<PageHeader
	{...attr}
	{store}
	menu="game"
	onPageHeaderMenu={menuHandler}>
	{#snippet center()}
		{#each chips as chip (chip.seat)}
			<PlayerChip
				name={chip.name}
				civilization={chip.civilization}
				vp={chip.vp}
				seat={chip.seat}
				current={chip.current}
				filled={overviewOpen}
				bump={bumped.includes(chip.seat)}
				ability={chip.ability}
				onPlayerChipClick={chipClick(chip.seat)} />
		{/each}
	{/snippet}
	{#snippet before()}
		{#if clock}
			<TurnClock
				seat={clock.seat}
				name={seatName(game, clock.seat)}
				ms={clockMs}
				running={isRunning(clock)}
				warn={clock.seat === seat &&
					clock.ends !== undefined &&
					clockMs <= 5000} />
		{/if}
		<IconButton
			icon="history"
			label="Undo"
			disabled={!room.canUndo}
			onIconButtonClick={() => store.undo()} />
		<span class="rg-game-header--log-button">
			<IconButton
				icon="log"
				label="Log and scores"
				expanded={logOpen}
				onIconButtonClick={logClickHandler} />
			{#if logUnread}
				<i
					class="rg-game-header--unread"
					title="New entries"></i>
			{/if}
		</span>
	{/snippet}
</PageHeader>

<style>
	.rg-game-header--log-button {
		position: relative;
		display: inline-flex;
	}

	/* The log button carries a gold dot while the log has entries the viewer hasn't seen. */
	.rg-game-header--unread {
		position: absolute;
		top: 5px;
		right: 5px;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--gold);
		box-shadow: 0 0 0 var(--border) var(--chrome);
		pointer-events: none;
	}
</style>
