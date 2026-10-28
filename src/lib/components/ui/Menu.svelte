<!-- The header's popover menu: a floating list of actions and links, closed with Escape. -->
<script module>
	/**
	 * One menu entry.
	 * @typedef {Object} MenuItem
	 * @property {string} id - Reported when chosen
	 * @property {string} label - The visible text, such as 'How to play'
	 * @property {string} [href] - Makes the entry a link to this address
	 * @property {'_blank'} [target] - Opens the link in a new tab
	 */

	/**
	 * Properties of the Menu component itself.
	 * @typedef {Object} MenuOwnProps
	 * @property {MenuItem[]} items - The entries, in order
	 * @property {boolean} [open=false] - Shown when true; renders nothing when false; bindable
	 * @property {string} label - Names the menu for assistive technology, such as 'Menu'
	 * @property {Function} [onMenuSelect] - Callback fired with the entry's id when one is chosen; the menu then closes
	 * @property {Function} [onMenuClose] - Callback fired when the menu closes itself, with the reason: 'escape', 'tab' or 'select'
	 */

	/**
	 * Properties for the Menu component, including any attributes for its root element.
	 *
	 * The menu renders in normal flow: the parent places it, usually in an absolutely positioned wrapper under its
	 * toggle, closes it on a click outside, and puts the focus back on the toggle after 'escape' or 'select'.
	 * Opening it moves the focus to its first entry.
	 * @typedef {MenuOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} MenuProps
	 *
	 * @example
	 * <Menu
	 *   label="Menu"
	 *   items={[
	 *     { id: 'help', label: 'How to play' },
	 *     { id: 'lobby', label: 'Lobby page', href: '/lobby' },
	 *   ]}
	 *   bind:open={menuOpen}
	 *   onMenuSelect={(event) => choose(event.value)}
	 *   onMenuClose={() => menuToggle.focus()}
	 * />
	 */
</script>

<script>
	import { untrack } from 'svelte';
	import { ComponentEvent } from '../../component-event.js';

	/** @type {MenuProps} */
	let {
		items,
		open = $bindable(false),
		label,
		onMenuSelect,
		onMenuClose,
		...attr
	} = $props();

	// A menu that starts open, such as on the library page, does not take the focus when the page loads.
	let wasOpen = untrack(() => open);

	/** @type {HTMLDivElement | undefined} */
	let element = $state();
	/** @type {(HTMLAnchorElement | HTMLButtonElement)[]} */
	let entries = $state([]);
	let focusIndex = $state(0);

	$effect(() => {
		if (!open) {
			wasOpen = false;
			return;
		}
		if (element && !wasOpen) {
			wasOpen = true;
			focusIndex = 0;
			entries[0]?.focus();
		}
	});

	/**
	 * @param {MouseEvent} event
	 * @param {MenuItem} item
	 */
	const itemClickHandler = (event, item) => {
		if (typeof onMenuSelect === 'function') {
			const target = /** @type {HTMLElement} */ (event.currentTarget);
			onMenuSelect(new ComponentEvent(item.id, target, event));
		}
		close('select', event);
	};

	/**
	 * Arrow keys, Home and End move between the entries; Escape and Tab close the menu.
	 * @param {KeyboardEvent} event
	 */
	const keydownHandler = (event) => {
		const last = items.length - 1;
		/** @type {Record<string, number>} */
		const moves = {
			ArrowUp: focusIndex <= 0 ? last : focusIndex - 1,
			ArrowDown: focusIndex >= last ? 0 : focusIndex + 1,
			Home: 0,
			End: last,
		};
		if (event.key === 'Escape') {
			event.preventDefault();
			close('escape', event);
			return;
		}
		if (event.key === 'Tab') {
			close('tab', event);
			return;
		}
		const next = moves[event.key];
		if (next === undefined) {
			return;
		}
		event.preventDefault();
		focusIndex = next;
		entries[next]?.focus();
	};

	/**
	 * @param {number} index
	 */
	const itemFocusHandler = (index) => {
		focusIndex = index;
	};

	/**
	 * Closes the menu and reports why.
	 * @param {string} reason - 'escape', 'tab' or 'select'
	 * @param {Event} event
	 */
	const close = (reason, event) => {
		open = false;
		if (typeof onMenuClose === 'function') {
			onMenuClose(
				new ComponentEvent(
					reason,
					/** @type {HTMLElement} */ (event.currentTarget),
					event
				)
			);
		}
	};
</script>

{#if open}
	<div
		bind:this={element}
		role="menu"
		aria-label={label}
		tabindex="-1"
		{...attr}
		class="rg-menu {attr.class ? attr.class : ''}"
		onkeydown={keydownHandler}>
		{#each items as item, index (item.id)}
			{#if item.href}
				<a
					bind:this={entries[index]}
					role="menuitem"
					class="rg-menu--item"
					href={item.href}
					target={item.target}
					rel={item.target === '_blank' ? 'noopener noreferrer' : undefined}
					tabindex={index === focusIndex ? 0 : -1}
					onclick={(event) => itemClickHandler(event, item)}
					onfocus={() => itemFocusHandler(index)}>{item.label}</a>
			{:else}
				<button
					bind:this={entries[index]}
					type="button"
					role="menuitem"
					class="rg-menu--item"
					tabindex={index === focusIndex ? 0 : -1}
					onclick={(event) => itemClickHandler(event, item)}
					onfocus={() => itemFocusHandler(index)}
					>{item.label}</button>
			{/if}
		{/each}
	</div>
{/if}

<style>
	.rg-menu {
		display: grid;
		min-width: 160px;
		padding: var(--space-3);
		border: var(--border) solid var(--line);
		border-radius: var(--radius);
		background: var(--chrome);
		box-shadow: var(--shadow-float);
	}

	.rg-menu--item {
		display: block;
		padding: var(--space-4) var(--space-5);
		border: 0;
		border-radius: var(--radius);
		background: transparent;
		color: var(--text);
		text-align: left;
		text-decoration: none;
		transition:
			background var(--duration-fast) var(--ease),
			color var(--duration-fast) var(--ease);
	}

	.rg-menu--item:hover,
	.rg-menu--item:focus-visible {
		background: var(--raised);
		color: var(--gold);
	}
</style>
