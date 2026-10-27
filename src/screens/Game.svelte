<!-- The play screen (#26 design): the header with the players, the shared board (tracks or map), the player area with Your overview, the footer turn and the decision panel. -->
<script module>
	/**
	 * Properties of the Game screen itself.
	 * @typedef {Object} GameOwnProps
	 * @property {import('../lib/game.svelte.js').GameStore} store - Its room holds the game on show
	 * @property {Function} [onGameHelp] - Callback fired when How to play is chosen
	 */

	/**
	 * Properties for Game, including any attributes for its root element.
	 * @typedef {GameOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} GameProps
	 *
	 * @example
	 * <Game {store} onGameHelp={() => (helpOpen = true)} />
	 */
</script>

<script>
	import { untrack } from 'svelte';
	import BoardSwitcher from '../lib/components/board/BoardSwitcher.svelte';
	import AchievementStrip from '../lib/components/board/AchievementStrip.svelte';
	import TrackBoard from '../lib/components/board/TrackBoard.svelte';
	import WorldMap from '../lib/components/board/WorldMap.svelte';
	import PlayerChip from '../lib/components/player/PlayerChip.svelte';
	import SelfSummary from '../lib/components/player/SelfSummary.svelte';
	import DecisionOption from '../lib/components/prompts/DecisionOption.svelte';
	import DecisionPanel from '../lib/components/prompts/DecisionPanel.svelte';
	import TurnBar from '../lib/components/prompts/TurnBar.svelte';
	import Button from '../lib/components/ui/Button.svelte';
	import IconButton from '../lib/components/ui/IconButton.svelte';
	import TurnClock from '../lib/components/ui/TurnClock.svelte';
	import PageHeader from './PageHeader.svelte';
	import PlayerTabs from './game/PlayerTabs.svelte';
	import PlayersOverview from './game/PlayersOverview.svelte';
	import OverviewCloseBar from '../lib/components/prompts/OverviewCloseBar.svelte';
	import TapestryCard from '../lib/components/player/TapestryCard.svelte';
	import TechnologyCard from '../lib/components/player/TechnologyCard.svelte';
	import { tabFor } from '../lib/area/tabs.js';
	import { achievements, trackBoard } from '../lib/board.js';
	import { formatClock, timeLeft } from '../lib/clock.js';
	import {
		civilizationName,
		decisionTitle,
		describeAnswer,
		describeBonus,
		describeEffects,
		describePayment,
	} from '../lib/describe.js';
	import { mapHexes } from '../lib/hexmap.js';
	import { selfSummary } from '../lib/overview.js';
	import { advanceOptions, myDecision } from '../lib/turn.js';
	import { askedSeats, bonusOf } from '../lib/engine/game.js';
	import { TRACKS } from '../lib/engine/data/tracks.js';
	import { playerColor } from '../lib/ui.js';

	/** @typedef {import('../lib/component-event.js').ComponentEvent} ComponentEvent */
	/** @typedef {import('../lib/ui.js').TrackId} TrackId */

	/** @type {GameProps} */
	let { store, onGameHelp, ...attr } = $props();

	/** Decisions answered with a hex: the map opens for them and lights up their hexes. */
	const MAP_KINDS = ['chooseExplore', 'chooseConquer', 'chooseHex'];

	let room = $derived(store.room);
	let game = $derived(room.game);
	let seat = $derived(store.seat);
	let mine = $derived(myDecision(game, seat));
	let options = $derived(advanceOptions(game, seat));
	let available = $derived(
		options.map((o) => ({ track: o.track, space: o.to }))
	);
	let summary = $derived(selfSummary(game, seat));
	let players = $derived(
		game.seats.filter((/** @type {any} */ s) => s.kind === 'player')
	);

	/** @type {'tracks' | 'map'} */
	let board = $state('tracks');
	/** @type {{ track: TrackId, space: number } | null} */
	let selected = $state(null);
	/** Whether the payment choice for the selected advance is open. */
	let paying = $state(false);
	/** @type {number | null} */
	let payIndex = $state(null);
	/** @type {number | null} The plain prompt's chosen answer, by index */
	let picked = $state(null);
	/** @type {string | null} The hex chosen for a map decision */
	let mapPick = $state(null);
	let sending = $state(false);
	/** The player tab on show (#27). */
	let tab = $state('capital');
	/** @type {{ kind: 'tech' | 'tapestry', data: any } | null} A card shown in full over the shared area */
	let inspected = $state(null);
	/** Whether the players overview is open (#27). */
	let overviewOpen = $state(false);

	/** The selected space's advance, if the viewer can take it now. */
	let chosenAdvance = $derived(
		selected
			? (options.find(
					(o) =>
						o.track === selected?.track && o.to === selected?.space
				) ?? null)
			: null
	);
	let turnDecision = $derived(
		mine && (mine.kind === 'chooseTurn' || mine.kind === 'chooseAdvance')
			? mine
			: null
	);
	let promptDecision = $derived(mine && !turnDecision ? mine : null);
	let isMapDecision = $derived(
		!!promptDecision &&
			(MAP_KINDS.includes(promptDecision.kind) ||
				promptDecision.answers.some(
					(/** @type {any} */ a) => typeof a.hex === 'string'
				))
	);
	let mapTargets = $derived(
		isMapDecision
			? [
					...new Set(
						promptDecision.answers
							.map((/** @type {any} */ a) => a.hex)
							.filter(
								(/** @type {any} */ h) => typeof h === 'string'
							)
					),
				]
			: []
	);
	/** The prompt's answers, narrowed to the chosen hex for a map decision. */
	let promptAnswers = $derived(
		promptDecision
			? promptDecision.answers
					.map(
						(
							/** @type {any} */ answer,
							/** @type {number} */ index
						) => ({
							answer,
							index,
						})
					)
					.filter(
						(/** @type {{ answer: any }} */ { answer }) =>
							typeof answer.hex !== 'string' ||
							answer.hex === mapPick
					)
					.sort(
						(
							/** @type {{ answer: any }} */ a,
							/** @type {{ answer: any }} */ b
						) =>
							(a.answer.tile ?? 0) - (b.answer.tile ?? 0) ||
							(a.answer.orient ?? 0) - (b.answer.orient ?? 0)
					)
			: []
	);
	/** The chosen payment, while it is still one of the selected advance's. */
	let validPay = $derived(
		chosenAdvance &&
			payIndex !== null &&
			payIndex < chosenAdvance.payments.length
			? payIndex
			: null
	);

	// The turn's own choices end with it, however it ends: a timeout, an undo, a refused move (#26 review).
	let turnKey = $derived(turnDecision ? turnDecision.id : null);
	$effect(() => {
		turnKey;
		if (!untrack(() => sending)) {
			selected = null;
			paying = false;
			payIndex = null;
		}
	});

	// A card shown in full goes when what it was shown from may have gone: another tab, seat or decision (#27 review).
	$effect(() => {
		tab;
		seat;
		decisionKey;
		inspected = null;
	});

	// A decision about a tab's things opens that tab (#27 design §5).
	$effect(() => {
		decisionKey;
		const wanted = untrack(() => tabFor(mine));
		if (wanted) {
			tab = wanted;
		}
	});

	// A new decision starts with nothing chosen, and a map decision opens the map.
	let decisionKey = $derived(mine ? `${mine.id}` : '');
	$effect(() => {
		decisionKey;
		picked = null;
		mapPick = null;
		if (isMapDecision) {
			board = 'map';
		}
	});

	// The turn clock: the running one, the viewer's own first; a paused one only when none runs (spec §4).
	let now = $state(Date.now());
	$effect(() => {
		const timer = setInterval(() => {
			now = Date.now();
		}, 250);
		return () => clearInterval(timer);
	});
	let clock = $derived(
		room.clocks.find(
			(/** @type {any} */ c) => c.seat === seat && c.ends !== undefined
		) ??
			room.clocks.find((/** @type {any} */ c) => c.ends !== undefined) ??
			room.clocks.find((/** @type {any} */ c) => c.seat === seat) ??
			room.clocks[0] ??
			null
	);
	let clockMs = $derived(
		clock ? timeLeft(clock, room.now, store.receivedAt, now) : 0
	);

	let currentSeat = $derived(
		game.current === null ? null : game.seats[game.current - 1]
	);

	/**
	 * The words for the selected space: its benefit, and its bonus when it has one.
	 * @param {TrackId} track
	 * @param {number} space
	 */
	function spaceWords(track, space) {
		const benefit = describeEffects(TRACKS[track][space].benefit, {
			state: game,
		});
		const bonus = bonusOf(game, track, space);
		return bonus
			? `${benefit}. Bonus: ${describeBonus(bonus, { state: game })}.`
			: `${benefit}.`;
	}

	/**
	 * The tier price as symbols, for the footer.
	 * @param {TrackId} track
	 * @param {number} space
	 * @returns {import('../lib/ui.js').CostSymbol[]}
	 */
	function priceSymbols(track, space) {
		const tier = trackBoard(game).find((t) => t.id === track)?.tiers[
			Math.ceil(space / 3) - 1
		];
		return tier ?? [];
	}

	/**
	 * A payment's resources as symbols, one per unit.
	 * @param {Record<string, any>} pay
	 * @returns {import('../lib/ui.js').CostSymbol[]}
	 */
	function paySymbols(pay) {
		return /** @type {import('../lib/ui.js').CostSymbol[]} */ (
			['coin', 'worker', 'food', 'culture'].flatMap((r) =>
				Array(typeof pay[r] === 'number' ? pay[r] : 0).fill(r)
			)
		);
	}

	/**
	 * @param {ComponentEvent} event
	 */
	const trackSelectHandler = (event) => {
		selected = event.value;
		paying = false;
		payIndex = null;
	};

	/** Takes an income turn. */
	const incomeHandler = async () => {
		if (!turnDecision || turnDecision.kind !== 'chooseTurn' || sending) {
			return;
		}
		sending = true;
		await store.move({ decision: turnDecision.id, turn: 'income' });
		selected = null;
		sending = false;
	};

	/** Advances on the selected space, asking for the payment first when there is a choice. */
	const advanceHandler = async () => {
		const option = chosenAdvance;
		if (!option || !turnDecision || sending) {
			return;
		}
		if (option.payments.length > 1 && validPay === null) {
			paying = true;
			return;
		}
		const pay = option.payments[validPay ?? 0];
		sending = true;
		if (turnDecision.kind === 'chooseTurn') {
			const ok = await store.move({
				decision: turnDecision.id,
				turn: 'advance',
			});
			if (!ok) {
				sending = false;
				return;
			}
		}
		const next = myDecision(store.room.game, store.seat);
		if (next?.kind === 'chooseAdvance') {
			await store.move({
				decision: next.id,
				track: option.track,
				from: option.from,
				pay,
			});
		}
		selected = null;
		paying = false;
		payIndex = null;
		sending = false;
	};

	/** Sends the plain prompt's chosen answer. */
	const promptConfirmHandler = async () => {
		if (!promptDecision || picked === null || sending) {
			return;
		}
		sending = true;
		await store.move({
			decision: promptDecision.id,
			...promptDecision.answers[picked],
		});
		sending = false;
	};

	/**
	 * @param {ComponentEvent} event
	 */
	const mapSelectHandler = (event) => {
		mapPick = event.value.hex;
		const left = promptAnswers;
		picked = left.length === 1 ? left[0].index : null;
	};

	/**
	 * @param {ComponentEvent} event
	 */
	const menuHandler = (event) => {
		if (event.value === 'leave') {
			store.leaveTable();
		} else if (typeof onGameHelp === 'function') {
			onGameHelp(event);
		}
	};

	/**
	 * Escape closes the players overview (#27 review).
	 * @param {KeyboardEvent} event
	 */
	const keyHandler = (event) => {
		if (event.key === 'Escape' && overviewOpen) {
			overviewOpen = false;
		}
	};

	/** @param {number} seatNumber */
	function nameOf(seatNumber) {
		return game.seats[seatNumber - 1]?.name ?? `Seat ${seatNumber}`;
	}

	let asked = $derived(askedSeats(game));
</script>

<svelte:window onkeydown={keyHandler} />

<div
	{...attr}
	class="rg-game {attr.class ? attr.class : ''}">
	<PageHeader
		sound={store.sound}
		items={[
			{ id: 'help', label: 'How to play' },
			{ id: 'leave', label: 'Leave table' },
		]}
		onPageHeaderSound={(/** @type {any} */ event) =>
			store.setSound(event.value)}
		onPageHeaderMenu={menuHandler}>
		{#snippet center()}
			{#each players as player (player.seat)}
				<PlayerChip
					name={player.name}
					civilization={player.civs.length
						? civilizationName(player.civs[0])
						: 'Setting up'}
					vp={player.vp}
					seat={player.seat}
					current={game.current === player.seat}
					filled={overviewOpen}
					onPlayerChipClick={() => (overviewOpen = !overviewOpen)} />
			{/each}
		{/snippet}
		{#snippet before()}
			{#if clock}
				<TurnClock
					seat={clock.seat}
					ms={clockMs}
					running={clock.ends !== undefined && !clock.expired}
					warn={clock.seat === seat &&
						clock.ends !== undefined &&
						clockMs <= 5000}
					title="{nameOf(clock.seat)}: {formatClock(clockMs)}" />
			{/if}
			<IconButton
				icon="history"
				label="Undo"
				disabled={!room.canUndo}
				onIconButtonClick={() => store.undo()} />
		{/snippet}
	</PageHeader>

	<div class="rg-game--middle">
		<section
			class="rg-game--shared"
			aria-label="Shared board"
			inert={overviewOpen}>
			<div class="rg-game--head">
				<BoardSwitcher bind:value={board} />
				<AchievementStrip achievements={achievements(game)} />
			</div>
			<div class="rg-game--board">
				{#if board === 'tracks'}
					<TrackBoard
						tracks={trackBoard(game)}
						{available}
						{selected}
						onTrackBoardSelect={trackSelectHandler} />
				{:else}
					<WorldMap
						hexes={mapHexes(game)}
						targets={mapTargets}
						selected={mapPick}
						onWorldMapSelect={mapSelectHandler} />
				{/if}
			</div>
			{#if paying && chosenAdvance && selected}
				<DecisionPanel
					title="How do you pay for {TRACKS[selected.track][
						selected.space
					].name}?"
					status={validPay === null
						? 'Choose a payment to continue.'
						: describePayment(chosenAdvance.payments[validPay])}
					confirmLabel="Advance"
					confirmDisabled={validPay === null || sending}
					cancelLabel="Cancel"
					onDecisionPanelConfirm={advanceHandler}
					onDecisionPanelCancel={() => {
						paying = false;
						payIndex = null;
					}}>
					<div class="rg-game--options">
						{#each chosenAdvance.payments as pay, index (index)}
							<DecisionOption
								label={describePayment(pay)}
								symbols={paySymbols(pay)}
								pressed={validPay === index}
								onDecisionOptionClick={() =>
									(payIndex = index)} />
						{/each}
					</div>
				</DecisionPanel>
			{:else if promptDecision}
				<DecisionPanel
					class={isMapDecision ? 'rg-game--map-prompt' : ''}
					title={decisionTitle(promptDecision, game)}
					status={picked === null
						? isMapDecision && !mapPick
							? promptAnswers.length
								? 'Choose a territory on the map, or an answer here.'
								: 'Choose a territory on the map.'
							: 'Choose an answer to continue.'
						: describeAnswer(
								promptDecision,
								promptDecision.answers[picked],
								game
							)}
					confirmDisabled={picked === null || sending}
					cancelLabel={isMapDecision && mapPick
						? 'Choose another territory'
						: undefined}
					onDecisionPanelConfirm={promptConfirmHandler}
					onDecisionPanelCancel={() => {
						mapPick = null;
						picked = null;
					}}>
					{#if promptAnswers.length}
						<div class="rg-game--options">
							{#each promptAnswers as { answer, index } (index)}
								<DecisionOption
									label={describeAnswer(
										promptDecision,
										answer,
										game
									)}
									symbols={answer.pay
										? paySymbols(answer.pay)
										: []}
									pressed={picked === index}
									onDecisionOptionClick={() =>
										(picked = index)} />
							{/each}
						</div>
					{:else}
						<p class="rg-game--hint">
							The territories you can choose are lit on the map.
						</p>
					{/if}
				</DecisionPanel>
			{/if}
			{#if inspected}
				<div
					class="rg-game--inspect"
					aria-hidden="true">
					{#if inspected.kind === 'tech'}
						<TechnologyCard data={inspected.data} />
					{:else}
						<TapestryCard data={inspected.data} />
					{/if}
				</div>
			{/if}
		</section>

		<aside
			class="rg-game--private"
			aria-label="Your player area"
			inert={overviewOpen}>
			{#if seat !== null && summary}
				<PlayerTabs
					{game}
					{seat}
					code={room.code}
					bind:tab
					onPlayerTabsInspect={(
						/** @type {ComponentEvent} */ event
					) => (inspected = event.value)} />
			{:else}
				<p class="rg-game--soon">
					Choose a seat to see its capital, hand and cards.
				</p>
			{/if}
			{#if summary}
				<SelfSummary {...summary} />
			{/if}
		</aside>
		{#if overviewOpen}
			<PlayersOverview
				{game}
				{seat}
				host={room.host}
				code={room.code} />
		{/if}
	</div>

	{#if overviewOpen}
		<OverviewCloseBar
			onOverviewCloseBarClick={() => (overviewOpen = false)} />
	{:else if game.phase === 'over'}
		<TurnBar
			tone="waiting"
			label="Game over"
			heading="The game is over." />
	{:else if turnDecision && selected}
		<TurnBar
			tone="selected"
			heading="Advance to"
			properName={TRACKS[selected.track][selected.space].name}
			track={selected.track}
			detail={spaceWords(selected.track, selected.space)}
			cost={priceSymbols(selected.track, selected.space)}
			income={turnDecision.kind === 'chooseTurn'
				? {
						description:
							'End this era, gain income and begin your next era.',
						label: 'Take income',
					}
				: null}
			onTurnBarIncome={incomeHandler}>
			{#snippet actions()}
				<Button
					mode="primary"
					disabled={!chosenAdvance || sending}
					title={chosenAdvance
						? undefined
						: "You can't advance there now."}
					onButtonClick={advanceHandler}>Advance</Button>
			{/snippet}
		</TurnBar>
	{:else if turnDecision}
		<TurnBar
			tone="neutral"
			heading={available.length
				? 'Choose a space to advance to, or take income.'
				: 'Take an income turn.'}
			detail={available.length
				? 'The spaces you can pay for are outlined in green.'
				: undefined}
			income={turnDecision.kind === 'chooseTurn'
				? {
						description:
							'End this era, gain income and begin your next era.',
						label: 'Take income',
					}
				: null}
			onTurnBarIncome={incomeHandler} />
	{:else if promptDecision}
		<TurnBar
			tone="neutral"
			label="Your decision"
			heading={decisionTitle(promptDecision, game)}
			detail="Answer in the panel above." />
	{:else if game.phase === 'setup'}
		<TurnBar
			tone="waiting"
			label="Setting up"
			heading="Waiting for the others to choose." />
	{:else if currentSeat}
		<TurnBar
			tone="waiting"
			label={asked.length && !asked.includes(currentSeat.seat)
				? `Waiting for ${nameOf(asked[0])}`
				: `${currentSeat.name}’s turn`}
			labelColor={playerColor(
				asked.length && !asked.includes(currentSeat.seat)
					? asked[0]
					: currentSeat.seat
			)}
			heading={asked.length && !asked.includes(currentSeat.seat)
				? `${nameOf(asked[0])} is deciding.`
				: `${currentSeat.name} is taking their turn.`} />
	{/if}
</div>

<style>
	.rg-game {
		display: grid;
		grid-template-rows: var(--bar-height) minmax(0, 1fr) var(--bar-height);
		height: 100vh;
		min-height: 0;
		overflow: hidden;
	}

	.rg-game--middle {
		position: relative;
		display: grid;
		grid-template-columns: var(--play-columns);
		gap: var(--play-gap);
		min-height: 0;
		background: var(--ink);
	}

	.rg-game--shared,
	.rg-game--private {
		min-width: 0;
		min-height: 0;
		background: var(--texture) var(--surface);
	}

	.rg-game--shared {
		position: relative;
		display: flex;
		flex-direction: column;
		padding: 14px var(--space-9) var(--space-6) var(--space-10);
		overflow: hidden;
	}

	.rg-game--head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-9);
		margin-bottom: var(--space-5);
	}

	.rg-game--board {
		flex: 1;
		min-height: 0;
	}

	.rg-game--private {
		display: grid;
		grid-template-rows: minmax(0, 1fr) auto;
		overflow: hidden;
	}

	/* A card shown in full over the shared area, as the mockup's card overview: a scrim, the card, no pointer. */
	.rg-game--inspect {
		position: absolute;
		z-index: var(--layer-popover);
		inset: 0;
		display: grid;
		place-items: center;
		background: color-mix(in srgb, var(--ink) 52%, transparent);
		pointer-events: none;
	}

	.rg-game--soon {
		margin: 0;
		padding: var(--space-9) 22px;
		color: var(--muted);
	}

	.rg-game--options {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-5);
		max-height: 340px;
		overflow: auto;
	}

	.rg-game--hint {
		margin: 0;
		color: var(--muted);
	}

	/* A map decision leaves the map clickable: no scrim, only the panel takes the pointer, docked at the right
	   beside the map rather than over its hexes (#26 review). */
	.rg-game--shared :global(.rg-game--map-prompt) {
		align-items: flex-end;
		justify-content: flex-start;
		padding-top: 70px;
		background: transparent;
		pointer-events: none;
	}

	.rg-game--shared :global(.rg-game--map-prompt .rg-decision-panel--panel) {
		width: 340px;
		min-width: 0;
		max-height: calc(100% - var(--space-9));
	}

	.rg-game--shared :global(.rg-game--map-prompt > *) {
		pointer-events: auto;
	}
</style>
