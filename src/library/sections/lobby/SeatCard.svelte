<!-- Library section: SeatCard as a joined player, an empty slot, a closed slot and a seat to name, and a working row of five seats. -->
<script>
	import SeatCard from '../../../lib/components/lobby/SeatCard.svelte';
	import CivChooser from '../../../lib/components/lobby/CivChooser.svelte';
	import Button from '../../../lib/components/ui/Button.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	/** @typedef {import('../../../lib/ui.js').Seat} Seat */
	/** @typedef {import('../../../lib/component-event.js').ComponentEvent} ComponentEvent */

	/**
	 * One seat in the working row.
	 * @typedef {Object} DemoSeat
	 * @property {'empty' | 'add' | 'player'} state
	 * @property {string} [name]
	 * @property {string | null} [civilization]
	 * @property {boolean} [you]
	 * @property {boolean} [host]
	 */

	const CIVILIZATIONS = [
		'Architects',
		'Alchemists',
		'Futurists',
		'Militants',
		'Nomads',
	];
	// The real seat is 188px wide in the 1000px lobby; the stage adds 34px of padding and border.
	const SEAT_WIDTH = 222;

	let ready = $state(false);
	let added = $state('Bryndoria');
	/** @type {string | null} */
	let lastAdded = $state(null);
	let rowName = $state('');

	/** @type {DemoSeat[]} */
	let seats = $state([
		{
			state: 'player',
			name: 'Cedarwyn',
			civilization: null,
			you: true,
			host: true,
		},
		{ state: 'player', name: 'Ana', civilization: 'Architects' },
		{ state: 'empty' },
		{ state: 'empty' },
		{ state: 'empty' },
	]);

	/** @type {Seat | null} */
	let chooserSeat = $state(null);

	let chooserCivilization = $derived(
		chooserSeat ? (seats[chooserSeat - 1].civilization ?? null) : null
	);

	/**
	 * @param {number} index
	 * @returns {Seat}
	 */
	function seatOf(index) {
		return /** @type {Seat} */ (index + 1);
	}

	/**
	 * @param {Seat} seat
	 * @param {DemoSeat} value
	 */
	function setSeat(seat, value) {
		seats[seat - 1] = value;
		if (chooserSeat === seat && value.state !== 'player') {
			chooserSeat = null;
		}
	}

	/**
	 * Opens an empty seat's name field, closing any other one, as the lobby does.
	 * @param {Seat} seat
	 */
	function open(seat) {
		seats = seats.map((item) =>
			item.state === 'add' ? { state: 'empty' } : item
		);
		rowName = '';
		setSeat(seat, { state: 'add' });
	}

	/**
	 * @param {string} civilization
	 */
	function choose(civilization) {
		if (chooserSeat) {
			seats[chooserSeat - 1].civilization = civilization;
		}
		chooserSeat = null;
	}

	/**
	 * @param {ComponentEvent} event
	 */
	const addHandler = (event) => {
		lastAdded = event.value.name;
	};

	/**
	 * The typed name joins as a player; the parent names an empty one, here "Player 3".
	 * @param {ComponentEvent} event
	 */
	const rowAddHandler = (event) => {
		const seat = /** @type {Seat} */ (event.value.seat);
		setSeat(seat, {
			state: 'player',
			name: event.value.name.trim() || `Player ${seat}`,
			civilization: null,
		});
	};

	/**
	 * @param {ComponentEvent} event
	 */
	const pickHandler = (event) => {
		choose(event.value.civilization);
	};

	/** The parent decides what Random means; here it simply takes the next civilization in the list. */
	function chooseNext() {
		const index = CIVILIZATIONS.indexOf(chooserCivilization ?? '');
		choose(CIVILIZATIONS[(index + 1) % CIVILIZATIONS.length]);
	}
</script>

