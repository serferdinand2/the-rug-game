<!-- Library section: CardPlacementRows, the five placement layouts (#106). -->
<script>
	import CardPlacementRows from '../../../lib/components/player/CardPlacementRows.svelte';
	import Section from '../../Section.svelte';
	import Example from '../../Example.svelte';
	import '../../../styles/card-patterns.css';

	/** @typedef {import('../../../lib/component-event.js').ComponentEvent} ComponentEvent */
	/** @typedef {import('../../../lib/ui.js').CostSymbol} CostSymbol */

	/** @type {{ name: string, picture: string, placed?: string, large?: boolean, facedown?: boolean, gain: CostSymbol, collected?: boolean }[]} */
	const COLLECTION = [
		{
			name: 'Outpost*',
			picture: '/art/piece/outpost.svg',
			placed: '/art/piece/outpost-blue.svg',
			large: true,
			gain: 'any',
			collected: true,
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
			collected: true,
		},
	];
	/** @type {{ id: string, gain?: CostSymbol, vp?: number, exposed?: boolean }[]} */
	const COVERED = [
		{ id: 'top0', gain: 'coin', exposed: true },
		{ id: 'top1', vp: 2 },
		{ id: 'top2', gain: 'food' },
		{ id: 'top3', vp: 4 },
		{ id: 'bottom0', vp: 1, exposed: true },
		{ id: 'bottom1', gain: 'worker' },
		{ id: 'bottom2', vp: 3 },
		{ id: 'bottom3', gain: 'culture' },
	];
	const TRACKS = ['exploration', 'technology', 'science', 'military'].map(
		(track, index) => ({
			id: track,
			name: track[0].toUpperCase() + track.slice(1),
			picture: `/art/track/${track}.svg`,
			rolled: index === 0,
			used: index === 0,
		})
	);
	/** @type {{ id: string, gain?: CostSymbol, vp?: number, exposed?: boolean }[]} */
	const HISTORY = [
		{ id: 'square0', vp: 3, exposed: true },
		{ id: 'square1', gain: 'food' },
		{ id: 'square2', gain: 'worker' },
		{ id: 'square3', vp: 3 },
	];
	let picked = $state('science');

	/** @param {ComponentEvent} event */
	const pickHandler = (event) => {
		picked = event.value;
	};
</script>

<Section
	name="CardPlacementRows"
	area="player"
	description="A card's placement squares in five reviewed layouts, each item's state a field: the Collectors' collection (greyed until collected; cards and tiles then lie face down), the Militants' covered rewards (an outpost lifts to show its reward), the Alchemists' rolled tracks, the Leaders' once-only tracks and the Historians' squares under the player's tokens. The spots a decision offers are buttons, the picked one gold. See docs/ui/card-design-rules.md."
	><Example
		label={'kind="collection" items, two collected'}
		width={425}
		><div class="rg-card-frame">
			<CardPlacementRows
				kind="collection"
				items={COLLECTION} />
		</div></Example
	><Example
		label={'kind="covered" items, two exposed'}
		width={425}
		><div class="rg-card-frame">
			<CardPlacementRows
				kind="covered"
				items={COVERED} />
		</div></Example
	><Example
		label={'kind="tracks" items, one rolled'}
		width={425}
		><div class="rg-card-frame">
			<CardPlacementRows
				kind="tracks"
				items={TRACKS} />
		</div></Example
	><Example
		label={`kind="leaders" items, one used, choices={['science', 'military']} picked="${picked}"`}
		width={425}
		><div class="rg-card-frame">
			<CardPlacementRows
				kind="leaders"
				items={TRACKS}
				choices={['science', 'military']}
				{picked}
				onCardPlacementRowsPick={pickHandler} />
		</div></Example
	><Example
		label={'kind="history" seat={3} items, one exposed'}
		width={425}
		><div class="rg-card-frame">
			<CardPlacementRows
				kind="history"
				seat={3}
				items={HISTORY} />
		</div></Example
	></Section>
