<!-- Library section: TechRows fanned as in Your area's Tech tab and wrapped as in the players overview, with cards and empty. -->
<script>
	import TechRows from '../../../lib/components/player/TechRows.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	/** @typedef {import('../../../lib/component-event.js').ComponentEvent} ComponentEvent */

	const TECH = { top: ['clocks'], middle: [], bottom: ['barn', 'bakery'] };
	const NONE = { top: [], middle: [], bottom: [] };

	/** @type {string | null} */
	let inspected = $state(null);
</script>

<Section
	name="TechRows"
	area="player"
	description="A player's three tech rows, top first, named by TECH_ROWS (src/lib/area/tech-rows.js). The fan layout is Your area's Tech tab: each row under its shape, a CardFan of cards at 0.42 that reports the hovered card, or a box when the row is empty. The wrap layout is the players overview's: plain headings and the cards at 0.4, wrapping. Its root is display: contents, so the parent lays the rows out.">
	<Example
		label={`layout="fan" tech={{ top: ['clocks'], middle: [], bottom: ['barn', 'bakery'] }}  (inspected: ${inspected ?? 'none'})`}
		surface="chrome"
		width={436}>
		<div>
			<TechRows
				tech={TECH}
				onTechRowsInspect={(/** @type {ComponentEvent} */ event) =>
					(inspected = event.value)} />
		</div>
	</Example>
	<Example
		label={'layout="wrap"  (the players overview, in its spaced, centred grid)'}
		surface="chrome"
		width={436}>
		<div
			style:display="grid"
			style:justify-items="center"
			style:gap="var(--space-6)">
			<TechRows
				tech={TECH}
				layout="wrap" />
		</div>
	</Example>
	<Example
		label={'layout="fan" tech={{ top: [], middle: [], bottom: [] }}'}
		surface="chrome"
		width={436}>
		<div>
			<TechRows tech={NONE} />
		</div>
	</Example>
	<Example
		label={'layout="wrap" tech={{ top: [], middle: [], bottom: [] }}'}
		surface="chrome"
		width={436}>
		<div
			style:display="grid"
			style:justify-items="center"
			style:gap="var(--space-6)">
			<TechRows
				tech={NONE}
				layout="wrap" />
		</div>
	</Example>
</Section>
