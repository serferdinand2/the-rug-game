<!-- The app root (#25, #26, #29, #30): one screen at a time, landing, lobby, the game, the hot-seat hand-over or the results, from the client's store; and the sound cues. -->
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
	import { rollsOf } from './lib/dice.js';
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

	// A new deal, or another table, shows its game rather than the review of the last one.
	$effect(() => {
		dealKey;
		reviewing = false;
	});

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
			panel={gamePanel} />
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
