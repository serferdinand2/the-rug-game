<!-- Library section: LandmarkPiece in the tray, placed with its controls, locked, and in a non-rectangular footprint. -->
<script>
	import LandmarkPiece from '../../../lib/components/player/LandmarkPiece.svelte';
	import Button from '../../../lib/components/ui/Button.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';
	import { FOOTPRINTS } from '../../../lib/art/footprints.js';
	import { rotateFootprint } from '../../../lib/capital.js';

	/**
	 * The size of a box covering n plots on a capital about 436 pixels wide, as the grid would give it.
	 * @param {number} plots
	 * @returns {string}
	 */
	const span = (plots) => `${plots * 47 - 2}px`;

	const LIGHTHOUSE = {
		id: 'lighthouse',
		name: 'Lighthouse',
		footprint: FOOTPRINTS.lighthouse,
		color: 'var(--exploration)',
	};

	/* The interactive Launch Pad: tray → placed → locked. */
	/** @type {'tray' | 'placed' | 'locked'} */
	let pieceState = $state('tray');
	let rotation = $state(1);
	let fresh = $state(false);
	let shape = $derived(rotateFootprint(FOOTPRINTS['launch-pad'], rotation));
</script>

<Section
	name="LandmarkPiece"
	area="player"
	description="A landmark's picture in its footprint's shape. In the To be placed tray it is a small box (29 pixels a plot) beside its Cinzel name; on the capital it covers its plots, with rotate, confirm and return controls until it is locked. The Lighthouse is outlined in exploration blue. It drags itself (its picture, from where it was held, reporting its id and grab), answers its own keys (src/lib/landmark-keys.js, the keys How to play lists) and takes the focus through its focus() (#111).">
	<Example
		label={`Interactive: state="${pieceState}" rotation={${rotation}}${fresh ? ' fresh' : ''}  (press the piece, then use its controls)`}
		width={300}>
		<div
			style:min-height="206px"
			style:display="grid"
			style:align-content="start"
			style:gap="var(--space-6)">
			{#if pieceState === 'tray'}
				<LandmarkPiece
					id="launch-pad"
					name="Launch Pad"
					footprint={FOOTPRINTS['launch-pad']}
					{rotation}
					onLandmarkPieceSelect={() => (pieceState = 'placed')} />
			{:else}
				<div
					style:width={span(shape[0].length)}
					style:height={span(shape.length)}>
					<LandmarkPiece
						id="launch-pad"
						name="Launch Pad"
						footprint={FOOTPRINTS['launch-pad']}
						{rotation}
						state={pieceState}
						{fresh}
						onLandmarkPieceRotate={() =>
							(rotation = (rotation + 1) % 4)}
						onLandmarkPieceConfirm={() => {
							pieceState = 'locked';
							fresh = true;
						}}
						onLandmarkPieceReturn={() => (pieceState = 'tray')} />
				</div>
			{/if}
			{#if pieceState === 'locked'}
				<Button
					size="small"
					onButtonClick={() => {
						pieceState = 'tray';
						fresh = false;
					}}>Start again</Button>
			{/if}
		</div>
	</Example>
	<Example label={'state="tray"'}>
		<LandmarkPiece {...LIGHTHOUSE} />
	</Example>
	<Example label={'state="tray" selected'}>
		<LandmarkPiece
			{...LIGHTHOUSE}
			selected />
	</Example>
	<Example label={'state="tray" dragging'}>
		<LandmarkPiece
			{...LIGHTHOUSE}
			dragging />
	</Example>
	<Example label={'state="tray"  (Rubber Works, default gold)'}>
		<LandmarkPiece
			id="rubber-works"
			name="Rubber Works"
			footprint={FOOTPRINTS['rubber-works']}
			selected />
	</Example>
	<Example label={'state="placed"'}>
		<div
			style:width={span(2)}
			style:height={span(2)}>
			<LandmarkPiece
				{...LIGHTHOUSE}
				state="placed" />
		</div>
	</Example>
	<Example label={'state="locked"'}>
		<div
			style:width={span(2)}
			style:height={span(2)}>
			<LandmarkPiece
				{...LIGHTHOUSE}
				state="locked" />
		</div>
	</Example>
	<Example label={'state="locked" fresh'}>
		<div
			style:width={span(2)}
			style:height={span(2)}>
			<LandmarkPiece
				{...LIGHTHOUSE}
				state="locked"
				fresh />
		</div>
	</Example>
	<Example label={'state="placed" rotation={3}  (Rubber Works)'}>
		<div
			style:width={span(4)}
			style:height={span(4)}>
			<LandmarkPiece
				id="rubber-works"
				name="Rubber Works"
				footprint={FOOTPRINTS['rubber-works']}
				rotation={3}
				state="placed" />
		</div>
	</Example>
</Section>
