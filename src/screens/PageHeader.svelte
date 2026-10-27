<!-- The header of every page (#25, #26): the brand, a sentence or the player chips, extra controls such as the clock and Undo, then sound and the menu. -->
<script module>
	/**
	 * Properties of the PageHeader screen part itself.
	 * @typedef {Object} PageHeaderOwnProps
	 * @property {string} [title] - The centred sentence, as on the landing page
	 * @property {import('svelte').Snippet} [center] - Centre content instead of the title, such as the player chips
	 * @property {import('svelte').Snippet} [before] - Controls before sound, such as the turn clock and Undo
	 * @property {boolean} sound - Whether sound is on
	 * @property {import('../lib/components/ui/Menu.svelte').MenuItem[]} [items] - The menu's entries; How to play and About this project when left out
	 * @property {Function} [onPageHeaderSound] - Callback fired with the new sound choice
	 * @property {Function} [onPageHeaderMenu] - Callback fired with the chosen entry's id
	 */

	/**
	 * Properties for PageHeader, including any attributes for its root element.
	 * @typedef {PageHeaderOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} PageHeaderProps
	 *
	 * @example
	 * <PageHeader sound={store.sound} onPageHeaderSound={(event) => store.setSound(event.value)} onPageHeaderMenu={(event) => choose(event.value)} />
	 */
</script>

<script>
	import IconButton from '../lib/components/ui/IconButton.svelte';
	import Menu from '../lib/components/ui/Menu.svelte';
	import TopBar from '../lib/components/ui/TopBar.svelte';
	import { ComponentEvent } from '../lib/component-event.js';

	/** @typedef {import('../lib/component-event.js').ComponentEvent} Event */

	/** @type {PageHeaderProps} */
	let {
		title,
		center,
		before,
		sound,
		items = [
			{ id: 'help', label: 'How to play' },
			{ id: 'about', label: 'About this project' },
		],
		onPageHeaderSound,
		onPageHeaderMenu,
		...attr
	} = $props();

	let menuOpen = $state(false);
	/** @type {HTMLElement | undefined} */
	let menuToggle = $state();
	/** @type {HTMLElement | undefined} */
	let menuHolder = $state();

	/**
	 * @param {Event} event
	 */
	const soundClickHandler = (event) => {
		if (typeof onPageHeaderSound === 'function') {
			onPageHeaderSound(
				new ComponentEvent(!sound, event.target, event.originalEvent)
			);
		}
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
		if (typeof onPageHeaderMenu === 'function') {
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
			muted={!sound}
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
