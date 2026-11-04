<!-- CivilizationCard: a civilization card drawn from its recipe, in the table's rules version; the card civilizations draw a seat's live state, and six take its choices (#78, #107). -->
<script module>
	/**
	 * @typedef {Object} CivilizationCardOwnProps
	 * @property {string} [id] - Civilization slug; one without a reviewed layout shows its frame, portrait and name only
	 * @property {'empty' | 'play'} [state] - Starting state or labelled illustration; the play illustration is the
	 *   card's sample view (`SAMPLE_VIEWS`)
	 * @property {import('../../engine/data/ids.js').VersionId} [version='current'] - The table's rules version, whose
	 *   setup line the card prints
	 * @property {import('../../civ-card.js').CivCardView | null} [live=null] - A seat's live state, from `civCardView`:
	 *   the card civilizations (`CARD_CIVS`) draw its marks in the play state instead of the illustration, and its
	 *   choices as buttons; the other civilizations ignore it
	 * @property {import('../../ui.js').Seat} [seat] - The card's player, whose colour its tokens take
	 * @property {string | null} [selected=null] - The spot the player has picked among `live.choices`, drawn in gold
	 * @property {{ hexes: import('../../hexmap.js').MapHex[], targets?: string[], scores?: Record<string, number>, selected?: string | null, preview?: import('../../hexmap.js').MapPreview | null } | null} [island=null] - The Islanders' mat, drawn over their portrait (#165): its hexes from `matMapHexes`, and the mat hexes (`mat:<seat>:<n>`) a decision offers, with their scores, the chosen one and the tile previewed
	 * @property {Function} [onCivilizationCardPick] - Callback fired with the spot id when a spot the decision offers is pressed
	 * @property {Function} [onCivilizationCardIsland] - Callback fired with { hex } when a mat hex the decision offers is pressed
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
	import IslandMat from '../board/IslandMat.svelte';
	import { playerColor } from '../../ui.js';
	import { matMapHexes } from '../../island-mat.js';
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
		island = null,
		onCivilizationCardPick,
		onCivilizationCardIsland,
		...attr
	} = $props();
	/** The Islanders' mat: the seat's, or an empty one on a card shown without a game. */
	const shownIsland = $derived(
		island ?? {
			hexes: matMapHexes(
				{
					seats: [
						{
							seat: seat ?? 1,
							civData: {
								islanders: { hexes: Array(6).fill(null) },
							},
						},
					],
				},
				seat ?? 1
			),
		}
	);
	/** The card civilizations draw live state in play; the illustration is a sample view drawn the same way. */
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
	 * A mat hex's pick, reported as the card's own.
	 * @param {ComponentEvent} event - Its value is { hex }
	 */
	const islandSelectHandler = (event) => {
		if (typeof onCivilizationCardIsland === 'function') {
			onCivilizationCardIsland(
				new ComponentEvent(
					event.value,
					event.target,
					event.originalEvent
				)
			);
		}
	};

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
		textLeading={recipe.textLeading}
		stage={recipe.stage !== undefined}>
		{#snippet overlay()}
			{#if recipe.stage === 'island'}
				<IslandMat
					hexes={shownIsland.hexes}
					seat={seat ?? 1}
					targets={shownIsland.targets}
					scores={shownIsland.scores}
					selected={shownIsland.selected}
					preview={shownIsland.preview}
					onIslandMatSelect={islandSelectHandler} />
			{/if}
		{/snippet}
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
				<CardTokenReserve
					{...section.props}
					{seat} />
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
							used={box.used}
							token={box.token}
							{seat}>{@render text(box.text)}</CardEffectBox
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
