<!-- A row of tabs and the selected tab's panel, such as the play page's right panel: Capital, Hand · 4, Income, Civilization, Technology, Terrain. -->
<script module>
	/**
	 * One tab.
	 * @typedef {Object} TabsItem
	 * @property {string} id - Reported when chosen; also names the tab's ids, `${idPrefix}-${id}-tab` and `${idPrefix}-${id}-panel`
	 * @property {string} label - The visible text, such as 'Hand'
	 * @property {number} [count] - A number after the label, such as the hand size: 'Hand · 4'
	 */

	/**
	 * Properties of the Tabs component itself.
	 * @typedef {Object} TabsOwnProps
	 * @property {TabsItem[]} tabs - The tabs, in order
	 * @property {string} [value] - The selected tab's id; bindable
	 * @property {string} label - Names the tab list for assistive technology, such as 'Your city and cards'
	 * @property {string} [idPrefix] - Starts every tab and panel id, so rows with the same tab ids can share a page; the row's own `$props.id()` by default
	 * @property {string} [panelClass] - Classes for the panel, which the parent lays out
	 * @property {boolean} [autofocus=false] - The selected tab takes the focus once, as the row is drawn
	 * @property {import('svelte').Snippet} [children] - The selected tab's panel; without it, no panel is drawn
	 * @property {Function} [onTabsChange] - Callback fired with the new tab's id when the selection changes
	 */

	/**
	 * Properties for the Tabs component, including any attributes for its root element, the tab list.
	 *
	 * The panel follows the tab list, without a wrapper: `<div role="tabpanel" tabindex="0">`, labelled by the selected
	 * tab, which alone controls it. The parent lays it out through `panelClass`, and owns the padding around the row. A
	 * parent short of room tightens the row with `--rg-tabs-padding` (a tab's side padding, `var(--space-4)`) and
	 * `--rg-tabs-gap` (`var(--space-2)`). A row still wider than its place scrolls, fades out at an edge with tabs past
	 * it, and keeps the selected tab in view (#64).
	 * @typedef {TabsOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} TabsProps
	 *
	 * @example
	 * <Tabs
	 *   label="Your city and cards"
	 *   tabs={[
	 *     { id: 'capital', label: 'Capital' },
	 *     { id: 'hand', label: 'Hand', count: 4 },
	 *     { id: 'income', label: 'Income' },
	 *   ]}
	 *   panelClass="rg-player-tabs--body"
	 *   bind:value={tab}>
	 *   {#if tab === 'capital'}…{/if}
	 * </Tabs>
	 */
</script>

<script>
	import { ComponentEvent } from '../../component-event.js';

	/** @type {TabsProps} */
	let {
		tabs,
		value = $bindable(),
		label,
		idPrefix,
		panelClass,
		autofocus = false,
		children,
		onTabsChange,
		...attr
	} = $props();

	const uid = $props.id();

	/** @type {HTMLButtonElement[]} */
	let buttons = $state([]);
	/** @type {HTMLDivElement | undefined} */
	let list = $state();
	let moreBefore = $state(false);
	let moreAfter = $state(false);
	let prefix = $derived(idPrefix ?? uid);
	let selected = $derived(tabs.find((tab) => tab.id === value));
	/** Whether the autofocus has been given, so it is given only once. */
	let focused = false;

	// With nothing selected, the first tab still takes the keyboard focus.
	let focusIndex = $derived(
		Math.max(
			0,
			tabs.findIndex((tab) => tab.id === value)
		)
	);

	// However a tab is chosen, by a click, a key or the parent, it scrolls into view.
	$effect(() => {
		reveal(focusIndex);
	});

	// An autofocus row gives the selected tab the focus once its button is drawn, so the arrow keys work at once.
	$effect(() => {
		const button = buttons[focusIndex];
		if (autofocus && button && !focused) {
			focused = true;
			button.focus();
		}
	});

	$effect(() => {
		if (!list) {
			return;
		}
		const observer = new ResizeObserver(() => reveal(focusIndex));
		observer.observe(list);
		return () => observer.disconnect();
	});

	/**
	 * @param {MouseEvent} event
	 * @param {number} index
	 */
	const tabClickHandler = (event, index) => {
		select(event, index);
	};

	/**
	 * Arrow keys, Home and End move along the row and select the tab they reach.
	 * @param {KeyboardEvent} event
	 * @param {number} index
	 */
	const tabKeydownHandler = (event, index) => {
		const last = tabs.length - 1;
		/** @type {Record<string, number>} */
		const moves = {
			ArrowLeft: index === 0 ? last : index - 1,
			ArrowRight: index === last ? 0 : index + 1,
			Home: 0,
			End: last,
		};
		const next = moves[event.key];
		if (next === undefined) {
			return;
		}
		event.preventDefault();
		select(event, next);
		buttons[next]?.focus();
	};

	/**
	 * Selects a tab and reports it, unless it is already selected.
	 * @param {Event} event
	 * @param {number} index
	 */
	const select = (event, index) => {
		const tab = tabs[index];
		if (!tab || tab.id === value) {
			return;
		}
		value = tab.id;
		if (typeof onTabsChange === 'function') {
			onTabsChange(new ComponentEvent(tab.id, buttons[index], event));
		}
	};

	/**
	 * Notes whether tabs lie past either end of a row that scrolls, for the fades.
	 */
	const measure = () => {
		if (!list) {
			return;
		}
		moreBefore = list.scrollLeft > 1;
		moreAfter = list.scrollLeft + list.clientWidth < list.scrollWidth - 1;
	};

	/**
	 * Scrolls the row just far enough to show a tab whole, clear of the fades (the row's scroll padding).
	 * @param {number} index
	 */
	const reveal = (index) => {
		const button = buttons[index];
		if (!list || !button) {
			return;
		}
		const room = parseFloat(getComputedStyle(list).scrollPaddingLeft) || 0;
		const start = button.offsetLeft - room;
		const end = button.offsetLeft + button.offsetWidth + room;
		if (start < list.scrollLeft) {
			list.scrollLeft = start;
		} else if (end > list.scrollLeft + list.clientWidth) {
			list.scrollLeft = end - list.clientWidth;
		}
		measure();
	};

	/**
	 * A tab's visible text, with its count after a middle dot.
	 * @param {TabsItem} tab
	 * @returns {string}
	 */
	const tabText = (tab) =>
		tab.count === undefined ? tab.label : `${tab.label} · ${tab.count}`;

	/**
	 * A tab's id, under the row's prefix.
	 * @param {string} id
	 * @returns {string}
	 */
	const tabId = (id) => `${prefix}-${id}-tab`;

	/**
	 * The id of a tab's panel, under the row's prefix.
	 * @param {string} id
	 * @returns {string}
	 */
	const panelId = (id) => `${prefix}-${id}-panel`;
