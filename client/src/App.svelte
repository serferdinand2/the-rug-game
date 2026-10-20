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
		max-width: 560px;
		margin: 0 auto;
		padding: 64px 16px;
		text-align: center;
		line-height: 1.6;
	}

	.rg-placeholder--emblem {
		max-width: 60vw;
		height: auto;
		image-rendering: pixelated;
		border: 4px solid var(--frame);
		border-radius: 10px;
		box-shadow: 0 0 0 3px var(--line);
	}

	.rg-placeholder--title {
		margin: 24px 0 12px;
		font-family: var(--font-title);
		font-weight: normal;
		font-size: clamp(32px, 8vw, 48px);
		color: var(--gold);
	}

	.rg-placeholder--text {
		color: var(--muted);
	}
</style>
