<!-- PlayerToken: a player's token, by seat or by artwork colour; an extracted owner-reviewed card pattern. -->
<script module>
	import { artUrl, PLAYER_ART_COLORS } from '../../ui.js';

	/**
	 * A seat's token picture, or a named colour's: the one picture of a player token, which a token drawn where an
	 * <img> can't go, such as on the World Map's SVG, uses too (#180).
	 * @param {import('../../ui.js').Seat | undefined} seat
	 * @param {'blue' | 'red' | 'green' | 'yellow' | 'purple'} [color='blue'] - Used where no seat is known
	 * @returns {string}
	 */
	export function playerTokenUrl(seat, color = 'blue') {
		return artUrl(
			`piece/token-${seat === undefined ? color : PLAYER_ART_COLORS[seat - 1]}`
		);
	}

	/**
	 * @typedef {Object} PlayerTokenOwnProps
	 * @property {import('../../ui.js').Seat} [seat] - The player's seat, which sets the colour; wins over `color`
	 * @property {'blue' | 'red' | 'green' | 'yellow' | 'purple'} [color] - Player artwork colour, where no seat is known
	 * @property {number} [size] - Display height; native artwork is 32px
	 * @property {boolean} [decorative] - Nearby text already describes the token
	 */
	/**
	 * @typedef {PlayerTokenOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} PlayerTokenProps
	 * @example
	 * <PlayerToken seat={2} size={24} decorative />
	 */
</script>

<script>
	/** @type {PlayerTokenProps} */
	let {
		seat,
		color = 'blue',
		size = 32,
		decorative = false,
		...attr
	} = $props();

	/** The artwork colour: the seat's, or the one named. */
	let art = $derived(
		seat === undefined ? color : PLAYER_ART_COLORS[seat - 1]
	);
</script>

<img
	{...attr}
	class="rg-player-token {attr.class ?? ''}"
	src={playerTokenUrl(seat, color)}
	width={size}
	height={size}
	alt={decorative ? '' : `${art} player token`}
	draggable="false" />

<style>
	.rg-player-token {
		object-fit: contain;
		image-rendering: pixelated;
		flex: none;
	}
</style>
