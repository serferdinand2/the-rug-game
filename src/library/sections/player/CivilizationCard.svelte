<!-- Library section: CivilizationCard, extracted from the reviewed cards. -->
<script>
	import CivilizationCard from '../../../lib/components/player/CivilizationCard.svelte';
	import Section from '../../Section.svelte';
	import Example from '../../Example.svelte';
	import '../../../styles/card-patterns.css';
	import { REVIEWED_CIVILIZATIONS } from '../../../lib/cards/reviewed-civilizations.js';
</script>

<Section
	name="CivilizationCard"
	area="player"
	description="Owner-reviewed card pattern; see docs/ui/card-design-rules.md for the composition rules."
	>{#each REVIEWED_CIVILIZATIONS as card}<Example
			label={`${card.title} · ${card.edition}`}
			width={425}
			><CivilizationCard
				id={card.id}
				state="play" /></Example
		>{/each}<Example
		label="The Infiltrators (Plans &amp; Ploys) · no layout until its expansion: frame, portrait and name only"
		width={425}
		><CivilizationCard
			id="infiltrators"
			state="empty" /></Example
	></Section>
