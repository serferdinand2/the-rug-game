<!-- CivilizationCard: an extracted owner-reviewed card pattern. -->
<script module>
	/**
	 * @typedef {Object} CivilizationCardOwnProps
	 * @property {string} [id] - Civilization slug; one without a reviewed layout shows its frame, portrait and name only
	 * @property {'empty' | 'play'} [state] - Starting state or labelled illustration
	 */
	/**
	 * @typedef {CivilizationCardOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} CivilizationCardProps
	 * @example
	 * <CivilizationCard />
	 */
</script>

<script>
	import CardClarity from './CardClarity.svelte';
	import CardEffectBox from './CardEffectBox.svelte';
	import CardFrame from './CardFrame.svelte';
	import CardPathGrid from './CardPathGrid.svelte';
	import CardPlacementRows from './CardPlacementRows.svelte';
	import CardPredictionTracks from './CardPredictionTracks.svelte';
	import CardResource from './CardResource.svelte';
	import CardRewardColumns from './CardRewardColumns.svelte';
	import CardScoreLadder from './CardScoreLadder.svelte';
	import CardSlot from './CardSlot.svelte';
	import CardTechnologyTransfer from './CardTechnologyTransfer.svelte';
	import CardTerrainRewards from './CardTerrainRewards.svelte';
	import CardTokenReserve from './CardTokenReserve.svelte';
	import PlayerToken from './PlayerToken.svelte';
	import { civilizationName } from '../../describe.js';
	import { ASSETS, EXPANSIONS } from '../../art/catalog.js';
	import '../../engine/game.js';
	import { entertainersMoves } from '../../engine/civs/entertainers.js';

	/** The Entertainers' links, drawn from the engine's own moves (R28), so the card never shows a link it refuses. */
	const ENTERTAINER_ROW_Y = [37.5, 119.5, 201.5, 283.5];
	const ENTERTAINER_GAPS = [
		[75, 108.67],
		[183.67, 217.33],
		[292.33, 326],
	];
	const ENTERTAINER_LINKS = ENTERTAINER_GAPS.map(([from, to], index) =>
		[1, 2, 3, 4]
			.flatMap((row) =>
				entertainersMoves(`c${index + 1}r${row}`).map(
					(id) =>
						`M${from} ${ENTERTAINER_ROW_Y[row - 1]}L${to} ${ENTERTAINER_ROW_Y[Number(id.split('r')[1]) - 1]}`
				)
			)
			.join(' ')
	);
	/** @type {CivilizationCardProps} */
	let { id = 'collectors', state = 'empty', ...attr } = $props();
	const edition = $derived(
		EXPANSIONS.find(
			(entry) =>
				entry.code ===
				ASSETS.find((asset) => asset.id === `civ/${id}`)?.expansion
		)?.name ?? 'Base game'
	);
</script>

