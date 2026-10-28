<!-- The game's screen at 1920×1080 between the header and the footer, scaled to fit the library page: the board on the left three quarters and the player area on the right (#79). -->
<script module>
	/**
	 * Properties of the Screen component itself.
	 * @typedef {Object} ScreenOwnProps
	 * @property {import('svelte').Snippet} board - What the board holds, such as a decision panel
	 * @property {import('svelte').Snippet} [children] - What sits over the whole screen, such as the dice tray
	 * @property {number} [width=1100] - The width the screen is scaled to, in pixels
	 */

	/**
	 * Properties for Screen, including any attributes for its root element.
	 * @typedef {ScreenOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} ScreenProps
	 *
	 * @example
	 * <Screen board={panel}><DiceTray {rolls} {batch} panel="shelf" /></Screen>
	 */
</script>

<script>
	/** @type {ScreenProps} */
	let { board, children, width = 1100, ...attr } = $props();
</script>

<!-- The screen is a size container as wide as the game's, and a containing block for fixed elements, so a centred
     panel finds the screen's centre and the dice tray its place as they do in the game. -->
<div
	{...attr}
	class="rg-library-screen {attr.class ? attr.class : ''}"
	style:--rg-library-screen-scale={width / 1920}>
	<div class="rg-library-screen--screen">
		<div class="rg-library-screen--board">{@render board()}</div>
		<div class="rg-library-screen--player">Your player area</div>
		{@render children?.()}
	</div>
</div>

<style>
	.rg-library-screen {
		width: calc(1920px * var(--rg-library-screen-scale));
		height: calc(964px * var(--rg-library-screen-scale));
		overflow: hidden;
	}

	.rg-library-screen--screen {
		container-type: inline-size;
		display: grid;
		grid-template-columns: var(--play-columns);
		gap: var(--play-gap);
		width: 1920px;
		height: 964px;
		background: var(--ink);
		transform: scale(var(--rg-library-screen-scale));
		transform-origin: top left;
	}

	.rg-library-screen--board,
	.rg-library-screen--player {
		position: relative;
		overflow: hidden;
		background: var(--texture) var(--surface);
	}

	.rg-library-screen--player {
		display: grid;
		place-items: center;
		color: var(--muted);
	}
</style>
