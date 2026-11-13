<!-- Library section: DecisionSource, the compact explanation of a decision's public cause. -->
<script>
	import DecisionSource from '../../../lib/components/prompts/DecisionSource.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	/** @type {{kind:string, id:string} | null} */
	let inspected = $state(null);
</script>

<Section
	name="DecisionSource"
	area="prompts"
	description="A decision's public origin, styled consistently in the prompt and action summary: track and space, card, territory, or a plain explanation. Hover or focus a public card name to preview it.">
	<Example label="track and space">
		<DecisionSource
			source={{ kind: 'track', track: 'science', space: 7, name: 'Laboratory', trackName: 'Science' }} />
	</Example>
	<Example label="territory tile">
		<DecisionSource
			source={{ kind: 'territory', prefix: 'From territory ', name: 'tile 12 (Northwest)' }} />
	</Example>
	<Example label="public card source; hover or focus to preview">
		<DecisionSource
			source={{ kind: 'named', prefix: 'From ', name: 'Bakery', suffix: ' technology · square benefit', inspect: { kind: 'tech', id: 'bakery' } }}
			onDecisionSourceInspect={(
				/** @type {import('../../../lib/component-event.js').ComponentEvent} */ event
			) => (inspected = event.value)} />
		<span>Preview: {inspected ? `${inspected.kind}/${inspected.id}` : 'none'}</span>
	</Example>
	<Example label="plain source">
		<DecisionSource source={{ kind: 'plain', text: 'From completing a row in your capital' }} />
	</Example>
</Section>
