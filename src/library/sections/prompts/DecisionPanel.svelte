<!-- Library section: DecisionPanel, the decision prompt over the shared area, with its scrim, content and Confirm, at the tracks' centre with any shelf of cards above it (#79), or docked beside the map. -->
<script>
	import DecisionOption from '../../../lib/components/prompts/DecisionOption.svelte';
	import DecisionPanel from '../../../lib/components/prompts/DecisionPanel.svelte';
	import CardShelf from '../../../lib/components/prompts/CardShelf.svelte';
	import IncomeSteps from '../../../lib/components/prompts/IncomeSteps.svelte';
	import ResourceRows from '../../../lib/components/prompts/ResourceRows.svelte';
	import TilePicker from '../../../lib/components/prompts/TilePicker.svelte';
	import TurnControl from '../../../lib/components/prompts/TurnControl.svelte';
	import { tilePreview, tileWords } from '../../../lib/area/explore.js';
	import { spaceName } from '../../../lib/game-names.js';
	import { offerArt } from '../../../lib/picks.js';
	import { PromptState } from '../../../lib/prompt-state.svelte.js';
	import Example from '../../Example.svelte';
	import Screen from '../../Screen.svelte';
	import Section from '../../Section.svelte';
	import {
		capWarning,
		guildsTrade,
		shuttleBonus,
		tanksPayment,
	} from '../../models.js';

	/** @typedef {import('../../../lib/picks.js').ResourceId} ResourceId */

	// The pick prompts come from dealt games played to their decision, through the game's own prompt state (#131).
	const tanks = new PromptState(tanksPayment());
	const SHUTTLE = shuttleBonus();
	/** Decline sends nothing here: a fresh prompt state stands in for the next decision. */
	let shuttle = $state(new PromptState(SHUTTLE));
	const trade = new PromptState(guildsTrade());
	const capped = new PromptState(capWarning());
	for (const [row, resource] of /** @type {[number, ResourceId][]} */ ([
		[0, 'food'],
		[1, 'food'],
		[2, 'coin'],
	])) {
		capped.pickRow(row, resource);
	}

	const STEPS = [
		{ id: 'civilization', label: 'Civilization' },
		{ id: 'tapestry', label: 'Tapestry card' },
		{ id: 'upgrade', label: 'Upgrade' },
		{ id: 'score', label: 'Score' },
		{ id: 'income', label: 'Income' },
	];

	/**
	 * Tiles for the explore's row, as the game screen builds them.
	 * @param {number[]} ids
	 * @param {(number | null)[]} [vps]
	 */
	const tilesOf = (ids, vps = []) =>
		ids.map((id, index) => ({
			id,
			label: tileWords(id),
			...tilePreview(id, 0),
			vp: vps[index] ?? null,
		}));

	/** The cards on the screen examples' shelves (#79). */
	const TAPESTRY = [
		{ index: 0, id: 'academia', label: 'Academia' },
		{ index: 1, id: 'age-of-discovery', label: 'Age of Discovery' },
		{ index: 2, id: 'capitalism', label: 'Capitalism' },
	];
	const TECH = [
		{ index: 0, id: 'clocks', label: 'Clocks' },
		{ index: 1, id: 'bakery', label: 'Bakery' },
		{ index: 2, id: 'compass', label: 'Compass' },
		{ index: 3, id: 'deck', label: 'Top of the deck', deck: 21 },
	];
	const CIVS = [
		{ index: 0, id: 'historians', label: 'Historians' },
		{ index: 1, id: 'leaders', label: 'Leaders' },
	];

	/** @type {number | null} */
	let played = $state(null);
	/** @type {number | null} */
	let invented = $state(null);
	/** @type {number | null} */
	let kept = $state(null);
	/** @type {string | null} */
	let track = $state(null);
</script>

