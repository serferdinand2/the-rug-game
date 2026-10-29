<!-- Library section: ResourceRows, one row per resource to choose (#75): empty, part chosen, complete, a fixed row with a resource the player lacks, and everything off while a move is sent. -->
<script>
	import { RESOURCE_ORDER } from '../../../lib/ui.js';
	import ResourceRows from '../../../lib/components/prompts/ResourceRows.svelte';
	import { emptySelection, rowView, togglePick } from '../../../lib/picks.js';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	/** @typedef {import('../../../lib/component-event.js').ComponentEvent} ComponentEvent */
	/** @typedef {import('../../../lib/picks.js').PickModel} PickModel */
	/** @typedef {import('../../../lib/picks.js').ResourceId} ResourceId */

	const IDS = RESOURCE_ORDER;
	const FREE = () => ({ fixed: null, offers: [...IDS] });

	/**
	 * Every mix of `count` resources that `held` can pay, or any mix when held is null (a gain).
	 * @param {number} count
	 * @param {Record<ResourceId, number> | null} held
	 * @returns {Partial<Record<ResourceId, number>>[]}
	 */
	function mixes(count, held) {
		/** @type {Partial<Record<ResourceId, number>>[]} */
		const found = [];
		/**
		 * @param {number} from
		 * @param {number} left
		 * @param {Partial<Record<ResourceId, number>>} chosen
		 */
		const build = (from, left, chosen) => {
			if (left === 0) {
				found.push(chosen);
				return;
			}
			for (let i = from; i < IDS.length; i++) {
				const id = IDS[i];
				if (!held || (chosen[id] ?? 0) < held[id]) {
					build(i, left - 1, {
						...chosen,
						[id]: (chosen[id] ?? 0) + 1,
					});
				}
			}
		};
		build(0, count, {});
		return found;
	}

	/** Choose 3 resources: any mix. @type {PickModel} */
	const GAIN = {
		mode: 'gain',
		rows: [FREE(), FREE(), FREE()],
		items: null,
		candidates: mixes(3, null).map((resources, index) => ({
			index,
			resources,
			items: [],
			label: '',
		})),
		decline: null,
		lead: 'Pick one resource in each row.',
		then: null,
	};
	const GAIN_HELD = { coin: 2, food: 7, worker: 0, culture: 1 };

	/** Tier III on the military track: 1 culture set by the cost, and 2 of the player's choice. */
	const PAY_HELD = { coin: 2, food: 1, worker: 0, culture: 3 };
	/** @type {PickModel} */
	const PAY = {
		mode: 'pay',
		rows: [{ fixed: 'culture', offers: [] }, FREE(), FREE()],
		items: null,
		candidates: mixes(2, { ...PAY_HELD, culture: 2 }).map(
			(extra, index) => ({
				index,
				resources: { ...extra, culture: (extra.culture ?? 0) + 1 },
				items: [],
				label: '',
			})
		),
		decline: null,
		lead: 'Tier III costs 1 culture and 2 resources of your choice. Pick one in each empty row.',
		then: null,
	};

	let gainPicks = $state(emptySelection(GAIN));
	let payPicks = $state(emptySelection(PAY));
	let reported = $state('nothing yet');

	/**
	 * @param {PickModel} model
	 * @param {ResourceId[]} resources
	 */
	const preset = (model, resources) =>
		resources.reduce(
			(selection, resource, row) =>
				togglePick(model, selection, row, resource),
			emptySelection(model)
		);
</script>

<Section
	name="ResourceRows"
	area="prompts"
	description="One row per resource to choose, as Board Game Arena's boxes, stacked (#75): the row's number, its four resources with the count the player would hold, and the name of the one picked. A row's other resources fade once one is picked but stay pressable; the picked one again clears the row. A cost's own resource is a fixed row, already chosen. A resource that no legal answer allows is off, with the reason as its title.">
	<Example
		label={'rows={rowView(gain, selection, held)}  (choose 3 resources; press them)'}
		surface="ink"
		width={392}>
		<ResourceRows
			rows={rowView(GAIN, gainPicks, GAIN_HELD)}
			onResourceRowsPick={(/** @type {ComponentEvent} */ event) => {
				gainPicks = togglePick(
					GAIN,
					gainPicks,
					event.value.row,
					event.value.resource
				);
				reported = `row ${event.value.row + 1}: ${event.value.resource}`;
			}} />
		<p
			class="rg-library-resource-rows--report"
			data-id="resource-rows-report">
			Last pick: {reported}
		</p>
	</Example>
	<Example
		label="one row picked"
		surface="ink"
		width={392}>
		<ResourceRows rows={rowView(GAIN, preset(GAIN, ['food']), GAIN_HELD)} />
	</Example>
	<Example
		label="complete"
		surface="ink"
		width={392}>
		<ResourceRows
			rows={rowView(
				GAIN,
				preset(GAIN, ['coin', 'food', 'food']),
				GAIN_HELD
			)} />
	</Example>
	<Example
		label={'a fixed row and two free; no worker held, so worker is off (press them)'}
		surface="ink"
		width={392}>
		<ResourceRows
			rows={rowView(PAY, payPicks, PAY_HELD)}
			onResourceRowsPick={(/** @type {ComponentEvent} */ event) =>
				(payPicks = togglePick(
					PAY,
					payPicks,
					event.value.row,
					event.value.resource
				))} />
	</Example>
	<Example
		label="disabled  (while the move is being sent)"
		surface="ink"
		width={392}>
		<ResourceRows
			rows={rowView(GAIN, preset(GAIN, ['coin', 'food']), GAIN_HELD)}
			disabled />
	</Example>
</Section>

<style>
	.rg-library-resource-rows--report {
		margin: var(--space-4) 0 0;
		color: var(--muted);
		font-size: var(--font-size-sm);
	}
</style>
