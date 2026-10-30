<!-- Library section: CardTechnologyTransfer, a technology card changing owner (#106). -->
<script>
	import CardTechnologyTransfer from '../../../lib/components/player/CardTechnologyTransfer.svelte';
	import Section from '../../Section.svelte';
	import Example from '../../Example.svelte';
	import '../../../styles/card-patterns.css';
</script>

<Section
	name="CardTechnologyTransfer"
	area="player"
	description="A technology card moving from one owner's top row into another's bottom row; when active, a token marks it in both. See docs/ui/card-design-rules.md."
	><Example
		label="from to"
		width={425}
		><div class="rg-card-frame"><CardTechnologyTransfer /></div></Example
	><Example
		label="active"
		width={425}
		><div class="rg-card-frame">
			<CardTechnologyTransfer active />
		</div></Example
	></Section>
