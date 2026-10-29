<!-- Library section: SettingRow holding the lobby's Rules, Expansions, Map and two Yes/No settings, one divided. -->
<script>
	import SettingRow from '../../../lib/components/lobby/SettingRow.svelte';
	import Segmented from '../../../lib/components/ui/Segmented.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	// The settings' left column is about 556px wide in the 1000px lobby, the right one about 400px; the stage adds 34px.
	const LEFT_WIDTH = 590;
	const RIGHT_WIDTH = 434;

	let rules = $state('current');
	let expansions = $state(['arts-architecture']);
	let map = $state('random');
	let draft = $state('no');
	let tapestryDraft = $state('yes');
</script>

<Section
	name="SettingRow"
	area="lobby"
	description="One table setting on a single line: the title, a thin rule that fills the gap, then the choices at the right.">
	<Example
		label={'label="Rules"'}
		surface="chrome"
		width={LEFT_WIDTH}>
		<SettingRow label="Rules">
			<Segmented
				label="Rules"
				options={[
					{
						value: 'current',
						label: 'Current rules',
						color: 'var(--science)',
					},
					{
						value: 'original',
						label: 'Original 2019',
						color: 'var(--technology)',
					},
				]}
				bind:value={rules} />
		</SettingRow>
	</Example>
	<Example
		label={'label="Expansions"'}
		surface="chrome"
		width={LEFT_WIDTH}>
		<SettingRow label="Expansions">
			<Segmented
				label="Expansions"
				multiple
				options={[
					{
						value: 'arts-architecture',
						label: 'Arts & Architecture',
						color: 'var(--arts-architecture)',
					},
					{
						value: 'plans-ploys',
						label: 'Plans & Ploys',
						color: 'var(--plans-ploys)',
					},
					{
						value: 'fantasies-futures',
						label: 'Fantasies & Futures',
						color: 'var(--fantasies-futures)',
					},
				]}
				bind:value={expansions} />
		</SettingRow>
	</Example>
	<Example
		label={'label="Map"'}
		surface="chrome"
		width={LEFT_WIDTH}>
		<SettingRow label="Map">
			<Segmented
				label="Map"
				options={[
					{
						value: 'random',
						label: 'Random map',
						color: 'var(--gold)',
					},
					{
						value: 'archipelago',
						label: 'Archipelago',
						color: 'var(--exploration)',
					},
					{
						value: 'continents',
						label: 'Continents',
						color: 'var(--science)',
					},
				]}
				bind:value={map} />
		</SettingRow>
	</Example>
	<Example
		label={'label="Landmarks draft"'}
		surface="chrome"
		width={RIGHT_WIDTH}>
		<SettingRow label="Landmarks draft">
			<Segmented
				label="Landmarks draft"
				options={[
					{ value: 'yes', label: 'Yes', color: 'var(--technology)' },
					{ value: 'no', label: 'No', color: 'var(--text)' },
				]}
				bind:value={draft} />
		</SettingRow>
	</Example>
	<Example
		label={'label="Tapestry draft" divided  (a soft rule under the row, as between the variants in the lobby)'}
		surface="chrome"
		width={RIGHT_WIDTH}>
		<SettingRow
			label="Tapestry draft"
			divided>
			<Segmented
				label="Tapestry draft"
				options={[
					{ value: 'yes', label: 'Yes', color: 'var(--science)' },
					{ value: 'no', label: 'No', color: 'var(--text)' },
				]}
				bind:value={tapestryDraft} />
		</SettingRow>
	</Example>
</Section>
