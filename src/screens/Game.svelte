<!-- The play screen (#26 design): the header with the players, the shared board (tracks or map), the player area with Your overview, the footer turn and the decision panel. -->
<script module>
	/**
	 * Properties of the Game screen itself.
	 * @typedef {Object} GameOwnProps
	 * @property {import('../lib/game.svelte.js').GameStore} store - Its room holds the game on show
	 * @property {Function} [onGameResults] - Callback fired when Results is chosen, once the game is over (#29)
	 * @property {'none' | 'panel' | 'shelf'} [panel='none'] - What is open over the board, so the dice tray outside the screen rolls clear of it (#61, #79); bindable
	 * @property {import('../lib/player-actions.js').PlayerActionItem | null} [action=null] - What another player did, on show outside the screen (#153): its space or hex is lit in their colour
	 * @property {string} [justNow] - The last thing another player did, for the footer's "Just now" line (#153)
	 * @property {Function} [onGameShowAgain] - Callback fired when the footer's Show again is pressed
	 */

	/**
	 * Properties for Game, including any attributes for its root element.
	 * @typedef {GameOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} GameProps
	 *
	 * @example
	 * <Game {store} bind:panel onGameResults={() => (reviewing = false)} />
	 */
</script>

<script>
	import { untrack } from 'svelte';
	import BoardSwitcher from '../lib/components/board/BoardSwitcher.svelte';
	import AchievementStrip from '../lib/components/board/AchievementStrip.svelte';
	import TrackBoard from '../lib/components/board/TrackBoard.svelte';
	import WorldMap from '../lib/components/board/WorldMap.svelte';
	import SelfSummary from '../lib/components/player/SelfSummary.svelte';
	import PlayLayout from '../lib/components/ui/PlayLayout.svelte';
	import IncomeNotice from '../lib/components/prompts/IncomeNotice.svelte';
	import DecisionPrompt from './game/DecisionPrompt.svelte';
	import GameHeader from './game/GameHeader.svelte';
	import TurnFooter from './game/TurnFooter.svelte';
	import PlayerTabs from './game/PlayerTabs.svelte';
	import PlayersOverview from './game/PlayersOverview.svelte';
	import LogPanel from './game/LogPanel.svelte';
	import TableSettings from './game/TableSettings.svelte';
	import RulesPanel from './game/RulesPanel.svelte';
	import { RULES_HELP } from '../lib/rules-help.js';
	import { hotkeyAction, hotkeyGate } from '../lib/hotkeys.js';
	import {
		NO_LAYERS,
		closeLayer,
		escapeLayer,
		openLayer,
	} from '../lib/layers.js';
	import { eventText } from '../lib/log.js';
	import { highlights, prefersReducedMotion } from '../lib/motion.js';
	import CardPreview from '../lib/components/player/CardPreview.svelte';
	import { tabFor } from '../lib/area/tabs.js';
	import { nextInspected, shownSeat } from '../lib/area/inspect.js';
	import { achievements, trackBoard } from '../lib/board.js';
	import { mapHexes } from '../lib/hexmap.js';
	import { PromptState } from '../lib/prompt-state.svelte.js';
	import { areaSummary, selfSummary } from '../lib/overview.js';
	import {
		advanceOptions,
		firstIncomeNotice,
		footerView,
		myDecision,
		trackPreviewSeat,
	} from '../lib/turn.js';
	import { sendAdvance } from '../lib/moves.js';

	/** @typedef {import('../lib/component-event.js').ComponentEvent} ComponentEvent */
	/** @typedef {import('../lib/ui.js').TrackId} TrackId */

	/** @type {GameProps} */
	let {
		store,
		onGameResults,
		panel = $bindable('none'),
		action = null,
		justNow,
		onGameShowAgain,
		...attr
	} = $props();

	let room = $derived(store.room);
	let game = $derived(room.game);
	let seat = $derived(store.seat);
	let mine = $derived(myDecision(game, seat));
	let options = $derived(advanceOptions(game, seat));
	let available = $derived(
		options.map((o) => ({ track: o.track, space: o.to }))
	);
	let players = $derived(
		game.seats.filter((/** @type {any} */ s) => s.kind === 'player')
	);

	let board = $state(/** @type {'tracks' | 'map'} */ ('tracks'));
	/** The space another player just advanced to, lit in their colour while it shows (#153). */
	let litSpace = $derived(
		action?.kind === 'advance'
			? {
					track: action.picture.track,
					space: action.picture.space,
					color: action.color,
				}
			: null
	);
	/** The hex another player just explored or conquered, lit on the map when it is on show (#153). */
	let litHex = $derived(
		action?.kind === 'explore' || action?.kind === 'conquer'
			? { hex: action.picture.hex, color: action.color }
			: null
	);
	/** @type {{ track: TrackId, space: number } | null} */
	let selected = $state(null);
	/** A move of the turn's own is being sent; the prompt has its own (#79). */
	let sending = $state(false);
	/** The player tab on show (#27). */
	let tab = $state('capital');
	/** Another player whose tabs the player area shows, read-only, as their chip or number key chose them; null for your own (#145, owner 2026-10-30). */
	let viewing = $state(/** @type {number | null} */ (null));
	let tabSeat = $derived(shownSeat(viewing, seat));
	let summary = $derived(selfSummary(game, seat));
	/** @type {import('../lib/prompt-state.svelte.js').Inspected | null} A card shown in full over the shared area; beside the shelf, without a scrim, for a shelf card */
	let inspected = $state(
		/** @type {import('../lib/prompt-state.svelte.js').Inspected | null} */ (
			null
		)
	);
	/**
	 * What is open over the screen (#88): How to play, Table settings, the players overview (#27) and the player it
	 * opened on, the log and scores (#29), and the footer's question (#83, owner): "Take an income turn?" before income
	 * is taken, or "Advance on which track?" after A, answered by 1 to 4.
	 */
	let layers = $state(
		/** @type {import('../lib/layers.js').Layers} */ (NO_LAYERS)
	);
	/** The log's tab, and a dot for entries it hasn't shown yet. */
	let logTab = $state(/** @type {'log' | 'scores'} */ ('log'));
	let logUnread = $state(false);
	/** How to play's tab on show (#42): a rules section or the keyboard shortcuts. */
	let rulesTab = $state(RULES_HELP[0].id);
	/** The log and scores, shown while Tab is held (#83, owner). */
	let logPeek = $state(false);
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let peekTimer;

	/** @type {import('../lib/motion.js').Highlights} */
	const STILL = { hexes: [], plots: [], landmarks: [], vp: [] };
	/** What moves for the latest fresh events (#29 design §8), for a moment. */
	let moved = $state(STILL);
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let movedTimer;
	let movedFrame = 0;
	/** The batch of fresh events handled last: one that arrived before this screen opened is not played again. */
	let handled = untrack(() => store.freshCount);

	$effect(() => {
		const count = store.freshCount;
		if (count === handled) {
			return;
		}
		handled = count;
		untrack(() => {
			const events = store.fresh;
			if (
				!layers.log &&
				events.some((e) => eventText(e, game) !== null)
			) {
				logUnread = true;
			}
			if (prefersReducedMotion()) {
				return;
			}
			const next = highlights(events, seat);
			// The last highlights go first, for a frame, so a hex or chip that changes again moves again.
			moved = STILL;
			clearTimeout(movedTimer);
			cancelAnimationFrame(movedFrame);
			movedFrame = requestAnimationFrame(() => {
				movedFrame = requestAnimationFrame(() => {
					moved = next;
					movedTimer = setTimeout(() => (moved = STILL), 2000);
				});
			});
		});
	});
	$effect(() => () => {
		clearTimeout(movedTimer);
		cancelAnimationFrame(movedFrame);
	});

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
	/** The one-time notice after income turn 1 (#77), and whether this seat closed it, kept per table and seat. */
	let notice = $derived(firstIncomeNotice(game, seat));
	let noticeKey = $derived(`rg-first-income:${room.code}:${seat}`);
	let noticeClosed = $state(false);
	/** The notice shows unless closed, and never under the players overview or the table settings. */
	let noticeOpen = $derived(
		Boolean(notice) && !noticeClosed && !layers.overview && !layers.settings
	);
	$effect(() => {
		const key = noticeKey;
		untrack(() => {
			noticeClosed = store.noticeClosed(key);
		});
	});

	/** Closes the income notice for good at this table and seat. */
	const noticeCloseHandler = () => {
		noticeClosed = true;
		store.closeNotice(noticeKey);
	};
	let held = $derived(
		summary?.resources ?? { coin: 0, food: 0, worker: 0, culture: 0 }
	);
	/** The decision prompt (#79): what the viewer has chosen in the open decision or an advance's payment. */
	const promptState = new PromptState({
		get game() {
			return game;
		},
		get seat() {
			return seat;
		},
		get decision() {
			return promptDecision;
		},
		get board() {
			return board;
		},
		get advance() {
			return chosenAdvance;
		},
		get held() {
			return held;
		},
		get busy() {
			return sending;
		},
		move: (action) =>
			store.move(/** @type {{ decision: number }} */ (action)),
	});
	/** The summary at the foot of the area: the seat on show's, with your prompt's preview only on your own (#157). */
	let shownSummary = $derived(
		areaSummary(game, tabSeat, seat, {
			resources: promptState.resources,
			changed: promptState.changed,
		})
	);

	// The turn's own choices end with it, however it ends: a timeout, an undo, a refused move (#26 review).
	let turnKey = $derived(turnDecision ? turnDecision.id : null);
	$effect(() => {
		turnKey;
		if (!untrack(() => sending)) {
			selected = null;
			promptState.clearPayment();
		}
	});

	// A card shown in full goes when what it was shown from may have gone: another tab, seat or decision (#27 review).
	$effect(() => {
		tab;
		tabSeat;
		decisionKey;
		inspected = null;
	});

	// A decision about a tab's things opens that tab (#27 design §5), in your own area (#145).
	$effect(() => {
		decisionKey;
		const wanted = untrack(() => tabFor(mine));
		if (wanted) {
			tab = wanted;
			viewing = null;
		}
	});

	// Another seat at the screen (a hot-seat pass) starts in its own area (#145).
	$effect(() => {
		seat;
		viewing = null;
	});

	// The dice tray rolls clear of what is open over the board: a panel, a stack of cards, or the income notice. It is
	// outside this screen, so it learns of it from here, and of nothing once the screen goes (#61, #79).
	$effect(() => {
		panel =
			promptState.panel !== 'none'
				? promptState.panel
				: noticeOpen
					? 'panel'
					: 'none';
		return () => {
			panel = 'none';
		};
	});

	// A map decision opens the map; the prompt state starts each decision with nothing chosen (#79).
	let decisionKey = $derived(mine ? `${mine.id}` : '');
	$effect(() => {
		decisionKey;
		if (promptState.isMap) {
			board = 'map';
		}
	});

	/** Which footer shows, and what it says (#86). */
	let footer = $derived(
		footerView(game, seat, {
			overviewOpen: layers.overview,
			noticeOpen,
			incomeAsk: layers.question === 'income',
			trackAsk: layers.question === 'track',
			selected,
			options,
			paying: promptState.paying,
			income: promptState.prompt?.income ?? null,
			incomeStep: promptState.incomeStep,
		})
	);

	/**
	 * A space picked on the tracks, or by the track question: with a choice of payment, its panel opens at once, as
	 * BGA opens its payment on the click (#75).
	 * @param {{ track: TrackId, space: number }} space
	 */
	function selectSpace(space) {
		clearQuestion();
		selected = space;
		promptState.clearPayment();
	}

	/**
	 * @param {ComponentEvent} event
	 */
	const trackSelectHandler = (event) => {
		selectSpace(event.value);
	};

	/** Asks "Take an income turn?" in the footer first: income is never taken on one press (#83, owner). */
	const incomeAskHandler = () => {
		if (!turnDecision || turnDecision.kind !== 'chooseTurn' || sending) {
			return;
		}
		layers = openLayer(layers, 'income');
	};

	/** The footer's question goes, whichever it was. */
	function clearQuestion() {
		layers = closeLayer(closeLayer(layers, 'income'), 'track');
	}

	/** The tracks with a space the viewer can pay for, which the track question offers (#83). */
	let askTracks = $derived([...new Set(options.map((o) => o.track))]);

	/**
	 * Answers the track question (#83): the token's next space, as a click picks it, then the advance at once unless
	 * the payment has a choice, which opens its panel. The most advanced token goes when a track has several.
	 * @param {TrackId} track
	 */
	const trackPickHandler = (track) => {
		const option = options
			.filter((o) => o.track === track)
			.sort((a, b) => b.from - a.from)[0];
		if (!option || sending) {
			return;
		}
		selectSpace({ track, space: option.to });
		if (!promptState.paying) {
			advanceHandler();
		}
	};

	/** Takes an income turn, once asked. */
	const incomeHandler = async () => {
		if (!turnDecision || turnDecision.kind !== 'chooseTurn' || sending) {
			return;
		}
		clearQuestion();
		sending = true;
		await store.move({ decision: turnDecision.id, turn: 'income' });
		selected = null;
		sending = false;
	};

	/**
	 * Advances on the selected space. A payment with a choice is picked in the prompt's panel first (#75), which
	 * passes the payment's index; without a choice the one payment goes.
	 * @param {number} [pay] - The payment's index in the advance's payments
	 */
	const advanceHandler = async (pay = -1) => {
		const option = chosenAdvance;
		if (!option || !turnDecision || sending) {
			return;
		}
		if (promptState.paying && pay === -1) {
			return;
		}
		sending = true;
		const moved = await sendAdvance(
			(action) => store.move(action),
			() => myDecision(store.room.game, store.seat),
			turnDecision,
			option,
			option.payments[pay === -1 ? 0 : pay]
		);
		if (!moved) {
			sending = false;
			return;
		}
		selected = null;
		promptState.clearPayment();
		sending = false;
	};

	/**
	 * A place chosen on the Capital tab, or none when a landmark goes back to the tray; the piece's own confirm sends it.
	 * @param {ComponentEvent} event
	 */
	const placeHandler = (event) => {
		promptState.place(event.value.index, event.value.confirm);
	};

	/**
	 * @param {ComponentEvent} event
	 */
	const menuHandler = (event) => {
		if (event.value === 'settings') {
			layers = openLayer(layers, 'settings');
		} else if (event.value === 'help' || event.value === 'keys') {
			// On the rules or on the keyboard shortcuts (#42).
			rulesTab = event.value === 'keys' ? 'keys' : RULES_HELP[0].id;
			layers = openLayer(layers, 'rules');
		}
	};

	const logToggleHandler = () => {
		layers = layers.log
			? closeLayer(layers, 'log')
			: openLayer(layers, 'log');
		logUnread = false;
	};

	/**
	 * A header chip shows that player's tabs in the player area, and the same chip or your own goes back (#145, owner
	 * 2026-10-30): the players overview no longer opens from the chips.
	 * @param {ComponentEvent} event - From GameHeader: the chip's seat
	 */
	const chipHandler = (event) => {
		viewing = nextInspected(viewing, event.value, seat);
	};

	/** A question in the footer belongs to the turn choice it was asked on. */
	$effect(() => {
		void turnDecision?.id;
		untrack(clearQuestion);
	});

	/**
	 * Tab held shows the log and scores (#83, owner): the first press moves the focus as usual and starts a short
	 * wait, the key's repeats don't move it on, and the log shows once the wait is over, until Tab is let go.
	 * @param {KeyboardEvent} event
	 */
	function tabDown(event) {
		if (event.ctrlKey || event.altKey || event.metaKey || layers.rules) {
			return;
		}
		if (event.repeat) {
			event.preventDefault();
			return;
		}
		clearTimeout(peekTimer);
		if (!layers.log) {
			peekTimer = setTimeout(() => (logPeek = true), 200);
		}
	}

	/** Letting Tab go hides the log it showed. */
	const keyUpHandler = (/** @type {KeyboardEvent} */ event) => {
		if (event.key === 'Tab') {
			clearTimeout(peekTimer);
			logPeek = false;
		}
	};

	const blurHandler = () => {
		clearTimeout(peekTimer);
		logPeek = false;
	};
	$effect(() => () => clearTimeout(peekTimer));

	/**
	 * What the screen needs to know about a key press, read from the event and the element it was pressed on (#88).
	 * @param {KeyboardEvent} event
	 * @returns {import('../lib/hotkeys.js').KeyFacts}
	 */
	function keyFacts(event) {
		const target = /** @type {HTMLElement | null} */ (event.target);
		/** @param {string} selector */
		const within = (selector) => Boolean(target?.closest?.(selector));
		return {
			key: event.key,
			modified: event.ctrlKey || event.altKey || event.metaKey,
			taken: event.defaultPrevented,
			typing:
				Boolean(target?.isContentEditable) ||
				within('input, textarea, select'),
			inMenu: within('[role="menu"]'),
			inModal: within('[aria-modal="true"]'),
			onControl: target !== document.body,
		};
	}

	/**
	 * Escape closes the one thing on top (#88); every other key is a hotkey (#83). hotkeyGate decides whether the
	 * screen takes the key at all.
	 * @param {KeyboardEvent} event
	 */
	const keyHandler = (event) => {
		if (event.key === 'Tab') {
			tabDown(event);
			return;
		}
		if (!hotkeyGate(keyFacts(event), layers)) {
			return;
		}
		if (event.key === 'Escape') {
			const layer = escapeLayer(layers, noticeOpen);
			if (layer === 'notice') {
				noticeCloseHandler();
			} else if (layer !== null) {
				layers = closeLayer(layers, layer);
			} else if (viewing !== null) {
				// With nothing open over the screen, Escape goes back to your own tabs (#145).
				viewing = null;
			}
			return;
		}
		const action = hotkeyAction(event.key, {
			canIncome:
				turnDecision?.kind === 'chooseTurn' && !noticeOpen && !sending,
			canAdvance:
				Boolean(turnDecision) &&
				askTracks.length > 0 &&
				!noticeOpen &&
				!sending,
			canUndo: Boolean(room.canUndo),
			confirming: layers.question === 'income',
			asking: layers.question === 'track',
			tracks: askTracks,
			players: players.length,
			board,
			exploring: promptState.canTurn,
		});
		if (!action) {
			return;
		}
		event.preventDefault();
		hotkeyHandler(action);
	};

	/**
	 * Does what a hotkey asks for (#83).
	 * @param {import('../lib/hotkeys.js').HotkeyAction} action
	 */
	function hotkeyHandler(action) {
		switch (action.type) {
			case 'income':
				incomeAskHandler();
				break;
			case 'incomeConfirm':
				incomeHandler();
				break;
			case 'advance':
				selected = null;
				promptState.clearPayment();
				layers = openLayer(layers, 'track');
				break;
			case 'track':
				trackPickHandler(action.track);
				break;
			case 'confirm':
				// The open panel's Confirm (the payment's Advance, the notice's Got it), or the footer's Advance.
				if (promptState.paying) {
					if (promptState.payIndex !== -1) {
						advanceHandler(promptState.payIndex);
					}
				} else if (promptState.prompt) {
					promptState.confirm();
				} else if (noticeOpen) {
					noticeCloseHandler();
				} else if (selected && chosenAdvance) {
					advanceHandler();
				}
				break;
			case 'undo':
				store.undo();
				break;
			case 'board':
				board = action.board;
				break;
			case 'tab':
				tab = action.tab;
				break;
			case 'player':
				// As the chip: that player's tabs, and the same key or your own goes back (#145).
				viewing = nextInspected(viewing, action.seat, seat);
				break;
			case 'log':
				logToggleHandler();
				break;
			case 'help':
			case 'keys':
				rulesTab = action.type === 'keys' ? 'keys' : RULES_HELP[0].id;
				layers = openLayer(layers, 'rules');
				break;
			case 'turn':
				promptState.turnTile(action.step);
				break;
		}
	}
</script>

<svelte:window
	onkeydown={keyHandler}
	onkeyup={keyUpHandler}
	onblur={blurHandler} />

<!-- The turn footer is a snippet of its own, outside PlayLayout's children, because `footer` already names its view. -->
{#snippet turnFooter()}
	<TurnFooter
		view={footer}
		{sending}
		onTurnFooterIncomeAsk={incomeAskHandler}
		onTurnFooterIncome={incomeHandler}
		onTurnFooterAdvance={() => advanceHandler()}
		onTurnFooterTrack={(/** @type {ComponentEvent} */ event) =>
			trackPickHandler(event.value)}
		onTurnFooterCancel={clearQuestion}
		onTurnFooterResults={(/** @type {ComponentEvent} */ event) =>
			onGameResults?.(event)}
		onTurnFooterOverviewClose={() =>
			(layers = closeLayer(layers, 'overview'))}
		{justNow}
		onTurnFooterShowAgain={(/** @type {ComponentEvent} */ event) =>
			onGameShowAgain?.(event)} />
{/snippet}

<PlayLayout
	{...attr}
	class="rg-game {attr.class ? attr.class : ''}"
	sharedLabel="Shared board"
	playerLabel="Your player area"
	areasInert={layers.overview}
	footer={turnFooter}>
	{#snippet header()}
		<GameHeader
			{store}
			{game}
			{seat}
			overviewOpen={layers.overview}
			logOpen={layers.log}
			{logUnread}
			bumped={moved.vp}
			onGameHeaderChip={chipHandler}
			onGameHeaderLog={logToggleHandler}
			onGameHeaderMenu={menuHandler} />
	{/snippet}

	{#snippet shared()}
		<div class="rg-game--shared">
			<div class="rg-game--head">
				<BoardSwitcher bind:value={board} />
				<AchievementStrip achievements={achievements(game)} />
			</div>
			<div
				class="rg-game--board"
				class:rg-game--board-docked={promptState.docked}>
				{#if board === 'tracks'}
					<TrackBoard
						tracks={trackBoard(game)}
						{available}
						previewSeat={trackPreviewSeat(game, seat)}
						{selected}
						lit={litSpace}
						onTrackBoardSelect={trackSelectHandler} />
				{:else}
					<WorldMap
						hexes={mapHexes(game)}
						targets={promptState.targets}
						selected={promptState.hex}
						scores={promptState.scores}
						preview={promptState.preview}
						fresh={moved.hexes}
						lit={litHex}
						onWorldMapSelect={(
							/** @type {ComponentEvent} */ event
						) => promptState.selectHex(event.value.hex)} />
				{/if}
			</div>
			{#if promptState.panel !== 'none'}
				<DecisionPrompt
					state={promptState}
					code={room.code}
					onDecisionPromptAdvance={(
						/** @type {ComponentEvent} */ event
					) => advanceHandler(event.value)}
					onDecisionPromptCancel={() => (selected = null)}
					onDecisionPromptInspect={(
						/** @type {ComponentEvent} */ event
					) => (inspected = event.value)} />
			{:else if noticeOpen && notice}
				<IncomeNotice
					resources={notice.resources}
					holdings={notice.holdings}
					onIncomeNoticeClose={noticeCloseHandler} />
			{/if}
			{#if inspected}
				<CardPreview {...inspected} />
			{/if}
		</div>
	{/snippet}

	{#snippet player()}
		<div class="rg-game--private">
			{#if tabSeat !== null && (viewing !== null || summary)}
				<PlayerTabs
					{game}
					seat={tabSeat}
					viewer={seat}
					onPlayerTabsBack={() => (viewing = null)}
					code={room.code}
					bind:tab
					placement={promptState.placement}
					fresh={{ plots: moved.plots, landmarks: moved.landmarks }}
					onPlayerTabsPlace={placeHandler}
					tilePick={promptState.tilePick}
					onPlayerTabsPick={(/** @type {ComponentEvent} */ event) =>
						promptState.pickTile(event.value.tile)}
					civPick={promptState.civPick}
					onPlayerTabsSpot={(/** @type {ComponentEvent} */ event) =>
						promptState.selectSpot(event.value)}
					onPlayerTabsInspect={(
						/** @type {ComponentEvent} */ event
					) => (inspected = event.value)} />
			{:else}
				<p class="rg-game--soon">
					Hands stay hidden at a shared screen. Open a player's chip
					to see their tabs.
				</p>
			{/if}
			{#if shownSummary}
				<SelfSummary
					{...shownSummary}
					class={viewing !== null && shownSummary.seat !== seat
						? 'rg-game--theirs'
						: ''} />
			{/if}
		</div>
	{/snippet}

	{#snippet overlays()}
		{#if layers.overview}
			<PlayersOverview
				{game}
				{seat}
				host={room.host}
				code={room.code}
				player={layers.player} />
		{/if}
		{#if (layers.log || logPeek) && !layers.overview}
			<LogPanel
				{game}
				{seat}
				bind:tab={logTab}
				onLogPanelClose={() => {
					layers = closeLayer(layers, 'log');
					logPeek = false;
				}} />
		{/if}
		{#if layers.settings}
			<TableSettings
				{store}
				onTableSettingsClose={() =>
					(layers = closeLayer(layers, 'settings'))} />
		{/if}
		{#if layers.rules}
			<RulesPanel
				bind:tab={rulesTab}
				expansions={game.expansions ?? []}
				onRulesPanelClose={() =>
					(layers = closeLayer(layers, 'rules'))} />
		{/if}
	{/snippet}
</PlayLayout>

<style>
	/* The frame and its areas are PlayLayout's (issue 105); these two fill the areas and set their own layout. */
	.rg-game--shared {
		position: relative;
		display: flex;
		min-width: 0;
		min-height: 0;
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

	/* While a panel is docked at the right, the board leaves the panel's width and inset free, so the map lays itself
	   out beside the panel, this area's right padding apart, and no hex lies under it (#74). */
	.rg-game--board-docked {
		margin-right: calc(
			var(--docked-panel-width) + var(--docked-panel-inset)
		);
	}

	/* The column, not its widest content, sets the width, so the tabs, capital and counters fit inside it (#64). */
	.rg-game--private {
		display: grid;
		min-width: 0;
		min-height: 0;
		grid-template-columns: minmax(0, 1fr);
		grid-template-rows: minmax(0, 1fr) auto;
		overflow: hidden;
	}

	/* Another player's summary (issue 157) continues the border their tabs draw (issue 145) down its sides and foot. */
	.rg-game--private :global(.rg-game--theirs) {
		box-shadow:
			inset var(--border-thick) 0 0 var(--rg-self-summary-color),
			inset calc(-1 * var(--border-thick)) 0 0
				var(--rg-self-summary-color),
			inset 0 calc(-1 * var(--border-thick)) 0
				var(--rg-self-summary-color);
	}

	.rg-game--soon {
		margin: 0;
		padding: var(--space-9) 22px;
		color: var(--muted);
	}
</style>
