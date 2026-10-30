<!-- Library section: CardResource, the native 24 px resource icon in card text (#106). -->
<script>
	import CardResource from '../../../lib/components/player/CardResource.svelte';
	import CardFrame from '../../../lib/components/player/CardFrame.svelte';
	import Section from '../../Section.svelte';
	import Example from '../../Example.svelte';
</script>

<Section
	name="CardResource"
	area="player"
	description="A native 24 px resource in card text that leaves the line's height alone; a container centres it differently with --card-resource-center and --card-resource-height. See docs/ui/card-design-rules.md."
	><Example
		label={'symbol="any" | "coin" | "worker" | "food" | "culture"'}
		width={425}
		><CardFrame plain>
			<p style="margin:12px;font-size:15px;line-height:1.38">
				Then gain <CardResource symbol="any" />, or
				<CardResource symbol="coin" />, <CardResource
					symbol="worker" />,
				<CardResource symbol="food" /> and <CardResource
					symbol="culture" />.
			</p>
		</CardFrame></Example
	><Example
		label="fine"
		width={425}
		><CardFrame plain>
			<p style="margin:12px;font-size:11px;line-height:1.3">
				If all its income buildings match, gain <strong
					>+ <CardResource
						symbol="any"
						fine /></strong> in addition to its usual reward.
			</p>
		</CardFrame></Example
	></Section>
