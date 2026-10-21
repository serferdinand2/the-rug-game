<!-- The app root. Until the game screens exist (#25), it shows the placeholder page. -->
<script module>
	/**
	 * Properties of the App component itself.
	 * @typedef {Object} AppOwnProps
	 * @property {string} [repositoryUrl] - Where progress is tracked
	 */

	/**
	 * Properties for the App component, including any attributes for its root element.
	 * @typedef {AppOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} AppProps
	 *
	 * @example
	 * mount(App, { target: document.getElementById('app') });
	 */
</script>

<script>
	/** @type {AppProps} */
	let {
		repositoryUrl = 'https://github.com/serferdinand2/the-rug-game',
		...attr
	} = $props();
</script>

<main
	{...attr}
	class="rg-placeholder {attr.class ? attr.class : ''}">
	<img
		class="rg-placeholder--emblem"
		src="/favicon.svg"
		alt="A lighthouse on a rocky island at night"
		width="192"
		height="192" />
	<h1 class="rg-placeholder--title">The Rug Game</h1>
	<p class="rg-placeholder--text">
		A browser game of civilizations rising through the eras, inspired by
		Tapestry. It is still being built.
	</p>
	<p class="rg-placeholder--text">
		<a href={repositoryUrl}>Follow the progress on GitHub</a>
	</p>
</main>

<style>
	.rg-placeholder {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: calc(var(--space-11) * 2) var(--space-8);
		background: var(--texture) var(--surface);
		text-align: center;
		line-height: var(--leading-normal);
	}

	.rg-placeholder--emblem {
		max-width: 60vw;
		height: auto;
		image-rendering: pixelated;
		border: var(--border-thick) solid var(--gold);
		border-radius: var(--radius);
	}

	.rg-placeholder--title {
		margin: var(--space-10) 0 var(--space-6);
		font-family: var(--font-title);
		font-weight: var(--weight-bold);
		font-size: var(--font-size-display);
		letter-spacing: var(--letter-spacing-title);
		color: var(--gold);
	}

	.rg-placeholder--text {
		max-width: var(--launch-width);
		margin: 0 0 var(--space-6);
		color: var(--muted);
	}
</style>
