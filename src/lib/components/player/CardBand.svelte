<!-- CardBand: the title band every card family shares (#109): the brown gradient over the paper noise, a gold Cinzel title at one of the three approved sizes, and the trap's red. -->
<script module>
	/**
	 * Properties of the CardBand component itself.
	 * @typedef {Object} CardBandOwnProps
	 * @property {string} title - The card's name
	 * @property {'large' | 'medium' | 'small'} [size='medium'] - The title's approved size: large 28 px (civilizations), medium 22 px (tech, masterpiece), small 21 px (tapestry, landmark)
	 * @property {boolean} [trap=false] - The trap's red band
	 */

	/**
	 * Properties for the CardBand component, including any attributes for its root header; the card's own class sets
	 * the band's height and padding.
	 * @typedef {CardBandOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} CardBandProps
	 *
	 * @example
	 * <CardBand class="rg-tech-layout--band" title="Clocks" size="medium" />
	 * <CardBand title="Trap" size="small" trap />
	 */
</script>

<script>
	/** @type {CardBandProps} */
	let { title, size = 'medium', trap = false, ...attr } = $props();
</script>

<header
	{...attr}
	class="rg-card-band rg-card-band--{size} {attr.class ?? ''}"
	class:rg-card-band--trap={trap}>
	<h3 class="rg-card-band--title">{title}</h3>
</header>

<style>
	.rg-card-band {
		display: flex;
		align-items: center;
		background-image:
			url('../../../styles/card-paper-noise.svg'),
			linear-gradient(
				90deg,
				var(--card-band-start) 0%,
				var(--card-band-middle) 57%,
				var(--card-band-end) 100%
			);
		background-size:
			256px 256px,
			auto;
		border-bottom: 1px solid var(--card-line-strong);
	}

	.rg-card-band--large .rg-card-band--title {
		font-size: var(--font-size-5xl);
		line-height: 1.05;
		letter-spacing: var(--letter-spacing-title);
	}

	.rg-card-band--medium .rg-card-band--title {
		font-size: var(--font-size-3xl);
		line-height: 1;
		letter-spacing: 0.025em;
	}

	.rg-card-band--small .rg-card-band--title {
		font-size: var(--font-size-card-title-sm);
		line-height: 1;
		letter-spacing: 0.025em;
	}

	.rg-card-band--trap {
		background-image:
			url('../../../styles/card-paper-noise.svg'),
			linear-gradient(
				90deg,
				var(--card-trap-band-start) 0%,
				var(--card-trap-band-middle) 57%,
				var(--card-trap-band-end) 100%
			);
		border-bottom-color: var(--card-trap-line);
	}

	.rg-card-band--title {
		margin: 0;
		color: var(--card-title);
		font-family: var(--font-title);
		font-weight: var(--weight-bold);
		text-shadow: 0 1px 0 var(--card-text);
	}
</style>
