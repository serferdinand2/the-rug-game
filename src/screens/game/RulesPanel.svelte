<!-- How to play in the game (#42): the rules in our own words, one tab per part of the game, and the keyboard shortcuts. -->
<script module>
	/**
	 * Properties of the RulesPanel screen part itself.
	 * @typedef {Object} RulesPanelOwnProps
	 * @property {string} [tab] - The tab on show: a section id of RULES_HELP, or 'keys' for the keyboard shortcuts; bindable, the first section by default
	 * @property {Function} [onRulesPanelClose] - Callback fired when Close, Escape or the backdrop closes the panel
	 */

	/**
	 * Properties for RulesPanel, including any attributes for its root element.
	 * @typedef {RulesPanelOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} RulesPanelProps
	 *
	 * @example
	 * {#if rulesOpen}<RulesPanel bind:tab={rulesTab} onRulesPanelClose={() => (rulesOpen = false)} />{/if}
	 */
</script>

<script>
	import Button from '../../lib/components/ui/Button.svelte';
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

	/** @type {HTMLElement | undefined} */
	let dialog = $state();

	// The tab on show takes the focus, so the arrow keys move between the tabs at once.
	$effect(() => {
		dialog
			?.querySelector(
				/** @type {'button'} */ ('[role="tab"][aria-selected="true"]')
			)
			?.focus();
	});

	/**
	 * @param {Event} event
	 */
	function close(event) {
		if (typeof onRulesPanelClose === 'function') {
			onRulesPanelClose(
				new ComponentEvent(
					null,
					/** @type {HTMLElement} */ (dialog),
					event
				)
			);
		}
	}

	/**
	 * @param {KeyboardEvent} event
	 */
	const windowKeydownHandler = (event) => {
		if (event.key === 'Escape') {
			close(event);
		}
	};

	/**
	 * @param {MouseEvent} event
	 */
	const backdropClickHandler = (event) => {
		if (event.target === event.currentTarget) {
			close(event);
		}
	};
</script>

<svelte:window onkeydown={windowKeydownHandler} />

<!-- The backdrop only closes on a pointer click; Escape and Close serve the keyboard. -->
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div
	{...attr}
	class="rg-rules-panel {attr.class ? attr.class : ''}"
	onclick={backdropClickHandler}>
	<div
		bind:this={dialog}
		class="rg-rules-panel--dialog"
		role="dialog"
		aria-modal="true"
		aria-labelledby="rg-rules-panel-title">
		<h2
			id="rg-rules-panel-title"
			class="rg-rules-panel--title">
			How to play
		</h2>
		<Tabs
			class="rg-rules-panel--tabs"
			{tabs}
			bind:value={tab}
			label="How to play" />
		<div
			class="rg-rules-panel--body"
			id="{tab}-panel"
			role="tabpanel"
			tabindex="0"
			aria-labelledby="{tab}-tab">
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
												class="rg-rules-panel--plus"
												>+</span
											>{/if}<kbd>{key}</kbd>
									{/each}
								{/each}
							</dt>
							<dd>{shortcut.action}</dd>
						{/each}
					</dl>
				{/each}
			{/if}
		</div>
		<div class="rg-rules-panel--actions">
			<Button
				mode="gold"
				onButtonClick={(/** @type {any} */ event) =>
					close(event.originalEvent)}>Close</Button>
		</div>
	</div>
</div>

<style>
	.rg-rules-panel {
		position: fixed;
		inset: 0;
		z-index: var(--layer-popover);
		display: grid;
		place-items: center;
		background: color-mix(in srgb, var(--ink) 70%, transparent);
	}

	.rg-rules-panel--dialog {
		display: grid;
		grid-template-rows: auto auto minmax(0, 1fr) auto;
		width: min(1000px, calc(100vw - 2 * var(--space-10)));
		max-height: calc(100vh - 2 * var(--space-10));
		padding: var(--space-10);
		border: var(--border) solid var(--line-soft);
		border-radius: var(--radius);
		background: var(--chrome);
		box-shadow: var(--shadow-float);
	}

	.rg-rules-panel--title {
		margin: 0 0 var(--space-6);
		font: var(--weight-bold) var(--font-size-xl) / var(--leading-tight)
			var(--font-body);
	}

	.rg-rules-panel--body {
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

	.rg-rules-panel--actions {
		display: flex;
		justify-content: flex-end;
		margin-top: var(--space-9);
	}
</style>
