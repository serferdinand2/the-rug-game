<!-- Library section: PlayerChip for each seat, as the current player, filled while the players overview is open, and with its civilization's ability on hover (#42). -->
<script>
	import PlayerChip from '../../../lib/components/player/PlayerChip.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
	import { civAbilityText } from '../../../lib/cards/civ-rules.js';

	/** @type {{ name: string, civilization: string, vp: number, seat: import('../../../lib/ui.js').Seat }[]} */
	const PLAYERS = [
		{ name: 'You', civilization: 'Alchemists', vp: 37, seat: 1 },
		{ name: 'Ana', civilization: 'Militants', vp: 41, seat: 2 },
		{ name: 'Marko', civilization: 'Nomads', vp: 33, seat: 3 },
		{ name: 'Vera', civilization: 'Futurists', vp: 29, seat: 4 },
	];

	let open = $state(false);
</script>

<Section
	name="PlayerChip"
	area="player"
	description="A header chip per player: a square in their colour, their name, civilization and VP. The current player glows green. While the players overview is open, the colour slides across every chip and the text hides, at the same size.">
	<Example
		label={`filled={${open}}  (click any chip)`}
		surface="chrome"
		wide>
		<div
			style:display="flex"
			style:gap="var(--space-4)">
			{#each PLAYERS as player (player.seat)}
				<PlayerChip
					{...player}
					current={player.seat === 1}
					filled={open}
					onPlayerChipClick={() => (open = !open)} />
			{/each}
		</div>
	</Example>
	{#each PLAYERS as player (player.seat)}
		<Example
			label={`seat={${player.seat}}${player.seat === 1 ? ' current' : ''}`}
			surface="chrome">
			<PlayerChip
				{...player}
				current={player.seat === 1} />
		</Example>
	{/each}
	<Example
		label={"ability={civAbilityText('militants', 'current')}  (hover: the tooltip reads the civilization's full ability; #42)"}
		surface="chrome">
		<PlayerChip
			{...PLAYERS[1]}
			ability={civAbilityText('militants', 'current') ?? undefined} />
	</Example>
	<Example
		label={'seat={1} current filled'}
		surface="chrome">
		<PlayerChip
			{...PLAYERS[0]}
			current
			filled />
	</Example>
	{#each PLAYERS.slice(1) as player (player.seat)}
		<Example
			label={`seat={${player.seat}} filled`}
			surface="chrome">
			<PlayerChip
				{...player}
				filled />
		</Example>
	{/each}
</Section>
