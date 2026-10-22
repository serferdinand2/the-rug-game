<!-- A row of tabs, such as the play page's right panel: Capital, Hand · 4, Income, Civilization, Technology, Terrain. -->
<script module>
	/**
	 * One tab.
	 * @typedef {Object} TabsItem
	 * @property {string} id - Reported when chosen; also names the tab's ids, `${id}-tab` and `${id}-panel`
	 * @property {string} label - The visible text, such as 'Hand'
	 * @property {number} [count] - A number after the label, such as the hand size: 'Hand · 4'
	 */

	/**
	 * Properties of the Tabs component itself.
	 * @typedef {Object} TabsOwnProps
	 * @property {TabsItem[]} tabs - The tabs, in order
	 * @property {string} [value] - The selected tab's id; bindable
	 * @property {string} label - Names the tab list for assistive technology, such as 'Your city and cards'
	 * @property {Function} [onTabsChange] - Callback fired with the new tab's id when the selection changes
	 */

	/**
	 * Properties for the Tabs component, including any attributes for its root element.
	 *
	 * Each tab controls the element with the id `${id}-panel` and is labelled `${id}-tab`. The parent renders the
	 * panels: `<div role="tabpanel" tabindex="0" id="capital-panel" aria-labelledby="capital-tab">`. The padding around the
	 * row belongs to the parent too.
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
	 *   bind:value={tab}
	 * />
	 * <div role="tabpanel" tabindex="0" id="{tab}-panel" aria-labelledby="{tab}-tab">…</div>
	 */
</script>

<script>
	import { ComponentEvent } from '../../component-event.js';

	/** @type {TabsProps} */
	let { tabs, value = $bindable(), label, onTabsChange, ...attr } = $props();

	/** @type {HTMLButtonElement[]} */
	let buttons = $state([]);

	// With nothing selected, the first tab still takes the keyboard focus.
	let focusIndex = $derived(
		Math.max(
			0,
			tabs.findIndex((tab) => tab.id === value)
		)
	);

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
	 * A tab's visible text, with its count after a middle dot.
	 * @param {TabsItem} tab
	 * @returns {string}
	 */
	const tabText = (tab) =>
		tab.count === undefined ? tab.label : `${tab.label} · ${tab.count}`;
</script>

<div
	role="tablist"
	aria-label={label}
	aria-orientation="horizontal"
	{...attr}
	class="rg-tabs {attr.class ? attr.class : ''}">
	{#each tabs as tab, index (tab.id)}
		<button
			bind:this={buttons[index]}
			type="button"
			role="tab"
			id="{tab.id}-tab"
			class="rg-tabs--tab"
			class:rg-tabs--selected={tab.id === value}
			aria-selected={tab.id === value}
			aria-controls="{tab.id}-panel"
			tabindex={index === focusIndex ? 0 : -1}
			onclick={(event) => tabClickHandler(event, index)}
			onkeydown={(event) => tabKeydownHandler(event, index)}
			>{tabText(tab)}</button>
	{/each}
</div>

<style>
	.rg-tabs {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		background: transparent;
	}

	/* Bold in both states, so a tab keeps its width when it is selected. */
	.rg-tabs--tab {
		flex: 0 0 auto;
		margin: 0;
		padding: var(--space-5) var(--space-4);
		border: 0;
		border-radius: var(--radius);
		background: transparent;
		color: var(--muted);
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

	.rg-tabs--selected,
	.rg-tabs--selected:hover {
		background: var(--raised);
		color: var(--text);
	}
</style>
