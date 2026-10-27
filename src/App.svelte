<!-- The app root (#25): one screen at a time, landing, lobby or the game in progress, from the client's store. -->
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
	import { onMount } from 'svelte';
	import Toast from './lib/components/ui/Toast.svelte';
	import { createApi } from './lib/api.js';
	import { createStore } from './lib/game.svelte.js';
	import HelpPanel from './screens/HelpPanel.svelte';
	import Holding from './screens/Holding.svelte';
	import Landing from './screens/Landing.svelte';
	import Lobby from './screens/Lobby.svelte';
	import PageHeader from './screens/PageHeader.svelte';

	/** @type {AppProps} */
	let { ...attr } = $props();

	/**
	 * The browser's storage, or one that forgets, where a private window refuses it.
	 * @param {() => Storage} get
	 * @returns {import('./lib/api.js').SessionStore}
	 */
	function storage(get) {
		try {
			const store = get();
			store.getItem('rg-check');
			return store;
		} catch {
			/** @type {Map<string, string>} */
			const items = new Map();
			return {
				getItem: (key) => items.get(key) ?? null,
				setItem: (key, value) => {
					items.set(key, value);
				},
				removeItem: (key) => {
					items.delete(key);
				},
			};
		}
	}

	/**
	 * @param {number} n
	 * @returns {number} A whole number from 0 to n − 1
	 */
	function random(n) {
		return crypto.getRandomValues(new Uint32Array(1))[0] % n;
	}

	const store = createStore({
		api: createApi({
			base: '/api/',
			fetch: window.fetch.bind(window),
			storage: storage(() => sessionStorage),
		}),
		random,
		prefs: storage(() => localStorage),
		copy: (text) => navigator.clipboard.writeText(text),
	});

	let helpOpen = $state(false);

	onMount(() => {
		store.start();
	});
</script>

<div
	{...attr}
	class="rg-app {attr.class ? attr.class : ''}">
	<PageHeader
		title={store.screen === 'landing'
			? 'Build a civilization that stands the test of time'
			: undefined}
		sound={store.sound}
		onPageHeaderSound={(/** @type {any} */ event) =>
			store.setSound(event.value)}
		onPageHeaderHelp={() => (helpOpen = true)}
		onPageHeaderAbout={() =>
			store.notify(
				'A browser game of civilizations rising through the eras, inspired by Tapestry.'
			)} />
	{#if store.screen === 'loading'}
		<main class="rg-app--loading"></main>
	{:else if store.screen === 'landing'}
		<Landing {store} />
	{:else if store.room?.phase === 'lobby'}
		<Lobby {store} />
	{:else if store.room}
		<Holding {store} />
	{/if}
	<Toast
		message={store.toast}
		visible={store.toastVisible} />
	{#if helpOpen}
		<HelpPanel onHelpPanelClose={() => (helpOpen = false)} />
	{/if}
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
