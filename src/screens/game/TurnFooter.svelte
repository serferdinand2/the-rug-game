<!-- The game's footer (#86): the players overview's close bar, or one TurnBar drawn from turn.js' footerView, with its actions and income reveal. -->
<script module>
	/**
	 * Properties of the TurnFooter screen part itself.
	 * @typedef {Object} TurnFooterOwnProps
	 * @property {import('../../lib/turn.js').FooterView} view - Which footer shows and what it says (turn.js footerView)
	 * @property {boolean} [sending=false] - A move of the turn's own is being sent: its buttons wait
	 * @property {Function} [onTurnFooterIncomeAsk] - Callback fired when Take income is pressed, before it is asked
	 * @property {Function} [onTurnFooterIncome] - Callback fired when the income question's Take income is pressed
	 * @property {Function} [onTurnFooterAdvance] - Callback fired when the selected space's Advance is pressed
	 * @property {Function} [onTurnFooterTrack] - Callback fired with a track chosen in the track question
	 * @property {Function} [onTurnFooterCancel] - Callback fired when the income or track question is cancelled
	 * @property {Function} [onTurnFooterResults] - Callback fired when a finished game's Results is pressed
	 * @property {Function} [onTurnFooterOverviewClose] - Callback fired when the players overview's close bar is pressed
	 */

	/**
	 * Properties for TurnFooter, including any attributes for its footer bar.
	 * @typedef {TurnFooterOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} TurnFooterProps
	 *
	 * @example
	 * <TurnFooter
	 *   view={footerView(game, seat, inputs)}
	 *   {sending}
	 *   onTurnFooterAdvance={() => advance()}
	 *   onTurnFooterTrack={(event) => pickTrack(event.value)} />
	 */
</script>

<script>
	import Button from '../../lib/components/ui/Button.svelte';
	import IncomeReveal from '../../lib/components/prompts/IncomeReveal.svelte';
	import OverviewCloseBar from '../../lib/components/prompts/OverviewCloseBar.svelte';
	import TurnBar from '../../lib/components/prompts/TurnBar.svelte';
	import { ComponentEvent } from '../../lib/component-event.js';

	/** @type {TurnFooterProps} */
	let {
		view,
		sending = false,
		onTurnFooterIncomeAsk,
		onTurnFooterIncome,
		onTurnFooterAdvance,
		onTurnFooterTrack,
		onTurnFooterCancel,
		onTurnFooterResults,
		onTurnFooterOverviewClose,
		...attr
	} = $props();

	/** Only these footers have buttons of their own; forced income only while its button shows. */
	let hasActions = $derived(
		view.kind === 'over' ||
			view.kind === 'incomeAsk' ||
			view.kind === 'trackAsk' ||
			view.kind === 'selected' ||
			(view.kind === 'forcedIncome' && Boolean(view.takeIncome))
	);

	/**
	 * Passes a press on to a callback as a ComponentEvent.
	 * @param {Function | undefined} callback
	 * @param {unknown} [value]
	 * @returns {(event: ComponentEvent) => void}
	 */
	function report(callback, value) {
		return (event) => {
			if (typeof callback === 'function') {
				callback(
					new ComponentEvent(value, event.target, event.originalEvent)
				);
			}
		};
	}
</script>

{#snippet footerActions()}
	{#if view.kind === 'over'}
		<Button
			mode="gold"
			onButtonClick={report(onTurnFooterResults)}>Results</Button>
	{:else if view.kind === 'incomeAsk'}
		<Button
			disabled={sending}
			onButtonClick={report(onTurnFooterCancel)}>Cancel</Button>
		<Button
			mode="gold"
			disabled={sending}
			onButtonClick={report(onTurnFooterIncome)}>Take income</Button>
	{:else if view.kind === 'trackAsk'}
		{#each view.tracks ?? [] as choice (choice.track)}
			<Button
				disabled={sending || !choice.enabled}
				onButtonClick={report(onTurnFooterTrack, choice.track)}
				>{choice.label}</Button>
		{/each}
		<Button onButtonClick={report(onTurnFooterCancel)}>Cancel</Button>
	{:else if view.kind === 'forcedIncome'}
		<Button
			mode="gold"
			disabled={sending}
			onButtonClick={report(onTurnFooterIncomeAsk)}>Take income</Button>
	{:else if view.kind === 'selected'}
		<Button
			mode="primary"
			disabled={!view.advance?.enabled || sending}
			title={view.advance?.title}
			onButtonClick={report(onTurnFooterAdvance)}>Advance</Button>
	{/if}
{/snippet}

{#snippet incomeReveal()}
	{#if view.income}
		<IncomeReveal
			description={view.income.description}
			label={view.income.label}
			folded={view.income.folded}
			onIncomeRevealClick={report(onTurnFooterIncomeAsk)} />
	{/if}
{/snippet}

{#if view.kind === 'overview'}
	<OverviewCloseBar
		{...attr}
		onOverviewCloseBarClick={report(onTurnFooterOverviewClose)} />
{:else if view.kind !== 'none'}
	<!-- Each kind of footer is its own bar, so nothing a bar keeps, such as its income reveal, carries into the next. -->
	{#key view.kind}
		<TurnBar
			{...attr}
			tone={view.tone}
			label={view.label}
			labelColor={view.labelColor}
			heading={view.heading ?? ''}
			properName={view.properName}
			track={view.track}
			detail={view.detail}
			cost={view.cost ?? null}
			reveal={view.income ? incomeReveal : undefined}
			actions={hasActions ? footerActions : undefined} />
	{/key}
{/if}
