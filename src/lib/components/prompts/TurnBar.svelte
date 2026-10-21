<!-- The footer: the current decision or what another player is doing, its cost and actions, and the income reveal. -->
<script module>
	/** @typedef {'neutral' | 'selected' | 'optional' | 'waiting'} TurnBarTone */

	/**
	 * The income choice offered beside the turn label.
	 * @typedef {Object} TurnBarIncome
	 * @property {string} description - What taking income does, such as 'End this era, gain income and begin your next era.'
	 * @property {string} label - The button's text, such as 'Take income'
	 */

	/**
	 * Properties of the TurnBar component itself.
	 * @typedef {Object} TurnBarOwnProps
	 * @property {TurnBarTone} [tone='neutral'] - neutral: your turn, nothing chosen, income shown; selected: a space is chosen, income folds behind the turn label and opens on hover or focus; optional: an optional benefit tinted with the track, income unavailable; waiting: another player's turn, label and text only
	 * @property {string} [label='Your turn'] - The turn label, such as 'Optional action' or 'Ana’s turn'
	 * @property {string} [labelColor] - The label's colour as a token reference, such as 'var(--player-2)' for another player's turn; defaults to gold
	 * @property {string} heading - The decision, such as 'Advance to'
	 * @property {string} [properName] - A game thing's name after the heading, in Cinzel and the track's colour, such as 'Ships'
	 * @property {import('svelte').Snippet} [properIcon] - A small inline icon after the proper name, such as the farm; an SVG that fills its 17px box and draws with currentColor
	 * @property {string} [headingEnd] - Text after the proper name and icon, such as '?'
	 * @property {string} [detail] - One line under the heading: the benefit or the instruction
	 * @property {import('../../ui.js').TrackId} [track] - The chosen space's track: colours the proper name, the cost and the optional tint
	 * @property {import('../../ui.js').CostSymbol[] | null} [cost=null] - The price shown before the actions
	 * @property {string} [costLabel] - The word before the price; defaults to 'Optional cost' in the optional tone and 'Cost' otherwise
	 * @property {import('svelte').Snippet} [actions] - The action Buttons, after the cost
	 * @property {TurnBarIncome | null} [income=null] - The income choice; never shown in the waiting tone
	 * @property {Function} [onTurnBarIncome] - Callback fired when the income button is pressed
	 */

	/**
	 * Properties for the TurnBar component, including any attributes for its root footer.
	 * @typedef {TurnBarOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} TurnBarProps
	 *
	 * @example
	 * <TurnBar
	 *   tone="selected"
	 *   heading="Advance to"
	 *   properName="Ships"
	 *   detail="Gain 1 VP per territory you control. You control 4 territories."
	 *   track="exploration"
	 *   cost={['food', 'any']}
	 *   income={{ description: 'End this era, gain income and begin your next era.', label: 'Take income' }}
	 *   onTurnBarIncome={() => takeIncome()}>
	 *   {#snippet actions()}
	 *     <Button mode="primary" onButtonClick={() => advance()}>Advance · +4 VP</Button>
	 *   {/snippet}
	 * </TurnBar>
	 */
</script>

<script>
	import Button from '../ui/Button.svelte';
	import CostBox from './CostBox.svelte';
	import { ComponentEvent } from '../../component-event.js';
	import { trackColor } from '../../ui.js';

	/** @type {TurnBarProps} */
	let {
		tone = 'neutral',
		label = 'Your turn',
		labelColor,
		heading,
		properName,
		properIcon,
		headingEnd,
		detail,
		track,
		cost = null,
		costLabel,
		actions,
		income = null,
		onTurnBarIncome,
		...attr
	} = $props();

	let waiting = $derived(tone === 'waiting');
	let showIncome = $derived(Boolean(income) && !waiting);
	let showCost = $derived(!waiting && Boolean(cost?.length));
	let showActions = $derived(!waiting && (showCost || Boolean(actions)));

	/**
	 * @param {import('../../component-event.js').ComponentEvent} event
	 */
	const incomeButtonClickHandler = (event) => {
		if (typeof onTurnBarIncome === 'function') {
			onTurnBarIncome(
				new ComponentEvent(undefined, event.target, event.originalEvent)
			);
		}
	};
</script>