<Section
	name="DecisionPanel"
	area="prompts"
	description="The decision prompt: a dark scrim over the shared area only, and at the centre of the tracks, not of the screen (owner), the panel with the question, the choices and Confirm; a shelf of cards sits above it, and the two are centred as one stack (#79). The shelf's cards fit the room above the panel (#57). A choice on the map docks the panel at the right instead. The screen examples are the game's screen at 1920×1080, scaled to fit: the board on the left three quarters, the player area on the right.">
	<Example
		label={'shelf tone="income" steps  (an income turn\'s tapestry card to play: the cards above the panel, both at the tracks\' centre; press one; #79)'}
		wide
		width={1100}>
		<Screen board={playBoard} />
	</Example>
	<Example
		label={'shelf  (a tech card to invent: the three face-up cards and the deck, centred on the tracks; press one; #79)'}
		wide
		width={1100}>
		<Screen board={inventBoard} />
	</Example>
	<Example
		label={'shelf  (the civilizations dealt at setup: whole cards, as tall as the room above the panel allows; press one; #57, #79)'}
		wide
		width={1100}>
		<Screen board={civBoard} />
	</Example>
	<Example
		label={'track="exploration"  (an options prompt at the tracks\' centre: the bottom bar takes the track tint; press one; #79)'}
		wide
		width={1100}>
		<Screen board={trackBoard} />
	</Example>
	<Example
		label={'narrow track="military"  (an advance with a choice of payment: the tier\'s own resource fixed, two rows to fill; press them; #75)'}
		wide
		width={1100}>
		<div
			class="rg-library-decision-stage rg-library-decision-stage--contained">
			<DecisionPanel
				narrow
				track="military"
				title="Advance to {spaceName(
					tanks.advance?.track,
					tanks.advance?.to
				)}"
				status={tanks.payControls?.status}
				statusWarn={tanks.payControls?.warn}
				confirmLabel={tanks.payControls?.confirmLabel}
				confirmDisabled={tanks.payControls?.confirmDisabled}
				cancelLabel={tanks.payControls?.cancelLabel}
				onDecisionPanelCancel={() => tanks.clearPayment()}>
				<div class="rg-library-picks">
					<p class="rg-library-explore--lead">
						{tanks.payModel?.lead}
					</p>
					<ResourceRows
						rows={tanks.payRows}
						onResourceRowsPick={(/** @type {any} */ event) =>
							tanks.payRow(
								event.value.row,
								event.value.resource
							)} />
				</div>
			</DecisionPanel>
		</div>
	</Example>
	<Example
		label={'narrow track="exploration"  (a bonus paid in tiles: several chosen, the rest waiting once 3 are; press them; #75)'}
		wide
		width={1100}>
		<div
			class="rg-library-decision-stage rg-library-decision-stage--contained">
			<DecisionPanel
				narrow
				track="exploration"
				title={shuttle.prompt?.title ?? ''}
				status={shuttle.controls?.status}
				statusWarn={shuttle.controls?.warn}
				confirmLabel={shuttle.controls?.confirmLabel}
				confirmDisabled={shuttle.controls?.confirmDisabled}
				cancelLabel={shuttle.controls?.cancelLabel}
				onDecisionPanelCancel={() =>
					(shuttle = new PromptState(SHUTTLE))}>
				<div class="rg-library-picks">
					<p class="rg-library-explore--lead">
						{shuttle.pick?.lead}
					</p>
					<p class="rg-library-explore--label">
						Your tiles · {shuttle.picks?.items.length} of {shuttle
							.pick?.items?.count} chosen
					</p>
					<TilePicker
						class="rg-library-pick-tiles"
						tiles={shuttle.pickTiles}
						selected={shuttle.picks?.items.map(Number)}
						disabled={shuttle.pickBlocked.map(Number)}
						onTilePickerSelect={(/** @type {any} */ event) =>
							shuttle.pickTile(event.value.tile)} />
				</div>
			</DecisionPanel>
		</div>
	</Example>
	<Example
		label={'narrow  (a trade: its offers in two columns, then the rows of the one picked; Back returns; press them; #75)'}
		wide
		width={1100}>
		<div
			class="rg-library-decision-stage rg-library-decision-stage--contained">
			<DecisionPanel
				narrow
				title={trade.prompt?.title ?? ''}
				status={trade.controls?.status}
				statusWarn={trade.controls?.warn}
				confirmLabel={trade.controls?.confirmLabel}
				confirmDisabled={trade.controls?.confirmDisabled}
				cancelLabel={trade.controls?.cancelLabel}
				onDecisionPanelCancel={() => trade.cancel()}>
				{#if trade.pick}
					<div class="rg-library-picks">
						<p class="rg-library-explore--lead">
							{trade.pick.lead}
						</p>
						<ResourceRows
							rows={trade.pickRows}
							onResourceRowsPick={(/** @type {any} */ event) =>
								trade.pickRow(
									event.value.row,
									event.value.resource
								)} />
					</div>
				{:else if trade.offering}
					<div class="rg-library-trades">
						{#each trade.offering as item (item.offer)}
							<DecisionOption
								label={item.label}
								art={offerArt(item)}
								disabled={!item.enabled}
								onDecisionOptionClick={() =>
									trade.chooseOffer(item.offer)} />
						{/each}
					</div>
				{/if}
			</DecisionPanel>
		</div>
	</Example>
	<Example
		label={'track="exploration"  (the bottom bar takes the track tint; the stage stands in for the shared area)'}
		wide
		width={1100}>
		<div class="rg-library-decision-stage rg-library-decision-stage--short">
			<DecisionPanel
				title="Choose a track"
				status="Exploration"
				track="exploration">
				<div class="rg-library-decision-options">
					<DecisionOption
						label="Exploration"
						art={[{ kind: 'track', id: 'exploration' }]}
						pressed />
					<DecisionOption
						label="Science"
						art={[{ kind: 'track', id: 'science' }]} />
				</div>
			</DecisionPanel>
		</div>
	</Example>
	<Example
		label={'tone="income" steps={IncomeSteps}'}
		wide
		width={1100}>
		<div class="rg-library-decision-stage rg-library-decision-stage--short">
			<DecisionPanel
				title="Choose a tapestry card"
				tone="income"
				status="Choose a card to continue.">
				{#snippet steps()}
					<IncomeSteps
						steps={STEPS}
						current="tapestry" />
				{/snippet}
				<div class="rg-library-decision-options">
					<DecisionOption
						label="Take 1 coin"
						art={[{ kind: 'resource', id: 'coin', count: 1 }]} />
					<DecisionOption
						label="Take 2 food"
						art={[{ kind: 'resource', id: 'food', count: 2 }]}
						pressed />
				</div>
			</DecisionPanel>
		</div>
	</Example>
	<Example
		label={'docked  (a choice on the map: no scrim, the panel at the right, what is chosen on its own line)'}
		wide
		width={1100}>
		<div class="rg-library-decision-stage">
			<DecisionPanel
				title="Choose a territory to conquer"
				status="Hex 1,0, held by Ben"
				confirmLabel="Conquer"
				cancelLabel="Choose another territory"
				docked>
				<div class="rg-library-decision-options">
					<DecisionOption
						label="Hex 1,0, held by Ben"
						pressed />
				</div>
			</DecisionPanel>
		</div>
	</Example>
	<Example
		label={"docked  (an explore: the player's tiles, the chosen hex and the turn)"}
		wide
		width={1100}>
		<div class="rg-library-decision-stage rg-library-decision-stage--tall">
			<DecisionPanel
				title="Choose where to explore"
				confirmLabel="Explore"
				docked>
				{@render exploreTiles(tilesOf([6, 19, 33], [3, 4, 2]), 19)}
				{#snippet pinned()}
					{@render exploreChosen('Hex 1,0, turned 3 times', 3)}
				{/snippet}
			</DecisionPanel>
		</div>
	</Example>
	<Example
		label={'docked  (an explore with 11 tiles in a box 700px tall: the tiles scroll; what is chosen, the turn and Explore stay in sight)'}
		wide
		width={1100}>
		<div class="rg-library-decision-stage rg-library-decision-stage--700">
			<DecisionPanel
				title="Choose where to explore"
				confirmLabel="Explore"
				confirmDisabled
				docked>
				{@render exploreTiles(
					tilesOf([1, 5, 9, 13, 17, 21, 25, 29, 33, 37, 41]),
					null
				)}
				{#snippet pinned()}
					{@render exploreChosen(
						'Pick a tile, or a lit hex on the map.',
						null
					)}
				{/snippet}
			</DecisionPanel>
		</div>
	</Example>
	<Example
		label={"narrow statusWarn  (a pick prompt: its centre at the tracks', here the stage's; the cap warning; #75)"}
		wide
		width={1100}>
		<div
			class="rg-library-decision-stage rg-library-decision-stage--contained">
			<DecisionPanel
				narrow
				title={capped.prompt?.title ?? ''}
				status={capped.controls?.status}
				statusWarn={capped.controls?.warn}
				confirmLabel={capped.controls?.confirmLabel}
				confirmDisabled={capped.controls?.confirmDisabled}>
				<p class="rg-library-explore--lead">
					{capped.pick?.lead}
				</p>
				<ResourceRows
					rows={capped.pickRows}
					onResourceRowsPick={(/** @type {any} */ event) =>
						capped.pickRow(
							event.value.row,
							event.value.resource
						)} />
			</DecisionPanel>
		</div>
	</Example>
</Section>

{#snippet playBoard()}
	<DecisionPanel
		title="Choose a tapestry card to play"
		tone="income"
		status={played === null
			? 'Choose a card above, then confirm it here.'
			: TAPESTRY[played].label}
		confirmLabel="Play card"
		confirmDisabled={played === null}>
		{#snippet steps()}
			<IncomeSteps
				steps={STEPS}
				current="tapestry" />
		{/snippet}
		{#snippet shelf(/** @type {number | undefined} */ room)}
			<CardShelf
				kind="tapestry"
				cards={TAPESTRY}
				selected={played}
				{room}
				onCardShelfSelect={(/** @type {any} */ event) =>
					(played = event.value)} />
		{/snippet}
	</DecisionPanel>
{/snippet}

{#snippet inventBoard()}
	<DecisionPanel
		title="Choose a tech card to invent"
		status={invented === null
			? 'Choose a card above, then confirm it here.'
			: TECH[invented].label}
		confirmLabel="Invent"
		confirmDisabled={invented === null}>
		{#snippet shelf(/** @type {number | undefined} */ room)}
			<CardShelf
				kind="tech"
				cards={TECH}
				selected={invented}
				{room}
				onCardShelfSelect={(/** @type {any} */ event) =>
					(invented = event.value)} />
		{/snippet}
	</DecisionPanel>
{/snippet}

{#snippet civBoard()}
	<DecisionPanel
		title="Choose your civilization"
		status={kept === null
			? 'Choose a card above, then confirm it here.'
			: CIVS[kept].label}
		confirmLabel="Keep civilization"
		confirmDisabled={kept === null}>
		{#snippet shelf(/** @type {number | undefined} */ room)}
			<CardShelf
				kind="civ"
				cards={CIVS}
				selected={kept}
				{room}
				onCardShelfSelect={(/** @type {any} */ event) =>
					(kept = event.value)} />
		{/snippet}
	</DecisionPanel>
{/snippet}

{#snippet trackBoard()}
	<DecisionPanel
		title="Choose a track for Dark Ages"
		status={track ?? 'Choose one.'}
		track="exploration"
		confirmDisabled={track === null}>
		<div class="rg-library-decision-options">
			{#each ['Exploration', 'Science', 'Technology', 'Military'] as name (name)}
				<DecisionOption
					label={name}
					art={[
						{
							kind: 'track',
							id: /** @type {any} */ (name.toLowerCase()),
						},
					]}
					pressed={track === name}
					onDecisionOptionClick={() => (track = name)} />
			{/each}
		</div>
	</DecisionPanel>
{/snippet}

<!-- The explore as the game screen draws it: the lead and the tile row scroll in the content, while what is chosen
     and the turn control are pinned above the actions, with no status line. -->
{#snippet exploreTiles(
	/** @type {ReturnType<typeof tilesOf>} */ tiles,
	/** @type {number | null} */ selected
)}
	<div class="rg-library-explore">
		<p class="rg-library-explore--lead">
			Pick one of your tiles and a lit hex, then turn the tile until you
			like it.
		</p>
		<p class="rg-library-explore--label">Your tiles · {tiles.length}</p>
		<TilePicker
			{tiles}
			{selected} />
	</div>
{/snippet}

{#snippet exploreChosen(
	/** @type {string} */ chosen,
	/** @type {number | null} */ vp
)}
	<div class="rg-library-explore">
		<p
			class="rg-library-explore--chosen"
			role="status">
			{chosen}{#if vp !== null}<span class="rg-library-explore--spoken"
					>, {vp} VP</span
				>{/if}
		</p>
		<TurnControl {vp} />
	</div>
{/snippet}

<style>
	/* A stage stands in for the shared area, which a panel is centred on. */
	.rg-library-decision-stage {
		position: relative;
		height: 420px;
		background: var(--texture) var(--surface);
	}

	.rg-library-picks {
		display: grid;
		gap: var(--space-6);
	}

	.rg-library-picks :global(.rg-library-pick-tiles) {
		max-width: calc(3 * 88px + 2 * var(--space-3));
	}

	.rg-library-trades {
		display: grid;
		grid-template-rows: repeat(3, auto);
		grid-template-columns: repeat(2, 1fr);
		grid-auto-flow: column;
		gap: var(--space-4);
	}

	.rg-library-decision-stage--contained {
		height: 520px;
	}

	.rg-library-decision-stage--short {
		height: 340px;
	}

	.rg-library-decision-stage--tall {
		height: 620px;
	}

	.rg-library-decision-stage--700 {
		height: 700px;
	}

	/* The explore's content, styled as the game screen styles it (src/screens/game/DecisionPrompt.svelte). */
	.rg-library-explore {
		display: grid;
		gap: var(--space-6);
	}

	.rg-library-explore--lead,
	.rg-library-explore--label,
	.rg-library-explore--chosen {
		margin: 0;
	}

	.rg-library-explore--lead {
		color: var(--muted);
		font-size: var(--font-size-md);
	}

	.rg-library-explore--label {
		color: var(--muted);
		font-size: var(--font-size-xs);
		font-weight: var(--weight-bold);
		letter-spacing: var(--letter-spacing-caps);
		text-transform: uppercase;
	}

	.rg-library-explore--chosen {
		color: var(--text);
		font-size: var(--font-size-md);
	}

	.rg-library-explore--spoken {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
	}

	.rg-library-decision-options {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-5);
	}
</style>
