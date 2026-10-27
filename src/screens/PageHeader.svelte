<!-- The header of the pages before the game (#25): the brand, an optional sentence, and the sound and menu controls. -->
<script module>
	/**
	 * Properties of the PageHeader screen part itself.
	 * @typedef {Object} PageHeaderOwnProps
	 * @property {string} [title] - The centred sentence, as on the landing page
	 * @property {boolean} sound - Whether sound is on
	 * @property {Function} [onPageHeaderSound] - Callback fired with the new sound choice
	 * @property {Function} [onPageHeaderHelp] - Callback fired when How to play is chosen
	 * @property {Function} [onPageHeaderAbout] - Callback fired when About this project is chosen
	 */

	/**
	 * Properties for PageHeader, including any attributes for its root element.
	 * @typedef {PageHeaderOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} PageHeaderProps
	 *
	 * @example
	 * <PageHeader sound={store.sound} onPageHeaderSound={(event) => store.setSound(event.value)} />
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
		sound,
		onPageHeaderSound,
		onPageHeaderHelp,
		onPageHeaderAbout,
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
		const handler =
			event.value === 'help' ? onPageHeaderHelp : onPageHeaderAbout;
		if (typeof handler === 'function') {
			handler(event);
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
	{...attr}
	class="rg-page-header {attr.class ? attr.class : ''}">
	{#snippet controls()}
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
					items={[
						{ id: 'help', label: 'How to play' },
						{ id: 'about', label: 'About this project' },
					]}
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
