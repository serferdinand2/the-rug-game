<!-- CivilizationCard: an extracted owner-reviewed card pattern; six cards draw a seat's live state and take its choices (#78). -->
<script module>
	/**
	 * @typedef {Object} CivilizationCardOwnProps
	 * @property {string} [id] - Civilization slug; one without a reviewed layout shows its frame, portrait and name only
	 * @property {'empty' | 'play'} [state] - Starting state or labelled illustration; the six card civilizations draw
	 *   their play illustration from `SAMPLE_CIV_DATA`
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
	import CardSlot from './CardSlot.svelte';
	import CardTechnologyTransfer from './CardTechnologyTransfer.svelte';
	import CardTerrainRewards from './CardTerrainRewards.svelte';
	import CardTokenReserve from './CardTokenReserve.svelte';
	import PlayerToken from './PlayerToken.svelte';
	import { civilizationName } from '../../game-names.js';
	import { playerColor } from '../../ui.js';
	import { ASSETS } from '../../art/catalog.js';
	import '../../engine/game.js';
	import { entertainersMoves } from '../../engine/civs/entertainers.js';
	import {
		CARD_CIVS,
		PREDICTIONS,
		SAMPLE_CIV_DATA,
		civCardMarks,
	} from '../../civ-card.js';
	import { ComponentEvent } from '../../component-event.js';

	/** The Entertainers' grid by row, as the card reads it: a resource, a building, an action and an advance. */
	const ENTERTAINER_ROWS = [
		{
			resource: /** @type {const} */ ('worker'),
			building: 'farm',
			name: 'Farm',
			action: 'Conquer',
			advance: 'Advance Technology',
		},
		{
			resource: /** @type {const} */ ('culture'),
			building: 'market',
			name: 'Market',
			action: 'Research without benefit or bonus',
			advance: 'Advance Exploration',
		},
		{
			resource: /** @type {const} */ ('food'),
			building: 'house',
			name: 'House',
			action: 'Invent',
			advance: 'Advance Military',
		},
		{
			resource: /** @type {const} */ ('coin'),
			building: 'armory',
			name: 'Armory',
			action: 'Explore',
			advance: 'Advance Science',
		},
	];
	/** The Entertainers' squares row by row, columns 1 to 4. */
	const ENTERTAINER_SPACES = ENTERTAINER_ROWS.flatMap((space, index) => [
		{ id: `c1r${index + 1}`, gain: space.resource },
		{
			id: `c2r${index + 1}`,
			picture: `/art/building/${space.building}.svg`,
			text: space.name,
		},
		{ id: `c3r${index + 1}`, text: space.action },
		{ id: `c4r${index + 1}`, text: space.advance },
	]);
	/** The Entertainers' links, from the engine's own moves (R28), so the card never shows a link it refuses. */
	const ENTERTAINER_LINKS = [1, 2, 3].flatMap((column) =>
		[1, 2, 3, 4].flatMap((row) =>
			entertainersMoves(`c${column}r${row}`).map(
				(to) => /** @type {const} */ ([`c${column}r${row}`, to])
			)
		)
	);
	/** The Treasure Hunters' terrains and rewards; the play example has used Desert. */
	const TREASURE_HUNTER_TERRAINS = /** @type {const} */ ([
		{
			terrain: 'desert',
			name: 'Desert',
			gain: 'coin',
			effect: 'roll the black conquer die twice and take one result.',
		},
		{
			terrain: 'grassland',
			name: 'Grassland',
			gain: 'culture',
			effect: 'roll the science die twice, choose one result, and advance with benefit.',
		},
		{
			terrain: 'mountain',
			name: 'Mountain',
			gain: 'worker',
			effect: 'roll both conquer dice and gain both results.',
		},
		{
			terrain: 'forest',
			name: 'Forest',
			gain: 'food',
			effect: 'roll the red conquer die twice and gain both results.',
		},
	]);
	/**
	 * The Craftsmen's three columns, top first; the play example has a farm and a house in column A.
	 * @type {{ title: string, note: string, rows: { vp?: number, gain?: import('../../ui.js').CostSymbol, text?: string, keep?: string, after?: string, building?: string }[] }[]}
	 */
	const CRAFTSMEN_COLUMNS = [
		{
			title: 'Column A',
			note: 'fill from bottom',
			rows: [
				{ vp: 5 },
				{ text: 'Gain 1 territory tile', building: 'farm' },
				{ gain: 'worker', building: 'house' },
			],
		},
		{
			title: 'Column B',
			note: 'fill from bottom',
			rows: [
				{ vp: 10 },
				{ text: 'Upgrade 1 tech card' },
				{ text: 'Invent 1 tech card' },
				{ gain: 'coin' },
			],
		},
		{
			title: 'Column C',
			note: 'fill from bottom',
			rows: [
				{ vp: 15 },
				{
					text: 'Research',
					keep: 'with benefit;',
					after: 'bonus is available',
				},
				{ gain: 'culture' },
				{ text: 'Gain 1 tapestry card' },
				{ gain: 'food' },
			],
		},
	];
	/**
	 * The Merrymakers' columns, top first: each square's spot id and reward.
	 * @type {{ id: string, cells: { id: string, gains?: import('../../ui.js').CostSymbol[], also?: string, lines?: string[] }[] }[]}
	 */
	const MERRYMAKER_COLUMNS = [
		{
			id: 'm0',
			cells: [
				{
					id: 'm0l3',
					gains: ['culture'],
					also: 'armory',
				},
				{
					id: 'm0l2',
					gains: ['worker', 'food'],
				},
				{ id: 'm0l1', gains: ['coin'] },
			],
		},
		{
			id: 'm1',
			cells: [
				{ id: 'm1l3', lines: ['Explore +', 'Research'] },
				{ id: 'm1l2', lines: ['Invent +', 'tapestry card'] },
				{ id: 'm1l1', lines: ['Territory tile'] },
			],
		},
		{
			id: 'm2',
			cells: [
				{ id: 'm2l3', lines: ['15 VP'] },
				{ id: 'm2l2', lines: ['10 VP'] },
				{ id: 'm2l1', lines: ['5 VP'] },
			],
		},
	];
	/** A track's picture. @param {string} track */
	const trackPicture = (track) => `/art/track/${track}.svg`;
	/**
	 * The Collectors' six items; the play example has collected the outpost, the house and the tech card.
	 * @type {{ name: string, picture: string, placed?: string, large?: boolean, facedown?: boolean, gain: import('../../ui.js').CostSymbol }[]}
	 */
	const COLLECTOR_ITEMS = [
		{
			name: 'Outpost*',
			picture: '/art/piece/outpost.svg',
			placed: '/art/piece/outpost-blue.svg',
			large: true,
			gain: 'any',
		},
		{ name: 'House', picture: '/art/building/house.svg', gain: 'any' },
		{
			name: 'Landmark',
			picture: '/art/landmark/clock-tower.svg',
			gain: 'any',
		},
		{
			name: 'Tapestry',
			picture: '/art/tapestry/lost-artifacts.svg',
			facedown: true,
			gain: 'any',
		},
		{
			name: 'Territory',
			picture: '/art/capital-terrain/grassland-open-01.svg',
			facedown: true,
			gain: 'any',
		},
		{
			name: 'Tech',
			picture: '/art/tech/eyeglasses.svg',
			facedown: true,
			gain: 'any',
		},
	];
	/** The Leaders' four tracks, in the card's order. */
	const LEADER_TRACKS = [
		'exploration',
		'technology',
		'science',
		'military',
	].map((track) => ({
		id: track,
		name: track[0].toUpperCase() + track.slice(1),
		picture: trackPicture(track),
	}));
	/**
	 * The Militants' rewards under their outposts, the top row then the bottom.
	 * @type {{ id: string, gain?: import('../../ui.js').CostSymbol, vp?: number }[]}
	 */
	const MILITANT_SPACES = [
		{ id: 'top0', gain: 'coin' },
		{ id: 'top1', vp: 2 },
		{ id: 'top2', gain: 'food' },
		{ id: 'top3', vp: 4 },
		{ id: 'bottom0', vp: 1 },
		{ id: 'bottom1', gain: 'worker' },
		{ id: 'bottom2', vp: 3 },
		{ id: 'bottom3', gain: 'culture' },
	];
	/** The Alchemists' four tracks; the play example has rolled Exploration and Science. */
	const ALCHEMIST_TRACKS = [
		'exploration',
		'technology',
		'science',
		'military',
	].map((track) => ({
		name: track[0].toUpperCase() + track.slice(1),
		picture: trackPicture(track),
	}));
	/**
	 * The Historians' four rewards under their tokens.
	 * @type {{ id: string, gain?: import('../../ui.js').CostSymbol, vp?: number }[]}
	 */
	const HISTORIAN_SQUARES = [
		{ id: 'square0', vp: 3 },
		{ id: 'square1', gain: 'food' },
		{ id: 'square2', gain: 'worker' },
		{ id: 'square3', vp: 3 },
	];
	/** The Collectors' end-of-game score by the number of different items collected. */
	const COLLECTOR_SCORE = [1, 3, 6, 10, 15, 21].map((points, index) => ({
		count: index + 1,
		points,
	}));
	/** The Isolationists' final score by the territories in their largest landmass of one terrain. */
	const ISOLATIONIST_SCORE = [
		{ count: 1, points: 5 },
		{ count: 2, points: 10 },
		{ count: 3, points: 16 },
		{ count: 4, points: 23 },
		{ count: 5, points: 31 },
		{ count: '6+', points: 40 },
	];
	/** The Mystics' categories, with the most each prediction can be: its numbers run from 1 to it. */
	const MYSTIC_CATEGORIES = [
		{ id: 'techCards', label: 'Tech cards', note: 'you have' },
		{ id: 'districts', label: 'Complete districts' },
		{ id: 'territories', label: 'Territories', note: 'you control' },
		{ id: 'tracks', label: 'Completed advancement tracks' },
	].map((category) => ({
		...category,
		most: /** @type {number} */ (
			PREDICTIONS.find((each) => each.category === category.id)?.most
		),
	}));
	/** @type {CivilizationCardProps} */
	let {
		id = 'collectors',
		state = 'empty',
		live = null,
		seat,
		selected = null,
		onCivilizationCardPick,
		...attr
	} = $props();
	/** The six card civilizations draw live state in play; their illustration is sample data drawn the same way. */
	const cardState = $derived(live && CARD_CIVS.includes(id) ? 'play' : state);
	const marks = $derived(
		live
			? live.marks
			: state === 'play' && CARD_CIVS.includes(id)
				? civCardMarks(id, SAMPLE_CIV_DATA[id])
				: {}
	);
	const choices = $derived(live?.choices ?? {});
	/** The edition's code, for the chip (#109). */
	const edition = $derived(
		ASSETS.find((asset) => asset.id === `civ/${id}`)?.expansion ?? 'base'
	);

	/**
	 * A CardSlot's pick, reported as the card's own.
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

	/**
	 * The number the Mystics predicted in a category, as the marks show it.
	 * @param {string} category
	 * @returns {number | undefined}
	 */
	function chosenNumber(category) {
		const spot = Object.keys(marks).find(
			(each) =>
				each.startsWith(`${category}:`) &&
				marks[each].includes('chosen')
		);
		return spot === undefined ? undefined : Number(spot.split(':')[1]);
	}
