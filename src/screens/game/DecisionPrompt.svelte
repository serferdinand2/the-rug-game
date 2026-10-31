<!-- The decision prompt (#79): the one decision panel over the shared area, for the viewer's open decision or an advance's payment, with its content, its shelf of cards and its income steps. -->
<script module>
	/**
	 * Properties of the DecisionPrompt screen part itself.
	 * @typedef {Object} DecisionPromptOwnProps
	 * @property {import('../../lib/prompt-state.svelte.js').PromptState} state - What the viewer has chosen, and what it makes the panel say
	 * @property {string} code - The table code, which seeds a capital mat's terrain on the shelf (#56)
	 * @property {Function} [onDecisionPromptAdvance] - Callback fired when the payment's Advance is pressed; its value is the payment's index in the advance's payments
	 * @property {Function} [onDecisionPromptCancel] - Callback fired when the payment's Cancel is pressed
	 * @property {Function} [onDecisionPromptInspect] - Callback fired with a shelf card to show in full ({ kind, id, side }, for CardPreview) while it is hovered or focused, and with null when that ends
	 */

	/**
	 * Properties for DecisionPrompt, including any attributes for its panel.
	 * @typedef {DecisionPromptOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} DecisionPromptProps
	 *
	 * @example
	 * <DecisionPrompt
	 *   state={promptState}
	 *   code={room.code}
	 *   onDecisionPromptAdvance={(event) => advance(event.value)}
	 *   onDecisionPromptCancel={() => (selected = null)}
	 *   onDecisionPromptInspect={(event) => (inspected = event.value)} />
	 */
</script>

<script>
	import DecisionOption from '../../lib/components/prompts/DecisionOption.svelte';
	import DecisionPanel from '../../lib/components/prompts/DecisionPanel.svelte';
	import CardShelf from '../../lib/components/prompts/CardShelf.svelte';
	import LandmarkCard from '../../lib/components/player/LandmarkCard.svelte';
	import CostBox from '../../lib/components/prompts/CostBox.svelte';
	import IncomeSteps from '../../lib/components/prompts/IncomeSteps.svelte';
	import ResourceRows from '../../lib/components/prompts/ResourceRows.svelte';
	import TilePicker from '../../lib/components/prompts/TilePicker.svelte';
	import TurnControl from '../../lib/components/prompts/TurnControl.svelte';
	import { ComponentEvent } from '../../lib/component-event.js';
	import { offerArt } from '../../lib/picks.js';
	import { spaceName } from '../../lib/game-names.js';
	import { terrainSeed } from '../../lib/area/capital.js';
	import { placingCard } from '../../lib/prompts.js';

	/** @type {DecisionPromptProps} */
	let {
		state,
		code,
		onDecisionPromptAdvance,
		onDecisionPromptCancel,
		onDecisionPromptInspect,
		...attr
	} = $props();

	let prompt = $derived(state.prompt);
	let controls = $derived(state.controls);
	let pick = $derived(state.pick);
	let picks = $derived(state.picks);
	let cardPick = $derived(state.cardPick);
	let advance = $derived(state.advance);
	/** The landmark card whose goal brought the landmark being placed, above the panel (#32). */
	let placing = $derived(placingCard(state.decision));
	/** A pick of several things, or a trade, is narrow, as #75 drew it. */
	let narrow = $derived(
		(!!pick && !cardPick) || !!state.offering || state.tradeAnswer !== -1
	);
	let pickNoun = $derived(
		pick?.items?.kind === 'territory' ? 'tile' : 'card'
	);
	let seed = $derived(terrainSeed(code));

	/**
	 * The payment's Advance: the payment the rows match.
	 * @param {ComponentEvent} event
	 */
	const payConfirmHandler = (event) => {
		if (typeof onDecisionPromptAdvance === 'function') {
			onDecisionPromptAdvance(
				new ComponentEvent(
					state.payIndex,
					event.target,
					event.originalEvent
				)
			);
		}
	};

	/**
	 * The payment's Cancel: the payment is forgotten, and the screen drops the selected space.
	 * @param {ComponentEvent} event
	 */
	const payCancelHandler = (event) => {
		state.clearPayment();
		if (typeof onDecisionPromptCancel === 'function') {
			onDecisionPromptCancel(
				new ComponentEvent(null, event.target, event.originalEvent)
			);
		}
	};

	/**
	 * Reports a card to show in full, or none.
	 * @param {import('../../lib/prompt-state.svelte.js').Inspected | null} card
	 * @param {ComponentEvent} event
	 */
	function inspect(card, event) {
		if (typeof onDecisionPromptInspect === 'function') {
			onDecisionPromptInspect(
				new ComponentEvent(card, event.target, event.originalEvent)
			);
		}
	}

	/**
	 * @param {ComponentEvent} event
	 */
	const shelfInspectHandler = (event) => {
		inspect(state.inspectShelf(event.value), event);
	};

	/**
	 * @param {ComponentEvent} event
	 */
	const pickInspectHandler = (event) => {
		inspect(state.inspectPick(event.value), event);
	};

	/**
	 * @param {ComponentEvent} event
	 */
	const tilePickHandler = (event) => {
		state.pickTile(event.value.tile);
	};

	/**
	 * @param {ComponentEvent} event
	 */
	const turnHandler = (event) => {
		state.turnTile(event.value.step);
	};
</script>

{#snippet incomeSteps()}
	{#if prompt?.income}
		<IncomeSteps
			steps={prompt.income.steps}
			current={prompt.income.current} />
	{/if}
{/snippet}

<!-- The prompt's cost and its own options; a prompt without them (cards on the shelf, plots, hexes) has no content
     area, and its status line gives the instruction, so the shelf has more room (#57). -->
{#snippet promptContent()}
	{#if state.offering}
		<div class="rg-decision-prompt--trades">
			{#each state.offering as offer (offer.offer)}
				<DecisionOption
					label={offer.label}
					art={offerArt(offer)}
					disabled={!offer.enabled || state.sending}
					onDecisionOptionClick={() =>
						state.chooseOffer(offer.offer)} />
			{/each}
		</div>
	{:else if pick && picks}
		<div class="rg-decision-prompt--picks">
			<p class="rg-decision-prompt--lead">{pick.lead}</p>
			{#if pick.rows.length}
				<ResourceRows
					rows={state.pickRows}
					disabled={state.sending}
					onResourceRowsPick={(/** @type {ComponentEvent} */ event) =>
						state.pickRow(event.value.row, event.value.resource)} />
			{/if}
			{#if pick.items}
				<p class="rg-decision-prompt--label">
					Your {pickNoun}s · {picks.items.length} of {pick.items
						.count} chosen
				</p>
				{#if pick.items.kind === 'territory'}
					<TilePicker
						class="rg-decision-prompt--pick-tiles"
						tiles={state.pickTiles}
						selected={picks.items.map(Number)}
						disabled={state.pickBlocked.map(Number)}
						onTilePickerSelect={tilePickHandler} />
				{/if}
			{/if}
		</div>
	{:else if state.tradeAnswer !== -1 && prompt}
		<p class="rg-decision-prompt--lead">
			{prompt.options[state.tradeAnswer]?.label}
		</p>
	{/if}
	{#if state.exploring}
		<div class="rg-decision-prompt--explore">
			<p class="rg-decision-prompt--lead">
				Pick one of your tiles and a lit hex, then turn the tile until
				you like it.
			</p>
			<p class="rg-decision-prompt--label">
				Your tiles · {state.offeredTiles.length}
			</p>
			<TilePicker
				tiles={state.exploreRow}
				selected={state.tile}
				onTilePickerSelect={tilePickHandler} />
		</div>
	{/if}
	{#if prompt?.cost && !pick}
		<div class="rg-decision-prompt--cost">
			<CostBox
				symbols={prompt.cost}
				track={prompt.track ?? undefined} />
		</div>
	{/if}
	{#if state.panelOptions.length}
		<div class="rg-decision-prompt--options">
			{#each state.panelOptions as option (option.index)}
				<DecisionOption
					label={option.label}
					art={option.art}
					vp={option.vp}
					pressed={state.picked === option.index}
					onDecisionOptionClick={() => state.choose(option.index)} />
			{/each}
		</div>
	{/if}
{/snippet}

<!-- An explore's chosen hex and turn, and the control that turns the tile, kept in sight while the tiles scroll
     (#74). The line is the one place that names them; it is announced with the VP the turn scores. -->
{#snippet explorePinned()}
	<div class="rg-decision-prompt--explore">
		<p
			class="rg-decision-prompt--chosen"
			role="status">
			{state.exploreChosen}{#if state.exploreVp !== null}<span
					class="rg-decision-prompt--spoken"
					>, {state.exploreVp} VP</span
				>{/if}
		</p>
		<TurnControl
			vp={state.exploreVp}
			onTurnControlTurn={turnHandler} />
	</div>
{/snippet}

<!-- Cards to pay (#75), several chosen at once on the shelf above the panel. -->
{#snippet pickShelf(/** @type {number | undefined} */ room)}
	{#if cardPick && picks}
		<CardShelf
			kind={cardPick.kind === 'tech' ? 'tech' : 'tapestry'}
			cards={state.pickCards}
			selected={cardPick.ids.flatMap((id, index) =>
				picks?.items.includes(id) ? [index] : []
			)}
			disabled={cardPick.ids.flatMap((id, index) =>
				state.pickBlocked.includes(id) ? [index] : []
			)}
			terrainSeed={seed}
			{room}
			onCardShelfSelect={(/** @type {ComponentEvent} */ event) =>
				state.pickCard(event.value)}
			onCardShelfInspect={pickInspectHandler} />
	{/if}
{/snippet}

{#snippet cardShelf(/** @type {number | undefined} */ room)}
	{#if prompt?.shelf}
		<CardShelf
			kind={prompt.shelf}
			cards={state.shelfCards}
			selected={state.picked}
			terrainSeed={seed}
			{room}
			onCardShelfSelect={(/** @type {ComponentEvent} */ event) =>
				state.choose(event.value)}
			onCardShelfInspect={shelfInspectHandler} />
	{/if}
{/snippet}

<!-- A landmark card's landmark to place: the card above the panel, outlined as the one met (#32 mockup). -->
{#snippet placingShelf()}
	{#if placing}
		<div class="rg-decision-prompt--placing">
			<LandmarkCard
				title={placing.title}
				artwork={placing.artwork}
				footprint={placing.footprint}
				edition={placing.edition}
				condition={placing.condition} />
		</div>
	{/if}
{/snippet}

{#if state.paying && advance && state.payModel && state.payControls}
	<DecisionPanel
		{...attr}
		narrow
		title="Advance to {spaceName(advance.track, advance.to)}"
		status={state.payControls.status}
		statusWarn={state.payControls.warn}
		track={advance.track}
		confirmLabel={state.payControls.confirmLabel}
		confirmDisabled={state.payControls.confirmDisabled}
		cancelLabel={state.payControls.cancelLabel}
		onDecisionPanelConfirm={payConfirmHandler}
		onDecisionPanelCancel={payCancelHandler}>
		<div class="rg-decision-prompt--picks">
			<p class="rg-decision-prompt--lead">{state.payModel.lead}</p>
			<ResourceRows
				rows={state.payRows}
				disabled={state.sending}
				onResourceRowsPick={(/** @type {ComponentEvent} */ event) =>
					state.payRow(event.value.row, event.value.resource)} />
		</div>
	</DecisionPanel>
{:else if prompt && controls}
	<DecisionPanel
		{...attr}
		docked={state.docked}
		{narrow}
		title={prompt.title}
		track={prompt.track}
		tone={prompt.income ? 'income' : 'default'}
		steps={prompt.income ? incomeSteps : undefined}
		shelf={cardPick
			? pickShelf
			: state.shelfCards.length
				? cardShelf
				: placing
					? placingShelf
					: undefined}
		status={controls.status}
		statusWarn={controls.warn}
		children={controls.content ? promptContent : undefined}
		pinned={state.exploring ? explorePinned : undefined}
		confirmLabel={controls.confirmLabel}
		confirmDisabled={controls.confirmDisabled}
		cancelLabel={controls.cancelLabel}
		onDecisionPanelConfirm={() => state.confirm()}
		onDecisionPanelCancel={() => state.cancel()} />
{/if}

<style>
	.rg-decision-prompt--placing {
		margin: var(--space-8) 0 var(--space-4);
		outline: 3px solid var(--gold);
		outline-offset: 3px;
	}

	.rg-decision-prompt--options {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-5);
		max-height: 340px;
		overflow: auto;
	}

	/* A pick prompt's content (#75): the lead, the resource rows, then the cards' or tiles' count and the tiles. */
	.rg-decision-prompt--picks {
		display: grid;
		gap: var(--space-6);
	}

	/* A payment's tiles wrap three to a row, favouring height (owner, #75). */
	.rg-decision-prompt--picks :global(.rg-decision-prompt--pick-tiles) {
		max-width: calc(3 * 88px + 2 * var(--space-3));
	}

	/* A trade's offers (#75), two columns of three. */
	.rg-decision-prompt--trades {
		display: grid;
		grid-template-rows: repeat(3, auto);
		grid-template-columns: repeat(2, 1fr);
		grid-auto-flow: column;
		gap: var(--space-4);
	}

	/* The explore's content (#74): the lead and the tile row, then (pinned) what is chosen and the turn control. */
	.rg-decision-prompt--explore {
		display: grid;
		gap: var(--space-6);
	}

	.rg-decision-prompt--lead,
	.rg-decision-prompt--label,
	.rg-decision-prompt--chosen {
		margin: 0;
	}

	.rg-decision-prompt--lead {
		color: var(--muted);
		font-size: var(--font-size-md);
	}

	.rg-decision-prompt--label {
		color: var(--muted);
		font-size: var(--font-size-xs);
		font-weight: var(--weight-bold);
		letter-spacing: var(--letter-spacing-caps);
		text-transform: uppercase;
	}

	.rg-decision-prompt--chosen {
		color: var(--text);
		font-size: var(--font-size-md);
	}

	/* Words for screen readers only. */
	.rg-decision-prompt--spoken {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
	}

	.rg-decision-prompt--cost {
		margin-bottom: var(--space-6);
	}
</style>