<footer
	{...attr}
	class="rg-turn-bar rg-turn-bar--{tone} {attr.class ? attr.class : ''}"
	style:--rg-turn-bar-track={track ? trackColor(track) : 'var(--gold)'}
	style:--rg-turn-bar-label={labelColor}>
	<div class="rg-turn-bar--copy">
		<div class="rg-turn-bar--income-access">
			{#if showIncome && income}
				<div
					class="rg-turn-bar--income-reveal"
					inert={tone === 'optional' || undefined}>
					<div class="rg-turn-bar--income-inner">
						<span class="rg-turn-bar--income-explanation"
							>{income.description}</span>
						<Button
							disabled={tone === 'optional'}
							onButtonClick={incomeButtonClickHandler}
							>{income.label}</Button>
					</div>
				</div>
			{/if}
			<span class="rg-turn-bar--label">{label}</span>
		</div>
		<div
			class="rg-turn-bar--text"
			aria-live="polite">
			<h3 class="rg-turn-bar--heading">
				{heading}
				{#if properName}<span class="rg-turn-bar--proper"
						>{properName}</span
					>{/if}{#if properIcon}<span class="rg-turn-bar--icon"
						>{@render properIcon()}</span
					>{/if}{headingEnd ?? ''}
			</h3>
			{#if detail}
				<p class="rg-turn-bar--detail">{detail}</p>
			{/if}
		</div>
	</div>
	{#if showActions}
		<div class="rg-turn-bar--actions">
			{#if showCost && cost}
				<span class="rg-turn-bar--cost">
					<CostBox
						symbols={cost}
						{track}
						label={costLabel ??
							(tone === 'optional' ? 'Optional cost' : 'Cost')} />
				</span>
			{/if}
			{#if actions}
				<div class="rg-turn-bar--buttons">
					{@render actions()}
				</div>
			{/if}
		</div>
	{/if}
</footer>

<style>
	.rg-turn-bar {
		display: grid;
		grid-template-columns: minmax(300px, 1fr) auto;
		align-items: center;
		gap: var(--space-10);
		height: var(--bar-height);
		padding: var(--space-3) var(--space-10);
		border-top: var(--border) solid var(--line);
		background: var(--chrome);
		transition:
			background var(--duration-fast) var(--ease),
			box-shadow var(--duration-fast) var(--ease);
	}

	/* The optional benefit takes a tint of its track and a band along the bottom, as the approved mockup draws it. */
	.rg-turn-bar--optional {
		--rg-turn-bar-tint: color-mix(
			in srgb,
			var(--rg-turn-bar-track) 60%,
			var(--text)
		);
		background: color-mix(
			in srgb,
			var(--rg-turn-bar-track) 18%,
			var(--chrome)
		);
		box-shadow: inset 0 -3px 0 var(--rg-turn-bar-track);
	}

	.rg-turn-bar--copy {
		display: grid;
		grid-template-columns: auto minmax(180px, 1fr);
		align-items: center;
		gap: var(--space-7);
		min-width: 0;
	}

	.rg-turn-bar--income-access {
		display: flex;
		align-items: center;
		min-width: 0;
	}

	.rg-turn-bar--income-reveal {
		max-width: 455px;
		margin-right: var(--space-6);
		overflow: hidden;
		opacity: 1;
		transition:
			max-width var(--duration-medium) var(--ease),
			margin-right var(--duration-medium) var(--ease),
			opacity var(--duration-fast) var(--ease);
	}

	.rg-turn-bar--selected .rg-turn-bar--income-reveal,
	.rg-turn-bar--optional .rg-turn-bar--income-reveal {
		max-width: 0;
		margin-right: 0;
		opacity: 0;
	}

	.rg-turn-bar--selected
		.rg-turn-bar--income-access:hover
		.rg-turn-bar--income-reveal,
	.rg-turn-bar--selected
		.rg-turn-bar--income-access:focus-within
		.rg-turn-bar--income-reveal {
		max-width: 455px;
		margin-right: var(--space-6);
		opacity: 1;
	}

	/* A fixed width, so the text does not reflow while the reveal slides open. */
	.rg-turn-bar--income-inner {
		display: flex;
		align-items: center;
		gap: var(--space-6);
		width: 455px;
		height: 40px;
		padding-right: var(--space-7);
		border-right: var(--border) solid var(--line);
	}

	.rg-turn-bar--income-explanation {
		flex: 1;
		color: var(--muted);
		font-size: var(--font-size-xs);
		line-height: var(--leading-tight);
	}

	.rg-turn-bar--label {
		color: var(--rg-turn-bar-label, var(--gold));
		font: italic var(--weight-title) var(--font-size-xl) /
			var(--leading-none) var(--font-title);
		white-space: nowrap;
	}

	.rg-turn-bar--optional .rg-turn-bar--label {
		color: var(--rg-turn-bar-tint);
	}

	/* Another player's turn carries their name, and player names never use Cinzel. */
	.rg-turn-bar--waiting .rg-turn-bar--label {
		font-family: var(--font-body);
		font-size: var(--font-size-lg);
		font-weight: var(--weight-bold);
	}

	.rg-turn-bar--text {
		min-width: 0;
	}

	.rg-turn-bar--heading {
		margin: 0 0 var(--space-1);
		font: var(--weight-bold) var(--font-size-base) / var(--leading-tight)
			var(--font-body);
	}

	.rg-turn-bar--proper {
		color: var(--rg-turn-bar-track);
		font-family: var(--font-title);
		font-weight: var(--weight-title);
	}

	.rg-turn-bar--optional .rg-turn-bar--proper {
		color: var(--rg-turn-bar-tint);
	}

	.rg-turn-bar--icon {
		display: inline-block;
		width: 17px;
		height: 17px;
		margin-left: var(--space-2);
		vertical-align: -3px;
		color: color-mix(in srgb, var(--gold) 50%, var(--bronze));
	}

	.rg-turn-bar--detail {
		margin: 0;
		color: var(--muted);
		font-size: var(--font-size-sm);
	}

	.rg-turn-bar--actions {
		display: flex;
		align-items: center;
		gap: var(--space-4);
	}

	.rg-turn-bar--cost {
		display: flex;
		margin-right: var(--space-2);
	}

	/* The action buttons share one minimum width; grid items stretch to fill it. */
	.rg-turn-bar--buttons {
		display: grid;
		grid-auto-columns: minmax(126px, auto);
		grid-auto-flow: column;
		gap: var(--space-4);
	}

	/* The optional benefit's commit button takes the light track tint instead of the action green. */
	.rg-turn-bar--optional .rg-turn-bar--buttons {
		--action: var(--rg-turn-bar-tint);
	}
</style>
