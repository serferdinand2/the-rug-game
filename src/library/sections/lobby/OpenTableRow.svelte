<!-- Library section: OpenTableRow for the launch page's three example tables, a table with two expansions and a base-game table. -->
<script>
	import OpenTableRow from '../../../lib/components/lobby/OpenTableRow.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	/** @typedef {import('../../../lib/component-event.js').ComponentEvent} ComponentEvent */

	// The open-tables panel is 530px wide with 20px of padding; the stage adds 34px.
	const ROW_WIDTH = 524;

	const TABLES = [
		{
			code: 'DAWN2048',
			players: 2,
			rules: 'Current rules',
			expansions: [
				{
					name: 'Arts & Architecture',
					color: 'var(--arts-architecture)',
				},
			],
		},
		{
			code: 'ERA10001',
			players: 3,
			rules: 'Original 2019 rules',
			expansions: [
				{ name: 'Plans & Ploys', color: 'var(--plans-ploys)' },
			],
		},
		{
			code: 'WORLD008',
			players: 1,
			rules: 'Current rules',
			expansions: [
				{
					name: 'Fantasies & Futures',
					color: 'var(--fantasies-futures)',
				},
			],
		},
		{
			code: 'BOTH0003',
			players: 3,
			rules: 'Original 2019 rules',
			expansions: [
				{ name: 'Plans & Ploys', color: 'var(--plans-ploys)' },
				{
					name: 'Arts & Architecture',
					color: 'var(--arts-architecture)',
				},
			],
		},
	];

	let joined = $state('');

	/**
	 * @param {ComponentEvent} event
	 */
	const joinHandler = (event) => {
		joined = event.value.code;
	};
</script>

<Section
	name="OpenTableRow"
	area="lobby"
	description="One open table on the launch page: Join, the table code over five seat boxes that fill from the left in the seats' colours, then the rules and a badge per expansion, each in its own colour.">
	{#each TABLES as table (table.code)}
		<Example
			label={`code="${table.code}" players={${table.players}} rules="${table.rules}" expansions={[${table.expansions.map((expansion) => `{ name: '${expansion.name}', … }`).join(', ')}]}${joined === table.code ? '  · onOpenTableRowJoin' : ''}`}
			surface="chrome"
			width={ROW_WIDTH}>
			<OpenTableRow
				code={table.code}
				players={table.players}
				rules={table.rules}
				expansions={table.expansions}
				onOpenTableRowJoin={joinHandler} />
		</Example>
	{/each}
	<Example
		label={'code="BASE0005" players={5} rules="Current rules" expansions={[]}'}
		surface="chrome"
		width={ROW_WIDTH}>
		<OpenTableRow
			code="BASE0005"
			players={5}
			rules="Current rules" />
	</Example>
</Section>
