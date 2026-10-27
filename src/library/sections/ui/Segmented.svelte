<!-- Library section: Segmented as the lobby's tinted settings and filled mode switch, single and multiple, and disabled. -->
<script>
	import Segmented from '../../../lib/components/ui/Segmented.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	let mode = $state('online');
	let rules = $state('current');
	let expansions = $state(['arts-architecture']);
	let draft = $state('no');
</script>

<Section
	name="Segmented"
	area="ui"
	description="A row of choices shown as pressed buttons: the lobby's mode switch (filled) and its settings (tinted), one choice or several. Disabled, it is shown but not choosable, as the settings are for a player who doesn't host.">
	<Example
		label={`variant="filled" value="${mode}"`}
		surface="chrome">
		<Segmented
			label="Mode"
			variant="filled"
			options={[
				{
					value: 'online',
					label: 'Online mode',
					color: 'var(--exploration)',
				},
				{
					value: 'local',
					label: 'Local mode',
					color: 'var(--exploration)',
				},
			]}
			bind:value={mode} />
	</Example>
	<Example
		label={`value="${rules}"`}
		surface="chrome">
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
	</Example>
	<Example
		label={`multiple value={${JSON.stringify(expansions)}}`}
		surface="chrome">
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
	</Example>
	<Example
		label={`value="${draft}"`}
		surface="chrome">
		<Segmented
			label="Landmarks draft"
			options={[
				{ value: 'yes', label: 'Yes', color: 'var(--technology)' },
				{ value: 'no', label: 'No', color: 'var(--military)' },
			]}
			bind:value={draft} />
	</Example>
	<Example
		label={'disabled value="online"  (a guest, or the host once a friend has joined)'}
		surface="chrome">
		<Segmented
			label="Mode"
			variant="filled"
			disabled
			title="Only the host changes the mode, while alone at the table."
			options={[
				{
					value: 'online',
					label: 'Online mode',
					color: 'var(--exploration)',
				},
				{
					value: 'local',
					label: 'Local mode',
					color: 'var(--exploration)',
				},
			]}
			value="online" />
	</Example>
</Section>