<div
	{...attr}
	class="rg-civilization-card {attr.class ?? ''}">
	{#if id === 'collectors'}
		<CardFrame
			title="Collectors"
			portrait="/art/civ/collectors.svg"
			portraitAlt="A collector studies a gem through a magnifying glass"
			badges={['Arts & Architecture']}
			complexity={2}
			{state}
			class="">
			{#snippet effect()}
				During an <b>advance</b> turn, when you gain one of these, you
				may place it on its space if the space is empty. Then gain
				<CardResource
					symbol="any"
					class="" />. One item per turn.
			{/snippet}

			<CardPlacementRows
				kind="collection"
				as="ol"
				><li class="rg-card-slot rg-card-is-collected">
					<CardSlot
						size={62}
						class="rg-card-slot--item"
						label="Outpost*"
						tabindex={0}
						><img
							class="rg-card-piece rg-card-piece--outpost rg-card-piece--printed"
							src="/art/piece/outpost.svg"
							alt="" /><img
							class="rg-card-piece rg-card-piece--outpost rg-card-piece--played"
							src="/art/piece/outpost-blue.svg"
							alt="" /></CardSlot
					><span class="rg-card-slot--name">Outpost*</span><span
						class="rg-card-slot--gain"
						>+<CardResource symbol="any" /></span>
				</li>
				<li class="rg-card-slot rg-card-is-collected">
					<CardSlot
						size={62}
						class="rg-card-slot--item"
						label="House"
						tabindex={0}
						><img
							class="rg-card-piece"
							src="/art/building/house.svg"
							alt="" /></CardSlot
					><span class="rg-card-slot--name">House</span><span
						class="rg-card-slot--gain"
						>+<CardResource symbol="any" /></span>
				</li>
				<li class="rg-card-slot">
					<CardSlot
						size={62}
						class="rg-card-slot--item"
						label="Landmark"
						tabindex={0}
						><img
							class="rg-card-piece"
							src="/art/landmark/clock-tower.svg"
							alt="" /></CardSlot
					><span class="rg-card-slot--name">Landmark</span><span
						class="rg-card-slot--gain"
						>+<CardResource symbol="any" /></span>
				</li>
				<li class="rg-card-slot">
					<CardSlot
						size={62}
						class="rg-card-slot--item"
						label="Tapestry"
						tabindex={0}
						><span class="rg-card-mini-card rg-card-face-down"
							><img
								class="rg-card-piece"
								src="/art/tapestry/lost-artifacts.svg"
								alt="" /></span
						></CardSlot
					><span class="rg-card-slot--name">Tapestry</span><span
						class="rg-card-slot--gain"
						>+<CardResource symbol="any" /></span>
				</li>
				<li class="rg-card-slot">
					<CardSlot
						size={62}
						class="rg-card-slot--item"
						label="Territory"
						tabindex={0}
						><span class="rg-card-mini-card rg-card-face-down"
							><img
								class="rg-card-piece"
								src="/art/capital-terrain/grassland-open-01.svg"
								alt="" /></span
						></CardSlot
					><span class="rg-card-slot--name">Territory</span><span
						class="rg-card-slot--gain"
						>+<CardResource symbol="any" /></span>
				</li>
				<li class="rg-card-slot rg-card-is-collected">
					<CardSlot
						size={62}
						class="rg-card-slot--item"
						label="Tech"
						tabindex={0}
						><span class="rg-card-mini-card rg-card-face-down"
							><img
								class="rg-card-piece"
								src="/art/tech/eyeglasses.svg"
								alt="" /></span
						></CardSlot
					><span class="rg-card-slot--name">Tech</span><span
						class="rg-card-slot--gain"
						>+<CardResource symbol="any" /></span>
				</li></CardPlacementRows>
			<CardClarity
				><p class="rg-card-fine">
					<b>*</b> Only from a conquer benefit, instead of conquering;
					don&#x27;t roll the dice.<br />Items here count for scoring
					but can&#x27;t be used. Cards and tiles lie face down; you
					may look at them.<br /><span class="rg-card-setup"
						>Setup, current rules: gain
						<CardResource
							symbol="any"
							class="rg-card-resource-icon--fine" />.</span>
				</p></CardClarity>
			<CardScoreLadder
				values={[1, 3, 6, 10, 15, 21]}
				current={state === 'play' ? 3 : 0} />
		</CardFrame>
	{:else if id === 'architects'}
		<CardFrame
			title="Architects"
			portrait="/art/civ/architects.svg"
			portraitAlt="Architects civilization portrait"
			badges={['Base game']}
			complexity={3}
			{state}
			class="rg-card-frame--architects">
			{#snippet effect()}Build with matching income buildings to gain more
				from completed districts and score more from completed rows and
				columns.{/snippet}

			<div class="rg-card-ability-list">
				<CardEffectBox>
					{#snippet symbol()}<span class="rg-card-district-icon"
							><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i
							></i
							><i></i></span
						>{/snippet}<b>Complete a district</b><span
						>If all its income buildings match, gain <strong
							>+ <CardResource
								symbol="any"
								class="rg-card-resource-icon--fine" /></strong> in
						addition to its usual reward.</span
					></CardEffectBox>
				<CardEffectBox>
					{#snippet symbol()}<span class="rg-card-line-icon"
							><i></i><i></i><i></i></span
						>{/snippet}<b>Score the capital</b><span
						>Each complete row or column whose income buildings
						match is worth <strong>+1 VP</strong> beyond its usual score.</span
					></CardEffectBox>
			</div>
			<CardClarity
				><p class="rg-card-fine">
					Each qualifying district, row or column needs at least one
					income building. If gained mid-game, you may swap the places
					of 2 income buildings in your capital, up to 3 times.<br /><span
						class="rg-card-setup"
						>Setup, current rules: place one impassable plot per
						opponent, each in a different district.</span>
				</p></CardClarity>
		</CardFrame>
	{:else if id === 'leaders'}
		<CardFrame
			title="Leaders"
			portrait="/art/civ/leaders.svg"
			portraitAlt="Leaders civilization portrait"
			badges={['Base game']}
			complexity={1}
			{state}
			class="rg-card-frame--leaders">
			{#snippet effect()}At the start of income turns 2–5, you may cover
				one unused track space. Advance on that track for free and gain
				its benefit.{/snippet}

			<CardPlacementRows
				kind="leaders"
				as="ol">
				<li class="rg-card-leader-track rg-card-is-used">
					<CardSlot
						size={75}
						label="exploration placement"
						><img
							src="/art/track/exploration.svg"
							alt="" /></CardSlot
					><span>Exploration</span>
				</li>
				<li class="rg-card-leader-track">
					<CardSlot
						size={75}
						label="technology placement"
						><img
							src="/art/track/technology.svg"
							alt="" /></CardSlot
					><span>Technology</span>
				</li>
				<li class="rg-card-leader-track rg-card-is-used">
					<CardSlot
						size={75}
						label="science placement"
						><img
							src="/art/track/science.svg"
							alt="" /></CardSlot
					><span>Science</span>
				</li>
				<li class="rg-card-leader-track">
					<CardSlot
						size={75}
						label="military placement"
						><img
							src="/art/track/military.svg"
							alt="" /></CardSlot
					><span>Military</span>
				</li>
			</CardPlacementRows>
			<CardClarity
				><p class="rg-card-fine">
					Each track space can be used once. This advance gains the
					benefit, but cannot gain its bonus.
				</p></CardClarity>
		</CardFrame>
	{:else if id === 'treasure-hunters'}
		<CardFrame
			title="Treasure Hunters"
			portrait="/art/civ/treasure-hunters.svg"
			portraitAlt="Treasure Hunters civilization portrait"
			badges={['Plans & Ploys']}
			complexity={3}
			{state}
			class="rg-card-frame--treasure">
			{#snippet effect()}At the start of income turns 2–5, you may move
				one token from this mat to an empty adjacent territory matching
				an unused terrain below. Control it and gain that terrain&#x27;s
				reward.{/snippet}

			<CardTerrainRewards>
				<li class="rg-card-treasure-row rg-card-is-used">
					<img
						src="/art/terrain/desert.svg"
						alt="" /><span class="rg-card-treasure-row--name"
						>Desert</span
					><span class="rg-card-treasure-row--effect"
						>+ <CardResource
							symbol="coin"
							class="" />; roll the black conquer die twice and
						take one result.</span>
				</li>
				<li class="rg-card-treasure-row">
					<img
						src="/art/terrain/grassland.svg"
						alt="" /><span class="rg-card-treasure-row--name"
						>Grassland</span
					><span class="rg-card-treasure-row--effect"
						>+ <CardResource
							symbol="culture"
							class="" />; roll the science die twice, choose one
						result, and advance with benefit.</span>
				</li>
				<li class="rg-card-treasure-row">
					<img
						src="/art/terrain/mountain.svg"
						alt="" /><span class="rg-card-treasure-row--name"
						>Mountain</span
					><span class="rg-card-treasure-row--effect"
						>+ <CardResource
							symbol="worker"
							class="" />; roll both conquer dice and gain both
						results.</span>
				</li>
				<li class="rg-card-treasure-row">
					<img
						src="/art/terrain/forest.svg"
						alt="" /><span class="rg-card-treasure-row--name"
						>Forest</span
					><span class="rg-card-treasure-row--effect"
						>+ <CardResource
							symbol="food"
							class="" />; roll the red conquer die twice and gain
						both results.</span>
				</li>
			</CardTerrainRewards>
			<CardClarity
				><p class="rg-card-fine">
					Setup: put 4 player tokens here and gain 2 territory tiles.
					Each terrain can be used once. Claiming a territory this way
					is not a conquer action. For Grassland, you may pay for the
					advancement bonus.
				</p></CardClarity>
		</CardFrame>
	{:else if id === 'craftsmen'}
		<CardFrame
			title="Craftsmen"
			portrait="/art/civ/craftsmen.svg"
			portraitAlt="Craftsmen civilization portrait"
			badges={['Base game']}
			complexity={1}
			{state}
			class="rg-card-frame--craftsmen">
			{#snippet effect()}When you gain an income building, you may place
				it here instead of in your capital. Place it on the <b
					>lowest open space</b> in any column and immediately gain that
				space&#x27;s reward.{/snippet}

			<CardRewardColumns kind="beside">
				<section
					class="rg-card-craftsmen-column"
					aria-labelledby="craftsmen-column-a">
					<h4
						class="rg-card-craftsmen-column--title"
						id="craftsmen-column-a">
						Column A <small>fill from bottom</small>
					</h4>
					<ol class="rg-card-craftsmen-column--rows">
						<li class="rg-card-craftsmen-row">
							<CardSlot
								size={62}
								class="rg-card-craftsmen-slot"></CardSlot
							><span
								class="rg-card-craftsmen-benefit rg-card-craftsmen-benefit--vp"
								>5 VP</span>
						</li>
						<li class="rg-card-craftsmen-row rg-card-is-filled">
							<CardSlot
								size={62}
								class="rg-card-craftsmen-slot"
								><img
									src="/art/building/farm.svg"
									alt="" /></CardSlot
							><span class="rg-card-craftsmen-benefit"
								>Gain 1 territory tile</span>
						</li>
						<li class="rg-card-craftsmen-row rg-card-is-filled">
							<CardSlot
								size={62}
								class="rg-card-craftsmen-slot"
								><img
									src="/art/building/house.svg"
									alt="" /></CardSlot
							><span
								class="rg-card-craftsmen-benefit rg-card-craftsmen-benefit--resource"
								>+ <CardResource
									symbol="worker"
									class="" /></span>
						</li>
					</ol>
				</section>
				<section
					class="rg-card-craftsmen-column"
					aria-labelledby="craftsmen-column-b">
					<h4
						class="rg-card-craftsmen-column--title"
						id="craftsmen-column-b">
						Column B <small>fill from bottom</small>
					</h4>
					<ol class="rg-card-craftsmen-column--rows">
						<li class="rg-card-craftsmen-row">
							<CardSlot
								size={62}
								class="rg-card-craftsmen-slot"></CardSlot
							><span
								class="rg-card-craftsmen-benefit rg-card-craftsmen-benefit--vp"
								>10 VP</span>
						</li>
						<li class="rg-card-craftsmen-row">
							<CardSlot
								size={62}
								class="rg-card-craftsmen-slot"></CardSlot
							><span class="rg-card-craftsmen-benefit"
								>Upgrade 1 tech card</span>
						</li>
						<li class="rg-card-craftsmen-row">
							<CardSlot
								size={62}
								class="rg-card-craftsmen-slot"></CardSlot
							><span class="rg-card-craftsmen-benefit"
								>Invent 1 tech card</span>
						</li>
						<li class="rg-card-craftsmen-row">
							<CardSlot
								size={62}
								class="rg-card-craftsmen-slot"></CardSlot
							><span
								class="rg-card-craftsmen-benefit rg-card-craftsmen-benefit--resource"
								>+ <CardResource
									symbol="coin"
									class="" /></span>
						</li>
					</ol>
				</section>
				<section
					class="rg-card-craftsmen-column"
					aria-labelledby="craftsmen-column-c">
					<h4
						class="rg-card-craftsmen-column--title"
						id="craftsmen-column-c">
						Column C <small>fill from bottom</small>
					</h4>
					<ol class="rg-card-craftsmen-column--rows">
						<li class="rg-card-craftsmen-row">
							<CardSlot
								size={62}
								class="rg-card-craftsmen-slot"></CardSlot
							><span
								class="rg-card-craftsmen-benefit rg-card-craftsmen-benefit--vp"
								>15 VP</span>
						</li>
						<li class="rg-card-craftsmen-row">
							<CardSlot
								size={62}
								class="rg-card-craftsmen-slot"></CardSlot
							><span class="rg-card-craftsmen-benefit"
								>Research <span
									class="rg-card-craftsmen-benefit--nowrap"
									>with benefit;</span> bonus is available</span>
						</li>
						<li class="rg-card-craftsmen-row">
							<CardSlot
								size={62}
								class="rg-card-craftsmen-slot"></CardSlot
							><span
								class="rg-card-craftsmen-benefit rg-card-craftsmen-benefit--resource"
								>+ <CardResource
									symbol="culture"
									class="" /></span>
						</li>
						<li class="rg-card-craftsmen-row">
							<CardSlot
								size={62}
								class="rg-card-craftsmen-slot"></CardSlot
							><span class="rg-card-craftsmen-benefit"
								>Gain 1 tapestry card</span>
						</li>
						<li class="rg-card-craftsmen-row">
							<CardSlot
								size={62}
								class="rg-card-craftsmen-slot"></CardSlot
							><span
								class="rg-card-craftsmen-benefit rg-card-craftsmen-benefit--resource"
								>+ <CardResource
									symbol="food"
									class="" /></span>
						</li>
					</ol>
				</section>
			</CardRewardColumns>
			<CardClarity
				><p class="rg-card-fine">
					Buildings here count as part of your capital for
					building-related benefits, but these columns do not score as
					completed capital rows or columns. You may start another
					column before finishing one.
				</p></CardClarity>
		</CardFrame>
	{:else if id === 'entertainers'}
		<CardFrame
			title="Entertainers"
			portrait="/art/civ/entertainers.svg"
			portraitAlt="Entertainers civilization portrait"
			badges={['Base game']}
			complexity={2}
			{state}
			class="rg-card-frame--entertainers">
			{#snippet effect()}At the start of income turns 2–5, move your token
				one column right along a path and gain the space&#x27;s reward.{/snippet}

			<CardPathGrid>
				<div class="rg-card-entertainer-path--head">
					<span>1st move</span><span>2nd</span><span>3rd</span><span
						>4th</span>
				</div>
				<div class="rg-card-entertainer-path--grid">
					<svg
						class="rg-card-entertainer-links"
						viewBox="0 0 401 321"
						preserveAspectRatio="none"
						aria-hidden="true">
						{#each ENTERTAINER_LINKS as d, index (index)}
							<path {d}></path>
						{/each}
					</svg>
					<CardSlot
						size={75}
						class="rg-card-entertainer-space"
						>+ <CardResource
							symbol="worker"
							class="" /></CardSlot>
					<CardSlot
						size={75}
						class="rg-card-entertainer-space"
						><img
							src="/art/building/farm.svg"
							alt="" /><span>Farm</span></CardSlot>
					<CardSlot
						size={75}
						class="rg-card-entertainer-space">Conquer</CardSlot>
					<CardSlot
						size={75}
						class="rg-card-entertainer-space"
						>Advance Technology</CardSlot>
					<CardSlot
						size={75}
						class="rg-card-entertainer-space"
						>+ <CardResource
							symbol="culture"
							class="" /></CardSlot>
					<CardSlot
						size={75}
						class="rg-card-entertainer-space"
						><img
							src="/art/building/market.svg"
							alt="" /><span>Market</span></CardSlot>
					<CardSlot
						size={75}
						class="rg-card-entertainer-space rg-card-is-current"
						>Research without benefit or bonus</CardSlot>
					<CardSlot
						size={75}
						class="rg-card-entertainer-space"
						>Advance Exploration</CardSlot>
					<CardSlot
						size={75}
						class="rg-card-entertainer-space"
						>+ <CardResource
							symbol="food"
							class="" /></CardSlot>
					<CardSlot
						size={75}
						class="rg-card-entertainer-space"
						><img
							src="/art/building/house.svg"
							alt="" /><span>House</span></CardSlot>
					<CardSlot
						size={75}
						class="rg-card-entertainer-space">Invent</CardSlot>
					<CardSlot
						size={75}
						class="rg-card-entertainer-space"
						>Advance Military</CardSlot>
					<CardSlot
						size={75}
						class="rg-card-entertainer-space"
						>+ <CardResource
							symbol="coin"
							class="" /></CardSlot>
					<CardSlot
						size={75}
						class="rg-card-entertainer-space"
						><img
							src="/art/building/armory.svg"
							alt="" /><span>Armory</span></CardSlot>
					<CardSlot
						size={75}
						class="rg-card-entertainer-space">Explore</CardSlot>
					<CardSlot
						size={75}
						class="rg-card-entertainer-space"
						>Advance Science</CardSlot>
				</div>
				<div class="rg-card-entertainer-path--start">
					<PlayerToken
						decorative
						class="rg-card-entertainer-path--token" /> Start at the left;
					move one column each income turn.
				</div>
			</CardPathGrid>
			<CardClarity
				><p class="rg-card-fine">
					If gained mid-game, place the token on any reward space and
					gain it immediately.<br /><span class="rg-card-setup"
						>Setup, current rules: gain
						<CardResource
							symbol="any"
							class="rg-card-resource-icon--fine" /> and 10 VP.</span>
				</p></CardClarity>
		</CardFrame>
	{:else if id === 'militants'}
		<CardFrame
			title="Militants"
			portrait="/art/civ/militants.svg"
			portraitAlt="Militants civilization portrait"
			badges={['Base game']}
			complexity={1}
			{state}
			class="rg-card-frame--militants">
			{#snippet effect()}When you conquer, take the leftmost outpost from
				either row. At the start of every income turn, gain all
				uncovered rewards.{/snippet}

			<CardPlacementRows kind="covered">
				<div class="rg-card-militant-space rg-card-is-exposed">
					<CardSlot
						size={62}
						class="rg-card-militant-space--slot"
						><span class="rg-card-militant-space--gain"
							>+ <CardResource
								symbol="coin"
								class="" /></span
						><img
							src="/art/piece/outpost.svg"
							alt="" /></CardSlot>
				</div>
				<div class="rg-card-militant-space">
					<CardSlot
						size={62}
						class="rg-card-militant-space--slot"
						><span
							class="rg-card-militant-space--gain rg-card-militant-space--gain--vp"
							>2 VP</span
						><img
							src="/art/piece/outpost.svg"
							alt="" /></CardSlot>
				</div>
				<div class="rg-card-militant-space">
					<CardSlot
						size={62}
						class="rg-card-militant-space--slot"
						><span class="rg-card-militant-space--gain"
							>+ <CardResource
								symbol="food"
								class="" /></span
						><img
							src="/art/piece/outpost.svg"
							alt="" /></CardSlot>
				</div>
				<div class="rg-card-militant-space">
					<CardSlot
						size={62}
						class="rg-card-militant-space--slot"
						><span
							class="rg-card-militant-space--gain rg-card-militant-space--gain--vp"
							>4 VP</span
						><img
							src="/art/piece/outpost.svg"
							alt="" /></CardSlot>
				</div>
				<div
					class="rg-card-militant-divider"
					aria-hidden="true">
				</div>
				<div class="rg-card-militant-space rg-card-is-exposed">
					<CardSlot
						size={62}
						class="rg-card-militant-space--slot"
						><span
							class="rg-card-militant-space--gain rg-card-militant-space--gain--vp"
							>1 VP</span
						><img
							src="/art/piece/outpost.svg"
							alt="" /></CardSlot>
				</div>
				<div class="rg-card-militant-space rg-card-is-exposed">
					<CardSlot
						size={62}
						class="rg-card-militant-space--slot"
						><span class="rg-card-militant-space--gain"
							>+ <CardResource
								symbol="worker"
								class="" /></span
						><img
							src="/art/piece/outpost.svg"
							alt="" /></CardSlot>
				</div>
				<div class="rg-card-militant-space">
					<CardSlot
						size={62}
						class="rg-card-militant-space--slot"
						><span
							class="rg-card-militant-space--gain rg-card-militant-space--gain--vp"
							>3 VP</span
						><img
							src="/art/piece/outpost.svg"
							alt="" /></CardSlot>
				</div>
				<div class="rg-card-militant-space">
					<CardSlot
						size={62}
						class="rg-card-militant-space--slot"
						><span class="rg-card-militant-space--gain"
							>+ <CardResource
								symbol="culture"
								class="" /></span
						><img
							src="/art/piece/outpost.svg"
							alt="" /></CardSlot>
				</div>
			</CardPlacementRows>
			<div class="rg-card-militant-guide">
				Take from the left of either row →
			</div>
			<CardClarity
				><p class="rg-card-fine">
					Start with 8 outposts here and 2 on your starting territory.
					If you gain this civilization mid-game, refill spaces from
					right to left, choosing either row for each remaining
					outpost.
				</p></CardClarity>
		</CardFrame>
	{:else if id === 'mystics'}
		<CardFrame
			title="Mystics"
			portrait="/art/civ/mystics.svg"
			portraitAlt="Mystics civilization portrait"
			badges={['Base game']}
			complexity={3}
			{state}
			class="rg-card-frame--mystics">
			{#snippet effect()}When you gain this civilization, predict one
				number in each category by placing a token on it.{/snippet}

			<CardPredictionTracks>
				<div class="rg-card-mystic-prediction">
					<div class="rg-card-mystic-prediction--label">
						Tech cards <small>you have</small>
					</div>
					<div class="rg-card-mystic-prediction--numbers">
						<CardSlot
							size={39}
							class="rg-card-mystic-number">1</CardSlot
						><CardSlot
							size={39}
							class="rg-card-mystic-number">2</CardSlot
						><CardSlot
							size={39}
							class="rg-card-mystic-number">3</CardSlot
						><CardSlot
							size={39}
							class="rg-card-mystic-number rg-card-is-selected"
							>4</CardSlot
						><CardSlot
							size={39}
							class="rg-card-mystic-number">5</CardSlot
						><CardSlot
							size={39}
							class="rg-card-mystic-number">6</CardSlot
						><CardSlot
							size={39}
							class="rg-card-mystic-number">7</CardSlot
						><CardSlot
							size={39}
							class="rg-card-mystic-number">8</CardSlot
						><CardSlot
							size={39}
							class="rg-card-mystic-number">9</CardSlot>
					</div>
				</div>
				<div class="rg-card-mystic-prediction">
					<div class="rg-card-mystic-prediction--label">
						Complete districts
					</div>
					<div class="rg-card-mystic-prediction--numbers">
						<CardSlot
							size={39}
							class="rg-card-mystic-number">1</CardSlot
						><CardSlot
							size={39}
							class="rg-card-mystic-number">2</CardSlot
						><CardSlot
							size={39}
							class="rg-card-mystic-number rg-card-is-selected"
							>3</CardSlot
						><CardSlot
							size={39}
							class="rg-card-mystic-number">4</CardSlot
						><CardSlot
							size={39}
							class="rg-card-mystic-number">5</CardSlot
						><CardSlot
							size={39}
							class="rg-card-mystic-number">6</CardSlot
						><CardSlot
							size={39}
							class="rg-card-mystic-number">7</CardSlot
						><CardSlot
							size={39}
							class="rg-card-mystic-number">8</CardSlot
						><CardSlot
							size={39}
							class="rg-card-mystic-number">9</CardSlot>
					</div>
				</div>
				<div class="rg-card-mystic-prediction">
					<div class="rg-card-mystic-prediction--label">
						Territories <small>you control</small>
					</div>
					<div class="rg-card-mystic-prediction--numbers">
						<CardSlot
							size={39}
							class="rg-card-mystic-number">1</CardSlot
						><CardSlot
							size={39}
							class="rg-card-mystic-number">2</CardSlot
						><CardSlot
							size={39}
							class="rg-card-mystic-number">3</CardSlot
						><CardSlot
							size={39}
							class="rg-card-mystic-number">4</CardSlot
						><CardSlot
							size={39}
							class="rg-card-mystic-number rg-card-is-selected"
							>5</CardSlot
						><CardSlot
							size={39}
							class="rg-card-mystic-number">6</CardSlot
						><CardSlot
							size={39}
							class="rg-card-mystic-number">7</CardSlot
						><CardSlot
							size={39}
							class="rg-card-mystic-number">8</CardSlot
						><CardSlot
							size={39}
							class="rg-card-mystic-number">9</CardSlot>
					</div>
				</div>
				<div class="rg-card-mystic-prediction">
					<div class="rg-card-mystic-prediction--label">
						Completed advancement tracks
					</div>
					<div
						class="rg-card-mystic-prediction--numbers rg-card-mystic-prediction--numbers--four">
						<CardSlot
							size={39}
							class="rg-card-mystic-number">1</CardSlot
						><CardSlot
							size={39}
							class="rg-card-mystic-number rg-card-is-selected"
							>2</CardSlot
						><CardSlot
							size={39}
							class="rg-card-mystic-number">3</CardSlot
						><CardSlot
							size={39}
							class="rg-card-mystic-number">4</CardSlot>
					</div>
				</div>
			</CardPredictionTracks>
			<div class="rg-card-ability-list rg-card-mystic-payoffs">
				<CardEffectBox>
					{#snippet symbol()}+ <CardResource
							symbol="any"
							class="" />{/snippet}<b>First time reached</b><span
						>Gain one resource of your choice when you first reach
						each predicted number.</span
					></CardEffectBox>
				<CardEffectBox>
					{#snippet symbol()}10 VP{/snippet}<b>Final income turn</b
					><span
						>Score 10 VP for each category predicted exactly.</span
					></CardEffectBox>
			</div>
			<CardClarity
				><p class="rg-card-fine">
					If gained mid-game, discard this civilization and gain
					another. This is the original prediction mat; the revised
					Mystics ability uses a different system.<br /><span
						class="rg-card-setup"
						>Setup, current rules: gain
						<CardResource
							symbol="any"
							class="rg-card-resource-icon--fine" />.</span>
				</p></CardClarity>
		</CardFrame>
	{:else if id === 'alchemists'}
		<CardFrame
			title="Alchemists"
			portrait="/art/civ/alchemists.svg"
			portraitAlt="Alchemists civilization portrait"
			badges={['Base game']}
			complexity={3}
			{state}
			class="rg-card-frame--alchemists">
			{#snippet effect()}At the start of income turns 2–5, roll the
				science die and mark its track. After each roll, stop or roll
				again.{/snippet}

			<CardPlacementRows kind="tracks">
				<div class="rg-card-alchemist-track rg-card-is-rolled">
					<CardSlot
						size={75}
						class="rg-card-alchemist-track--slot"
						><img
							src="/art/track/exploration.svg"
							alt="" /><PlayerToken
							decorative
							class="rg-card-alchemist-track--token" /></CardSlot
					><span>Exploration</span>
				</div>
				<div class="rg-card-alchemist-track">
					<CardSlot
						size={75}
						class="rg-card-alchemist-track--slot"
						><img
							src="/art/track/technology.svg"
							alt="" /><PlayerToken
							decorative
							class="rg-card-alchemist-track--token" /></CardSlot
					><span>Technology</span>
				</div>
				<div class="rg-card-alchemist-track rg-card-is-rolled">
					<CardSlot
						size={75}
						class="rg-card-alchemist-track--slot"
						><img
							src="/art/track/science.svg"
							alt="" /><PlayerToken
							decorative
							class="rg-card-alchemist-track--token" /></CardSlot
					><span>Science</span>
				</div>
				<div class="rg-card-alchemist-track">
					<CardSlot
						size={75}
						class="rg-card-alchemist-track--slot"
						><img
							src="/art/track/military.svg"
							alt="" /><PlayerToken
							decorative
							class="rg-card-alchemist-track--token" /></CardSlot
					><span>Military</span>
				</div>
			</CardPlacementRows>
			<div class="rg-card-ability-list rg-card-alchemist-outcomes">
				<CardEffectBox>
					{#snippet symbol()}STOP{/snippet}<b>Keep distinct rolls</b
					><span
						>Advance once on each marked track, without benefits or
						bonuses. Then clear the tokens.</span
					></CardEffectBox>
				<CardEffectBox>
					{#snippet symbol()}BUST{/snippet}<b
						>Roll a marked track again</b
					><span
						>Clear all tokens and gain + <CardResource
							symbol="any"
							class="" /> instead.</span
					></CardEffectBox>
				<CardEffectBox>
					{#snippet symbol()}5 VP{/snippet}<b
						>Past a track&#x27;s end</b
					><span
						>Gain 5 VP each time the final result would push you
						beyond a track&#x27;s end.</span
					></CardEffectBox>
			</div>
			<CardClarity
				><p class="rg-card-fine">
					Tokens mark only rolls from this activation; remove them
					after stopping or busting.<br /><span class="rg-card-setup"
						>Setup, current rules: gain
						<CardResource
							symbol="any"
							class="rg-card-resource-icon--fine" /> and 10 VP.</span>
				</p></CardClarity>
		</CardFrame>
	{:else if id === 'isolationists'}
		<CardFrame
			title="Isolationists"
			portrait="/art/civ/isolationists.svg"
			portraitAlt="Isolationists civilization portrait"
			badges={['Base game']}
			complexity={2}
			{state}
			class="rg-card-frame--isolationists">
			{#snippet effect()}When you conquer an empty territory, you may add
				one of your four tokens there beside your outpost.{/snippet}

			<CardTokenReserve
				count={4}
				used={state === 'play' ? 1 : 0} />
			<div class="rg-card-ability-list rg-card-isolation-effects">
				<CardEffectBox>
					{#snippet symbol()}+ <CardResource
							symbol="any"
							class="" />{/snippet}<b>Place a token</b><span
						>Gain any resource. With two tokens on it, that
						territory cannot be conquered.</span
					></CardEffectBox>
			</div>
			<div class="rg-card-isolation-score">
				<div class="rg-card-isolation-score--title">
					Final income turn · territories in your largest connected
					landmass of one terrain
				</div>
				<div class="rg-card-isolation-score--ladder">
					<span class="rg-card-isolation-score--step"
						><small>1</small>5 VP</span
					><span class="rg-card-isolation-score--step"
						><small>2</small>10 VP</span
					><span class="rg-card-isolation-score--step"
						><small>3</small>16 VP</span
					><span class="rg-card-isolation-score--step"
						><small>4</small>23 VP</span
					><span class="rg-card-isolation-score--step"
						><small>5</small>31 VP</span
					><span class="rg-card-isolation-score--step"
						><small>6+</small>40 VP</span>
				</div>
				<div class="rg-card-isolation-score--example">
					<img
						src="/art/terrain/grassland.svg"
						alt="" /><img
						src="/art/terrain/grassland.svg"
						alt="" /><img
						src="/art/terrain/grassland.svg"
						alt="" /><span>3 connected grassland territories</span
					><b>= 16 VP</b>
				</div>
			</div>
			<CardClarity
				><p class="rg-card-fine">
					Only land territories you control count; water does not form
					a landmass. The middle island is not a wildcard.<br /><span
						class="rg-card-setup"
						>Setup, current rules: gain 2 territory tiles.</span>
				</p></CardClarity>
		</CardFrame>
	{:else if id === 'traders'}
		<CardFrame
			title="Traders"
			portrait="/art/civ/traders.svg"
			portraitAlt="Traders civilization portrait"
			badges={['Base game']}
			complexity={1}
			{state}
			class="rg-card-frame--traders">
			{#snippet effect()}At the start of income turns 2–5, you may place
				one of these tokens on a qualifying map territory.{/snippet}

			<CardTokenReserve
				count={4}
				used={state === 'play' ? 2 : 0} />
			<div class="rg-card-ability-list rg-card-trader-options">
				<CardEffectBox>
					{#snippet symbol()}<span class="rg-card-trader-hex"></span
						>{/snippet}<b>Empty territory</b><span
						>Gain 1 VP per adjacent opponent-controlled territory.
						If an opponent later conquers it, you may gain the
						benefit of an unselected conquer die.</span
					></CardEffectBox>
				<CardEffectBox>
					{#snippet symbol()}<span class="rg-card-trader-hex"
							><img
								src="/art/piece/outpost-red.svg"
								alt="" /></span
						>{/snippet}<b>One opponent outpost</b><span
						>Gain the benefit printed on its territory tile, if it
						has one.</span
					></CardEffectBox>
			</div>
			<CardClarity
				><p class="rg-card-fine">
					A territory with two tokens of any kind cannot be conquered.
					The token placement is not a conquer action.<br /><span
						class="rg-card-setup"
						>Setup, current rules: gain 2 <CardResource
							symbol="any"
							class="rg-card-resource-icon--fine" /> and 10 VP.</span>
				</p></CardClarity>
		</CardFrame>
	{:else if id === 'merrymakers'}
		<CardFrame
			title="Merrymakers"
			portrait="/art/civ/merrymakers.svg"
			portraitAlt="Merrymakers civilization portrait"
			badges={['Base game']}
			complexity={1}
			{state}
			class="rg-card-frame--merrymakers">
			{#snippet effect()}At the start of income turns 2–5, move one token
				up one square and gain everything shown there.{/snippet}

			<CardRewardColumns kind="inside">
				<div class="rg-card-merry-column rg-card-is-moved">
					<CardSlot
						size={75}
						class="rg-card-merry-cell"
						><span class="rg-card-merry-cell--reward"
							><CardResource
								symbol="culture"
								class="" /> + armory</span
						></CardSlot
					><CardSlot
						size={75}
						class="rg-card-merry-cell rg-card-is-current"
						><span class="rg-card-merry-cell--reward"
							><CardResource
								symbol="worker"
								class="" /> + <CardResource
								symbol="food"
								class="" /></span
						><PlayerToken
							color="blue"
							class="rg-card-merry-cell--token"
							decorative /></CardSlot
					><CardSlot
						size={75}
						class="rg-card-merry-cell"
						><span class="rg-card-merry-cell--reward"
							><CardResource
								symbol="coin"
								class="" /></span
						></CardSlot
					><CardSlot
						size={62}
						class="rg-card-merry-start"
						><PlayerToken
							color="blue"
							decorative /></CardSlot>
				</div>
				<div class="rg-card-merry-column rg-card-is-moved">
					<CardSlot
						size={75}
						class="rg-card-merry-cell"
						>Explore +<br />Research</CardSlot
					><CardSlot
						size={75}
						class="rg-card-merry-cell"
						>Invent +<br />tapestry card</CardSlot
					><CardSlot
						size={75}
						class="rg-card-merry-cell rg-card-is-current"
						>Territory tile<PlayerToken
							color="blue"
							class="rg-card-merry-cell--token"
							decorative /></CardSlot
					><CardSlot
						size={62}
						class="rg-card-merry-start"
						><PlayerToken
							color="blue"
							decorative /></CardSlot>
				</div>
				<div class="rg-card-merry-column">
					<CardSlot
						size={75}
						class="rg-card-merry-cell">15 VP</CardSlot
					><CardSlot
						size={75}
						class="rg-card-merry-cell">10 VP</CardSlot
					><CardSlot
						size={75}
						class="rg-card-merry-cell">5 VP</CardSlot
					><CardSlot
						size={62}
						class="rg-card-merry-start"
						><PlayerToken
							color="blue"
							decorative /></CardSlot>
				</div>
			</CardRewardColumns>
			<CardClarity
				><p class="rg-card-fine">
					Each column starts with one token below its lowest square.
					Double rewards grant both items; Explore and Research
					include their benefits. This shows the original mat.<br /><span
						class="rg-card-setup"
						>Setup, current rules: gain
						<CardResource
							symbol="any"
							class="rg-card-resource-icon--fine" />.</span>
				</p></CardClarity>
		</CardFrame>
	{:else if id === 'historians'}
		<CardFrame
			title="Historians"
			portrait="/art/civ/historians.svg"
			portraitAlt="Historians civilization portrait"
			badges={['Base game']}
			complexity={1}
			{state}
			class="rg-card-frame--historians">
			{#snippet effect()}At the start of income turns 2–5, you may discard
				a territory tile to give one of these tokens to an opponent.{/snippet}

			<CardPlacementRows kind="history"
				><CardSlot
					size={75}
					class="rg-card-history-square rg-card-is-exposed"
					>3 VP<PlayerToken
						color="blue"
						decorative /></CardSlot
				><CardSlot
					size={75}
					class="rg-card-history-square rg-card-is-exposed"
					>+ <CardResource
						symbol="food"
						class="" /><PlayerToken
						color="blue"
						decorative /></CardSlot
				><CardSlot
					size={75}
					class="rg-card-history-square"
					>+ <CardResource
						symbol="worker"
						class="" /><PlayerToken
						color="blue"
						decorative /></CardSlot
				><CardSlot
					size={75}
					class="rg-card-history-square"
					>3 VP<PlayerToken
						color="blue"
						decorative /></CardSlot
				></CardPlacementRows>
			<div class="rg-card-ability-list rg-card-inventor-effects">
				<CardEffectBox>
					{#snippet symbol()}Landmark{/snippet}<b
						>Opponent holding your token</b
					><span
						>When they gain a landmark, gain every currently exposed
						reward above.</span
					></CardEffectBox>
			</div>
			<CardClarity
				><p class="rg-card-fine">
					An opponent may hold more than one token. If gained
					mid-game, give away all four immediately and expose every
					reward. This shows the original mat.
				</p></CardClarity>
		</CardFrame>
	{:else if id === 'inventors'}
		<CardFrame
			title="Inventors"
			portrait="/art/civ/inventors.svg"
			portraitAlt="Inventors civilization portrait"
			badges={['Base game']}
			complexity={1}
			{state}
			class="rg-card-frame--inventors">
			{#snippet effect()}At the start of income turns 2–5, you may put one
				token on any technology card and upgrade it one row.{/snippet}

			<CardTokenReserve
				count={4}
				used={state === 'play' ? 1 : 0} />
			<CardTechnologyTransfer active={state === 'play'} />
			<div class="rg-card-ability-list rg-card-inventor-effects">
				<CardEffectBox>
					{#snippet symbol()}Upgrade{/snippet}<b
						>On an opponent&#x27;s card</b
					><span
						>They gain the upgrade benefit; you may gain it too.
						Top-row prerequisites are ignored.</span
					></CardEffectBox
				><CardEffectBox>
					{#snippet symbol()}Top row{/snippet}<b
						>When their marked card reaches the top</b
					><span
						>They gain the benefit first; under the original rules
						you may gain it too, under the current rules only if
						your own token moved it there. Then take the card into
						your bottom row, keeping your token on it.</span
					></CardEffectBox>
			</div>
			<CardClarity
				><p class="rg-card-fine">
					On your own card, gain the upgrade benefit normally. A
					landmark already claimed by the opponent gives you nothing.
				</p></CardClarity>
		</CardFrame>
	{:else if id === 'futurists'}
		<!-- 02-base-content §1.2; current rules' adjustment D (§2.2), at the end of income turn 1 (#20 design). -->
		<CardFrame
			title="Futurists"
			portrait="/art/civ/futurists.svg"
			portraitAlt="Futurists civilization portrait"
			badges={['Base game']}
			complexity={3}
			{state}
			class="rg-card-frame--futurists">
			{#snippet effect()}When you gain this civilization, at setup or
				during the game, jump ahead on every advancement track at once.{/snippet}

			<div class="rg-card-ability-list">
				<CardEffectBox>
					{#snippet symbol()}<span class="rg-card-track-quad"
							><img
								src="/art/track/exploration.svg"
								alt="" /><img
								src="/art/track/science.svg"
								alt="" /><img
								src="/art/track/technology.svg"
								alt="" /><img
								src="/art/track/military.svg"
								alt="" /></span
						>{/snippet}<b>Head start</b><span
						>Advance exactly <strong>4 spaces</strong> on each of the
						four tracks, without their benefits, bonuses or landmarks.
						The end of a track is the limit.</span
					></CardEffectBox>
				<CardEffectBox>
					{#snippet symbol()}<span class="rg-card-resource-quad"
							><CardResource symbol="coin" /><CardResource
								symbol="worker" /><CardResource
								symbol="food" /><CardResource
								symbol="culture" /></span
						>{/snippet}<b>Supplies</b><span
						>Gain 1 of each resource.</span
					></CardEffectBox>
			</div>
			<CardClarity
				><p class="rg-card-fine">
					A landmark you jump past stays on its track; you gain it
					only by later advancing onto its space.<br /><span
						class="rg-card-setup"
						>Current rules: at the end of your first income turn,
						lose 1 culture and 1 other resource of your choice.</span>
				</p></CardClarity>
		</CardFrame>
	{:else if id === 'heralds'}
		<!-- 02-base-content §1.2; current rules' adjustment D (§2.2), at the end of income turn 1 (#20 design). -->
		<CardFrame
			title="Heralds"
			portrait="/art/civ/heralds.svg"
			portraitAlt="Heralds civilization portrait"
			badges={['Base game']}
			complexity={1}
			{state}
			class="rg-card-frame--heralds">
			{#snippet effect()}At the start of income turns 2–5, you may move
				one of these tokens onto a When Played tapestry card, yours or
				an opponent&#x27;s, and gain its benefit.{/snippet}

			<CardTokenReserve
				count={4}
				used={state === 'play' ? 1 : 0} />
			<div class="rg-card-ability-list">
				<CardEffectBox>
					{#snippet symbol()}<span
							class="rg-card-mini-card rg-card-mini-card--tapestry"
							><img
								src="/art/tapestry/renaissance.svg"
								alt="" /></span
						>{/snippet}<b>Copy a card</b><span
						>Only the top card of a slot can be chosen, and each
						card holds at most one token.</span
					></CardEffectBox>
				<CardEffectBox>
					{#snippet symbol()}<span
							class="rg-card-mini-card rg-card-mini-card--tapestry rg-card-era-numeral"
							title="Maker of Fire, era I"><b>I</b></span
						>{/snippet}<b>Started with the Heralds</b><span
						>At the end of your first income turn, you may play a
						tapestry card on top of Maker of Fire.</span
					></CardEffectBox>
			</div>
			<CardClarity
				><p class="rg-card-fine">
					<span class="rg-card-setup"
						>Current rules: instead, at the end of your first income
						turn draw tapestry cards until you find a When Played
						card, and discard the others. You may play that card on
						Maker of Fire, unless it is Renaissance.</span>
				</p></CardClarity>
		</CardFrame>
	{:else if id === 'nomads'}
		<!-- 02-base-content §1.2; no adjustment in either version (§2.2). -->
		<CardFrame
			title="Nomads"
			portrait="/art/civ/nomads.svg"
			portraitAlt="Nomads civilization portrait"
			badges={['Base game']}
			complexity={3}
			{state}
			class="rg-card-frame--nomads">
			{#snippet effect()}Whenever you gain a building or a landmark, you
				may place it on the map instead of in your capital, in one of
				two ways.{/snippet}

			<div class="rg-card-ability-list rg-card-trader-options">
				<CardEffectBox>
					{#snippet symbol()}<span class="rg-card-trader-hex"
							><img
								src="/art/piece/outpost-blue.svg"
								alt="" /></span
						>{/snippet}<b>Your territory with one item</b><span
						>Place it beside the one outpost or building there and
						gain <strong
							>+ <CardResource
								symbol="any"
								class="rg-card-resource-icon--fine" /></strong
						>. Opponents can no longer conquer that territory.</span
					></CardEffectBox>
				<CardEffectBox>
					{#snippet symbol()}<span class="rg-card-trader-hex"></span
						>{/snippet}<b>Empty territory next to yours</b><span
						>Place it there to take control. This is not a conquest;
						if an opponent conquers the territory, the piece counts
						as an outpost.</span
					></CardEffectBox>
			</div>
			<CardClarity
				><p class="rg-card-fine">
					Buildings on the map still count for VP per building.
				</p></CardClarity>
		</CardFrame>
	{:else if id === 'the-chosen'}
		<!-- 02-base-content §1.2; current rules' adjustment (§2.2): +15 VP per opponent. -->
		<CardFrame
			title="The Chosen"
			portrait="/art/civ/the-chosen.svg"
			portraitAlt="The Chosen civilization portrait"
			badges={['Base game']}
			complexity={2}
			{state}
			class="rg-card-frame--the-chosen">
			{#snippet effect()}At the start of income turns 2–5, gain VP for the
				tracks you lead and resources for your achievements.{/snippet}

			<div class="rg-card-ability-list">
				<CardEffectBox>
					{#snippet symbol()}<span class="rg-card-track-quad"
							><img
								src="/art/track/exploration.svg"
								alt="" /><img
								src="/art/track/science.svg"
								alt="" /><img
								src="/art/track/technology.svg"
								alt="" /><img
								src="/art/track/military.svg"
								alt="" /></span
						>{/snippet}<b>Each track you lead</b><span
						>Gain <strong>1 VP per opponent</strong> for each track you
						have completed, or on which no token is further advanced than
						yours.</span
					></CardEffectBox>
				<CardEffectBox>
					{#snippet symbol()}+ <CardResource
							symbol="any"
							class="" />{/snippet}<b>Each achievement</b><span
						>Gain any resource for each achievement you have earned.
						On your final income turn, gain <strong>5 VP</strong> per
						achievement instead.</span
					></CardEffectBox>
			</div>
			<CardClarity
				><p class="rg-card-fine">
					A track where another token is level with yours still
					counts.<br /><span class="rg-card-setup"
						>Setup, current rules: start with 15 VP per opponent.</span>
				</p></CardClarity>
		</CardFrame>
	{:else}
		<!-- A civilization without a reviewed layout yet: its frame, portrait and name, and no invented rules text. -->
		<CardFrame
			title={civilizationName(id)}
			portrait="/art/civ/{id}.svg"
			portraitAlt=""
			badges={[edition]}
			{state}
			class="">
			{#snippet effect()}
				<span class="rg-civilization-card--missing"
					>The full card is on its way.</span>
			{/snippet}
		</CardFrame>
	{/if}
</div>
