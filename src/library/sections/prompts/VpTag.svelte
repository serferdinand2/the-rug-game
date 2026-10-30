<!-- Library section: VpTag, the "+N VP" a choice scores, in a corner or in a row, plain or muted. -->
<script>
	import VpTag from '../../../lib/components/prompts/VpTag.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
</script>

<Section
	name="VpTag"
	area="prompts"
	description="The VP a choice scores, after a plus sign. corner: a small gold badge over the top-right corner of its parent, as DecisionOption and TilePicker draw it; muted, a tile that scores nothing. inline: bold gold text in a row, as TurnControl draws it (#116).">
	<Example
		label={'value={4}  (corner, in a box)'}
		surface="chrome">
		<span class="rg-library-vp-tag-box">
			<VpTag value={4} />
		</span>
	</Example>
	<Example
		label={'value={3} unit=""  (as a tile)'}
		surface="chrome">
		<span class="rg-library-vp-tag-box">
			<VpTag
				value={3}
				unit="" />
		</span>
	</Example>
	<Example
		label={'value={0} unit="" muted'}
		surface="chrome">
		<span class="rg-library-vp-tag-box">
			<VpTag
				value={0}
				unit=""
				muted />
		</span>
	</Example>
	<Example
		label={'value={3} variant="inline"'}
		surface="chrome">
		<VpTag
			value={3}
			variant="inline" />
	</Example>
	<Example
		label={'value={0} variant="inline" muted'}
		surface="chrome">
		<VpTag
			value={0}
			variant="inline"
			muted />
	</Example>
</Section>

<style>
	/* A choice-sized box for the corner badge to sit on. */
	.rg-library-vp-tag-box {
		position: relative;
		display: block;
		width: 88px;
		height: 58px;
		border: var(--border) solid var(--line);
		background: var(--choice-fill);
	}
</style>
