<!-- Library section: PlayerCard for the four overview players, with selectable civilization, capital and tech rows. -->
<script>
	import PlayerCard from '../../../lib/components/player/PlayerCard.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	/** The four players of the overview mockup. */
	const PLAYERS = [
		{
			name: 'You',
			seat: /** @type {const} */ (1),
			vp: 37,
			you: true,
			host: true,
			civilization: 'Alchemists',
			era: 3,
			resources: { coin: 2, food: 3, worker: 4, culture: 1 },
			tracks: { exploration: 4, science: 2, technology: 5, military: 3 },
			handSize: 4,
			capitalPoints: 12,
			tech: 2,
			terrain: ['Mountain', 'Forest'],
		},
		{
			name: 'Ana',
			seat: /** @type {const} */ (2),
			vp: 41,
			civilization: 'Militants',
			era: 3,
			resources: { coin: 4, food: 2, worker: 1, culture: 0 },
			tracks: { exploration: 2, science: 1, technology: 0, military: 6 },
			handSize: 3,
			capitalPoints: 15,
			tech: 1,
			terrain: ['Desert', 'Grassland'],
		},
		{
			name: 'Marko',
			seat: /** @type {const} */ (3),
			vp: 33,
			civilization: 'Nomads',
			era: 2,
			resources: { coin: 1, food: 5, worker: 2, culture: 1 },
			tracks: { exploration: 5, science: 3, technology: 2, military: 4 },
			handSize: 5,
			capitalPoints: 8,
			tech: 3,
			terrain: ['Forest', 'Grassland'],
		},
		{
			name: 'Vera',
			seat: /** @type {const} */ (4),
			vp: 29,
			civilization: 'Futurists',
			era: 2,
			resources: { coin: 3, food: 1, worker: 3, culture: 2 },
			tracks: { exploration: 1, science: 6, technology: 3, military: 2 },
			handSize: 4,
			capitalPoints: 10,
			tech: 4,
			terrain: ['Mountain', 'Desert'],
		},
	];

	/** One row is selected across all four cards, as in the overview. @type {{ seat: number, row: 'civilization' | 'capital' | 'tech' } | null} */
	let selection = $state({ seat: 2, row: 'capital' });

	/**
	 * @param {number} seat
	 * @param {import('../../../lib/component-event.js').ComponentEvent} event
	 */
	const select = (seat, event) => {
		selection =
			selection?.seat === seat && selection.row === event.value
				? null
				: { seat, row: event.value };
	};
</script>

<Section
	name="PlayerCard"
	area="player"
	description="A player's card in the players overview, bordered in their colour: name and VP, civilization and era, resources, a thin guide per track with the space reached, then hand size, capital points, tech and terrain. Civilization, Capital and Tech are selectable rows; the rest are not clickable.">
	<Example
		label={`selected=${selection ? `"${selection.row}" on seat ${selection.seat}` : '{null}'}  (click Civilization, Capital or Tech)`}
		surface="chrome"
		wide>
		<div
			style:display="grid"
			style:grid-template-columns="repeat(4, 268px)"
			style:gap="var(--space-7)">
			{#each PLAYERS as player (player.seat)}
				<PlayerCard
					{...player}
					selected={selection?.seat === player.seat
						? selection.row
						: null}
					onPlayerCardSelect={(
						/** @type {import('../../../lib/component-event.js').ComponentEvent} */ event
					) => select(player.seat, event)} />
			{/each}
		</div>
	</Example>
	<Example
		label={'you host selected="civilization"'}
		surface="chrome"
		width={300}>
		<PlayerCard
			{...PLAYERS[0]}
			selected="civilization" />
	</Example>
	<Example
		label={'selected="tech"'}
		surface="chrome"
		width={300}>
		<PlayerCard
			{...PLAYERS[3]}
			selected="tech" />
	</Example>
	<Example
		label={'selected={null}'}
		surface="chrome"
		width={300}>
		<PlayerCard {...PLAYERS[2]} />
	</Example>
</Section>
