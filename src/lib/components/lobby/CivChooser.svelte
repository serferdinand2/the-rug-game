<!-- The lobby's civilization chooser: a heading with Random, then one tile per civilization, bordered in the edited player's colour. -->
<script module>
	/**
	 * Properties of the CivChooser component itself.
	 * @typedef {Object} CivChooserOwnProps
	 * @property {string[]} civilizations - The civilizations on offer, in order
	 * @property {import('../../ui.js').Seat} seat - The seat being edited; the border takes its player's colour
	 * @property {string | null} [selected=null] - The seat's current civilization, marked on its tile
	 * @property {string} [heading='Choose your civilization'] - The panel's heading
	 * @property {Function} [onCivChooserPick] - Callback fired with { civilization } when a tile is pressed
	 * @property {Function} [onCivChooserRandom] - Callback fired when Random is pressed; the parent picks the civilization
	 */

	/**
	 * Properties for the CivChooser component, including any attributes for its root section.
	 * @typedef {CivChooserOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} CivChooserProps
	 *
	 * @example
	 * <CivChooser
	 *   seat={5}
	 *   civilizations={['Architects', 'Alchemists', 'Futurists', 'Militants', 'Nomads']}
	 *   onCivChooserPick={(event) => choose(event.value.civilization)}
	 *   onCivChooserRandom={() => chooseRandom()} />
	 */
</script>

<script>
	import Button from '../ui/Button.svelte';
	import { ComponentEvent } from '../../component-event.js';
	import { playerColor } from '../../ui.js';

	/** @type {CivChooserProps} */
	let {
		civilizations,
		seat,
		selected = null,
		heading = 'Choose your civilization',
		onCivChooserPick,
		onCivChooserRandom,
		...attr
	} = $props();

	const id = $props.id();

	/**
	 * @param {MouseEvent} event
	 * @param {string} civilization
	 */
	const tileClickHandler = (event, civilization) => {
		if (typeof onCivChooserPick === 'function') {
			const target = /** @type {HTMLButtonElement} */ (
				event.currentTarget
			);
			onCivChooserPick(
				new ComponentEvent({ civilization }, target, event)
			);
		}
	};

	/**
	 * @param {import('../../component-event.js').ComponentEvent} event
	 */
	const randomButtonClickHandler = (event) => {
		if (typeof onCivChooserRandom === 'function') {
			onCivChooserRandom(
				new ComponentEvent(undefined, event.target, event.originalEvent)
			);
		}
	};
</script>

<section
	aria-labelledby="{id}-heading"
	{...attr}
	class="rg-civ-chooser {attr.class ? attr.class : ''}"
	style:--rg-civ-chooser-color={playerColor(seat)}>
	<div class="rg-civ-chooser--head">
		<h2
			id="{id}-heading"
			class="rg-civ-chooser--heading">
			{heading}
		</h2>
		<Button
			size="small"
			onButtonClick={randomButtonClickHandler}>Random</Button>
	</div>
	<div class="rg-civ-chooser--tiles">
		{#each civilizations as civilization (civilization)}
			<button
				type="button"
				class="rg-civ-chooser--tile"
				class:rg-civ-chooser--selected={civilization === selected}
				aria-pressed={civilization === selected}
				onclick={(event) => tileClickHandler(event, civilization)}
				>{civilization}</button>
		{/each}
	</div>
</section>

<style>
	.rg-civ-chooser {
		padding: var(--space-6) var(--space-7);
		border: var(--border) solid var(--rg-civ-chooser-color);
		border-radius: var(--radius);
		background: var(--chrome);
	}

	.rg-civ-chooser--head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-6);
		margin-bottom: var(--space-4);
	}

	.rg-civ-chooser--heading {
		margin: 0;
		font: var(--weight-bold) var(--font-size-lg) / var(--leading-snug)
			var(--font-body);
	}

	.rg-civ-chooser--tiles {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: var(--space-4);
	}

	.rg-civ-chooser--tile {
		min-height: 70px;
		padding: var(--space-4);
		border: var(--border) solid var(--line);
		border-radius: var(--radius);
		background: var(--control);
		color: var(--text);
		font: var(--weight-title) var(--font-size-sm) / var(--leading-snug)
			var(--font-title);
		letter-spacing: var(--letter-spacing-title);
		transition:
			background var(--duration-fast) var(--ease),
			border-color var(--duration-fast) var(--ease),
			color var(--duration-fast) var(--ease);
	}

	.rg-civ-chooser--tile:hover,
	.rg-civ-chooser--selected {
		border-color: var(--gold);
		background: color-mix(in srgb, var(--gold) 20%, var(--ink));
		color: color-mix(in srgb, var(--gold) 65%, var(--text));
	}

	/* The current choice also gets a thicker outline, so colour is not its only mark. */
	.rg-civ-chooser--selected {
		box-shadow: inset 0 0 0 1px var(--gold);
	}
</style>
