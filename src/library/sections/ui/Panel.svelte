<!-- Library section: Panel at each padding, with a title, with a heading row, and with no heading. -->
<script>
	import Panel from '../../../lib/components/ui/Panel.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
</script>

<Section
	name="Panel"
	area="ui"
	description="The chrome panels of the launch and lobby pages: a thin border, square corners and no shadow, with an optional heading.">
	<Example
		label={'title="Open tables" padding="large"'}
		surface="surface"
		width={530}>
		<Panel
			title="Open tables"
			padding="large">
			<p style:margin="0">Three tables are waiting for players.</p>
		</Panel>
	</Example>
	<Example
		label={'title="Players" padding="small" heading={…}'}
		surface="surface"
		width={530}>
		<Panel
			title="Players"
			padding="small">
			{#snippet heading()}
				<h2>Players</h2>
				<span
					style:color="var(--muted)"
					style:font-size="var(--font-size-sm)">2 of 5 joined</span>
			{/snippet}
			<p style:margin="0">The five seats go here.</p>
		</Panel>
	</Example>
	<Example
		label={'padding="medium"'}
		surface="surface"
		width={530}>
		<Panel>
			<p style:margin="0">A panel with no heading.</p>
		</Panel>
	</Example>
</Section>
