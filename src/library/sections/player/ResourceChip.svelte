<!-- Library section: ResourceChip for each resource, as a player card lists them. -->
<script>
	import ResourceChip from '../../../lib/components/player/ResourceChip.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
	import { RESOURCES } from '../../../lib/ui.js';

	/** @type {Record<import('../../../lib/ui.js').ResourceId, number>} */
	const COUNTS = { coin: 2, food: 3, worker: 4, culture: 1 };
</script>

<Section
	name="ResourceChip"
	area="player"
	description="A resource symbol and how many of it a player holds, four to a row on each player card. The symbols are placeholders until the resource icons land.">
	{#each RESOURCES as resource (resource.id)}
		<Example
			label={`resource="${resource.id}" count={${COUNTS[resource.id]}}`}
			surface="chrome"
			width={86}>
			<ResourceChip
				resource={resource.id}
				count={COUNTS[resource.id]} />
		</Example>
	{/each}
	<Example
		label={'count={0}'}
		surface="chrome"
		width={86}>
		<ResourceChip
			resource="culture"
			count={0} />
	</Example>
	<Example
		label="A player card's resource row"
		surface="chrome"
		width={264}>
		<div
			style:display="grid"
			style:grid-template-columns="repeat(4, 1fr)"
			style:gap="var(--space-2)">
			{#each RESOURCES as resource (resource.id)}
				<ResourceChip
					resource={resource.id}
					count={COUNTS[resource.id]} />
			{/each}
		</div>
	</Example>
</Section>
