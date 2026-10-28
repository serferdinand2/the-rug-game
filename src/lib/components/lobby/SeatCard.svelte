<!-- One lobby seat, always the same size: an empty slot to open, a closed one, an open seat to take, a hot-seat player to name, or a joined player. -->
<script module>
	/** @typedef {'empty' | 'closed' | 'open' | 'add' | 'player'} SeatCardState */

	/**
	 * Properties of the SeatCard component itself.
	 * @typedef {Object} SeatCardOwnProps
	 * @property {SeatCardState} [state='empty'] - empty: one "Open seat" choice; closed: the same empty slot without the choice, for a viewer who can't open it (#98); open: the gold "Take the seat!" prompt; add: the same gold frame holding a name field and Add, for a hot-seat table; player: a joined player
	 * @property {import('../../ui.js').Seat} seat - The seat number, which sets the player's colour
	 * @property {string} [name] - The player's name, in the player state; in the add state, the typed name, bindable so a refused name stays
	 * @property {string | null} [civilization=null] - The chosen civilization, or null before one is chosen
	 * @property {boolean} [showCivilization=true] - The civilization line under the name; false where civilizations are dealt later, as in the lobby
	 * @property {boolean} [canChooseCivilization=false] - The civilization is a button that opens the chooser; it reads "Choose civilization" while none is chosen
	 * @property {boolean} [you=false] - The player is the viewer; shows YOU
	 * @property {boolean} [host=false] - The player hosts the table; shows HOST
	 * @property {boolean} [ready] - Readiness, shown after the badges as READY or NOT READY; left out, nothing is shown
	 * @property {boolean} [removable=false] - The viewer may clear this seat: a × at the top right, shown on hover or focus, removes the player or closes the open seat
	 * @property {Function} [onSeatCardOpen] - Callback fired when an empty seat is opened
	 * @property {Function} [onSeatCardTake] - Callback fired when the viewer takes an open seat
	 * @property {Function} [onSeatCardCancel] - Callback fired when an open or add seat goes back to empty
	 * @property {Function} [onSeatCardAdd] - Callback fired with { seat, name } when Add is pressed or Enter typed in the add state
	 * @property {Function} [onSeatCardRemove] - Callback fired when the host removes the player
	 * @property {Function} [onSeatCardChooseCivilization] - Callback fired when the civilization button is pressed
	 */

	/**
	 * Properties for the SeatCard component, including any attributes for its root element.
	 * @typedef {SeatCardOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} SeatCardProps
	 *
	 * @example
	 * <SeatCard
	 *   state="player"
	 *   seat={1}
	 *   name="Cedarwyn"
	 *   you
	 *   host
	 *   ready={false}
	 *   canChooseCivilization
	 *   onSeatCardChooseCivilization={(event) => openChooser(event.value.seat)} />
	 * <SeatCard seat={3} onSeatCardOpen={(event) => openSeat(event.value.seat)} />
	 * <SeatCard state="add" seat={3} bind:name onSeatCardAdd={(event) => addPlayer(event.value.name)} />
	 */
</script>

<script>
	import Badge from '../ui/Badge.svelte';
	import { ComponentEvent } from '../../component-event.js';
	import { playerColor } from '../../ui.js';

	/** @type {SeatCardProps} */
	let {
		// Named apart from the $state rune.
		state: kind = 'empty',
		seat,
		name = $bindable(''),
		civilization = null,
		showCivilization = true,
		canChooseCivilization = false,
		you = false,
		host = false,
		ready,
		removable = false,
		onSeatCardOpen,
		onSeatCardTake,
		onSeatCardCancel,
		onSeatCardAdd,
		onSeatCardRemove,
		onSeatCardChooseCivilization,
		...attr
	} = $props();

	let badges = $derived.by(() => {
		/** @type {{ label: string, color: string }[]} */
		const list = [];
		if (you) {
			list.push({ label: 'You', color: 'var(--gold)' });
		}
		if (host) {
			list.push({ label: 'Host', color: 'var(--gold)' });
		}
		if (ready === true) {
			list.push({ label: 'Ready', color: 'var(--ok)' });
		} else if (ready === false) {
			list.push({ label: 'Not ready', color: 'var(--muted)' });
		}
		return list;
	});

	let seatLabel = $derived(
		kind === 'player'
			? `Seat ${seat}: ${name}`
			: kind === 'open'
				? `Seat ${seat}: open`
				: kind === 'add'
					? `Seat ${seat}: add a player`
					: `Seat ${seat}: empty`
	);

	/** @type {HTMLInputElement | undefined} */
	let nameInput = $state();

	// The name field takes the focus when the seat opens, so the keyboard can type straight in.
	$effect(() => {
		if (kind === 'add' && nameInput) {
			nameInput.focus();
		}
	});

	/**
	 * @param {SubmitEvent} event
	 */
	const addSubmitHandler = (event) => {
		event.preventDefault();
		if (typeof onSeatCardAdd === 'function') {
			onSeatCardAdd(
				new ComponentEvent(
					{ seat, name },
					/** @type {HTMLFormElement} */ (event.currentTarget),
					event
				)
			);
		}
	};

	/**
	 * @param {MouseEvent} event
	 */
	const openClickHandler = (event) => {
		if (typeof onSeatCardOpen === 'function') {
			onSeatCardOpen(new ComponentEvent({ seat }, button(event), event));
		}
	};

	/**
	 * @param {MouseEvent} event
	 */
	const takeClickHandler = (event) => {
		if (typeof onSeatCardTake === 'function') {
			onSeatCardTake(new ComponentEvent({ seat }, button(event), event));
		}
	};

	/**
	 * @param {MouseEvent} event
	 */
	const cancelClickHandler = (event) => {
		if (typeof onSeatCardCancel === 'function') {
			onSeatCardCancel(
				new ComponentEvent({ seat }, button(event), event)
			);
		}
	};

	/**
	 * @param {MouseEvent} event
	 */
	const removeClickHandler = (event) => {
		if (typeof onSeatCardRemove === 'function') {
			onSeatCardRemove(
				new ComponentEvent({ seat }, button(event), event)
			);
		}
	};

	/**
	 * @param {MouseEvent} event
	 */
	const civilizationClickHandler = (event) => {
		if (typeof onSeatCardChooseCivilization === 'function') {
			onSeatCardChooseCivilization(
				new ComponentEvent({ seat }, button(event), event)
			);
		}
	};

	/**
	 * The button that was pressed.
	 * @param {MouseEvent} event
	 * @returns {HTMLButtonElement}
	 */
	function button(event) {
		return /** @type {HTMLButtonElement} */ (event.currentTarget);
	}
