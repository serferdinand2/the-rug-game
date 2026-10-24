<!-- Library section: ResourceIcon for each resource and "any", at both sizes. -->
<script>
	import ResourceIcon from '../../../lib/components/ui/ResourceIcon.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
	import { RESOURCES } from '../../../lib/ui.js';
</script>

<Section
	name="ResourceIcon"
	area="ui"
	description="Placeholder price symbols until the resource icons land: a square in the resource's colour, or a track's colour in its prices, and a gold diamond for any resource.">
	{#each RESOURCES as resource (resource.id)}
		<Example
			label={`symbol="${resource.id}"`}
			surface="chrome">
			<ResourceIcon symbol={resource.id} />
			<ResourceIcon
				symbol={resource.id}
				size="medium" />
		</Example>
	{/each}
	<Example
		label={'symbol="any"'}
		surface="chrome">
		<ResourceIcon symbol="any" />
		<ResourceIcon
			symbol="any"
			size="medium" />
	</Example>
	<Example
		label={'symbol="food" color="var(--exploration)"'}
		surface="chrome">
		<ResourceIcon
			symbol="food"
			color="var(--exploration)" />
		<ResourceIcon
			symbol="food"
			color="var(--exploration)"
			size="medium" />
	</Example>
</Section>
