<!-- One section on the library page, for a component or an art group: its name, area and purpose, then its examples. -->
<script module>
	/**
	 * Properties of the Section component itself.
	 * @typedef {Object} SectionOwnProps
	 * @property {string} name - The component's name, such as 'TrackSpace', or an art group's heading
	 * @property {string} [id] - The anchor id; defaults to the name in kebab case
	 * @property {string} area - Its area folder, such as 'board'
	 * @property {string} description - One sentence on what it is for
	 * @property {import('svelte').Snippet} children - The Example blocks
	 */

	/**
	 * Properties for the Section component, including any attributes for its root element.
	 * @typedef {SectionOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} SectionProps
	 *
	 * @example
	 * <Section name="Button" area="ui" description="Every button in the game.">
	 *   <Example label='mode="gold"'><Button mode="gold">Create a table</Button></Example>
	 * </Section>
	 */
</script>

<script>
	import { anchorId } from './Library.svelte';

	/** @type {SectionProps} */
	let { name, area, description, id, children, ...attr } = $props();
</script>

<section
	{...attr}
	id={id ?? anchorId(name)}
	class="rg-library-section {attr.class ? attr.class : ''}">
	<header class="rg-library-section--head">
		<h2 class="rg-library-section--name">{name}</h2>
		<span class="rg-library-section--area">{area}/</span>
		<p class="rg-library-section--description">{description}</p>
	</header>
	<div class="rg-library-section--examples">
		{@render children()}
	</div>
</section>

<style>
	.rg-library-section {
		padding: var(--space-10) 0 var(--space-11);
		border-bottom: var(--border) solid var(--line-soft);
		scroll-margin-top: var(--space-8);
	}

	.rg-library-section--head {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--space-2) var(--space-5);
		margin-bottom: var(--space-9);
	}

	.rg-library-section--name {
		margin: 0;
		font: var(--weight-bold) var(--font-size-3xl) / var(--leading-none)
			var(--font-body);
		color: var(--text);
	}

	.rg-library-section--area {
		font-size: var(--font-size-xs);
		color: var(--faint);
	}

	.rg-library-section--description {
		flex-basis: 100%;
		margin: 0;
		color: var(--muted);
		font-size: var(--font-size-sm);
	}

	.rg-library-section--examples {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		gap: var(--space-10);
	}
</style>
