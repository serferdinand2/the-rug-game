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
	import SeatCard from '../lib/components/lobby/SeatCard.svelte';
	import SettingRow from '../lib/components/lobby/SettingRow.svelte';
	import TableCode from '../lib/components/lobby/TableCode.svelte';
	import {
		VARIANT_LABELS,
		canChangeMode,
		isHost,
		rulesLabel,
		seatSlots,
		timerChoices,
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
	let lockedTitle = $derived(
		hosting ? undefined : 'Only the host changes the table.'
	);
	/**
	 * Redraws the choices after a refused change, so the choice snaps back. Only then: a redraw on every answer would
	 * take the keyboard focus away.
	 */
	let settingsKey = $derived(store.refusals);

	/** The empty seat whose name field is open, at a hot-seat table. @type {number | null} */
	let addingSeat = $state(null);
	let newName = $state('');

	const MODES = [
		{ value: 'online', label: 'Online mode', color: 'var(--exploration)' },
		{ value: 'hotseat', label: 'Local mode', color: 'var(--exploration)' },
	];
	const YES_NO = [
		{ value: 'yes', label: 'Yes', color: 'var(--science)' },
		{ value: 'no', label: 'No', color: 'var(--text)' },
	];
	const UNDO = [
		{ value: 'on', label: 'Allow undo', color: 'var(--exploration)' },
		{ value: 'off', label: 'No undo', color: 'var(--military)' },
	];
	const RULES_COLORS = /** @type {Record<string, string>} */ ({
		current: 'var(--science)',
		original: 'var(--technology)',
	});

	/** The mockup's order: the current rules first. */
	const RULES_ORDER = ['current', 'original'];

	let rulesChoices = $derived(
		[...(config?.versions ?? [])]
			.sort(
				(
					/** @type {{ id: string }} */ a,
					/** @type {{ id: string }} */ b
				) => RULES_ORDER.indexOf(a.id) - RULES_ORDER.indexOf(b.id)
			)
			.map((/** @type {{ id: string }} */ v) => ({
				value: v.id,
				label: rulesLabel(v.id, { short: true }),
				color: RULES_COLORS[v.id] ?? 'var(--gold)',
			}))
	);

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
	const timerChangeHandler = (event) => {
		store.settings({ timer: Number(event.value) });
	};

	/**
	 * @param {ComponentEvent} event
	 */
	const undoChangeHandler = (event) => {
		store.settings({ undo: event.value === 'on' });
	};

	/**
	 * @param {string} id
	 * @param {ComponentEvent} event
	 */
	const variantChangeHandler = (id, event) => {
		const on = event.value === 'yes';
		// Built from the table the server has, so two quick choices both count.
		store.configure((/** @type {any} */ table) => {
			const others = table.options.variants.filter(
				(/** @type {string} */ v) => v !== id
			);
			return { variants: on ? [...others, id] : others };
		});
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
							options={MODES}
							value={room.mode}
							disabled={!canChangeMode(room)}
							title={canChangeMode(room)
								? undefined
								: hosting
									? 'The mode changes only while you are alone at the table.'
									: 'Only the host changes the mode.'}
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
				<h2 class="rg-lobby--players-title">Players</h2>
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
					{:else if online || hosting}
						<SeatCard
							seat={slot.seat}
							onSeatCardOpen={seatOpenHandler} />
					{:else}
						<div class="rg-lobby--empty-seat"></div>
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
								options={rulesChoices}
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
									options={config.expansions.map(
										(/** @type {string} */ id) => ({
											value: id,
											label: id,
										})
									)}
									value={room.options.expansions}
									disabled={!hosting}
									onSegmentedChange={(
										/** @type {ComponentEvent} */ event
									) =>
										store.configure({
											expansions: event.value,
										})} />
							{/if}
						</SettingRow>
						<SettingRow
							label="Turn timer"
							title={lockedTitle}>
							<Segmented
								label="Turn timer"
								options={timerChoices(
									config?.timers ?? [0]
								).map((choice) => ({
									...choice,
									color: 'var(--exploration)',
								}))}
								value={String(room.timer)}
								disabled={!hosting}
								onSegmentedChange={timerChangeHandler} />
						</SettingRow>
					</div>
					<div class="rg-lobby--column rg-lobby--variants">
						<SettingRow
							label="Undo rules"
							title={lockedTitle}>
							<Segmented
								label="Undo rules"
								options={UNDO}
								value={room.undo ? 'on' : 'off'}
								disabled={!hosting}
								onSegmentedChange={undoChangeHandler} />
						</SettingRow>
						{#each config?.variants ?? [] as variant (variant.id)}
							<SettingRow
								label={VARIANT_LABELS[variant.id] ??
									variant.name}
								title={variant.name}>
								<Segmented
									label={variant.name}
									options={YES_NO}
									value={room.options.variants.includes(
										variant.id
									)
										? 'yes'
										: 'no'}
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
		font: var(--weight-title) clamp(20px, 2vw, 26px) / 1.4 var(--font-title);
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

	.rg-lobby--players-title {
		margin: 0;
		font: var(--weight-bold) var(--font-size-lg) / var(--leading-tight)
			var(--font-body);
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

	.rg-lobby--empty-seat {
		height: var(--seat-height);
		background: var(--surface);
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

	.rg-lobby--variants :global(> *) {
		padding-bottom: var(--space-3);
		border-bottom: var(--border) solid var(--line-soft);
	}

	.rg-lobby--variants :global(> *:last-child) {
		padding-bottom: 0;
		border-bottom: 0;
	}

	.rg-lobby--muted {
		color: var(--muted);
		font-size: var(--font-size-sm);
	}
</style>
