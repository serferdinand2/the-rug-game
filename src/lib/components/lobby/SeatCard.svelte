<!-- One lobby seat, always the same size: an empty slot to open, a closed one, a hot-seat player to name, or a joined player, who rises into the seat (#175). -->
<script module>
	/** @typedef {'empty' | 'closed' | 'add' | 'player'} SeatCardState */

	/**
	 * Properties of the SeatCard component itself.
	 * @typedef {Object} SeatCardOwnProps
	 * @property {SeatCardState} [state='empty'] - empty: one "Open seat" choice; closed: the same empty slot without the choice, for a viewer who can't open it (#98); add: a gold frame holding a small TextInput for the name and a small gold Add Button, for a hot-seat table; player: a joined player
	 * @property {import('../../ui.js').Seat} seat - The seat number, which sets the player's colour
	 * @property {string} [name] - The player's name, in the player state; in the add state, the typed name, bindable so a refused name stays
	 * @property {string | null} [civilization=null] - The chosen civilization, or null before one is chosen; kept for a civilization choice in the lobby (owner, 2026-10-30), which today passes showCivilization={false}
	 * @property {boolean} [showCivilization=true] - The civilization line under the name; false where civilizations are dealt later, as in the lobby
	 * @property {boolean} [canChooseCivilization=false] - The civilization is a button that opens the chooser; it reads "Choose civilization" while none is chosen
	 * @property {boolean} [you=false] - The player is the viewer; shows YOU
	 * @property {boolean} [host=false] - The player hosts the table; shows HOST
	 * @property {boolean} [ready] - Readiness, shown after the badges as READY or NOT READY; left out, nothing is shown
	 * @property {boolean} [removable=false] - The viewer may remove this player: a × at the top right, shown on hover or focus
	 * @property {'automa' | 'shadow' | null} [botKind=null] - Official bot seat, with its name followed by (Automa)
	 * @property {boolean} [canAddBot=false] - The host can add a bot to this empty seat
	 * @property {Function} [onSeatCardAddBot] - Callback fired with { seat }
	 * @property {Function} [onSeatCardOpen] - Callback fired when an empty seat is opened
	 * @property {Function} [onSeatCardCancel] - Callback fired when the × closes an add seat, back to empty
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
	 *   showCivilization={false} />
	 * <SeatCard seat={3} onSeatCardOpen={(event) => openSeat(event.value.seat)} />
	 * <SeatCard state="add" seat={3} bind:name onSeatCardAdd={(event) => addPlayer(event.value.name)} />
	 */
</script>

<script>
	import Badge from '../ui/Badge.svelte';
	import Button from '../ui/Button.svelte';
	import TextInput from '../ui/TextInput.svelte';
	import { ComponentEvent } from '../../component-event.js';
	import { seatBadges, seatLabel } from '../../lobby.js';
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
		botKind = null,
		canAddBot = false,
		onSeatCardAddBot,
		onSeatCardOpen,
		onSeatCardCancel,
		onSeatCardAdd,
		onSeatCardRemove,
		onSeatCardChooseCivilization,
		...attr
	} = $props();

	let badges = $derived(seatBadges({ you, host, ready }));
	let label = $derived(seatLabel({ seat, state: kind, name }));

	/** @type {HTMLFormElement | undefined} */
	let addForm = $state();

	// The name field takes the focus when the seat opens, so the keyboard can type straight in.
	$effect(() => {
		if (kind === 'add' && addForm) {
			addForm.querySelector('input')?.focus();
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

{#snippet remove(
	/** @type {string} */ removeLabel,
	/** @type {string} */ tooltip,
	/** @type {(event: MouseEvent) => void} */ handler
)}
	<!-- The ×: closes an add seat, or removes a player. -->
	<button
		type="button"
		class="rg-seat-card--remove"
		aria-label={removeLabel}
		title={tooltip}
		onclick={handler}>×</button>
{/snippet}

<div
	role="group"
	aria-label={label}
	{...attr}
	class="rg-seat-card rg-seat-card--{kind} {attr.class ? attr.class : ''}"
	style:--rg-seat-card-color={playerColor(seat)}>
	{#if kind === 'closed'}
		<!-- Nothing to choose: only the slot's surface. -->
	{:else if kind === 'empty'}
		<div
			class="rg-seat-card--empty-actions"
			class:rg-seat-card--with-bot={canAddBot}>
			<button
				type="button"
				class="rg-seat-card--choice"
				onclick={openClickHandler}>
				<span
					class="rg-seat-card--plus"
					aria-hidden="true">+</span>
				<span>Open seat</span>
			</button>
			{#if canAddBot}
				<Button
					mode="primary"
					size="small"
					onButtonClick={(
						/** @type {import('../../component-event.js').ComponentEvent} */ event
					) => {
						if (typeof onSeatCardAddBot === 'function') {
							onSeatCardAddBot(
								new ComponentEvent(
									{ seat },
									event.target,
									event.originalEvent
								)
							);
						}
					}}>Add bot</Button>
			{/if}
		</div>
	{:else if kind === 'add'}
		<form
			bind:this={addForm}
			class="rg-seat-card--frame"
			onsubmit={addSubmitHandler}>
			<TextInput
				bind:value={name}
				label="Name of the player in seat {seat}"
				hideLabel
				size="small"
				block
				placeholder="Name, or leave empty"
				maxlength={24}
				autocomplete="off" />
			<Button
				type="submit"
				mode="gold"
				size="small"
				block>Add</Button>
		</form>
		{@render remove(
			`Close seat ${seat}`,
			'Close the seat',
			cancelClickHandler
		)}
	{:else}
		<div class="rg-seat-card--header">
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
			{#if removable}
				{@render remove(
					`Remove ${name}`,
					'Remove the player',
					removeClickHandler
				)}
			{/if}
		</div>
		<span class="rg-seat-card--name">{name}</span>
		{#if botKind}<span class="rg-seat-card--bot-label"
				>({botKind === 'shadow' ? 'Shadow Empire' : 'Automa'})</span
			>{/if}
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

	.rg-seat-card--empty-actions {
		display: contents;
	}

	.rg-seat-card--empty-actions.rg-seat-card--with-bot {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		width: 100%;
		height: 100%;
		background: var(--surface);
		padding: var(--space-2);
	}
	.rg-seat-card--with-bot .rg-seat-card--choice {
		flex: 1;
		padding: 0;
		gap: var(--space-2);
	}
	.rg-seat-card--bot-label {
		font-family: var(--font-title);
		font-size: var(--font-size-sm);
		font-weight: var(--weight-title);
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

	/* The add seat's one gold frame (the library's browser test checks there is only one). */
	.rg-seat-card--frame {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: var(--space-3);
		width: 100%;
		height: 100%;
		/* The top keeps the ×'s 22px corner clear of the focused name field's outline. */
		padding: calc(var(--space-2) + 22px) var(--space-5) var(--space-4);
		border: var(--border) solid var(--gold);
		border-radius: var(--radius);
		background: color-mix(in srgb, var(--gold) 22%, var(--ink));
		box-shadow:
			inset 0 0 0 2px color-mix(in srgb, var(--gold) 33%, transparent),
			var(--glow-gold);
	}

	.rg-seat-card--header {
		position: absolute;
		top: var(--space-3);
		left: var(--space-4);
		right: 0;
		height: var(--font-size-3xs);
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.rg-seat-card--badges {
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

	/* The badges and remove button share one top row; add-seat cancellation stays absolute. */
	.rg-seat-card--header .rg-seat-card--remove {
		position: static;
		flex: none;
		margin-left: auto;
	}

	.rg-seat-card:hover .rg-seat-card--remove,
	.rg-seat-card:focus-within .rg-seat-card--remove {
		opacity: 1;
	}

	/* A player who takes the seat rises into it (issue 175). */
	.rg-seat-card--player {
		animation: rg-seat-card-in var(--duration-slow) var(--ease-out);
	}

	@keyframes rg-seat-card-in {
		from {
			opacity: 0;
			transform: translateY(10px) scale(0.97);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.rg-seat-card--player {
			animation: none;
		}
	}
</style>
