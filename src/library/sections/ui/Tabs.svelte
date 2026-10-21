<!-- Library section: Tabs as the play page's right-panel tabs, with the hand count and a panel for each tab. -->
<script>
	import Tabs from '../../../lib/components/ui/Tabs.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	const TABS = [
		{ id: 'capital', label: 'Capital' },
		{ id: 'hand', label: 'Hand', count: 4 },
		{ id: 'income', label: 'Income' },
		{ id: 'civilization', label: 'Civilization' },
		{ id: 'technology', label: 'Technology' },
		{ id: 'terrain', label: 'Terrain' },
	];

	let tab = $state('capital');
	let selected = $derived(TABS.find((item) => item.id === tab));
</script>

<Section
	name="Tabs"
	area="ui"
	description="The right panel's tabs. Labels are bold in both states, so nothing moves when the selection changes; the arrow keys, Home and End move between them.">
	<Example
		label={`value="${tab}"  (click a tab, or use the arrow keys)`}
		surface="surface"
		width={480}>
		<Tabs
			label="Your city and cards"
			tabs={TABS}
			bind:value={tab} />
		<div
			role="tabpanel"
			tabindex="0"
			id="{tab}-panel"
			aria-labelledby="{tab}-tab"
			style:padding="var(--space-9) var(--space-2) 0"
			style:color="var(--muted)">
			The {selected?.label} tab's panel.
		</div>
	</Example>
</Section>
