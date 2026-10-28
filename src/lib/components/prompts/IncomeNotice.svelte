<!-- The one-time notice after income turn 1 (#77): the gold income panel says the game took the turn, what it gave, and what comes next. -->
<script module>
	/**
	 * Properties of the IncomeNotice component itself.
	 * @typedef {Object} IncomeNoticeOwnProps
	 * @property {string} [title='Era I begins'] - The panel's title
	 * @property {string} [lead='Every player’s first turn is an income turn, so the game took yours for you.'] - Why nobody was asked
	 * @property {{ coin: number, worker: number, food: number, culture: number }} resources - The viewer's resources, one chip for each above 0
	 * @property {string} holdings - The words after "You start with", such as '1 coin, 1 food and 1 tapestry card'
	 * @property {string} [next='From now on, each turn you either advance on a track or take income.'] - What every later turn offers
	 * @property {string} [confirmLabel='Got it'] - The closing button's text
	 * @property {Function} [onIncomeNoticeClose] - Callback fired when Got it is pressed; the screen it sits on closes it on Escape too, when nothing else is open, since only the screen knows what else is
	 */

	/**
	 * Properties for the IncomeNotice component, including any attributes for the panel's root element.
	 * @typedef {IncomeNoticeOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} IncomeNoticeProps
	 *
	 * @example
	 * <IncomeNotice
	 *   resources={{ coin: 1, worker: 1, food: 1, culture: 1 }}
	 *   holdings="1 coin, 1 food, 1 worker, 1 culture, 1 territory tile and 1 tapestry card"
	 *   onIncomeNoticeClose={() => (noticeClosed = true)} />
	 */
</script>

<script>
	import DecisionPanel from './DecisionPanel.svelte';
	import ResourceChip from '../player/ResourceChip.svelte';
	import { ComponentEvent } from '../../component-event.js';

	/** @typedef {import('../../ui.js').ResourceId} ResourceId */

	/** @type {ResourceId[]} */
	const ORDER = ['coin', 'food', 'worker', 'culture'];

	/** @type {IncomeNoticeProps} */
	let {
		title = 'Era I begins',
		lead = 'Every player’s first turn is an income turn, so the game took yours for you.',
		resources,
		holdings,
		next = 'From now on, each turn you either advance on a track or take income.',
		confirmLabel = 'Got it',
		onIncomeNoticeClose,
		...attr
	} = $props();

	let chips = $derived(ORDER.filter((id) => resources[id] > 0));

	/**
	 * @param {ComponentEvent} event
	 */
	const confirmHandler = (event) => {
		if (typeof onIncomeNoticeClose === 'function') {
			onIncomeNoticeClose(
				new ComponentEvent(null, event.target, event.originalEvent)
			);
		}
	};
</script>

<DecisionPanel
	{...attr}
	class="rg-income-notice {attr.class ? attr.class : ''}"
	narrow
	tone="income"
	{title}
	{confirmLabel}
	onDecisionPanelConfirm={confirmHandler}>
	<div class="rg-income-notice--body">
		<p class="rg-income-notice--lead">{lead}</p>
		<div class="rg-income-notice--holdings">
			<span class="rg-income-notice--label">You start with</span>
			{#if chips.length}
				<span class="rg-income-notice--chips">
					{#each chips as id (id)}
						<ResourceChip
							resource={id}
							count={resources[id]} />
					{/each}
				</span>
			{/if}
			<p class="rg-income-notice--words">{holdings}.</p>
		</div>
		<p class="rg-income-notice--next">{next}</p>
	</div>
</DecisionPanel>

<style>
	.rg-income-notice--body {
		display: grid;
		gap: var(--space-6);
		max-width: 520px;
	}

	.rg-income-notice--lead,
	.rg-income-notice--next {
		margin: 0;
		color: var(--muted);
		font-size: var(--font-size-md);
	}

	.rg-income-notice--holdings {
		display: grid;
		gap: var(--space-4);
		padding: var(--space-6) var(--space-7);
		border: var(--border) solid var(--line);
		border-radius: var(--radius);
		background: color-mix(in srgb, var(--gold) 8%, transparent);
	}

	.rg-income-notice--label {
		color: var(--income-title);
		font-size: var(--font-size-xs);
		font-weight: var(--weight-bold);
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.rg-income-notice--chips {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-4);
	}

	.rg-income-notice--words {
		margin: 0;
		font-size: var(--font-size-base);
	}
</style>
