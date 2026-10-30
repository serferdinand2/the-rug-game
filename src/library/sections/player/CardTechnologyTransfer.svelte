<!-- Library section: CardTechnologyTransfer, a technology card changing owner (#106). -->
<script>
	import CardTechnologyTransfer from '../../../lib/components/player/CardTechnologyTransfer.svelte';
	import CardFrame from '../../../lib/components/player/CardFrame.svelte';
	import Section from '../../Section.svelte';
	import Example from '../../Example.svelte';
</script>

<Section
	name="CardTechnologyTransfer"
	area="player"
	description="A technology card moving from one owner's top row into another's bottom row; when active, a token marks it in both. See docs/ui/card-design-rules.md."
	><Example
		label="from to"
		width={425}
		><CardFrame plain><CardTechnologyTransfer /></CardFrame></Example
	><Example
		label="active"
		width={425}
		><CardFrame plain>
			<CardTechnologyTransfer active />
		</CardFrame></Example
	></Section>
