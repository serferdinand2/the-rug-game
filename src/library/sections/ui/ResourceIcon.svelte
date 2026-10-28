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
	description="The only native resource artwork sizes are 24×24 and 48×48. Small 16px display slots scale the 24px source. Both native sets preserve the supplied opaque colors and transparent background; the former 32px set is deprecated.">
	{#each RESOURCES as resource (resource.id)}
		<Example
			label={`symbol="${resource.id}" · native 24px / native 48px`}
			surface="chrome">
			<ResourceIcon
				symbol={resource.id}
				size="medium" />
			<ResourceIcon
				symbol={resource.id}
				size="large" />
		</Example>
	{/each}
	<Example
		label={'symbol="any" · native 24px / native 48px'}
		surface="chrome">
		<ResourceIcon
			symbol="any"
			size="medium" />
		<ResourceIcon
			symbol="any"
			size="large" />
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
