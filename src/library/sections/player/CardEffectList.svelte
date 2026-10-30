<!-- Library section: CardEffectList, a card's column of effect boxes (#106). -->
<script>
	import CardEffectBox from '../../../lib/components/player/CardEffectBox.svelte';
	import CardEffectList from '../../../lib/components/player/CardEffectList.svelte';
	import CardFrame from '../../../lib/components/player/CardFrame.svelte';
	import Section from '../../Section.svelte';
	import Example from '../../Example.svelte';
</script>

<Section
	name="CardEffectList"
	area="player"
	description="A card's triggered and scoring effects: CardEffectBox rows 8 px apart inside the card's 12 px inset. See docs/ui/card-design-rules.md."
	><Example
		label="children"
		width={425}
		><CardFrame plain>
			<CardEffectList>
				<CardEffectBox
					title="Place a token"
					gain="any"
					symbolText={13}
					>Gain any resource. With two tokens on it, that territory
					cannot be conquered.</CardEffectBox>
			</CardEffectList>
		</CardFrame></Example
	><Example
		label={'above={14}'}
		width={425}
		><CardFrame plain>
			<CardEffectList above={14}>
				<CardEffectBox
					title="First time reached"
					gain="any"
					symbolText={15}
					>Gain one resource of your choice when you first reach each
					predicted number.</CardEffectBox>
				<CardEffectBox
					title="Final income turn"
					label="10 VP"
					symbolText={15}
					>Score 10 VP for each category predicted exactly.</CardEffectBox>
			</CardEffectList>
		</CardFrame></Example
	></Section>
