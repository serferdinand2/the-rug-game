<!-- Library section: Tabs as the play page's right-panel tabs, with the hand count, the panel it draws, its own ids and its autofocus. -->
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
	let rulesTab = $state('capital');
	let areaTab = $state('income');
	let focusShown = $state(false);
	let focusTab = $state('hand');
</script>

<Section
	name="Tabs"
	area="ui"
	description="The right panel's tabs and the selected tab's panel. Labels are bold in both states, so nothing moves when the selection changes; the arrow keys, Home and End move between them. Every id starts with the row's own prefix.">
	<Example
		label={`value="${tab}"  (click a tab, or use the arrow keys)`}
		surface="surface"
		width={480}>
		<Tabs
			label="Your city and cards"
			tabs={TABS}
			bind:value={tab}>
			<p
				style:margin="0"
				style:padding="var(--space-9) var(--space-2) 0"
				style:color="var(--muted)">
				The {selected?.label} tab's panel, drawn by Tabs from its children.
			</p>
		</Tabs>
	</Example>
	<Example
		label={'Two rows with the same tab ids, as How to play over the player area: each takes its own $props.id() prefix, so no id repeats'}
		surface="surface"
		width={480}>
		<Tabs
			label="How to play"
			tabs={TABS.slice(0, 3)}
			bind:value={rulesTab}>
			<p
				style:margin="0"
				style:padding="var(--space-6) var(--space-2)"
				style:color="var(--muted)">
				How to play's panel.
			</p>
		</Tabs>
		<Tabs
			label="The player area"
			tabs={TABS.slice(0, 3)}
			bind:value={areaTab}>
			<p
				style:margin="0"
				style:padding="var(--space-6) var(--space-2) 0"
				style:color="var(--muted)">
				The player area's panel.
			</p>
		</Tabs>
	</Example>
	<Example
		label={`idPrefix="rules" autofocus  (ids rules-${focusTab}-tab and rules-${focusTab}-panel; press Draw: the selected tab takes the focus)`}
		surface="surface"
		width={480}>
		<Button
			size="small"
			onButtonClick={() => (focusShown = !focusShown)}
			>{focusShown ? 'Remove' : 'Draw'}</Button>
		{#if focusShown}
			<Tabs
				idPrefix="rules"
				label="A row that takes the focus"
				tabs={TABS.slice(0, 3)}
				bind:value={focusTab}
				autofocus>
				<p
					style:margin="0"
					style:padding="var(--space-6) var(--space-2) 0"
					style:color="var(--muted)">
					The selected tab has the focus; the arrow keys move on.
				</p>
			</Tabs>
		{/if}
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
		label={`value="${narrowTab}"  (a row wider than its place scrolls; Select Terrain picks it from outside, as a decision does; without children, no panel)`}
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
