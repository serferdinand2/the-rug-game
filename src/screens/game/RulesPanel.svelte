<!-- How to play in the game (#42): the rules in our own words, one tab per part of the game, and the keyboard shortcuts. -->
<script module>
	/**
	 * Properties of the RulesPanel screen part itself.
	 * @typedef {Object} RulesPanelOwnProps
	 * @property {string} [tab] - The tab on show: a section id of RULES_HELP, or 'keys' for the keyboard shortcuts; bindable, the first section by default
	 * @property {Function} [onRulesPanelClose] - Callback fired when Close, Escape or the backdrop closes the panel
	 */

	/**
	 * Properties for RulesPanel, including any attributes for its root element, Dialog's scrim.
	 * @typedef {RulesPanelOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} RulesPanelProps
	 *
	 * @example
	 * {#if rulesOpen}<RulesPanel bind:tab={rulesTab} onRulesPanelClose={() => (rulesOpen = false)} />{/if}
	 */
</script>

<script>
	import Dialog from '../../lib/components/ui/Dialog.svelte';
	import Tabs from '../../lib/components/ui/Tabs.svelte';
	import { ComponentEvent } from '../../lib/component-event.js';
	import { RULES_HELP } from '../../lib/rules-help.js';
	import { SHORTCUTS } from '../../lib/shortcuts.js';

	/** The keyboard shortcuts' tab, after the rules. */
	const KEYS = 'keys';

	/** @type {RulesPanelProps} */
	let {
		tab = $bindable(RULES_HELP[0]?.id ?? KEYS),
		onRulesPanelClose,
		...attr
	} = $props();

	const tabs = [
		...RULES_HELP.map((section) => ({
			id: section.id,
			label: section.title,
		})),
		{ id: KEYS, label: 'Keyboard shortcuts' },
	];

	let section = $derived(RULES_HELP.find((s) => s.id === tab) ?? null);

	/**
	 * Close, Escape or the backdrop closed the dialog.
	 * @param {ComponentEvent} event
	 */
	const dialogCloseHandler = (event) => {
		if (typeof onRulesPanelClose === 'function') {
			onRulesPanelClose(
				new ComponentEvent(null, event.target, event.originalEvent)
			);
		}
	};
</script>

<Dialog
	{...attr}
	class="rg-rules-panel {attr.class ? attr.class : ''}"
	title="How to play"
	size="wide"
	onDialogClose={dialogCloseHandler}>
	<!-- The tab on show takes the focus, so the arrow keys move between the tabs at once. -->
	<Tabs
		class="rg-rules-panel--tabs"
		panelClass="rg-rules-panel--body"
		{tabs}
		bind:value={tab}
		label="How to play"
		autofocus>
		{#if section}
			{#each section.blocks as block, index (index)}
				{#if 'list' in block}
					<ul class="rg-rules-panel--list">
						{#each block.list as item, at (at)}
							<li>{item}</li>
						{/each}
					</ul>
				{:else}
					<p class="rg-rules-panel--text">{block.text}</p>
				{/if}
			{/each}
		{:else}
			{#each SHORTCUTS as group (group.title)}
				<h3 class="rg-rules-panel--group">{group.title}</h3>
				<dl class="rg-rules-panel--keys">
					{#each group.shortcuts as shortcut (shortcut.action)}
						<dt>
							{#each shortcut.keys as combo, at (at)}
								{#if at > 0}<span class="rg-rules-panel--or"
										>or</span
									>{/if}
								{#each combo as key, k (k)}
									{#if k > 0}<span
											class="rg-rules-panel--plus">+</span
										>{/if}<kbd>{key}</kbd>
								{/each}
							{/each}
						</dt>
						<dd>{shortcut.action}</dd>
					{/each}
				</dl>
			{/each}
		{/if}
	</Tabs>
</Dialog>

<style>
	/* Tabs' row and panel, inside Dialog, reached through their class props: the row keeps its height, and the panel
	   scrolls when the screen is short. */
	:global(.rg-rules-panel .rg-rules-panel--tabs) {
		flex: none;
	}

	:global(.rg-rules-panel .rg-rules-panel--body) {
		min-height: 320px;
		margin-top: var(--space-6);
		padding-right: var(--space-4);
		overflow-y: auto;
		color: var(--muted);
		line-height: var(--leading-normal);
	}

	.rg-rules-panel--text {
		margin: 0 0 var(--space-6);
	}

	.rg-rules-panel--list {
		display: grid;
		gap: var(--space-3);
		margin: 0 0 var(--space-6);
		padding-left: var(--space-10);
	}

	.rg-rules-panel--group {
		margin: var(--space-8) 0 var(--space-4);
		color: var(--text);
		font: var(--weight-bold) var(--font-size-base) / var(--leading-tight)
			var(--font-body);
	}

	.rg-rules-panel--group:first-child {
		margin-top: 0;
	}

	.rg-rules-panel--keys {
		display: grid;
		/* One key column for every group, so the actions line up down the page. */
		grid-template-columns: 180px 1fr;
		gap: var(--space-4) var(--space-8);
		align-items: baseline;
		margin: 0;
	}

	.rg-rules-panel--keys dt {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		align-items: baseline;
	}

	.rg-rules-panel--keys dd {
		margin: 0;
	}

	.rg-rules-panel--keys kbd {
		min-width: 24px;
		padding: var(--space-1) var(--space-3);
		border: var(--border) solid var(--line-soft);
		border-bottom-width: 2px;
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--text);
		font: var(--weight-bold) var(--font-size-sm) / var(--leading-tight)
			var(--font-body);
		text-align: center;
	}

	.rg-rules-panel--or,
	.rg-rules-panel--plus {
		color: var(--muted);
		font-size: var(--font-size-xs);
	}
</style>
