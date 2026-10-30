<!-- Library section: CardEffectBox, a beige trigger or scoring row with its symbol (#106). -->
<script>
	import CardEffectBox from '../../../lib/components/player/CardEffectBox.svelte';
	import CardResource from '../../../lib/components/player/CardResource.svelte';
	import CardFrame from '../../../lib/components/player/CardFrame.svelte';
	import Section from '../../Section.svelte';
	import Example from '../../Example.svelte';
</script>

<Section
	name="CardEffectBox"
	area="player"
	description="A triggered or scoring effect: a 64 px symbol (a gained resource, a word or a pictogram), then its title in capitals and its rules. See docs/ui/card-design-rules.md."
	><Example
		label={'title gain="any" symbolText={15}'}
		width={425}
		><CardFrame plain>
			<CardEffectBox
				title="First time reached"
				gain="any"
				symbolText={15}
				>Gain one resource of your choice when you first reach each
				predicted number.</CardEffectBox>
		</CardFrame></Example
	><Example
		label={'title label="BUST" symbolText={14}'}
		width={425}
		><CardFrame plain>
			<CardEffectBox
				title="Roll a marked track again"
				label="BUST"
				symbolText={14}
				>Clear all tokens and gain + <CardResource symbol="any" /> instead.</CardEffectBox>
		</CardFrame></Example
	><Example
		label={'title label="Top row" symbolText={12}'}
		width={425}
		><CardFrame plain>
			<CardEffectBox
				title="When their marked card reaches the top"
				label="Top row"
				symbolText={12}
				>They gain the benefit first, then you take the card into your
				bottom row.</CardEffectBox>
		</CardFrame></Example
	><Example
		label="title, a symbol snippet"
		width={425}
		><CardFrame plain>
			<CardEffectBox title="Supplies"
				>{#snippet symbol()}<span class="rg-card-resource-quad"
						><CardResource symbol="coin" /><CardResource
							symbol="worker" /><CardResource
							symbol="food" /><CardResource
							symbol="culture" /></span
					>{/snippet}Gain 1 of each resource.</CardEffectBox>
		</CardFrame></Example
	></Section>
