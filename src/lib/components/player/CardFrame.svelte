<!-- CardFrame: an extracted owner-reviewed card pattern. -->
<script module>
	/**
	 * @typedef {Object} CardFrameOwnProps
	 * @property {string} title - Card title
	 * @property {string} portrait - Full artwork URL
	 * @property {string} [portraitAlt] - Artwork description
	 * @property {string[]} [badges] - Expansion names
	 * @property {number} [complexity] - Complexity dots
	 * @property {'empty' | 'play'} [state] - Demonstration state
	 * @property {import('svelte').Snippet} [effect] - Main effect beside the art
	 * @property {import('svelte').Snippet} [children] - Card layout
	 */
	/**
	 * @typedef {CardFrameOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} CardFrameProps
	 * @example
	 * <CardFrame />
	 */
</script>

<script>
	import '../../../styles/card-patterns.css';
	/** @type {CardFrameProps} */
	let {
		title,
		portrait,
		portraitAlt = '',
		badges = ['Base game'],
		complexity = 1,
		state = 'empty',
		effect,
		children,
		...attr
	} = $props();
</script>

<article
	{...attr}
	class="rg-card-frame {attr.class ?? ''}"
	data-state={state}
	aria-label={title + ' civilization card'}>
	<header class="rg-card-frame--band">
		<h3 class="rg-card-frame--name">{title}</h3>
	</header>
	<div class="rg-card-frame--body">
		<img
			class="rg-card-frame--portrait"
			src={portrait}
			alt={portraitAlt} />
		<div class="rg-card-frame--text">{@render effect?.()}</div>
	</div>
	{@render children?.()}
	<footer class="rg-card-frame--foot">
		<span class="rg-card-badge-group"
			>{#each badges as badge}<span
					class="rg-card-badge-aa rg-card-badge-base">{badge}</span
				>{/each}</span
		><span
			class="rg-card-cx"
			aria-label={`Complexity ${complexity} of 3`}
			>{#each [1, 2, 3] as level}<i class:rg-card-off={level > complexity}
				></i
				>{/each}</span>
	</footer>
</article>
