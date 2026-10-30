<!-- Library section: CardEffectBox, a beige trigger or scoring row with its symbol (#106), and each pictogram the cards draw (#107). -->
<script>
	import CardEffectBox from '../../../lib/components/player/CardEffectBox.svelte';
	import CardResource from '../../../lib/components/player/CardResource.svelte';
	import CardFrame from '../../../lib/components/player/CardFrame.svelte';
	import Section from '../../Section.svelte';
	import Example from '../../Example.svelte';
	import { artUrl } from '../../../lib/ui.js';

	/**
	 * Each pictogram the cards draw, with the props that make it, its card's title and words.
	 * @type {{ props: string, title: string, pictogram: import('../../../lib/cards/civ-cards.js').CardPictogram, text: string }[]}
	 */
	const PICTOGRAMS = [
		{
			props: "{ kind: 'district' }",
			title: 'Complete a district',
			pictogram: { kind: 'district' },
			text: 'If all its income buildings match, gain one more resource.',
		},
		{
			props: "{ kind: 'lines' }",
			title: 'Score the capital',
			pictogram: { kind: 'lines' },
			text: 'Each complete row or column whose income buildings match is worth +1 VP.',
		},
		{
			props: "{ kind: 'territory' }",
			title: 'Empty territory',
			pictogram: { kind: 'territory' },
			text: 'Gain 1 VP per adjacent opponent-controlled territory.',
		},
		{
			props: "{ kind: 'territory', piece: artUrl('piece/outpost-red') }",
			title: 'One opponent outpost',
			pictogram: {
				kind: 'territory',
				piece: artUrl('piece/outpost-red'),
			},
			text: 'Gain the benefit printed on its territory tile, if it has one.',
		},
		{
			props: "{ kind: 'tracks' }",
			title: 'Head start',
			pictogram: { kind: 'tracks' },
			text: 'Advance exactly 4 spaces on each of the four tracks.',
		},
		{
			props: "{ kind: 'resources' }",
			title: 'Supplies',
			pictogram: { kind: 'resources' },
			text: 'Gain 1 of each resource.',
		},
		{
			props: "{ kind: 'card', picture: artUrl('tapestry/renaissance') }",
			title: 'Copy a card',
			pictogram: {
				kind: 'card',
				picture: artUrl('tapestry/renaissance'),
			},
			text: 'Only the top card of a slot can be chosen.',
		},
		{
			props: "{ kind: 'era', numeral: 'I', title: 'Maker of Fire, era I' }",
			title: 'Started with the Heralds',
			pictogram: {
				kind: 'era',
				numeral: 'I',
				title: 'Maker of Fire, era I',
			},
			text: 'At the end of your first income turn, you may play a tapestry card on top of Maker of Fire.',
		},
	];
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
	>{#each PICTOGRAMS as example (example.props)}<Example
			label={`title pictogram={${example.props}}`}
			width={425}
			><CardFrame plain>
				<CardEffectBox
					title={example.title}
					pictogram={example.pictogram}>{example.text}</CardEffectBox>
			</CardFrame></Example
		>{/each}</Section>
