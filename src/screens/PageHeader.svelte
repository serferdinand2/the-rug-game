<!-- The header of every page (#25, #26): the brand, a sentence or the player chips, extra controls such as the clock and Undo, then sound and the screen's menu, which leaves the table itself (#99). -->
<script module>
	/**
	 * Properties of the PageHeader screen part itself.
	 * @typedef {Object} PageHeaderOwnProps
	 * @property {string} [title] - The centred sentence, as on the landing page
	 * @property {import('svelte').Snippet} [center] - Centre content instead of the title, such as the player chips
	 * @property {import('svelte').Snippet} [before] - Controls before sound, such as the turn clock and Undo
	 * @property {import('../lib/game.svelte.js').GameStore} store - The client's store: its sound choice, its table and leaving it
	 * @property {import('../lib/menu.js').MenuScreen} [menu='start'] - The screen whose entries the menu shows (menu.js)
	 * @property {Function} [onPageHeaderMenu] - Callback fired with the chosen entry's id, for every entry but Leave table and the card gallery
	 */

	/**
	 * Properties for PageHeader, including any attributes for its root element.
	 * @typedef {PageHeaderOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} PageHeaderProps
	 *
	 * @example
	 * <PageHeader {store} menu="results" onPageHeaderMenu={(event) => choose(event.value)} />
	 */
</script>

<script>
	import IconButton from '../lib/components/ui/IconButton.svelte';
	import Menu from '../lib/components/ui/Menu.svelte';
	import TopBar from '../lib/components/ui/TopBar.svelte';
	import { isHost } from '../lib/lobby.js';
	import { menuItems } from '../lib/menu.js';

	/** @typedef {import('../lib/component-event.js').ComponentEvent} Event */

	/** @type {PageHeaderProps} */
	let {
		title,
		center,
		before,
		store,
		menu = 'start',
		onPageHeaderMenu,
		...attr
	} = $props();

	let items = $derived(
		menuItems(menu, { hosting: store.room ? isHost(store.room) : false })
	);

	let menuOpen = $state(false);
	/** @type {HTMLElement | undefined} */
	let menuToggle = $state();
	/** @type {HTMLElement | undefined} */
	let menuHolder = $state();

	const soundClickHandler = () => {
		store.setSound(!store.sound);
	};

	/**
	 * @param {Event} event
	 */
	const menuToggleClickHandler = (event) => {
		menuToggle = event.target;
		menuOpen = !menuOpen;
	};

	/**
	 * @param {Event} event
	 */
	const menuSelectHandler = (event) => {
		// The gallery is a link, which opens itself.
		if (event.value === 'gallery') {
			return;
		}
		if (event.value === 'leave') {
			store.leaveTable();
		} else if (typeof onPageHeaderMenu === 'function') {
			onPageHeaderMenu(event);
		}
	};

	/**
	 * Escape and a choice return the focus to the toggle; Tab moves on.
	 * @param {Event} event
	 */
	const menuCloseHandler = (event) => {
		if (event.value !== 'tab') {
			menuToggle?.focus();
		}
	};

	/**
	 * A click anywhere else closes the menu.
	 * @param {MouseEvent} event
	 */
	const windowClickHandler = (event) => {
		if (
			menuOpen &&
			menuHolder &&
			!menuHolder.contains(/** @type {Node} */ (event.target))
		) {
			menuOpen = false;
		}
	};
</script>

<svelte:window onclick={windowClickHandler} />

<TopBar
	{title}
	{center}
	{...attr}
	class="rg-page-header {attr.class ? attr.class : ''}">
	{#snippet controls()}
		{@render before?.()}
		<IconButton
			icon="sound"
			label="Mute"
			muted={!store.sound}
			onIconButtonClick={soundClickHandler} />
		<div
			class="rg-page-header--menu"
			bind:this={menuHolder}>
			<IconButton
				icon="menu"
				label="Menu"
				expanded={menuOpen}
				onIconButtonClick={menuToggleClickHandler} />
			<div class="rg-page-header--popover">
				<Menu
					label="Menu"
					{items}
					bind:open={menuOpen}
					onMenuSelect={menuSelectHandler}
					onMenuClose={menuCloseHandler} />
			</div>
		</div>
	{/snippet}
</TopBar>

<style>
	.rg-page-header--menu {
		position: relative;
	}

	.rg-page-header--popover {
		position: absolute;
		top: calc(100% + var(--space-3));
		right: 0;
		z-index: var(--layer-popover);
	}
</style>
