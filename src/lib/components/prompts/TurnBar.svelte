<!-- The footer: the current decision or what another player is doing, its cost and actions, and a reveal beside the turn label. -->
<script module>
	/** @typedef {'neutral' | 'selected' | 'optional' | 'waiting' | 'income' | 'complete'} TurnBarTone */

	/**
	 * Properties of the TurnBar component itself.
	 * @typedef {Object} TurnBarOwnProps
	 * @property {TurnBarTone} [tone='neutral'] - neutral: your turn, nothing chosen; selected: a space is chosen; optional: an optional benefit tinted with the track; waiting: another player's turn, label and text only; income: the viewer's own income turn, a gold footer; complete: the finished game, on the results and the board review, its label upright as the header's Game complete (#105)
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
	 * @property {import('svelte').Snippet} [note] - Drawn after the heading, on its line, such as the footer's "Just now" line with Show again (#153)
	 * @property {import('svelte').Snippet} [reveal] - Drawn before the turn label, in the group whose hover and focus open it, such as the IncomeReveal (#122)
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
	 *   cost={['food', 'any']}>
	 *   {#snippet reveal()}
	 *     <IncomeReveal description="End this era, gain income and begin your next era." label="Take income" folded onIncomeRevealClick={() => takeIncome()} />
	 *   {/snippet}
	 *   {#snippet actions()}
	 *     <Button mode="primary" onButtonClick={() => advance()}>Advance · +4 VP</Button>
	 *   {/snippet}
	 * </TurnBar>
	 */
</script>

<script>
	import CostBox from './CostBox.svelte';
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
		note,
		reveal,
		...attr
	} = $props();

	let waiting = $derived(tone === 'waiting');
	let showCost = $derived(!waiting && Boolean(cost?.length));
	let showActions = $derived(
		!waiting && tone !== 'income' && (showCost || Boolean(actions))
	);
</script>

<footer
	{...attr}
	class="rg-turn-bar rg-turn-bar--{tone} {attr.class ? attr.class : ''}"
	style:--rg-turn-bar-track={track ? trackColor(track) : 'var(--gold)'}
	style:--rg-turn-bar-proper={track ? trackColor(track) : 'var(--gold)'}
	style:--rg-turn-bar-label={labelColor}>
	<div class="rg-turn-bar--copy">
		<div class="rg-turn-bar--lead">
			{#if reveal}
				{@render reveal()}
			{/if}
			<span class="rg-turn-bar--label">{label}</span>
		</div>
		<div
			class="rg-turn-bar--text"
			aria-live="polite">
			<div class="rg-turn-bar--line">
				<h3 class="rg-turn-bar--heading">
					{heading}
					{#if properName}<span class="rg-turn-bar--proper"
							>{properName}</span
						>{/if}{#if properIcon}<span class="rg-turn-bar--icon"
							>{@render properIcon()}</span
						>{/if}{headingEnd ?? ''}
				</h3>
				{#if note}
					{@render note()}
				{/if}
			</div>
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

	/* The income turn is gold from edge to edge, as the mockup's .turnbar.income-turn. */
	.rg-turn-bar--income {
		border-top-color: var(--gold);
		background: linear-gradient(
			180deg,
			var(--income-top) 0%,
			var(--income-mid) 52%,
			var(--income-bottom) 100%
		);
		box-shadow: inset 0 -3px var(--gold);
	}

	.rg-turn-bar--income .rg-turn-bar--label,
	.rg-turn-bar--income .rg-turn-bar--heading {
		color: var(--income-title);
	}

	.rg-turn-bar--income .rg-turn-bar--detail {
		color: var(--income-soft);
	}

	.rg-turn-bar--copy {
		display: grid;
		grid-template-columns: auto minmax(180px, 1fr);
		align-items: center;
		gap: var(--space-7);
		min-width: 0;
	}

	/* The reveal and the turn label: hovering or focusing either opens a folded reveal. */
	.rg-turn-bar--lead {
		display: flex;
		align-items: center;
		min-width: 0;
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

	/* The finished game's label stands upright and spaced, as the end-screen mockup's footer and the header's Game complete (issue 105). */
	.rg-turn-bar--complete .rg-turn-bar--label {
		font-style: normal;
		letter-spacing: var(--letter-spacing-title);
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

	.rg-turn-bar--line {
		display: flex;
		align-items: baseline;
		gap: var(--space-4);
		min-width: 0;
		margin: 0 0 var(--space-1);
	}

	.rg-turn-bar--heading {
		margin: 0;
		font: var(--weight-bold) var(--font-size-base) / var(--leading-tight)
			var(--font-body);
	}

	.rg-turn-bar--proper {
		color: var(--rg-turn-bar-proper);
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
