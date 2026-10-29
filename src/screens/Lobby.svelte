<!-- The lobby (#25 design §6), as in docs/ui/lobby.html: the mode and code, start, ready and leave, the five seats and the table settings. -->
<script module>
	/**
	 * Properties of the Lobby screen itself.
	 * @typedef {Object} LobbyOwnProps
	 * @property {import('../lib/game.svelte.js').GameStore} store - Its room is the table shown
	 */

	/**
	 * Properties for Lobby, including any attributes for its root element.
	 * @typedef {LobbyOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} LobbyProps
	 *
	 * @example
	 * <Lobby {store} />
	 */
</script>

<script>
	import Button from '../lib/components/ui/Button.svelte';
	import Panel from '../lib/components/ui/Panel.svelte';
	import Segmented from '../lib/components/ui/Segmented.svelte';
	import PlaySettings from '../lib/components/lobby/PlaySettings.svelte';
	import SeatCard from '../lib/components/lobby/SeatCard.svelte';
	import SettingRow from '../lib/components/lobby/SettingRow.svelte';
	import TableCode from '../lib/components/lobby/TableCode.svelte';
	import {
		YES_NO_CHOICES,
		expansionChoices,
		isHost,
		modeChoices,
		modeLock,
		rulesChoices,
		seatSlots,
		settingsLock,
		toggleVariant,
		variantRows,
	} from '../lib/lobby.js';

	/** @typedef {import('../lib/component-event.js').ComponentEvent} ComponentEvent */

	/** @type {LobbyProps} */
	let { store, ...attr } = $props();

	let room = $derived(store.room);
	let config = $derived(store.config);
	let online = $derived(room.mode === 'online');
	let hosting = $derived(isHost(room));
	let slots = $derived(seatSlots(room, config?.maxSeats ?? 5));
	let you = $derived(room.seats[room.you[0] - 1]);
	let ready = $derived(online && you?.ready === true);
	let modeLocked = $derived(modeLock(room));
	let lockedTitle = $derived(settingsLock(room) ?? undefined);
	let variants = $derived(variantRows(config, room));
	/**
	 * Redraws the choices after a refused change, so the choice snaps back. Only then: a redraw on every answer would
	 * take the keyboard focus away.
	 */
	let settingsKey = $derived(store.refusals);

	/** The empty seat whose name field is open, at a hot-seat table. @type {number | null} */
	let addingSeat = $state(null);
	let newName = $state('');

	/**
	 * @param {ComponentEvent} event
	 */
	const modeChangeHandler = (event) => {
		store.configure({ mode: event.value });
	};

	/**
	 * @param {ComponentEvent} event
	 */
	const rulesChangeHandler = (event) => {
		store.configure({ version: event.value });
	};

	/**
	 * @param {ComponentEvent} event
	 */
	const expansionsChangeHandler = (event) => {
		store.configure({ expansions: event.value });
	};

	/**
	 * @param {ComponentEvent} event - Its value is { timer } or { undo }
	 */
	const playSettingsChangeHandler = (event) => {
		store.settings(event.value);
	};

	/**
	 * @param {string} id
	 * @param {ComponentEvent} event
	 */
	const variantChangeHandler = (id, event) => {
		const on = event.value === 'yes';
		// Built from the table the server has, so two quick choices both count.
		store.configure((/** @type {any} */ table) => ({
			variants: toggleVariant(table.options.variants, id, on),
		}));
	};

	/**
	 * Online, a friend fills an open seat by joining with the code, so pressing it shares the code.
	 * @param {ComponentEvent} event
	 */
	const seatOpenHandler = (event) => {
		if (online) {
			store.copyCode();
			return;
		}
		newName = '';
		addingSeat = event.value.seat;
	};

	/**
	 * @param {ComponentEvent} event
	 */
	const seatAddHandler = async (event) => {
		if (await store.addSeat(event.value.name)) {
			addingSeat = null;
			newName = '';
		}
	};

	/**
	 * @param {ComponentEvent} event
	 */
	const seatRemoveHandler = (event) => {
		store.removeSeat(event.value.seat);
	};
</script>

<main
	{...attr}
	class="rg-lobby {attr.class ? attr.class : ''}">
	<p class="rg-lobby--intro">
		Invite your friends, choose your civilization,<br />and prepare to make
		history.
	</p>
	<div class="rg-lobby--stack">
		{#if store.connection}
			<p
				class="rg-lobby--connection"
				role="status">
				{store.connection}
			</p>
		{/if}
		<div class="rg-lobby--top">
			<Panel
				padding="small"
				class="rg-lobby--mode-panel"
				aria-label="Table mode">
				<div class="rg-lobby--mode-line">
					<span class="rg-lobby--mode-label">Mode:</span>
					{#key settingsKey}
						<Segmented
							label="Mode"
							class="rg-lobby--modes"
							variant="filled"
							options={modeChoices(config?.modes ?? [room.mode])}
							value={room.mode}
							disabled={modeLocked !== null}
							title={modeLocked ?? undefined}
							onSegmentedChange={modeChangeHandler} />
					{/key}
				</div>
				<div class="rg-lobby--code-line">
					{#if online}
						<TableCode
							code={room.code}
							onTableCodeCopy={() => store.copyCode()} />
					{:else}
						<p class="rg-lobby--local">
							<span>Classic hot-seat gaming.</span> Your friends and
							you will share a screen.
						</p>
					{/if}
				</div>
			</Panel>
			<Panel
				padding="small"
				class="rg-lobby--action-panel"
				aria-label="Table actions">
				<p class="rg-lobby--action-text">
					Start the game, mark yourself<br />as ready, or leave the
					table!
				</p>
				<div class="rg-lobby--actions">
					{#if hosting}
						<Button
							mode="success"
							size="small"
							onButtonClick={() => store.startGame()}
							>Start game</Button>
					{:else}
						<span class="rg-lobby--waiting"
							>Waiting for the host</span>
					{/if}
					{#if online}
						<Button
							mode="gold"
							size="small"
							selected={ready}
							onButtonClick={() => store.setReady(!ready)}
							>I’m ready{#if ready}
								<span
									class="rg-lobby--check"
									aria-hidden="true">✓</span
								>{/if}</Button>
					{/if}
					<Button
						mode="danger"
						size="small"
						onButtonClick={() => store.leaveTable()}
						>Leave table</Button>
				</div>
			</Panel>
		</div>

		<Panel padding="small">
			{#snippet heading()}
				<h2>Players</h2>
				<span class="rg-lobby--count"
					>{room.seats.length} of {config?.maxSeats ?? 5} joined</span>
			{/snippet}
			<div class="rg-lobby--seats">
				{#each slots as slot (slot.seat)}
					{#if slot.state === 'player'}
						<SeatCard
							state="player"
							seat={slot.seat}
							name={slot.name}
							you={slot.you}
							host={slot.host}
							ready={slot.ready}
							removable={slot.removable}
							showCivilization={false}
							onSeatCardRemove={seatRemoveHandler} />
					{:else if addingSeat === slot.seat}
						<SeatCard
							state="add"
							seat={slot.seat}
							bind:name={newName}
							onSeatCardAdd={seatAddHandler}
							onSeatCardCancel={() => (addingSeat = null)} />
					{:else}
						<SeatCard
							state={slot.state}
							seat={slot.seat}
							onSeatCardOpen={seatOpenHandler} />
					{/if}
				{/each}
			</div>
		</Panel>

		<Panel
			padding="small"
			aria-label="Table settings">
			{#key settingsKey}
				<div class="rg-lobby--settings">
					<div class="rg-lobby--column">
						<SettingRow
							label="Rules"
							title={lockedTitle}>
							<Segmented
								label="Rules"
								options={rulesChoices(config?.versions)}
								value={room.options.version}
								disabled={!hosting}
								onSegmentedChange={rulesChangeHandler} />
						</SettingRow>
						<SettingRow label="Expansions">
							{#if (config?.expansions ?? []).length === 0}
								<span class="rg-lobby--muted"
									>Base game only for now</span>
							{:else}
								<Segmented
									label="Expansions"
									multiple
									options={expansionChoices(
										config.expansions
									)}
									value={room.options.expansions}
									disabled={!hosting}
									onSegmentedChange={expansionsChangeHandler} />
							{/if}
						</SettingRow>
						<PlaySettings
							timers={config?.timers ?? [0]}
							timer={room.timer}
							undo={room.undo}
							disabled={!hosting}
							title={lockedTitle}
							onPlaySettingsChange={playSettingsChangeHandler} />
					</div>
					<div class="rg-lobby--column">
						{#each variants as variant, index (variant.id)}
							<SettingRow
								label={variant.label}
								title={variant.name}
								divided={index < variants.length - 1}>
								<Segmented
									label={variant.name}
									options={[...YES_NO_CHOICES]}
									value={variant.value}
									disabled={!hosting}
									onSegmentedChange={(
										/** @type {ComponentEvent} */ event
									) =>
										variantChangeHandler(
											variant.id,
											event
										)} />
							</SettingRow>
						{/each}
					</div>
				</div>
			{/key}
		</Panel>
	</div>
</main>

<style>
	.rg-lobby {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-6);
		padding: clamp(70px, calc((100vh - 680px) / 2), 220px) var(--space-9)
			22px;
		background: var(--texture) var(--surface);
	}

	.rg-lobby--intro {
		width: min(var(--lobby-width), 100%);
		margin: 0;
		color: var(--text);
		font: var(--weight-title) var(--font-size-display-sm) / 1.4
			var(--font-title);
		text-align: center;
	}

	.rg-lobby--stack {
		display: grid;
		gap: var(--space-5);
		width: min(var(--lobby-width), 100%);
	}

	.rg-lobby--connection {
		margin: 0;
		color: color-mix(in srgb, var(--danger) 70%, var(--text));
		font-size: var(--font-size-sm);
		text-align: center;
	}

	.rg-lobby--top {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-5);
	}

	.rg-lobby--top :global(.rg-lobby--mode-panel) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-5);
	}

	.rg-lobby--mode-line {
		display: flex;
		flex: none;
		align-items: center;
		gap: var(--space-5);
	}

	.rg-lobby--mode-line :global(.rg-lobby--modes) {
		flex-wrap: nowrap;
	}

	.rg-lobby--mode-label {
		font-size: var(--font-size-xs);
		font-weight: var(--weight-bold);
	}

	.rg-lobby--code-line {
		display: flex;
		flex: 1;
		min-width: 0;
		align-items: center;
		justify-content: flex-end;
		min-height: var(--input-height-small);
	}

	.rg-lobby--local {
		margin: 0 0 0 auto;
		color: var(--muted);
		font-size: var(--font-size-sm);
		text-align: right;
	}

	.rg-lobby--local span {
		color: var(--text);
		font-weight: var(--weight-bold);
	}

	.rg-lobby--top :global(.rg-lobby--action-panel) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-5);
	}

	.rg-lobby--action-text {
		margin: 0;
		color: var(--muted);
		font-size: var(--font-size-sm);
		white-space: nowrap;
	}

	.rg-lobby--actions {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.rg-lobby--waiting {
		padding: 0 var(--space-4);
		color: var(--muted);
		font-size: var(--font-size-xs);
		white-space: nowrap;
	}

	.rg-lobby--check {
		margin-left: var(--space-2);
		color: var(--ok);
		font-weight: var(--weight-bold);
	}

	.rg-lobby--count {
		color: var(--muted);
		font-size: var(--font-size-sm);
	}

	.rg-lobby--seats {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		grid-auto-rows: var(--seat-height);
		gap: var(--space-4);
	}

	.rg-lobby--settings {
		display: grid;
		grid-template-columns: 1.4fr 1fr;
		gap: 18px;
		padding: var(--space-1) 0;
	}

	.rg-lobby--column {
		display: grid;
		align-content: start;
		gap: var(--space-5);
	}

	.rg-lobby--muted {
		color: var(--muted);
		font-size: var(--font-size-sm);
	}
</style>