<Section
	name="SeatCard"
	area="lobby"
	description="One of the five lobby seats. Every state is exactly one seat tall and as wide as its column: an empty slot offers Open seat, a closed one offers nothing, a seat at a hot-seat table asks for a name, and a joined player shows the badges, name and civilization. The host's × appears on hover or keyboard focus.">
	<Example
		label={'state="player" seat={1} you host ready={false} canChooseCivilization'}
		surface="chrome"
		width={SEAT_WIDTH}>
		<SeatCard
			state="player"
			seat={1}
			name="Cedarwyn"
			you
			host
			ready={false}
			canChooseCivilization />
	</Example>
	<Example
		label={'state="player" seat={1} you host ready civilization="Alchemists" canChooseCivilization'}
		surface="chrome"
		width={SEAT_WIDTH}>
		<SeatCard
			state="player"
			seat={1}
			name="Cedarwyn"
			civilization="Alchemists"
			you
			host
			ready
			canChooseCivilization />
	</Example>
	<Example
		label={'state="player" seat={2} civilization="Architects" removable'}
		surface="chrome"
		width={SEAT_WIDTH}>
		<SeatCard
			state="player"
			seat={2}
			name="Ana"
			civilization="Architects"
			removable />
	</Example>
	<Example
		label={'state="player" seat={4}  (no civilization yet)'}
		surface="chrome"
		width={SEAT_WIDTH}>
		<SeatCard
			state="player"
			seat={4}
			name="Vera" />
	</Example>
	<Example
		label={'state="player" seat={2} ready showCivilization={false}  (the lobby: civilizations are dealt at the start)'}
		surface="chrome"
		width={SEAT_WIDTH}>
		<SeatCard
			state="player"
			seat={2}
			name="Ana"
			ready
			showCivilization={false} />
	</Example>
	<Example
		label={'state="add" seat={3}  (a hot-seat table: type a name, Add or Enter)'}
		surface="chrome"
		width={SEAT_WIDTH}>
		<SeatCard
			state="add"
			seat={3}
			bind:name={added}
			onSeatCardAdd={addHandler} />
		<p class="rg-library-seats--controls">
			Added: {lastAdded === null ? 'nothing yet' : `"${lastAdded}"`}
		</p>
	</Example>
	<Example
		label={'state="empty" seat={3}'}
		surface="chrome"
		width={SEAT_WIDTH}>
		<SeatCard seat={3} />
	</Example>
	<Example
		label={'state="closed" seat={3}  (a hot-seat table the viewer does not host: nothing to open)'}
		surface="chrome"
		width={SEAT_WIDTH}>
		<SeatCard
			state="closed"
			seat={3} />
	</Example>
	<Example
		label={`Five seats at the lobby's width  (open a seat and name a player, remove, choose a civilization, toggle ready)`}
		surface="chrome"
		width={1000}>
		<div class="rg-library-seats">
			{#each seats as item, index (index)}
				{@const seat = seatOf(index)}
				{#if item.state === 'add'}
					<SeatCard
						state="add"
						{seat}
						bind:name={rowName}
						onSeatCardAdd={rowAddHandler}
						onSeatCardCancel={() =>
							setSeat(seat, { state: 'empty' })} />
				{:else}
					<SeatCard
						state={item.state}
						{seat}
						name={item.name}
						civilization={item.civilization ?? null}
						you={item.you}
						host={item.host}
						ready={item.you ? ready : undefined}
						canChooseCivilization={item.you}
						removable={!item.you && item.state !== 'empty'}
						onSeatCardOpen={() => open(seat)}
						onSeatCardRemove={() =>
							setSeat(seat, { state: 'empty' })}
						onSeatCardChooseCivilization={() =>
							(chooserSeat =
								chooserSeat === seat ? null : seat)} />
				{/if}
			{/each}
		</div>
		<p class="rg-library-seats--controls">
			<Button
				mode="gold"
				size="small"
				selected={ready}
				onButtonClick={() => (ready = !ready)}
				>I’m ready {ready ? '✓' : ''}</Button>
		</p>
		{#if chooserSeat}
			<CivChooser
				seat={chooserSeat}
				civilizations={CIVILIZATIONS}
				selected={chooserCivilization}
				onCivChooserPick={pickHandler}
				onCivChooserRandom={chooseNext} />
		{/if}
	</Example>
</Section>

<style>
	.rg-library-seats {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: var(--space-4);
	}

	.rg-library-seats--controls {
		margin: var(--space-6) 0;
	}
</style>
