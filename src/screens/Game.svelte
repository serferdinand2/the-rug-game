<!-- The play screen (#26 design): the header with the players, the shared board (tracks or map), the player area with Your overview, the footer turn and the decision panel. -->
<script module>
	/**
	 * Properties of the Game screen itself.
	 * @typedef {Object} GameOwnProps
	 * @property {import('../lib/game.svelte.js').GameStore} store - Its room holds the game on show
	 * @property {Function} [onGameResults] - Callback fired when Results is chosen, once the game is over (#29)
	 * @property {'none' | 'panel' | 'shelf'} [panel='none'] - What is open over the board, so the dice tray outside the screen rolls clear of it (#61, #79); bindable
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
	import { hotkeyAction } from '../lib/hotkeys.js';
	import { eventText } from '../lib/log.js';
	import { highlights, prefersReducedMotion } from '../lib/motion.js';
	import TapestryCard from '../lib/components/player/TapestryCard.svelte';
	import TechnologyCard from '../lib/components/player/TechnologyCard.svelte';
	import { tabFor } from '../lib/area/tabs.js';
	import { achievements, trackBoard } from '../lib/board.js';
	import { mapHexes } from '../lib/hexmap.js';
	import { PromptState } from '../lib/prompt-state.svelte.js';
	import { selfSummary } from '../lib/overview.js';
	import {
		advanceOptions,
		firstIncomeNotice,
		footerView,
		myDecision,
	} from '../lib/turn.js';
	import { sendAdvance } from '../lib/moves.js';

	/** @typedef {import('../lib/component-event.js').ComponentEvent} ComponentEvent */
	/** @typedef {import('../lib/ui.js').TrackId} TrackId */

	/** @type {GameProps} */
	let { store, onGameResults, panel = $bindable('none'), ...attr } = $props();

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

	let board = $state(/** @type {'tracks' | 'map'} */ ('tracks'));
	/** @type {{ track: TrackId, space: number } | null} */
	let selected = $state(null);
	/** A move of the turn's own is being sent; the prompt has its own (#79). */
	let sending = $state(false);
	/** The player tab on show (#27). */
	let tab = $state('capital');
	/** @type {{ kind: 'tech' | 'tapestry', data: any, side?: boolean } | null} A card shown in full over the shared area; beside the shelf, without a scrim, for a shelf card */
	let inspected = $state(null);
	/** Whether the players overview is open (#27). */
	let overviewOpen = $state(false);
	/** The log and scores panel (#29): open, its tab, and a dot for entries it hasn't shown yet. */
	let logOpen = $state(false);
	let logTab = $state(/** @type {'log' | 'scores'} */ ('log'));
	let logUnread = $state(false);
	/** The host's table settings during a game (#29 design §9). */
	let settingsOpen = $state(false);
	/** How to play (#42): open, and the tab on show, a rules section or the keyboard shortcuts. */
	let rulesOpen = $state(false);
	let rulesTab = $state(RULES_HELP[0].id);
	/** The footer asks "Take an income turn?" before taking it, from the button or I (#83, owner). */
	let incomeAsk = $state(false);
	/** The footer asks "Advance on which track?" after A, answered by 1 to 4 (#83, owner). */
	let trackAsk = $state(false);
	/** The log and scores, shown while Tab is held (#83, owner). */
	let logPeek = $state(false);
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let peekTimer;
	/** The player whose capital the overview opens on, from 1 to 5 (#83); null from a chip. */
	let overviewPlayer = $state(/** @type {number | null} */ (null));

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
			if (!logOpen && events.some((e) => eventText(e, game) !== null)) {
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
		Boolean(notice) && !noticeClosed && !overviewOpen && !settingsOpen
	);
	$effect(() => {
		const key = noticeKey;
		untrack(() => {
			try {
				noticeClosed = sessionStorage.getItem(key) === '1';
			} catch {
				noticeClosed = false;
			}
		});
	});

	/** Closes the income notice for good at this table and seat. */
	const noticeCloseHandler = () => {
		noticeClosed = true;
		try {
			sessionStorage.setItem(noticeKey, '1');
		} catch {
			// Without storage it opens again after a refresh, which is harmless.
		}
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
			overviewOpen,
			noticeOpen,
			incomeAsk,
			trackAsk,
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
		incomeAsk = false;
		trackAsk = false;
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
		trackAsk = false;
		incomeAsk = true;
	};

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
		incomeAsk = false;
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
			// One Escape closes one thing, so the settings open alone.
			logOpen = false;
			overviewOpen = false;
			settingsOpen = true;
		} else if (event.value === 'help' || event.value === 'keys') {
			// How to play opens alone too, on the rules or on the keyboard shortcuts (#42).
			logOpen = false;
			overviewOpen = false;
			settingsOpen = false;
			rulesTab = event.value === 'keys' ? 'keys' : RULES_HELP[0].id;
			rulesOpen = true;
		}
	};

	const logToggleHandler = () => {
		logOpen = !logOpen;
		logUnread = false;
	};

	/** A question in the footer belongs to the turn choice it was asked on. */
	$effect(() => {
		void turnDecision?.id;
		untrack(() => {
			incomeAsk = false;
			trackAsk = false;
		});
	});

	/**
	 * Tab held shows the log and scores (#83, owner): the first press moves the focus as usual and starts a short
	 * wait, the key's repeats don't move it on, and the log shows once the wait is over, until Tab is let go.
	 * @param {KeyboardEvent} event
	 */
	function tabDown(event) {
		if (
			event.ctrlKey ||
			event.altKey ||
			event.metaKey ||
			document.querySelector('[aria-modal="true"]')
		) {
			return;
		}
		if (event.repeat) {
			event.preventDefault();
			return;
		}
		clearTimeout(peekTimer);
		if (!logOpen) {
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
	 * Escape closes the players overview (#27 review), then the notice; every other key is a hotkey (#83) unless the
	 * player is typing, holds a browser shortcut's key, has a menu, dialog or settings open, or a component took it.
	 * @param {KeyboardEvent} event
	 */
	const keyHandler = (event) => {
		if (event.key === 'Tab') {
			tabDown(event);
			return;
		}
		if (event.key === 'Escape' && overviewOpen) {
			overviewOpen = false;
			return;
		}
		if (event.key === 'Escape' && (incomeAsk || trackAsk)) {
			incomeAsk = false;
			trackAsk = false;
			return;
		}
		const target = /** @type {HTMLElement | null} */ (event.target);
		// One Escape closes one thing: the notice only when nothing else is open and the key isn't meant for another
		// layer, such as the header menu, a dialog or a field (#77).
		const elsewhere = target?.closest?.(
			'[role="menu"], [role="dialog"], input, textarea, select'
		);
		if (
			event.key === 'Escape' &&
			noticeOpen &&
			!logOpen &&
			!document.querySelector('[aria-modal="true"]') &&
			(!elsewhere || Boolean(elsewhere.closest('.rg-income-notice')))
		) {
			noticeCloseHandler();
			return;
		}
		if (
			event.defaultPrevented ||
			event.ctrlKey ||
			event.altKey ||
			event.metaKey ||
			target?.isContentEditable ||
			// A menu, a modal or a field keeps its keys; a decision panel's controls don't, so . still turns a tile.
			target?.closest?.(
				'[role="menu"], [aria-modal="true"], input, textarea, select'
			) ||
			settingsOpen ||
			// How to play, over the whole screen.
			document.querySelector('[aria-modal="true"]') ||
			// Enter on a control presses that control.
			(event.key === 'Enter' && target !== document.body)
		) {
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
			confirming: incomeAsk,
			asking: trackAsk,
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
				incomeAsk = false;
				selected = null;
				promptState.clearPayment();
				trackAsk = true;
				break;
			case 'track':
				trackPickHandler(action.track);
				break;
			case 'cancel':
				incomeAsk = false;
				trackAsk = false;
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
				if (overviewOpen && overviewPlayer === action.seat) {
					overviewOpen = false;
				} else {
					logOpen = false;
					settingsOpen = false;
					overviewPlayer = action.seat;
					overviewOpen = true;
				}
				break;
			case 'log':
				logToggleHandler();
				break;
			case 'help':
			case 'keys':
				logOpen = false;
				overviewOpen = false;
				rulesTab = action.type === 'keys' ? 'keys' : RULES_HELP[0].id;
				rulesOpen = true;
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

<div
	{...attr}
	class="rg-game {attr.class ? attr.class : ''}">
	<GameHeader
		{store}
		{game}
		{seat}
		{overviewOpen}
		{logOpen}
		{logUnread}
		bumped={moved.vp}
		onGameHeaderChip={() => {
			overviewPlayer = null;
			overviewOpen = !overviewOpen;
		}}
		onGameHeaderLog={logToggleHandler}
		onGameHeaderMenu={menuHandler} />

	<div class="rg-game--middle">
		<section
			class="rg-game--shared"
			aria-label="Shared board"
			inert={overviewOpen}>
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
						{selected}
						onTrackBoardSelect={trackSelectHandler} />
				{:else}
					<WorldMap
						hexes={mapHexes(game)}
						targets={promptState.targets}
						selected={promptState.hex}
						scores={promptState.scores}
						preview={promptState.preview}
						fresh={moved.hexes}
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
				<div
					class="rg-game--inspect"
					class:rg-game--inspect-side={inspected.side}
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
					placement={promptState.placement}
					fresh={{ plots: moved.plots, landmarks: moved.landmarks }}
					onPlayerTabsPlace={placeHandler}
					tilePick={promptState.tilePick}
					onPlayerTabsPick={(/** @type {ComponentEvent} */ event) =>
						promptState.pickTile(event.value.tile)}
					onPlayerTabsInspect={(
						/** @type {ComponentEvent} */ event
					) => (inspected = event.value)} />
			{:else}
				<p class="rg-game--soon">
					Hands stay hidden at a shared screen. Open a player's chip
					to see their capital, civilization and tech.
				</p>
			{/if}
			{#if summary}
				<SelfSummary
					{...summary}
					resources={promptState.resources}
					changed={promptState.changed} />
			{/if}
		</aside>
		{#if overviewOpen}
			<PlayersOverview
				{game}
				{seat}
				host={room.host}
				code={room.code}
				player={overviewPlayer} />
		{/if}
		{#if (logOpen || logPeek) && !overviewOpen}
			<LogPanel
				{game}
				{seat}
				bind:tab={logTab}
				onLogPanelClose={() => {
					logOpen = false;
					logPeek = false;
				}} />
		{/if}
		{#if settingsOpen}
			<TableSettings
				{store}
				onTableSettingsClose={() => (settingsOpen = false)} />
		{/if}
		{#if rulesOpen}
			<RulesPanel
				bind:tab={rulesTab}
				onRulesPanelClose={() => (rulesOpen = false)} />
		{/if}
	</div>

	<TurnFooter
		view={footer}
		{sending}
		onTurnFooterIncomeAsk={incomeAskHandler}
		onTurnFooterIncome={incomeHandler}
		onTurnFooterAdvance={() => advanceHandler()}
		onTurnFooterTrack={(/** @type {ComponentEvent} */ event) =>
			trackPickHandler(event.value)}
		onTurnFooterCancel={() => {
			incomeAsk = false;
			trackAsk = false;
		}}
		onTurnFooterResults={(/** @type {ComponentEvent} */ event) =>
			onGameResults?.(event)}
		onTurnFooterOverviewClose={() => (overviewOpen = false)} />
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
		grid-template-columns: minmax(0, 1fr);
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
		background: var(--scrim);
		pointer-events: none;
	}

	.rg-game--soon {
		margin: 0;
		padding: var(--space-9) 22px;
		color: var(--muted);
	}

	/* A shelf card shown in full beside the shelf, at the left, so the shelf and its focus stay in sight (#28 review). */
	.rg-game--inspect-side {
		justify-items: start;
		padding-left: var(--space-10);
		background: transparent;
	}
</style>
