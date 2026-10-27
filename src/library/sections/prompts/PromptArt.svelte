<!-- Library section: PromptArt, the pictures a decision prompt shows, one example for every kind. -->
<script>
	import PromptArt from '../../../lib/components/prompts/PromptArt.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	/** @type {{ label: string, item: import('../../../lib/components/prompts/PromptArt.svelte').PromptArtItem }[]} */
	const KINDS = [
		{
			label: 'resource, count 1',
			item: { kind: 'resource', id: 'food', count: 1 },
		},
		{
			label: 'resource, count 3',
			item: { kind: 'resource', id: 'coin', count: 3 },
		},
		{ label: 'track', item: { kind: 'track', id: 'science' } },
		{ label: 'building', item: { kind: 'building', id: 'market' } },
		{ label: 'landmark', item: { kind: 'landmark', id: 'lighthouse' } },
		{ label: 'terrain', item: { kind: 'terrain', id: 'forest' } },
		{ label: 'civ', item: { kind: 'civ', id: 'collectors' } },
		{ label: 'space-tile', item: { kind: 'space-tile', id: 1 } },
		{
			label: 'territory, turned 2',
			item: { kind: 'territory', id: 17, orient: 2 },
		},
		{ label: 'mat', item: { kind: 'mat', id: 1 } },
		{ label: 'vp', item: { kind: 'vp', count: 5 } },
		{ label: 'deck', item: { kind: 'deck', id: 'tech', count: 12 } },
		{ label: 'tapestry', item: { kind: 'tapestry', id: 'academia' } },
		{ label: 'tech', item: { kind: 'tech', id: 'clocks' } },
	];
</script>

<Section
	name="PromptArt"
	area="prompts"
	description="One picture in a decision prompt, drawn at 48px (large) or 24px (medium). Decorative: the option's words name it. Resources show a count badge above 1; territories are turned as they would lie on the map.">
	{#each KINDS as kind (kind.label)}
		<Example
			label={`item=${kind.label}`}
			surface="chrome">
			<PromptArt item={kind.item} />
		</Example>
	{/each}
	<Example
		label={`size="medium"`}
		surface="chrome">
		<PromptArt
			item={{ kind: 'resource', id: 'worker', count: 2 }}
			size="medium" />
		<PromptArt
			item={{ kind: 'track', id: 'military' }}
			size="medium" />
		<PromptArt
			item={{ kind: 'vp', count: 3 }}
			size="medium" />
	</Example>
</Section>
