<!-- CivilizationCard: a civilization card drawn from its recipe, in the table's rules version; six cards draw a seat's live state and take its choices (#78, #107). -->
<script module>
	/**
	 * @typedef {Object} CivilizationCardOwnProps
	 * @property {string} [id] - Civilization slug; one without a reviewed layout shows its frame, portrait and name only
	 * @property {'empty' | 'play'} [state] - Starting state or labelled illustration; the play illustration is the
	 *   card's sample view (`SAMPLE_VIEWS`)
	 * @property {import('../../engine/data/ids.js').VersionId} [version='current'] - The table's rules version, whose
	 *   setup line the card prints
	 * @property {import('../../civ-card.js').CivCardView | null} [live=null] - A seat's live state, from `civCardView`:
	 *   the six card civilizations (`CARD_CIVS`) draw its marks in the play state instead of the illustration, and its
	 *   choices as buttons; the other civilizations ignore it
	 * @property {import('../../ui.js').Seat} [seat] - The card's player, whose colour its tokens take
	 * @property {string | null} [selected=null] - The spot the player has picked among `live.choices`, drawn in gold
	 * @property {Function} [onCivilizationCardPick] - Callback fired with the spot id when a spot the decision offers is pressed
	 */
	/**
	 * @typedef {CivilizationCardOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} CivilizationCardProps
	 * @example
	 * <CivilizationCard />
	 * <CivilizationCard
	 *   id="traders"
	 *   version="original" />
	 * <CivilizationCard
	 *   id="entertainers"
	 *   live={civCardView(game, 2, 'entertainers', decision)}
	 *   seat={2}
	 *   selected="c2r1"
	 *   onCivilizationCardPick={(event) => pick(event.value)} />
	 */
</script>

<script>
	import CardClarity from './CardClarity.svelte';
	import CardEffectBox from './CardEffectBox.svelte';
	import CardEffectList from './CardEffectList.svelte';
	import CardFrame from './CardFrame.svelte';
	import CardPathGrid from './CardPathGrid.svelte';
	import CardPlacementRows from './CardPlacementRows.svelte';
	import CardPredictionTracks from './CardPredictionTracks.svelte';
	import CardResource from './CardResource.svelte';
	import CardRewardColumns from './CardRewardColumns.svelte';
	import CardScoreLadder from './CardScoreLadder.svelte';
	import CardTechnologyTransfer from './CardTechnologyTransfer.svelte';
	import CardTerrainRewards from './CardTerrainRewards.svelte';
	import CardTokenReserve from './CardTokenReserve.svelte';
	import { playerColor } from '../../ui.js';
	import { CARD_CIVS } from '../../civ-card.js';
	import { civCard } from '../../cards/civ-cards.js';
	import { SAMPLE_VIEWS } from '../../cards/reviewed-civilizations.js';
	import { ComponentEvent } from '../../component-event.js';

	/** @typedef {import('../../cards/civ-cards.js').CardText} CardText */

	/** @type {CivilizationCardProps} */
	let {
		id = 'collectors',
		state = 'empty',
		version = 'current',
		live = null,
		seat,
		selected = null,
		onCivilizationCardPick,
		...attr
	} = $props();
	/** The six card civilizations draw live state in play; the illustration is a sample view drawn the same way. */
	const liveCard = $derived(live !== null && CARD_CIVS.includes(id));
	const recipe = $derived(
		civCard(id, {
			version,
			view: liveCard
				? live
				: state === 'play'
					? (SAMPLE_VIEWS[id] ?? null)
					: null,
		})
	);

	/**
	 * A pattern's pick, reported as the card's own.
	 * @param {ComponentEvent} event - Its value is the spot id
	 */
	const slotPickHandler = (event) => {
		if (typeof onCivilizationCardPick === 'function') {
			onCivilizationCardPick(
				new ComponentEvent(
					event.value,
					event.target,
					event.originalEvent
				)
			);
		}
	};
</script>

<!-- A card's text: words, bold words, resource icons and line breaks, with no space between the pieces. -->
{#snippet text(
	/** @type {import('../../cards/civ-cards.js').CardText} */ parts
)}{#each parts as part, index (index)}{#if typeof part === 'string'}{part}{:else if 'b' in part}<b
				>{part.b}</b
			>{:else if 'strong' in part}<strong
				>{@render text(part.strong)}</strong
			>{:else if 'resource' in part}<CardResource
				symbol={part.resource}
				fine={part.fine} />{:else}<br />{/if}{/each}{/snippet}

<!-- The play look draws the player's marks in --player-1; a seat's card draws them in that seat's colour. -->
<div
	{...attr}
	class="rg-civilization-card {attr.class ?? ''}"
	style:--player-1={seat !== undefined && seat !== 1
		? playerColor(seat)
		: undefined}>
	<CardFrame
		title={recipe.title}
		portrait={recipe.art}
		portraitAlt={recipe.portraitAlt}
		editions={recipe.editions}
		complexity={recipe.complexity}
		state={liveCard ? 'play' : state}
		bodyMinHeight={recipe.bodyMinHeight}
		textLeading={recipe.textLeading}>
		{#snippet effect()}{@render text(recipe.effect)}{/snippet}

		{#each recipe.sections as section, index (index)}
			{#if section.pattern === 'placementRows'}
				<CardPlacementRows
					kind={section.props.kind}
					items={section.props.items}
					{...section.props}
					seat={section.seated ? seat : undefined}
					picked={selected}
					onCardPlacementRowsPick={slotPickHandler} />
			{:else if section.pattern === 'pathGrid'}
				<CardPathGrid
					heads={section.props.heads}
					spaces={section.props.spaces}
					{...section.props}
					{seat}
					picked={selected}
					onCardPathGridPick={slotPickHandler} />
			{:else if section.pattern === 'predictionTracks'}
				<CardPredictionTracks
					categories={section.props.categories}
					{...section.props}
					picked={selected}
					onCardPredictionTracksPick={slotPickHandler} />
			{:else if section.pattern === 'rewardColumns'}
				<CardRewardColumns
					columns={section.props.columns}
					{...section.props}
					seat={section.seated ? seat : undefined}
					picked={selected}
					onCardRewardColumnsPick={slotPickHandler} />
			{:else if section.pattern === 'terrainRewards'}
				<CardTerrainRewards rows={section.props.rows} />
			{:else if section.pattern === 'scoreLadder'}
				<CardScoreLadder
					steps={section.props.steps}
					{...section.props} />
			{:else if section.pattern === 'tokenReserve'}
				<CardTokenReserve {...section.props} />
			{:else if section.pattern === 'technologyTransfer'}
				<CardTechnologyTransfer {...section.props} />
			{:else if section.pattern === 'effects'}
				<CardEffectList above={section.above}>
					{#each section.effects as box, boxIndex (boxIndex)}<CardEffectBox
							title={box.title}
							gain={box.gain}
							label={box.label}
							symbolText={box.symbolText}
							pictogram={box.pictogram}
							>{@render text(box.text)}</CardEffectBox
						>{/each}
				</CardEffectList>
			{:else if section.pattern === 'clarity'}
				{#if section.text.length > 0 && section.setup}
					<CardClarity
						above={section.above}
						minHeight={section.minHeight}
						>{@render text(
							section.text
						)}{#snippet setup()}{@render text(
								/** @type {CardText} */ (section.setup)
							)}{/snippet}</CardClarity>
				{:else if section.setup}
					<CardClarity
						above={section.above}
						minHeight={section.minHeight}
						>{#snippet setup()}{@render text(
								/** @type {CardText} */ (section.setup)
							)}{/snippet}</CardClarity>
				{:else}
					<CardClarity
						above={section.above}
						minHeight={section.minHeight}
						>{@render text(section.text)}</CardClarity>
				{/if}
			{:else if section.pattern === 'guide'}
				<div class="rg-civilization-card--guide">{section.text}</div>
			{/if}
		{/each}
	</CardFrame>
</div>

<style>
	/* The Militants' instruction under their rows. */
	.rg-civilization-card--guide {
		margin: 7px 20px 0;
		color: var(--muted);
		font: var(--weight-bold) var(--font-size-3xs) / 1.2 var(--font-body);
		text-transform: uppercase;
	}
</style>