</script>

<div
	role="group"
	aria-label={seatLabel}
	{...attr}
	class="rg-seat-card rg-seat-card--{kind} {attr.class ? attr.class : ''}"
	style:--rg-seat-card-color={playerColor(seat)}>
	{#if kind === 'closed'}
		<!-- Nothing to choose: only the slot's surface. -->
	{:else if kind === 'empty'}
		<button
			type="button"
			class="rg-seat-card--choice"
			onclick={openClickHandler}>
			<span
				class="rg-seat-card--plus"
				aria-hidden="true">+</span>
			<span>Open seat</span>
		</button>
	{:else if kind === 'open'}
		<button
			type="button"
			class="rg-seat-card--take"
			onclick={takeClickHandler}>Take the seat!</button>
		{#if removable}
			<button
				type="button"
				class="rg-seat-card--remove"
				aria-label="Close seat {seat}"
				title="Close the seat"
				onclick={cancelClickHandler}>×</button>
		{/if}
	{:else if kind === 'add'}
		<form
			class="rg-seat-card--add-form"
			onsubmit={addSubmitHandler}>
			<input
				bind:this={nameInput}
				bind:value={name}
				class="rg-seat-card--add-input"
				aria-label="Name of the player in seat {seat}"
				placeholder="Name, or leave empty"
				maxlength="24"
				autocomplete="off" />
			<button
				type="submit"
				class="rg-seat-card--add-button">Add</button>
		</form>
		<button
			type="button"
			class="rg-seat-card--remove"
			aria-label="Close seat {seat}"
			title="Close the seat"
			onclick={cancelClickHandler}>×</button>
	{:else}
		{#if badges.length}
			<div class="rg-seat-card--badges">
				{#each badges as badge, index (badge.label)}
					{#if index > 0}
						<span
							class="rg-seat-card--dot"
							aria-hidden="true">·</span>
					{/if}
					<Badge
						label={badge.label}
						variant="caps"
						color={badge.color} />
				{/each}
			</div>
		{/if}
		<span class="rg-seat-card--name">{name}</span>
		{#if !showCivilization}
			<!-- Civilizations are dealt once the game starts. -->
		{:else if canChooseCivilization}
			<button
				type="button"
				class="rg-seat-card--civ-button"
				class:rg-seat-card--unchosen={!civilization}
				aria-label={civilization
					? `${civilization}: change civilization`
					: undefined}
				onclick={civilizationClickHandler}
				>{civilization ?? 'Choose civilization'}</button>
		{:else}
			<span
				class="rg-seat-card--civ"
				class:rg-seat-card--unchosen={!civilization}
				>{civilization ?? 'Not yet chosen'}</span>
		{/if}
		{#if removable}
			<button
				type="button"
				class="rg-seat-card--remove"
				aria-label="Remove {name}"
				title="Remove the player"
				onclick={removeClickHandler}>×</button>
		{/if}
	{/if}
</div>

<style>
	.rg-seat-card {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-3);
		width: 100%;
		min-width: 0;
		height: var(--seat-height);
		border-radius: var(--radius);
		text-align: center;
	}

	.rg-seat-card--closed {
		background: var(--surface);
	}

	.rg-seat-card--player {
		padding: var(--space-4);
		border: var(--border-thick) solid var(--rg-seat-card-color);
		background: var(--control);
	}

	.rg-seat-card--choice {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-4);
		width: 100%;
		height: 100%;
		padding: var(--space-2);
		border: 0;
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--muted);
		font-weight: var(--weight-bold);
		transition:
			background var(--duration-fast) var(--ease),
			color var(--duration-fast) var(--ease);
	}

	.rg-seat-card--choice:hover {
		background: color-mix(in srgb, var(--gold) 5%, var(--surface));
		color: var(--gold);
	}

	.rg-seat-card--plus {
		font-size: var(--font-size-3xl);
		font-weight: var(--weight-regular);
		line-height: var(--leading-none);
	}

	.rg-seat-card--take {
		width: 100%;
		height: 100%;
		padding: var(--space-4);
		border: var(--border) solid var(--gold);
		border-radius: var(--radius);
		background: color-mix(in srgb, var(--gold) 22%, var(--ink));
		color: color-mix(in srgb, var(--gold) 40%, var(--text));
		font-size: var(--font-size-md);
		font-weight: var(--weight-bold);
		box-shadow:
			inset 0 0 0 2px color-mix(in srgb, var(--gold) 33%, transparent),
			var(--glow-gold);
		transition: background var(--duration-fast) var(--ease);
	}

	.rg-seat-card--take:hover {
		background: color-mix(in srgb, var(--gold) 30%, var(--ink));
	}

	.rg-seat-card--add-form {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: var(--space-3);
		width: 100%;
		height: 100%;
		padding: var(--space-4) var(--space-5);
		border: var(--border) solid var(--gold);
		border-radius: var(--radius);
		background: color-mix(in srgb, var(--gold) 22%, var(--ink));
		box-shadow:
			inset 0 0 0 2px color-mix(in srgb, var(--gold) 33%, transparent),
			var(--glow-gold);
	}

	.rg-seat-card--add-input {
		width: 100%;
		min-width: 0;
		height: 30px;
		padding: var(--space-2) var(--space-3);
		border: var(--border) solid var(--line);
		border-radius: var(--radius);
		background: var(--ink);
		color: var(--text);
		font-size: var(--font-size-sm);
	}

	.rg-seat-card--add-input:focus {
		border-color: var(--gold);
		outline: none;
	}

	.rg-seat-card--add-button {
		height: 30px;
		padding: 0 var(--space-4);
		border: var(--border) solid var(--gold);
		border-radius: var(--radius);
		background: color-mix(in srgb, var(--gold) 30%, var(--ink));
		color: color-mix(in srgb, var(--gold) 40%, var(--text));
		font-size: var(--font-size-sm);
		font-weight: var(--weight-bold);
		transition: background var(--duration-fast) var(--ease);
	}

	.rg-seat-card--add-button:hover {
		background: color-mix(in srgb, var(--gold) 40%, var(--ink));
	}

	.rg-seat-card--badges {
		position: absolute;
		top: var(--space-3);
		left: var(--space-4);
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.rg-seat-card--dot {
		color: var(--text);
		font-size: var(--font-size-3xs);
		font-weight: var(--weight-bold);
		line-height: var(--leading-none);
	}

	.rg-seat-card--name {
		max-width: 100%;
		margin-top: var(--space-5);
		overflow: hidden;
		font: var(--weight-bold) var(--font-size-base) / var(--leading-tight)
			var(--font-body);
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.rg-seat-card--civ {
		color: var(--gold);
		font: var(--weight-title) var(--font-size-md) / var(--leading-snug)
			var(--font-title);
		letter-spacing: var(--letter-spacing-title);
	}

	.rg-seat-card--civ-button {
		min-height: 28px;
		padding: var(--space-3) var(--space-4);
		border: var(--border) solid var(--line);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--gold);
		font: var(--weight-title) var(--font-size-xs) / var(--leading-tight)
			var(--font-title);
		letter-spacing: var(--letter-spacing-title);
		transition:
			border-color var(--duration-fast) var(--ease),
			color var(--duration-fast) var(--ease);
	}

	.rg-seat-card--civ-button:hover {
		border-color: var(--gold);
	}

	/* "Choose civilization" and "Not yet chosen" are interface text, not civilization names. */
	.rg-seat-card--civ.rg-seat-card--unchosen {
		color: var(--muted);
		font-family: var(--font-body);
		font-weight: var(--weight-regular);
		letter-spacing: normal;
	}

	.rg-seat-card--civ-button.rg-seat-card--unchosen {
		font-family: var(--font-body);
		font-weight: var(--weight-bold);
		letter-spacing: var(--letter-spacing-button);
	}

	.rg-seat-card--remove {
		position: absolute;
		top: var(--space-2);
		right: var(--space-2);
		display: grid;
		place-items: center;
		width: 22px;
		height: 22px;
		padding: 0;
		border: 0;
		border-radius: var(--radius);
		background: transparent;
		color: color-mix(in srgb, var(--danger) 80%, var(--text));
		font-size: var(--font-size-xl);
		line-height: var(--leading-none);
		opacity: 0;
		transition: opacity var(--duration-fast) var(--ease);
	}

	.rg-seat-card:hover .rg-seat-card--remove,
	.rg-seat-card:focus-within .rg-seat-card--remove {
		opacity: 1;
	}
</style>