</script>

<!-- The play look draws the player's marks in --player-1; a seat's card draws them in that seat's colour. -->
<div
	{...attr}
	class="rg-civilization-card {attr.class ?? ''}"
	style:--player-1={seat !== undefined && seat !== 1
		? playerColor(seat)
		: undefined}>
	{#if id === 'collectors'}
		<CardFrame
			title="Collectors"
			portrait="/art/civ/collectors.svg"
			portraitAlt="A collector studies a gem through a magnifying glass"
			editions={['aa']}
			complexity={2}
			{state}>
			{#snippet effect()}
				During an <b>advance</b> turn, when you gain one of these, you
				may place it on its space if the space is empty. Then gain
				<CardResource symbol="any" />. One item per turn.
			{/snippet}

			<CardPlacementRows
				kind="collection"
				items={COLLECTOR_ITEMS.map((item, index) => ({
					...item,
					collected: state === 'play' && [0, 1, 5].includes(index),
				}))} />
			<CardClarity>
				<b>*</b> Only from a conquer benefit, instead of conquering;
				don&#x27;t roll the dice.<br />Items here count for scoring but
				can&#x27;t be used. Cards and tiles lie face down; you may look
				at them.{#snippet setup()}Setup, current rules: gain
					<CardResource symbol="any" />.{/snippet}</CardClarity>
			<CardScoreLadder
				steps={COLLECTOR_SCORE}
				current={state === 'play' ? 3 : 0} />
		</CardFrame>
	{:else if id === 'architects'}
		<CardFrame
			title="Architects"
			portrait="/art/civ/architects.svg"
			portraitAlt="Architects civilization portrait"
			editions={['base']}
			complexity={3}
			{state}
			bodyMinHeight={184}
			textLeading={1.5}>
			{#snippet effect()}Build with matching income buildings to gain more
				from completed districts and score more from completed rows and
				columns.{/snippet}

			<CardEffectList>
				<CardEffectBox title="Complete a district"
					>{#snippet symbol()}<span class="rg-card-district-icon"
							><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i
							></i
							><i></i></span
						>{/snippet}If all its income buildings match, gain
					<strong
						>+ <CardResource
							symbol="any"
							fine /></strong> in addition to its usual reward.</CardEffectBox>
				<CardEffectBox title="Score the capital"
					>{#snippet symbol()}<span class="rg-card-line-icon"
							><i></i><i></i><i></i></span
						>{/snippet}Each complete row or column whose income
					buildings match is worth <strong>+1 VP</strong> beyond its usual
					score.</CardEffectBox>
			</CardEffectList>
			<CardClarity minHeight={70}>
				Each qualifying district, row or column needs at least one
				income building. If gained mid-game, you may swap the places of
				2 income buildings in your capital, up to 3 times.{#snippet setup()}Setup,
					current rules: place one impassable plot per opponent, each
					in a different district.{/snippet}</CardClarity>
		</CardFrame>
	{:else if id === 'leaders'}
		<CardFrame
			title="Leaders"
			portrait="/art/civ/leaders.svg"
			portraitAlt="Leaders civilization portrait"
			editions={['base']}
			complexity={1}
			state={cardState}
			bodyMinHeight={184}
			textLeading={1.5}>
			{#snippet effect()}At the start of income turns 2–5, you may cover
				one unused track space. Advance on that track for free and gain
				its benefit.{/snippet}

			<CardPlacementRows
				kind="leaders"
				items={LEADER_TRACKS.map((item) => ({
					...item,
					used: marks[item.id]?.includes('used'),
				}))}
				choices={Object.keys(choices)}
				picked={selected}
				onCardPlacementRowsPick={slotPickHandler} />
			<CardClarity
				above={16}
				minHeight={70}>
				Each track space can be used once. This advance gains the
				benefit, but cannot gain its bonus.
			</CardClarity>
		</CardFrame>
	{:else if id === 'treasure-hunters'}
		<CardFrame
			title="Treasure Hunters"
			portrait="/art/civ/treasure-hunters.svg"
			portraitAlt="Treasure Hunters civilization portrait"
			editions={['pp']}
			complexity={3}
			{state}
			bodyMinHeight={184}>
			{#snippet effect()}At the start of income turns 2–5, you may move
				one token from this mat to an empty adjacent territory matching
				an unused terrain below. Control it and gain that terrain&#x27;s
				reward.{/snippet}

			<CardTerrainRewards
				rows={TREASURE_HUNTER_TERRAINS.map((row, index) => ({
					...row,
					used: state === 'play' && index === 0,
				}))} />
			<CardClarity>
				Setup: put 4 player tokens here and gain 2 territory tiles. Each
				terrain can be used once. Claiming a territory this way is not a
				conquer action. For Grassland, you may pay for the advancement
				bonus.
			</CardClarity>
		</CardFrame>
	{:else if id === 'craftsmen'}
		<CardFrame
			title="Craftsmen"
			portrait="/art/civ/craftsmen.svg"
			portraitAlt="Craftsmen civilization portrait"
			editions={['base']}
			complexity={1}
			{state}
			bodyMinHeight={184}>
			{#snippet effect()}When you gain an income building, you may place
				it here instead of in your capital. Place it on the <b
					>lowest open space</b> in any column and immediately gain that
				space&#x27;s reward.{/snippet}

			<CardRewardColumns
				columns={CRAFTSMEN_COLUMNS.map((column) => ({
					...column,
					rows: column.rows.map((row) => ({
						...row,
						filled: state === 'play' && row.building !== undefined,
					})),
				}))} />
			<CardClarity>
				Buildings here count as part of your capital for
				building-related benefits, but these columns do not score as
				completed capital rows or columns. You may start another column
				before finishing one.
			</CardClarity>
		</CardFrame>
	{:else if id === 'entertainers'}
		<CardFrame
			title="Entertainers"
			portrait="/art/civ/entertainers.svg"
			portraitAlt="Entertainers civilization portrait"
			editions={['base']}
			complexity={2}
			state={cardState}>
			{#snippet effect()}At the start of income turns 2–5, move your token
				one column right along a path and gain the space&#x27;s reward.{/snippet}

			<CardPathGrid
				heads={['1st move', '2nd', '3rd', '4th']}
				spaces={ENTERTAINER_SPACES}
				links={ENTERTAINER_LINKS}
				current={cardState === 'play'
					? (Object.keys(marks).find((spot) =>
							marks[spot].includes('token')
						) ?? null)
					: null}
				start="Start at the left; move one column each income turn."
				{seat}
				choices={Object.keys(choices)}
				picked={selected}
				onCardPathGridPick={slotPickHandler} />
			<CardClarity>
				If gained mid-game, place the token on any reward space and gain
				it immediately.{#snippet setup()}Setup, current rules: gain
					<CardResource symbol="any" /> and 10 VP.{/snippet}</CardClarity>
		</CardFrame>
	{:else if id === 'militants'}
		<CardFrame
			title="Militants"
			portrait="/art/civ/militants.svg"
			portraitAlt="Militants civilization portrait"
			editions={['base']}
			complexity={1}
			state={cardState}>
			{#snippet effect()}When you conquer, take the leftmost outpost from
				either row. At the start of every income turn, gain all
				uncovered rewards.{/snippet}

			<CardPlacementRows
				kind="covered"
				items={MILITANT_SPACES.map((item) => ({
					...item,
					exposed: marks[item.id]?.includes('exposed'),
				}))}
				choices={Object.keys(choices)}
				picked={selected}
				onCardPlacementRowsPick={slotPickHandler} />
			<div class="rg-card-militant-guide">
				Take from the left of either row →
			</div>
			<CardClarity>
				Start with 8 outposts here and 2 on your starting territory. If
				you gain this civilization mid-game, refill spaces from right to
				left, choosing either row for each remaining outpost.
			</CardClarity>
		</CardFrame>
	{:else if id === 'mystics'}
		<CardFrame
			title="Mystics"
			portrait="/art/civ/mystics.svg"
			portraitAlt="Mystics civilization portrait"
			editions={['base']}
			complexity={3}
			state={cardState}>
			{#snippet effect()}When you gain this civilization, predict one
				number in each category by placing a token on it.{/snippet}

			<CardPredictionTracks
				categories={MYSTIC_CATEGORIES.map((category) => ({
					...category,
					selected: chosenNumber(category.id),
				}))}
				choices={Object.keys(choices)}
				picked={selected}
				onCardPredictionTracksPick={slotPickHandler} />
			<CardEffectList above={14}>
				<CardEffectBox
					title="First time reached"
					gain="any"
					symbolText={15}
					>Gain one resource of your choice when you first reach each
					predicted number.</CardEffectBox>
				<CardEffectBox
					title="Final income turn"
					label="10 VP"
					symbolText={15}
					>Score 10 VP for each category predicted exactly.</CardEffectBox>
			</CardEffectList>
			<CardClarity>
				If gained mid-game, discard this civilization and gain another.
				This is the original prediction mat; the revised Mystics ability
				uses a different system.{#snippet setup()}Setup, current rules:
					gain
					<CardResource symbol="any" />.{/snippet}</CardClarity>
		</CardFrame>
	{:else if id === 'alchemists'}
		<CardFrame
			title="Alchemists"
			portrait="/art/civ/alchemists.svg"
			portraitAlt="Alchemists civilization portrait"
			editions={['base']}
			complexity={3}
			{state}>
			{#snippet effect()}At the start of income turns 2–5, roll the
				science die and mark its track. After each roll, stop or roll
				again.{/snippet}

			<CardPlacementRows
				kind="tracks"
				{seat}
				items={ALCHEMIST_TRACKS.map((item, index) => ({
					...item,
					rolled: state === 'play' && [0, 2].includes(index),
				}))} />
			<CardEffectList above={4}>
				<CardEffectBox
					title="Keep distinct rolls"
					label="STOP"
					symbolText={14}
					>Advance once on each marked track, without benefits or
					bonuses. Then clear the tokens.</CardEffectBox>
				<CardEffectBox
					title="Roll a marked track again"
					label="BUST"
					symbolText={14}
					>Clear all tokens and gain + <CardResource symbol="any" /> instead.</CardEffectBox>
				<CardEffectBox
					title="Past a track's end"
					label="5 VP"
					symbolText={14}
					>Gain 5 VP each time the final result would push you beyond
					a track&#x27;s end.</CardEffectBox>
			</CardEffectList>
			<CardClarity>
				Tokens mark only rolls from this activation; remove them after
				stopping or busting.{#snippet setup()}Setup, current rules: gain
					<CardResource symbol="any" /> and 10 VP.{/snippet}</CardClarity>
		</CardFrame>
	{:else if id === 'isolationists'}
		<CardFrame
			title="Isolationists"
			portrait="/art/civ/isolationists.svg"
			portraitAlt="Isolationists civilization portrait"
			editions={['base']}
			complexity={2}
			{state}>
			{#snippet effect()}When you conquer an empty territory, you may add
				one of your four tokens there beside your outpost.{/snippet}

			<CardTokenReserve
				count={4}
				used={state === 'play' ? 1 : 0} />
			<CardEffectList>
				<CardEffectBox
					title="Place a token"
					gain="any"
					symbolText={13}
					>Gain any resource. With two tokens on it, that territory
					cannot be conquered.</CardEffectBox>
			</CardEffectList>
			<CardScoreLadder
				kind="flat"
				label="Final income turn · territories in your largest connected landmass of one terrain"
				steps={ISOLATIONIST_SCORE}
				example={{
					pictures: Array(3).fill('/art/terrain/grassland.svg'),
					text: '3 connected grassland territories',
					result: '= 16 VP',
				}} />
			<CardClarity>
				Only land territories you control count; water does not form a
				landmass. The middle island is not a wildcard.{#snippet setup()}Setup,
					current rules: gain 2 territory tiles.{/snippet}</CardClarity>
		</CardFrame>
	{:else if id === 'traders'}
		<CardFrame
			title="Traders"
			portrait="/art/civ/traders.svg"
			portraitAlt="Traders civilization portrait"
			editions={['base']}
			complexity={1}
			{state}>
			{#snippet effect()}At the start of income turns 2–5, you may place
				one of these tokens on a qualifying map territory.{/snippet}

			<CardTokenReserve
				count={4}
				used={state === 'play' ? 2 : 0} />
			<CardEffectList>
				<CardEffectBox title="Empty territory"
					>{#snippet symbol()}<span class="rg-card-trader-hex"></span
						>{/snippet}Gain 1 VP per adjacent opponent-controlled
					territory. If an opponent later conquers it, you may gain
					the benefit of an unselected conquer die.</CardEffectBox>
				<CardEffectBox title="One opponent outpost"
					>{#snippet symbol()}<span class="rg-card-trader-hex"
							><img
								src="/art/piece/outpost-red.svg"
								alt="" /></span
						>{/snippet}Gain the benefit printed on its territory
					tile, if it has one.</CardEffectBox>
			</CardEffectList>
			<CardClarity>
				A territory with two tokens of any kind cannot be conquered. The
				token placement is not a conquer action.{#snippet setup()}Setup,
					current rules: gain 2 <CardResource symbol="any" /> and 10 VP.{/snippet}</CardClarity>
		</CardFrame>
	{:else if id === 'merrymakers'}
		<CardFrame
			title="Merrymakers"
			portrait="/art/civ/merrymakers.svg"
			portraitAlt="Merrymakers civilization portrait"
			editions={['base']}
			complexity={1}
			state={cardState}>
			{#snippet effect()}At the start of income turns 2–5, move one token
				up one square and gain everything shown there.{/snippet}

			<CardRewardColumns
				kind="inside"
				{seat}
				columns={MERRYMAKER_COLUMNS.map((column) => ({
					id: column.id,
					moved: marks[column.id]?.includes('moved'),
					cells: column.cells.map((cell) => ({
						...cell,
						current: marks[cell.id]?.includes('token'),
					})),
				}))}
				choices={Object.keys(choices)}
				picked={selected}
				onCardRewardColumnsPick={slotPickHandler} />
			<CardClarity>
				Each column starts with one token below its lowest square.
				Double rewards grant both items; Explore and Research include
				their benefits. This shows the original mat.{#snippet setup()}Setup,
					current rules: gain
					<CardResource symbol="any" />.{/snippet}</CardClarity>
		</CardFrame>
	{:else if id === 'historians'}
		<CardFrame
			title="Historians"
			portrait="/art/civ/historians.svg"
			portraitAlt="Historians civilization portrait"
			editions={['base']}
			complexity={1}
			state={cardState}>
			{#snippet effect()}At the start of income turns 2–5, you may discard
				a territory tile to give one of these tokens to an opponent.{/snippet}

			<CardPlacementRows
				kind="history"
				{seat}
				items={HISTORIAN_SQUARES.map((item) => ({
					...item,
					exposed: marks[item.id]?.includes('exposed'),
				}))}
				choices={Object.keys(choices)}
				picked={selected}
				onCardPlacementRowsPick={slotPickHandler} />
			<CardEffectList>
				<CardEffectBox
					title="Opponent holding your token"
					label="Landmark"
					symbolText={12}
					>When they gain a landmark, gain every currently exposed
					reward above.</CardEffectBox>
			</CardEffectList>
			<CardClarity>
				An opponent may hold more than one token. If gained mid-game,
				give away all four immediately and expose every reward. This
				shows the original mat.
			</CardClarity>
		</CardFrame>
	{:else if id === 'inventors'}
		<CardFrame
			title="Inventors"
			portrait="/art/civ/inventors.svg"
			portraitAlt="Inventors civilization portrait"
			editions={['base']}
			complexity={1}
			{state}>
			{#snippet effect()}At the start of income turns 2–5, you may put one
				token on any technology card and upgrade it one row.{/snippet}

			<CardTokenReserve
				count={4}
				used={state === 'play' ? 1 : 0} />
			<CardTechnologyTransfer active={state === 'play'} />
			<CardEffectList>
				<CardEffectBox
					title="On an opponent's card"
					label="Upgrade"
					symbolText={12}
					>They gain the upgrade benefit; you may gain it too. Top-row
					prerequisites are ignored.</CardEffectBox
				><CardEffectBox
					title="When their marked card reaches the top"
					label="Top row"
					symbolText={12}
					>They gain the benefit first; under the original rules you
					may gain it too, under the current rules only if your own
					token moved it there. Then take the card into your bottom
					row, keeping your token on it.</CardEffectBox>
			</CardEffectList>
			<CardClarity>
				On your own card, gain the upgrade benefit normally. A landmark
				already claimed by the opponent gives you nothing.
			</CardClarity>
		</CardFrame>
	{:else if id === 'futurists'}
		<!-- 02-base-content §1.2; current rules' adjustment D (§2.2), at the end of income turn 1 (#20 design). -->
		<CardFrame
			title="Futurists"
			portrait="/art/civ/futurists.svg"
			portraitAlt="Futurists civilization portrait"
			editions={['base']}
			complexity={3}
			{state}>
			{#snippet effect()}When you gain this civilization, at setup or
				during the game, jump ahead on every advancement track at once.{/snippet}

			<CardEffectList>
				<CardEffectBox title="Head start"
					>{#snippet symbol()}<span class="rg-card-track-quad"
							><img
								src="/art/track/exploration.svg"
								alt="" /><img
								src="/art/track/science.svg"
								alt="" /><img
								src="/art/track/technology.svg"
								alt="" /><img
								src="/art/track/military.svg"
								alt="" /></span
						>{/snippet}Advance exactly <strong>4 spaces</strong> on each
					of the four tracks, without their benefits, bonuses or landmarks.
					The end of a track is the limit.</CardEffectBox>
				<CardEffectBox title="Supplies"
					>{#snippet symbol()}<span class="rg-card-resource-quad"
							><CardResource symbol="coin" /><CardResource
								symbol="worker" /><CardResource
								symbol="food" /><CardResource
								symbol="culture" /></span
						>{/snippet}Gain 1 of each resource.</CardEffectBox>
			</CardEffectList>
			<CardClarity>
				A landmark you jump past stays on its track; you gain it only by
				later advancing onto its space.{#snippet setup()}Current rules:
					at the end of your first income turn, lose 1 culture and 1
					other resource of your choice.{/snippet}</CardClarity>
		</CardFrame>
	{:else if id === 'heralds'}
		<!-- 02-base-content §1.2; current rules' adjustment D (§2.2), at the end of income turn 1 (#20 design). -->
		<CardFrame
			title="Heralds"
			portrait="/art/civ/heralds.svg"
			portraitAlt="Heralds civilization portrait"
			editions={['base']}
			complexity={1}
			{state}>
			{#snippet effect()}At the start of income turns 2–5, you may move
				one of these tokens onto a When Played tapestry card, yours or
				an opponent&#x27;s, and gain its benefit.{/snippet}

			<CardTokenReserve
				count={4}
				used={state === 'play' ? 1 : 0} />
			<CardEffectList>
				<CardEffectBox title="Copy a card"
					>{#snippet symbol()}<span
							class="rg-card-mini-card rg-card-mini-card--tapestry"
							><img
								src="/art/tapestry/renaissance.svg"
								alt="" /></span
						>{/snippet}Only the top card of a slot can be chosen,
					and each card holds at most one token.</CardEffectBox>
				<CardEffectBox title="Started with the Heralds"
					>{#snippet symbol()}<span
							class="rg-card-mini-card rg-card-mini-card--tapestry rg-card-era-numeral"
							title="Maker of Fire, era I"><b>I</b></span
						>{/snippet}At the end of your first income turn, you may
					play a tapestry card on top of Maker of Fire.</CardEffectBox>
			</CardEffectList>
			<CardClarity>
				{#snippet setup()}Current rules: instead, at the end of your
					first income turn draw tapestry cards until you find a When
					Played card, and discard the others. You may play that card
					on Maker of Fire, unless it is Renaissance.{/snippet}</CardClarity>
		</CardFrame>
	{:else if id === 'nomads'}
		<!-- 02-base-content §1.2; no adjustment in either version (§2.2). -->
		<CardFrame
			title="Nomads"
			portrait="/art/civ/nomads.svg"
			portraitAlt="Nomads civilization portrait"
			editions={['base']}
			complexity={3}
			{state}>
			{#snippet effect()}Whenever you gain a building or a landmark, you
				may place it on the map instead of in your capital, in one of
				two ways.{/snippet}

			<CardEffectList>
				<CardEffectBox title="Your territory with one item"
					>{#snippet symbol()}<span class="rg-card-trader-hex"
							><img
								src="/art/piece/outpost-blue.svg"
								alt="" /></span
						>{/snippet}Place it beside the one outpost or building
					there and gain
					<strong
						>+ <CardResource
							symbol="any"
							fine /></strong
					>. Opponents can no longer conquer that territory.</CardEffectBox>
				<CardEffectBox title="Empty territory next to yours"
					>{#snippet symbol()}<span class="rg-card-trader-hex"></span
						>{/snippet}Place it there to take control. This is not a
					conquest; if an opponent conquers the territory, the piece
					counts as an outpost.</CardEffectBox>
			</CardEffectList>
			<CardClarity>
				Buildings on the map still count for VP per building.
			</CardClarity>
		</CardFrame>
	{:else if id === 'the-chosen'}
		<!-- 02-base-content §1.2; current rules' adjustment (§2.2): +15 VP per opponent. -->
		<CardFrame
			title="The Chosen"
			portrait="/art/civ/the-chosen.svg"
			portraitAlt="The Chosen civilization portrait"
			editions={['base']}
			complexity={2}
			{state}>
			{#snippet effect()}At the start of income turns 2–5, gain VP for the
				tracks you lead and resources for your achievements.{/snippet}

			<CardEffectList>
				<CardEffectBox title="Each track you lead"
					>{#snippet symbol()}<span class="rg-card-track-quad"
							><img
								src="/art/track/exploration.svg"
								alt="" /><img
								src="/art/track/science.svg"
								alt="" /><img
								src="/art/track/technology.svg"
								alt="" /><img
								src="/art/track/military.svg"
								alt="" /></span
						>{/snippet}Gain <strong>1 VP per opponent</strong> for each
					track you have completed, or on which no token is further advanced
					than yours.</CardEffectBox>
				<CardEffectBox
					title="Each achievement"
					gain="any"
					>Gain any resource for each achievement you have earned. On
					your final income turn, gain <strong>5 VP</strong> per achievement
					instead.</CardEffectBox>
			</CardEffectList>
			<CardClarity>
				A track where another token is level with yours still counts.{#snippet setup()}Setup,
					current rules: start with 15 VP per opponent.{/snippet}</CardClarity>
		</CardFrame>
	{:else}
		<!-- A civilization without a reviewed layout yet: its frame, portrait and name, and no invented rules text. -->
		<CardFrame
			title={civilizationName(id)}
			portrait="/art/civ/{id}.svg"
			portraitAlt=""
			editions={[edition]}
			{state}>
			{#snippet effect()}
				<span class="rg-civilization-card--missing"
					>The full card is on its way.</span>
			{/snippet}
		</CardFrame>
	{/if}
</div>
