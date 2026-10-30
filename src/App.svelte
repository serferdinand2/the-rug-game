<!-- The app root (#25, #26, #29, #30): one screen at a time, landing, lobby, the game, the hot-seat hand-over or the results, from the client's store; the sound cues, the dice tray (#61) and what other players just did (#153). -->
<script module>
	/**
	 * Properties for the App component, including any attributes for its root element.
	 * @typedef {import('svelte/elements').HTMLAttributes<HTMLDivElement>} AppProps
	 *
	 * @example
	 * mount(App, { target: document.getElementById('app') });
	 */
</script>

<script>
	import { onMount, untrack } from 'svelte';
	import Toast from './lib/components/ui/Toast.svelte';
	import Tooltip from './lib/components/ui/Tooltip.svelte';
	import DiceTray from './lib/components/board/DiceTray.svelte';
	import PlayerAction from './lib/components/board/PlayerAction.svelte';
	import { rollsOf } from './lib/dice.js';
	import {
		EMPTY_QUEUE,
		actionsOf,
		queueAdd,
		queueCurrent,
		queueNext,
		queuePosition,
	} from './lib/player-actions.js';
	import { createApi } from './lib/api.js';
	import { createStore } from './lib/game.svelte.js';
	import { randomInt, safeStorage } from './lib/storage.js';
	import HelpPanel from './screens/HelpPanel.svelte';
	import Game from './screens/Game.svelte';
	import HandOver from './screens/HandOver.svelte';
	import Landing from './screens/Landing.svelte';
	import Lobby from './screens/Lobby.svelte';
	import Results from './screens/Results.svelte';
	import { createSoundPlayer, cueFor } from './lib/sound.js';
	import PageHeader from './screens/PageHeader.svelte';

	/** @type {AppProps} */
	let { ...attr } = $props();

	const store = createStore({
		api: createApi({
			base: '/api/',
			fetch: window.fetch.bind(window),
			storage: safeStorage(() => sessionStorage),
		}),
		random: randomInt,
		prefs: safeStorage(() => localStorage),
		session: safeStorage(() => sessionStorage),
		copy: (text) => navigator.clipboard.writeText(text),
	});

	let helpOpen = $state(false);
	/** Whether a finished game's board is on show instead of its results (#29 design §6). */
	let reviewing = $state(false);
	/** What the game screen has open over its board, which the dice tray rolls clear of (#61, #79). */
	let gamePanel = $state(/** @type {'none' | 'panel' | 'shelf'} */ ('none'));

	/** The table and deal on show: a key that changes only with a new deal or another table, not with every room view. */
	let dealKey = $derived(
		`${store.room?.code ?? ''}:${store.room?.deal ?? 0}`
	);

	/** What other players just did, played one after another (#153): the run's items and the one on show. */
	let queue = $state.raw(
		/** @type {import('./lib/player-actions.js').ActionQueue} */ (
			EMPTY_QUEUE
		)
	);
	/** @type {import('./lib/player-actions.js').PlayerActionItem[]} The last run, which the footer's Show again plays again */
	let lastRun = $state.raw([]);
	/** Counts the displays shown, so each one, even one shown again, starts its own timer. */
	let shownCount = $state(0);
	/** The dice tray is rolling: the actions wait for it (#153 design). */
	let rolling = $state(false);
	/** The seat whose own actions show nothing: the viewer online, the seat on show at a hot-seat table. */
	let actor = $derived(
		store.room?.mode === 'hotseat' ? store.seat : store.viewer
	);
	/** The game screen is on show: no lobby, pass screen or results over it. */
	let onGame = $derived(
		Boolean(store.room?.game) &&
			store.room.phase !== 'lobby' &&
			store.passing === null &&
			!(store.room.phase === 'finished' && !reviewing)
	);
	// The actions wait while the dice roll, and while the viewer has a question or notice of their own open (#153 design).
	let action = $derived(
		onGame && !rolling && gamePanel === 'none' ? queueCurrent(queue) : null
	);
	let position = $derived(queuePosition(queue));

	// A new deal, or another table, shows its game rather than the review of the last one, and none of its actions.
	$effect(() => {
		dealKey;
		reviewing = false;
		queue = EMPTY_QUEUE;
		lastRun = [];
		rolling = false;
	});

	/**
	 * Queues what other players did in a batch of events.
	 * @param {any[]} events
	 */
	function enqueue(events) {
		const game = store.room?.game;
		if (!game) {
			return;
		}
		const items = actionsOf(events, game, actor, game.events);
		if (items.length === 0) {
			return;
		}
		if (queue.items.length === 0) {
			shownCount += 1;
		}
		queue = queueAdd(queue, items);
		lastRun = queue.items;
	}

	/** The batches already queued: one that arrived before the app opened is not played. */
	let freshQueued = untrack(() => store.freshCount);
	let handedQueued = untrack(() => store.handedCount);

	// Each batch of fresh events once; a roll in it plays first.
	$effect(() => {
		const count = store.freshCount;
		if (count === freshQueued) {
			return;
		}
		freshQueued = count;
		untrack(() => {
			const game = store.room?.game;
			if (game && rollsOf(store.fresh, game, store.viewer).length > 0) {
				rolling = true;
			}
			enqueue(store.fresh);
		});
	});

	// At a hot-seat table, what the others did since this player last held the screen (#153 design).
	$effect(() => {
		const count = store.handedCount;
		if (count === handedQueued) {
			return;
		}
		handedQueued = count;
		untrack(() => enqueue(store.handed));
	});

	/**
	 * The display closed: the next one shows, or none with Skip all.
	 * @param {import('./lib/component-event.js').ComponentEvent} event
	 */
	const actionCloseHandler = (event) => {
		queue = event.value.all ? EMPTY_QUEUE : queueNext(queue);
		shownCount += 1;
	};

	/** The footer's Show again plays the last run again. */
	const showAgainHandler = () => {
		if (lastRun.length === 0) {
			return;
		}
		queue = queueAdd(EMPTY_QUEUE, lastRun);
		shownCount += 1;
	};

	const sound = createSoundPlayer();

	// One cue for each batch of fresh events, while sound is on (#29 design §7). A refresh brings no fresh events.
	$effect(() => {
		store.freshCount;
		untrack(() => {
			if (!store.sound || store.fresh.length === 0) {
				return;
			}
			const cue = cueFor(store.fresh, store.viewer);
			if (cue) {
				sound.play(cue);
			}
		});
	});

	/**
	 * The menu outside the game screen: How to play or About this project. PageHeader leaves the table itself.
	 * @param {import('./lib/component-event.js').ComponentEvent} event
	 */
	const menuHandler = (event) => {
		if (event.value === 'help') {
			helpOpen = true;
		} else {
			store.notify(
				'A browser game of civilizations rising through the eras, inspired by Tapestry.'
			);
		}
	};

	onMount(() => {
		store.start();
		// Browsers let audio start only after a gesture, so the first click or key unlocks it.
		document.addEventListener('click', sound.unlock, true);
		document.addEventListener('keydown', sound.unlock, true);
		return () => {
			document.removeEventListener('click', sound.unlock, true);
			document.removeEventListener('keydown', sound.unlock, true);
		};
	});
</script>

<div
	{...attr}
	class="rg-app {attr.class ? attr.class : ''}">
	{#if store.room?.phase === 'finished' && store.room.game && !reviewing}
		<Results
			{store}
			onResultsReview={() => (reviewing = true)}
			onResultsHelp={() => (helpOpen = true)} />
	{:else if store.passing !== null && store.room?.game}
		<PageHeader
			{store}
			menu="passing"
			onPageHeaderMenu={menuHandler} />
		<HandOver {store} />
	{:else if store.room && store.room.phase !== 'lobby'}
		<Game
			{store}
			bind:panel={gamePanel}
			{action}
			justNow={lastRun.at(-1)?.text}
			onGameShowAgain={showAgainHandler}
			onGameResults={() => (reviewing = false)} />
	{:else}
		<PageHeader
			title={store.screen === 'landing'
				? 'Build a civilization that stands the test of time'
				: undefined}
			{store}
			onPageHeaderMenu={menuHandler} />
		{#if store.screen === 'loading'}
			<main class="rg-app--loading"></main>
		{:else if store.screen === 'landing'}
			<Landing {store} />
		{:else if store.room?.phase === 'lobby'}
			<Lobby {store} />
		{/if}
	{/if}
	<!-- A roll shows over whichever screen is on show, the pass screen too, for everyone at the table (#61). At a
	     hot-seat table the whole table shares the screen, so the caption names the roller rather than "You". -->
	{#if store.room?.game}
		<DiceTray
			rolls={rollsOf(store.fresh, store.room.game, store.viewer)}
			batch={store.freshCount}
			panel={gamePanel}
			onDiceTrayDone={() => (rolling = false)} />
	{/if}
	<!-- What another player just did, at the centre of the tracks, after any roll (#153). -->
	{#if action}
		{#key shownCount}
			<PlayerAction
				item={action}
				index={position.index}
				count={position.count}
				onPlayerActionClose={actionCloseHandler} />
		{/key}
	{/if}
	<Toast
		message={store.toast}
		visible={store.toastVisible} />
	{#if helpOpen}
		<HelpPanel onHelpPanelClose={() => (helpOpen = false)} />
	{/if}
	<!-- Every title on every screen shows in this one tooltip, not the browser's. -->
	<Tooltip />
</div>

<style>
	.rg-app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.rg-app--loading {
		flex: 1;
		background: var(--texture) var(--surface);
	}
</style>
