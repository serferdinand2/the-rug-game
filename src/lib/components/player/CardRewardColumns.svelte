<!-- CardRewardColumns: columns of reward squares, filled from the bottom with each benefit beside its square (Craftsmen), or climbed by a token with the rewards inside (Merrymakers) (#106). -->
<script module>
	/**
	 * A square with its benefit beside it. The benefit is `vp`, a `gain`, or `text`, which may keep `keep` on one line
	 * before `after`.
	 * @typedef {Object} CardRewardRow
	 * @property {number} [vp] - Victory points, bold
	 * @property {import('../../ui.js').CostSymbol} [gain] - A resource, after its +
	 * @property {string} [text] - Words
	 * @property {string} [keep] - Words after `text` kept on one line, smaller
	 * @property {string} [after] - Words after `keep`
	 * @property {string} [building] - The income building on the square when `filled`, such as 'farm'
	 * @property {boolean} [filled=false] - A building fills the square
	 */
	/**
	 * A column filled from the bottom.
	 * @typedef {Object} CardRewardColumn
	 * @property {string} title - Its name, such as 'Column A'
	 * @property {string} [note] - A smaller line under its name
	 * @property {CardRewardRow[]} rows - Its squares, top first
	 */
	/**
	 * A square with its reward inside: its `gains` joined by +, then `also`; or its `lines` of words.
	 * @typedef {Object} CardRewardCell
	 * @property {string} id - Its spot id, such as 'm0l3'
	 * @property {import('../../ui.js').CostSymbol[]} [gains] - Resources
	 * @property {string} [also] - What comes with the resources, such as 'armory'
	 * @property {string[]} [lines] - Words, one line each
	 * @property {boolean} [current=false] - The column's token is here
	 */
	/**
	 * A column a token climbs from the start square below it.
	 * @typedef {Object} CardRewardTrack
	 * @property {string} id - Its id, such as 'm0'
	 * @property {CardRewardCell[]} cells - Its squares, top first
	 * @property {boolean} [moved=false] - The token has left the start square
	 */
	/**
	 * @typedef {Object} CardRewardColumnsOwnProps
	 * @property {'beside' | 'inside'} [kind='beside'] - Benefits beside the squares, or inside them
	 * @property {readonly (CardRewardColumn | CardRewardTrack)[]} columns - `CardRewardColumn`s beside, `CardRewardTrack`s inside
	 * @property {import('../../ui.js').Seat} [seat] - Whose tokens climb the columns inside, for their colour
	 * @property {readonly string[]} [choices=[]] - The cell ids the open decision offers, drawn as buttons
	 * @property {string | null} [picked=null] - The offered cell the player has picked, in gold
	 * @property {Function} [onCardRewardColumnsPick] - Callback fired with the cell id when an offered cell is pressed
	 */
	/**
	 * @typedef {CardRewardColumnsOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} CardRewardColumnsProps
	 * @example
	 * <CardRewardColumns
	 *   columns={[{ title: 'Column A', note: 'fill from bottom', rows: [{ vp: 5 }, { text: 'Gain 1 territory tile', building: 'farm', filled: true }, { gain: 'worker' }] }]} />
	 * <CardRewardColumns
	 *   kind="inside"
	 *   seat={2}
	 *   columns={[{ id: 'm2', moved: true, cells: [{ id: 'm2l3', lines: ['15 VP'] }, { id: 'm2l2', lines: ['10 VP'], current: true }, { id: 'm2l1', lines: ['5 VP'] }] }]}
	 *   choices={['m2l3']}
	 *   onCardRewardColumnsPick={(event) => pick(event.value)} />
	 */
</script>

<script>
	import CardResource from './CardResource.svelte';
	import CardSlot from './CardSlot.svelte';
	import PlayerToken from './PlayerToken.svelte';
	import { ComponentEvent } from '../../component-event.js';
	import { spotChoice } from '../../card-spots.js';
	/** @type {CardRewardColumnsProps} */
	let {
		kind = 'beside',
		columns,
		seat,
		choices = [],
		picked = null,
		onCardRewardColumnsPick,
		...attr
	} = $props();
	const uid = $props.id();
	const besides = $derived(
		kind === 'beside' ? /** @type {CardRewardColumn[]} */ (columns) : []
	);
	const tracks = $derived(
		kind === 'inside' ? /** @type {CardRewardTrack[]} */ (columns) : []
	);

	/**
	 * A cell's pick, reported as the columns' own.
	 * @param {ComponentEvent} event - Its value is the cell id
	 */
	const cellPickHandler = (event) => {
		if (typeof onCardRewardColumnsPick === 'function') {
			onCardRewardColumnsPick(
				new ComponentEvent(
					event.value,
					event.target,
					event.originalEvent
				)
			);
		}
	};
</script>

<div
	{...attr}
	class="rg-card-reward-columns rg-card-reward-columns--{kind} {attr.class ??
		''}">
	{#each besides as column, index (index)}
		<section
			class="rg-card-reward-columns--column"
			aria-labelledby="{uid}-{index}">
			<h4
				class="rg-card-reward-columns--title"
				id="{uid}-{index}">
				{column.title}{#if column.note}
					<small>{column.note}</small>{/if}
			</h4>
			<ol class="rg-card-reward-columns--rows">
				{#each column.rows as row, place (place)}
					<li
						class="rg-card-reward-columns--row"
						class:rg-card-reward-columns--filled={row.filled}>
						<CardSlot
							size={62}
							class="rg-card-reward-columns--slot"
							>{#if row.filled && row.building}<img
									src="/art/building/{row.building}.svg"
									alt="" />{/if}</CardSlot
						>{#if row.vp !== undefined}<span
								class="rg-card-reward-columns--benefit rg-card-reward-columns--vp"
								>{row.vp} VP</span
							>{:else if row.gain}<span
								class="rg-card-reward-columns--benefit rg-card-reward-columns--gain"
								>+ <CardResource symbol={row.gain} /></span
							>{:else}<span
								class="rg-card-reward-columns--benefit"
								>{row.text}{#if row.keep}{' '}<span
										class="rg-card-reward-columns--keep"
										>{row.keep}</span
									>{' '}{row.after}{/if}</span
							>{/if}
					</li>
				{/each}
			</ol>
		</section>
	{/each}
	{#each tracks as track (track.id)}
		<div
			class="rg-card-reward-columns--track"
			class:rg-card-reward-columns--moved={track.moved}>
			{#each track.cells as cell (cell.id)}<CardSlot
					size={75}
					{...spotChoice(cell.id, choices, picked, cellPickHandler)}
					class="rg-card-reward-columns--cell {cell.current
						? 'rg-card-reward-columns--current'
						: ''}"
					>{#if cell.gains}<span
							class="rg-card-reward-columns--reward"
							>{#each cell.gains as gain, place (place)}{#if place}{' + '}{/if}<CardResource
									symbol={gain} />{/each}{#if cell.also}{' + '}{cell.also}{/if}</span
						>{:else}{#each cell.lines ?? [] as line, place (place)}{#if place}<br />{/if}{line}{/each}{/if}{#if cell.current}<PlayerToken
							{seat}
							color="blue"
							class="rg-card-reward-columns--token"
							decorative />{/if}</CardSlot
				>{/each}<CardSlot
				size={62}
				class="rg-card-reward-columns--start"
				>{#if !track.moved}<PlayerToken
						{seat}
						color="blue"
						decorative />{/if}</CardSlot>
		</div>
	{/each}
</div>

<style>
	.rg-card-reward-columns--beside {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 5px;
		margin: 3px 12px 0;
	}
	.rg-card-reward-columns--inside {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0;
		margin: 2px 12px 12px;
	}
	.rg-card-reward-columns--column {
		display: flex;
		flex-direction: column;
		min-width: 0;
		margin: 0;
	}
	.rg-card-reward-columns--column + .rg-card-reward-columns--column {
		border-left: 1px solid var(--line-soft);
		padding-left: 5px;
	}
	.rg-card-reward-columns--title {
		margin: 0 0 8px;
		color: var(--gold);
		font: var(--weight-bold) var(--font-size-xs) / 1.2 var(--font-body);
	}
	.rg-card-reward-columns--title small {
		display: block;
		color: var(--muted);
		font-size: var(--font-size-3xs);
		font-weight: var(--weight-regular);
	}
	.rg-card-reward-columns--rows {
		display: grid;
		gap: 5px;
		margin: auto 0 0;
		padding: 0;
		list-style: none;
	}
	.rg-card-reward-columns--row {
		display: grid;
		grid-template-columns: 62px minmax(0, 1fr);
		align-items: center;
		gap: 5px;
		min-height: 62px;
	}
	/* CardSlot draws the squares; the columns draw what is on them. */
	.rg-card-reward-columns--filled :global(.rg-card-reward-columns--slot) {
		background: var(--card-filled-slot);
		border: 2px solid var(--player-1);
	}
	.rg-card-reward-columns--row :global(.rg-card-reward-columns--slot img) {
		display: block;
		width: 36px;
		height: 36px;
	}
	.rg-card-reward-columns--benefit {
		--card-resource-center: -4px;
		min-width: 0;
		overflow-wrap: normal;
		color: var(--text);
		font: var(--weight-regular) var(--font-size-2xs) / 1.2 var(--font-body);
	}
	.rg-card-reward-columns--gain,
	.rg-card-reward-columns--keep {
		white-space: nowrap;
	}
	.rg-card-reward-columns--keep {
		font-size: var(--font-size-3xs);
	}
	.rg-card-reward-columns--vp {
		font-size: var(--font-size-md);
		font-weight: var(--weight-bold);
	}
	.rg-card-reward-columns--track {
		display: grid;
		justify-items: center;
		gap: 6px;
		padding: 0 8px;
	}
	.rg-card-reward-columns--track + .rg-card-reward-columns--track {
		border-left: 1px solid var(--line-soft);
	}
	.rg-card-reward-columns--track :global(.rg-card-reward-columns--cell) {
		--card-resource-height: 24px;
		--card-resource-center: 12px;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 2px;
		padding: 4px;
		color: var(--card-text);
		font: var(--weight-bold) var(--font-size-2xs) / 1.15 var(--font-body);
		text-align: center;
	}
	.rg-card-reward-columns--track :global(.rg-card-reward-columns--current) {
		border: 2px solid var(--player-1);
		box-shadow: var(--glow-current);
	}
	.rg-card-reward-columns--reward {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 2px;
		white-space: nowrap;
	}
	.rg-card-reward-columns--track :global(.rg-card-reward-columns--token) {
		position: absolute;
		right: 3px;
		top: 3px;
		width: 21px;
		height: 21px;
	}
	.rg-card-reward-columns--track :global(.rg-card-reward-columns--start) {
		margin-top: 4px;
	}
	.rg-card-reward-columns--track :global(.rg-card-reward-columns--start img) {
		width: 26px;
		height: 26px;
	}
</style>
