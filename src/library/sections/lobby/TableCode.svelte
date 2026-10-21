<!-- Library section: TableCode, the lobby's read-only code with COPY. -->
<script>
	import TableCode from '../../../lib/components/lobby/TableCode.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	/** @typedef {import('../../../lib/component-event.js').ComponentEvent} ComponentEvent */

	let copied = $state('');

	/**
	 * @param {ComponentEvent} event
	 */
	const copyHandler = (event) => {
		copied = event.value.code;
	};
</script>

<Section
	name="TableCode"
	area="lobby"
	description="The table code in the lobby's top panel: a read-only gold field that selects itself on focus, and COPY, which reports the code so the page can copy it and confirm.">
	<Example
		label={`code="DAWN2048"${copied ? `  · onTableCodeCopy → ${copied}` : ''}`}
		surface="chrome">
		<TableCode
			code="DAWN2048"
			onTableCodeCopy={copyHandler} />
	</Example>
</Section>