</script>

<div
	role="tablist"
	aria-label={label}
	aria-orientation="horizontal"
	{...attr}
	bind:this={list}
	class="rg-tabs {attr.class ? attr.class : ''}"
	class:rg-tabs--more-before={moreBefore}
	class:rg-tabs--more-after={moreAfter}
	onscroll={measure}>
	{#each tabs as tab, index (tab.id)}
		<button
			bind:this={buttons[index]}
			type="button"
			role="tab"
			id={tabId(tab.id)}
			class="rg-tabs--tab"
			class:rg-tabs--selected={tab.id === value}
			aria-selected={tab.id === value}
			aria-controls={children && tab.id === value
				? panelId(tab.id)
				: undefined}
			tabindex={index === focusIndex ? 0 : -1}
			onclick={(event) => tabClickHandler(event, index)}
			onkeydown={(event) => tabKeydownHandler(event, index)}
			>{tabText(tab)}</button>
	{/each}
</div>
{#if children}
	<div
		role="tabpanel"
		tabindex="0"
		id={selected ? panelId(selected.id) : undefined}
		aria-labelledby={selected ? tabId(selected.id) : undefined}
		class="rg-tabs--panel {panelClass ? panelClass : ''}">
		{@render children()}
	</div>
{/if}

<style>
	/* Positioned, so each tab's offsetLeft is its place in the row; the scroll padding keeps a revealed tab clear of the
	   fades. The end padding is room past the last tab, so a scroll length rounded down can't leave it a fraction cut
	   off. */
	.rg-tabs {
		position: relative;
		display: flex;
		align-items: center;
		gap: var(--rg-tabs-gap, var(--space-2));
		padding-inline-end: var(--space-1);
		overflow-x: auto;
		overscroll-behavior-x: contain;
		scroll-padding-inline: var(--space-10);
		background: transparent;
	}

	/* An edge with tabs past it fades out, so the row reads as cut, not finished. */
	.rg-tabs--more-before {
		mask-image: linear-gradient(
			to right,
			transparent,
			var(--ink) var(--space-10)
		);
	}

	.rg-tabs--more-after {
		mask-image: linear-gradient(
			to left,
			transparent,
			var(--ink) var(--space-10)
		);
	}

	.rg-tabs--more-before.rg-tabs--more-after {
		mask-image: linear-gradient(
			to right,
			transparent,
			var(--ink) var(--space-10),
			var(--ink) calc(100% - var(--space-10)),
			transparent
		);
	}

	/* Bold in both states, so a tab keeps its width when it is selected. */
	.rg-tabs--tab {
		flex: 0 0 auto;
		margin: 0;
		padding: var(--space-5) var(--rg-tabs-padding, var(--space-4));
		border: 0;
		border-radius: var(--radius);
		background: transparent;
		color: var(--faint);
		font-size: var(--font-size-sm);
		font-weight: var(--weight-bold);
		white-space: nowrap;
		transition:
			background var(--duration-fast) var(--ease),
			color var(--duration-fast) var(--ease);
	}

	.rg-tabs--tab:hover {
		color: var(--text);
	}

	/* Inside the tab, where the scrolling row can't cut it off. */
	.rg-tabs--tab:focus-visible {
		outline-offset: calc(-1 * var(--border-thick));
	}

	.rg-tabs--selected,
	.rg-tabs--selected:hover {
		background: var(--raised);
		color: var(--text);
	}
</style>
