<!-- Library section: PlayerAction, what another player just did, at the centre of the tracks (#153): every kind of action, a queue of three, and one held on show. -->
<script>
	import PlayerAction from '../../../lib/components/board/PlayerAction.svelte';
	import Button from '../../../lib/components/ui/Button.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
	import {
		EMPTY_QUEUE,
		actionsOf,
		queueAdd,
		queueCurrent,
		queueNext,
		queuePosition,
	} from '../../../lib/player-actions.js';

	/** @typedef {import('../../../lib/player-actions.js').PlayerActionItem} PlayerActionItem */

	/** Mira watches while Lazar (seat 1) acts, as in the mockup. */
	const GAME = {
		seats: [
			{ seat: 1, name: 'Lazar', kind: 'player', civs: ['leaders'] },
			{ seat: 2, name: 'Mira', kind: 'player', civs: ['the-chosen'] },
		],
		hexes: { '-3_-2': { tile: 12, orient: 2, outposts: [], tokens: [] } },
	};

	/**
	 * The displays for some events, numbered from `from`, as Mira's screen shows them.
	 * @param {Record<string, any>[]} events
	 * @param {number} [from]
	 * @returns {PlayerActionItem[]}
	 */
	function displays(events, from = 1) {
		return actionsOf(
			events.map((event, at) => ({ seq: from + at, ...event })),
			GAME,
			2
		);
	}

	/** @type {Record<string, { label: string, items: PlayerActionItem[] }>} */
	const SHOWS = {
		tapestry: {
			label: 'Tapestry card',
			items: displays([
				{
					type: 'tapestryPlayed',
					player: 1,
					era: 4,
					card: 'industrialism',
					faceDown: false,
				},
				{
					type: 'eraStarted',
					player: 1,
					card: 'industrialism',
					ability: 'industrialism',
				},
			]),
		},
		faceDown: {
			label: 'Face down',
			items: displays([
				{
					type: 'tapestryPlayed',
					player: 1,
					era: 2,
					card: null,
					faceDown: true,
				},
			]),
		},
		advance: {
			label: 'Advance + landmark',
			items: displays([
				{
					type: 'tokenMoved',
					player: 1,
					track: 'exploration',
					from: 3,
					to: 4,
				},
				{
					type: 'landmarkGained',
					player: 1,
					landmark: 'lighthouse',
					track: 'exploration',
				},
				{
					type: 'tilesGained',
					player: 1,
					stack: 'territory',
					tiles: [23],
				},
			]),
		},
		invent: {
			label: 'Invent',
			items: displays([
				{
					type: 'techInvented',
					player: 1,
					card: 'printing-press',
					from: 'face',
				},
			]),
		},
		upgrade: {
			label: 'Upgrade',
			items: displays([
				{
					type: 'techUpgraded',
					player: 1,
					card: 'compass',
					from: 'middle',
					to: 'top',
				},
				{ type: 'vpGained', player: 1, vp: 3, source: 'tech' },
			]),
		},
		explore: {
			label: 'Explore',
			items: displays([
				{
					type: 'explored',
					player: 1,
					hex: '-2_-1',
					tile: 23,
					orient: 1,
					vp: 2,
				},
				{ type: 'vpGained', player: 1, vp: 2, source: 'map' },
			]),
		},
		conquer: {
			label: 'Conquer',
			items: displays([
				{ type: 'outpostPlaced', player: 1, hex: '-3_-2' },
				{ type: 'outpostToppled', player: 2, hex: '-3_-2', by: 1 },
				{ type: 'conquered', player: 1, hex: '-3_-2', trapped: false },
				{ type: 'conquerDiceRolled', player: 1, red: 1, black: 2 },
			]),
		},
		income: {
			label: 'Income turn (2)',
			items: displays([
				{ type: 'turnStarted', player: 1 },
				{ type: 'incomeTurnStarted', player: 1, turn: 4 },
				{
					type: 'tapestryPlayed',
					player: 1,
					era: 4,
					card: 'industrialism',
					faceDown: false,
				},
				{
					type: 'techUpgraded',
					player: 1,
					card: 'compass',
					from: 'bottom',
					to: 'middle',
				},
				{ type: 'vpGained', player: 1, vp: 12, source: 'income' },
				{
					type: 'resourcesGained',
					player: 1,
					gained: { coin: 3, food: 2, worker: 2, culture: 2 },
				},
			]),
		},
	};

	let queue = $state.raw(EMPTY_QUEUE);
	/** Counts the displays shown, so each starts its own timer, as App.svelte does. */
	let shown = $state(0);
	let hold = $state(false);
	let closed = $state('');
	let item = $derived(queueCurrent(queue));
	let position = $derived(queuePosition(queue));

	/** The second example's display, on show until closed. */
	let heldOpen = $state(true);

	/** @param {PlayerActionItem[]} items */
	const play = (items) => {
		queue = queueAdd(EMPTY_QUEUE, items);
		shown += 1;
	};

	/** @param {import('../../../lib/component-event.js').ComponentEvent} event */
	const closeHandler = (event) => {
		closed = `${event.value.timedOut ? 'timed out' : 'closed'}${event.value.all ? ', skipped all' : ''}`;
		queue = event.value.all ? EMPTY_QUEUE : queueNext(queue);
		shown += 1;
	};
</script>

<Section
	name="PlayerAction"
	area="board"
	description="What another player just did, at the centre of the tracks (#153, option A): a band in their colour with their turn and '1 of N', the card or the action's picture, the log's sentence as a headline with their name in their colour, a 4-second progress line under it, and what followed as lines. Hovering holds the timer; a click, Close or Escape closes it, and Skip all or Shift+Escape the rest of the queue. It takes no focus. With reduced motion it appears without sliding; the progress line still runs.">
	<Example
		label={`item={actionsOf(…)[0]}  index={${position.index}}  count={${position.count}}  duration={${hold ? 3600000 : 4000}}  (press a button${closed ? `; last: ${closed}` : ''})`}
		wide
		width={1400}>
		<div class="rg-library-action-controls">
			{#each Object.entries(SHOWS) as [id, show] (id)}
				<Button
					size="small"
					onButtonClick={() => play(show.items)}>{show.label}</Button>
			{/each}
			<Button
				size="small"
				mode="gold"
				onButtonClick={() =>
					play([
						...SHOWS.advance.items,
						...SHOWS.explore.items,
						...SHOWS.invent.items,
					])}>Queue of three</Button>
			<label class="rg-library-action-hold">
				<input
					type="checkbox"
					bind:checked={hold} /> Stay for an hour
			</label>
		</div>
		<div class="rg-library-action-stage">
			{#if item}
				{#key shown}
					<PlayerAction
						{item}
						index={position.index}
						count={position.count}
						duration={hold ? 3600000 : 4000}
						onPlayerActionClose={closeHandler} />
				{/key}
			{/if}
		</div>
	</Example>
	<Example
		label={`item={actionsOf(…)[0]}  index={2}  count={3}  duration={3600000}  (on show from the start; ${heldOpen ? 'close it to see it go' : 'closed: press Show'})`}
		wide
		width={1400}>
		<div class="rg-library-action-controls">
			<Button
				size="small"
				onButtonClick={() => (heldOpen = true)}>Show</Button>
		</div>
		<div class="rg-library-action-stage">
			{#if heldOpen}
				<PlayerAction
					item={SHOWS.explore.items[0]}
					index={2}
					count={3}
					duration={3600000}
					onPlayerActionClose={() => (heldOpen = false)} />
			{/if}
		</div>
	</Example>
</Section>

<style>
	/* The panel is fixed to the screen; contained, the stage stands in for the screen at 1920×1080. */
	.rg-library-action-stage {
		position: relative;
		height: 760px;
		contain: layout;
		background: var(--texture) var(--surface);
	}

	.rg-library-action-controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-6);
	}

	.rg-library-action-hold {
		display: inline-flex;
		align-items: center;
		gap: var(--space-3);
		color: var(--muted);
		font-size: var(--font-size-sm);
	}
</style>
