<!-- EraNote: the tapestry card of the era a player is in, under their capital (#174): its name in gold and its text. -->
<script module>
	/**
	 * Properties of the EraNote component itself.
	 * @typedef {Object} EraNoteOwnProps
	 * @property {string} heading - The era, such as "Era III" or "Era II · Active"
	 * @property {string | null} [name=null] - The card's name; null before any card
	 * @property {string | null} [copy=null] - The card's text, when it has one
	 * @property {boolean} [faceDown=false] - The card lies face down
	 */

	/**
	 * Properties for the EraNote component, including any attributes for its root element.
	 * @typedef {EraNoteOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} EraNoteProps
	 *
	 * @example
	 * <EraNote
	 *   heading="Era III"
	 *   name="Dystopia"
	 *   copy="Gain a track landmark nobody owns." />
	 */
</script>

<script>
	/** @type {EraNoteProps} */
	let {
		heading,
		name = null,
		copy = null,
		faceDown = false,
		...attr
	} = $props();
</script>

<section
	aria-label="This era"
	{...attr}
	class="rg-era-note {attr.class ? attr.class : ''}">
	<h3 class="rg-era-note--heading">This era · {heading}</h3>
	{#if faceDown}
		<p class="rg-era-note--plain">A face-down tapestry card.</p>
	{:else if name}
		<b class="rg-era-note--name">{name}</b>
		{#if copy}
			<p class="rg-era-note--copy">{copy}</p>
		{/if}
	{:else}
		<p class="rg-era-note--plain">No tapestry card this era yet.</p>
	{/if}
</section>

<style>
	.rg-era-note {
		display: grid;
		gap: var(--space-2);
		padding: var(--space-4) var(--space-5);
		border: var(--border) solid var(--line);
		background: color-mix(in srgb, var(--chrome) 70%, transparent);
	}

	.rg-era-note--heading {
		margin: 0;
		color: var(--muted);
		font: var(--weight-bold) var(--font-size-sm) var(--font-body);
	}

	.rg-era-note--name {
		color: var(--gold);
		font: var(--weight-title) var(--font-size-lg) var(--font-title);
	}

	.rg-era-note--copy,
	.rg-era-note--plain {
		margin: 0;
		color: var(--text);
		font-size: var(--font-size-sm);
		line-height: var(--leading-snug);
	}

	.rg-era-note--plain {
		color: var(--muted);
	}
</style>
