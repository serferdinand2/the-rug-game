<!-- Library section: Tooltip (#137) in place, short, long with paragraphs and below its target, and the page's own tooltip over titled controls. -->
<script>
	import Button from '../../../lib/components/ui/Button.svelte';
	import IconButton from '../../../lib/components/ui/IconButton.svelte';
	import Tooltip from '../../../lib/components/ui/Tooltip.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
	import { civAbilityText } from '../../../lib/cards/civ-rules.js';

	const ABILITY = `Ana, Militants, 41 VP\n\n${civAbilityText('militants', 'current')}`;
</script>

<Section
	name="Tooltip"
	area="ui"
	description="Every title on a page shows in one tooltip instead of the browser's small one: a chrome box with a thin border, a float shadow and body text at 15 px, up to 360 px wide, keeping the title's line breaks. It shows after a quarter of a second of hover or keyboard focus, and at once when the pointer moves on from one that shows. It sits above its element, or below near the top of the window, stays inside the window and points its arrow at the element's centre. A press, a key or a scroll that moves the element closes it. App and this page mount it once at the root.">
	<Example
		label={'placement="inline" text="Close the seat"'}
		surface="surface">
		<Tooltip
			placement="inline"
			text="Close the seat" />
	</Example>
	<Example
		label={'placement="inline" side="bottom" text="Turn back (,)"'}
		surface="surface">
		<Tooltip
			placement="inline"
			side="bottom"
			text="Turn back (,)" />
	</Example>
	<Example
		label={'placement="inline" text={…}  (a player chip: the name line, then the civilization\'s ability)'}
		surface="surface"
		wide>
		<Tooltip
			placement="inline"
			text={ABILITY} />
	</Example>
	<Example
		label={'<Tooltip />  (once at the page root; hover or Tab to these)'}
		surface="chrome"
		wide>
		<div class="rg-library-tooltip--row">
			<IconButton
				icon="sound"
				label="Mute" />
			<IconButton
				icon="menu"
				label="Menu" />
			<Button
				mode="secondary"
				title="Only the host changes the table.">Rules</Button>
			<Button
				mode="primary"
				title={ABILITY}>Ana</Button>
		</div>
	</Example>
</Section>

<style>
	.rg-library-tooltip--row {
		display: flex;
		align-items: center;
		gap: var(--space-6);
	}
</style>
