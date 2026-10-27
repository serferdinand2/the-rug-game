<!-- Library section: Tabs as the play page's right-panel tabs, with the hand count and a panel for each tab. -->
<script>
	import Button from '../../../lib/components/ui/Button.svelte';
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

	/** The player area's tabs, as the game labels them. */
	const PLAYER_TABS = [
		{ id: 'capital', label: 'Capital' },
		{ id: 'hand', label: 'Hand', count: 2 },
		{ id: 'income', label: 'Income' },
		{ id: 'eras', label: 'Eras' },
		{ id: 'civ', label: 'Civ' },
		{ id: 'tech', label: 'Tech' },
		{ id: 'terrain', label: 'Terrain' },
	];

	let tab = $state('capital');
	let selected = $derived(TABS.find((item) => item.id === tab));
	let tightTab = $state('capital');
	let narrowTab = $state('capital');
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
	<Example
		label={'--rg-tabs-padding="var(--space-2)" --rg-tabs-gap="var(--space-1)"  (the player area under 420px wide, here 341px as at 1366×768)'}
		surface="surface">
		<div style:width="341px">
			<Tabs
				--rg-tabs-padding="var(--space-2)"
				--rg-tabs-gap="var(--space-1)"
				label="A tightened tab row"
				tabs={PLAYER_TABS}
				bind:value={tightTab} />
		</div>
	</Example>
	<Example
		label={`value="${narrowTab}"  (a row wider than its place scrolls; Select Terrain picks it from outside, as a decision does)`}
		surface="surface"
		width={300}>
		<Tabs
			label="A narrow tab row"
			tabs={TABS}
			bind:value={narrowTab} />
		<div
			style:padding="var(--space-9) var(--space-2) 0"
			style:color="var(--muted)">
			<Button
				size="small"
				onButtonClick={() => (narrowTab = 'terrain')}
				>Select Terrain</Button>
		</div>
	</Example>
</Section>
