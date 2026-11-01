<!-- PlayerAction: what another player just did, at the centre of the tracks (#153, option A): their card or the action's picture, their name and the log's words, closing by itself after 4 seconds. -->
<script module>
	/**
	 * How the panel closed, as onPlayerActionClose reports it.
	 * @typedef {Object} PlayerActionClose
	 * @property {string} id - The item's id
	 * @property {boolean} all - Skip all: the rest of the queue goes too
	 * @property {boolean} timedOut - The timer ran out, rather than a click, a button or Escape
	 */

	/**
	 * Properties of the PlayerAction component itself.
	 * @typedef {Object} PlayerActionOwnProps
	 * @property {import('../../player-actions.js').PlayerActionItem} item - The display, from actionsOf() in player-actions.js
	 * @property {number} [index=1] - Its place in the queue, from 1, for "1 of N"
	 * @property {number} [count=1] - How many the queue holds in this run
	 * @property {number} [duration=4000] - How long it stays, in milliseconds, unless hovered (owner, 2026-10-30)
	 * @property {Function} [onPlayerActionClose] - Callback fired with a PlayerActionClose when the timer runs out, the panel or Close is clicked, or Escape is pressed (Shift+Escape or Skip all: `all`)
	 */

	/**
	 * Properties for the PlayerAction component, including any attributes for its root element.
	 * @typedef {PlayerActionOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} PlayerActionProps
	 *
	 * @example
	 * <PlayerAction
	 *   item={queueCurrent(queue)}
	 *   index={2}
	 *   count={3}
	 *   onPlayerActionClose={(event) => (queue = event.value.all ? EMPTY_QUEUE : queueNext(queue))} />
	 */
</script>

<script>
	import { untrack } from 'svelte';
	import Die from './Die.svelte';
	import TapestryCard from '../player/TapestryCard.svelte';
	import TapestryCardBack from '../player/TapestryCardBack.svelte';
	import TechnologyCard from '../player/TechnologyCard.svelte';
	import TerritoryTile from '../player/TerritoryTile.svelte';
	import { ComponentEvent } from '../../component-event.js';
	import {
		ACTION_MS,
		pauseTimer,
		resumeTimer,
		startTimer,
		timeLeft,
	} from '../../action-timer.js';
	import { tilePreview } from '../../area/explore.js';
	import { landmarkName, spaceName, trackName } from '../../game-names.js';
	import { artUrl, trackColor } from '../../ui.js';

	/** @type {PlayerActionProps} */
	let {
		item,
		index = 1,
		count = 1,
		duration = ACTION_MS,
		onPlayerActionClose,
		...attr
	} = $props();

	/** @type {HTMLDivElement | undefined} */
	let root = $state();
	/** The timer of the item on show; a new item starts a new one. */
	let timer = $state(startTimer(performance.now(), ACTION_MS));
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let handle;
	let closed = false;

	let paused = $derived(timer.since === null);
	let picture = $derived(item.picture);

	// A new item, or a new duration, starts the timer afresh; pausing and going on are the handlers' alone.
	$effect(() => {
		void item.id;
		const hold = duration;
		untrack(() => {
			closed = false;
			timer = startTimer(performance.now(), hold);
			schedule();
		});
		return () => clearTimeout(handle);
	});

	/** Waits out the time left, then closes. */
	function schedule() {
		clearTimeout(handle);
		if (timer.since === null) {
			return;
		}
		handle = setTimeout(
			() => close(false, true),
			timeLeft(timer, performance.now())
		);
	}

	/**
	 * Closes once: reports how, and stops the timer.
	 * @param {boolean} all - Skip the rest of the queue too
	 * @param {boolean} timedOut
	 * @param {Event} [event]
	 */
	function close(all, timedOut, event) {
		if (closed) {
			return;
		}
		closed = true;
		clearTimeout(handle);
		if (root && typeof onPlayerActionClose === 'function') {
			onPlayerActionClose(
				new ComponentEvent({ id: item.id, all, timedOut }, root, event)
			);
		}
	}

	/** The pointer over the panel holds the timer (owner, 2026-10-30). */
	const pointerEnterHandler = () => {
		timer = pauseTimer(timer, performance.now());
		clearTimeout(handle);
	};

	/** The pointer leaving lets it run on from where it stopped. */
	const pointerLeaveHandler = () => {
		timer = resumeTimer(timer, performance.now());
		schedule();
	};

	/**
	 * A click anywhere on the panel closes it, as Close does.
	 * @param {MouseEvent} event
	 */
	const clickHandler = (event) => close(false, false, event);

	/**
	 * @param {MouseEvent} event
	 */
	const closeButtonClickHandler = (event) => {
		event.stopPropagation();
		close(false, false, event);
	};

	/**
	 * @param {MouseEvent} event
	 */
	const skipButtonClickHandler = (event) => {
		event.stopPropagation();
		close(true, false, event);
	};

	/**
	 * Escape closes the panel, and Shift+Escape the rest of the queue too; it closes nothing else while the panel is up.
	 * @param {KeyboardEvent} event
	 */
	const keydownHandler = (event) => {
		if (event.key === 'Escape') {
			event.stopPropagation();
			event.preventDefault();
			close(event.shiftKey, false, event);
		}
	};

	/**
	 * A tech card's row, as the upgrade names it.
	 * @param {unknown} row
	 * @returns {string}
	 */
	function rowName(row) {
		return typeof row === 'string'
			? `${row.charAt(0).toUpperCase()}${row.slice(1)} row`
			: 'Its row';
	}
</script>

<svelte:window onkeydowncapture={keydownHandler} />

<div
	role="presentation"
	{...attr}
	bind:this={root}
	class="rg-player-action {attr.class ? attr.class : ''}"
	class:rg-player-action--income={item.kind === 'income'}
	class:rg-player-action--paused={paused}
	style:--rg-player-action-who={item.color}
	style:--rg-player-action-hold="{duration}ms"
	data-action={item.id}
	data-kind={item.kind}
	onclick={clickHandler}
	onpointerenter={pointerEnterHandler}
	onpointerleave={pointerLeaveHandler}>
	<div class="rg-player-action--band">
		<span class="rg-player-action--turn">{item.name}'s turn</span>
		{#if item.context}
			<span class="rg-player-action--context">· {item.context}</span>
		{/if}
		<span class="rg-player-action--controls">
			{#if count > 1}
				<span class="rg-player-action--count">
					{index} of {count}
					{#each Array.from({ length: count }, (_, at) => at) as dot (dot)}
						<i
							class="rg-player-action--dot"
							class:rg-player-action--dot-on={dot + 1 === index}
						></i>
					{/each}
				</span>
			{/if}
			{#if count > index}
				<button
					type="button"
					class="rg-player-action--button"
					title="Close this and the rest (Shift+Esc)"
					onclick={skipButtonClickHandler}>Skip all</button>
			{/if}
			<button
				type="button"
				class="rg-player-action--button rg-player-action--close"
				title="Close (Esc)"
				onclick={closeButtonClickHandler}>Close ✕</button>
		</span>
	</div>
	<div class="rg-player-action--body">
		{#if item.kind === 'tapestry'}
			<div class="rg-player-action--picture">
				{#if picture.card}
					<TapestryCard id={picture.card} />
				{:else}
					<TapestryCardBack class="rg-player-action--back" />
				{/if}
			</div>
		{:else if item.kind === 'advance'}
			<div class="rg-player-action--picture">
				<span
					class="rg-player-action--tag"
					style:--rg-player-action-track={trackColor(picture.track)}>
					<img
						src={artUrl(`track/${picture.track}`)}
						alt="" />
					<b>{spaceName(picture.track, picture.space)}</b>
					<span>· space {picture.space}</span>
				</span>
				{#if picture.landmark}
					<span class="rg-player-action--landmark">
						<img
							src={artUrl(`landmark/${picture.landmark}`)}
							alt="" />
					</span>
					<span class="rg-player-action--caption"
						>{landmarkName(picture.landmark)}</span>
				{:else}
					<span class="rg-player-action--caption"
						>{trackName(picture.track)}</span>
				{/if}
			</div>
		{:else if item.kind === 'invent' || item.kind === 'upgrade'}
			<div class="rg-player-action--picture">
				<TechnologyCard id={picture.card} />
				{#if item.kind === 'upgrade' && picture.to}
					<span class="rg-player-action--caption"
						>{rowName(picture.from)} → {rowName(picture.to)}</span>
				{/if}
			</div>
		{:else if item.kind === 'explore'}
			<div class="rg-player-action--picture">
				<TerritoryTile
					id={picture.tile}
					{...tilePreview(picture.tile, picture.orient)}
					size={96} />
			</div>
		{:else if item.kind === 'conquer' && (picture.tile !== null || picture.dice)}
			<div class="rg-player-action--picture">
				{#if picture.tile !== null}
					<TerritoryTile
						id={picture.tile}
						{...tilePreview(picture.tile, picture.orient)}
						size={80} />
				{/if}
				{#if picture.dice}
					<span class="rg-player-action--dice">
						<Die
							die="red"
							face={picture.dice.red}
							size={64} />
						<Die
							die="black"
							face={picture.dice.black}
							size={64} />
					</span>
				{/if}
			</div>
		{/if}
		<div class="rg-player-action--words">
			<p class="rg-player-action--headline">
				{#each item.headline as part, at (at)}
					<span
						class:rg-player-action--who={part.role === 'who'}
						class:rg-player-action--name={part.role === 'name'}
						>{part.text}</span>
				{/each}
			</p>
			<span
				class="rg-player-action--timer"
				title={paused ? 'Held while the pointer is here' : undefined}
				><i></i></span>
			{#if item.lines.length > 0}
				<ul class="rg-player-action--lines">
					{#each item.lines as line, at (at)}
						<li>{line}</li>
					{/each}
				</ul>
			{/if}
			{#if item.more > 0}
				<p class="rg-player-action--note">
					And {item.more} more in the log.
				</p>
			{/if}
			<p class="rg-player-action--hint">
				Hover to hold · click, Close or Esc to close
			</p>
		</div>
	</div>
</div>

<style>
	.rg-player-action {
		position: fixed;
		z-index: var(--layer-tray);
		top: 50%;
		left: 37.5%;
		max-width: calc(75% - 2 * var(--space-10));
		border: var(--border) solid var(--line);
		border-radius: var(--radius);
		background: var(--float-surface);
		box-shadow: var(--shadow-float);
		color: var(--text);
		transform: translate(-50%, -50%);
		cursor: pointer;
		animation: rg-player-action-in var(--duration-medium) var(--ease-out);
	}

	.rg-player-action--income .rg-player-action--band {
		background: linear-gradient(
			color-mix(in srgb, var(--gold) 30%, var(--chrome)),
			color-mix(in srgb, var(--gold) 8%, var(--chrome))
		);
	}

	.rg-player-action--band {
		display: flex;
		align-items: baseline;
		gap: var(--space-4);
		padding: var(--space-5) var(--space-8);
		border-top: 4px solid var(--rg-player-action-who);
		border-bottom: var(--border) solid var(--line-soft);
	}

	.rg-player-action--turn {
		color: var(--rg-player-action-who);
		font: italic var(--weight-bold) var(--font-size-xl) /
			var(--leading-tight) var(--font-body);
	}

	.rg-player-action--context {
		color: var(--muted);
		font-size: var(--font-size-sm);
	}

	.rg-player-action--controls {
		display: flex;
		align-items: center;
		gap: var(--space-5);
		margin-left: auto;
		padding-left: var(--space-8);
	}

	.rg-player-action--count {
		display: flex;
		align-items: center;
		gap: 6px;
		color: var(--muted);
		font-size: var(--font-size-sm);
		font-weight: var(--weight-bold);
		white-space: nowrap;
	}

	.rg-player-action--dot {
		width: 8px;
		height: 8px;
		background: var(--line);
	}

	.rg-player-action--dot-on {
		background: var(--rg-player-action-who);
	}

	.rg-player-action--button {
		padding: var(--space-2) var(--space-5);
		border: var(--border) solid var(--line);
		border-radius: var(--radius);
		background: var(--control);
		color: var(--text);
		font: inherit;
		font-size: var(--font-size-sm);
		white-space: nowrap;
		cursor: pointer;
	}

	.rg-player-action--button:hover {
		border-color: var(--gold);
	}

	.rg-player-action--close {
		font-weight: var(--weight-bold);
	}

	.rg-player-action--body {
		display: flex;
		align-items: center;
		gap: var(--space-9);
		padding: var(--space-8);
	}

	.rg-player-action--picture {
		display: grid;
		flex: none;
		justify-items: center;
		gap: var(--space-5);
	}

	.rg-player-action--words {
		display: grid;
		gap: var(--space-6);
		width: 340px;
	}

	.rg-player-action--headline {
		margin: 0;
		font-size: var(--font-size-3xl);
		font-weight: var(--weight-bold);
		line-height: var(--leading-snug);
	}

	.rg-player-action--who {
		color: var(--rg-player-action-who);
	}

	.rg-player-action--name {
		color: var(--gold);
		font-family: var(--font-title);
	}

	/* The 4-second timer under the headline (owner, 2026-10-30): a line in the player's colour that runs down, and
	   stops while the pointer is over the panel. It shows time rather than moving anything, so it runs with reduced
	   motion too. */
	.rg-player-action--timer {
		display: block;
		height: 3px;
		overflow: hidden;
		background: var(--line-soft);
	}

	.rg-player-action--timer i {
		display: block;
		height: 100%;
		background: var(--rg-player-action-who);
		transform-origin: left;
		animation: rg-player-action-timer var(--rg-player-action-hold) linear
			forwards;
	}

	.rg-player-action--paused .rg-player-action--timer i {
		animation-play-state: paused;
	}

	.rg-player-action--lines {
		display: grid;
		gap: var(--space-3);
		margin: 0;
		padding: 0;
		color: var(--muted);
		font-size: var(--font-size-base);
		line-height: var(--leading-snug);
		list-style: none;
	}

	.rg-player-action--lines li {
		position: relative;
		padding-left: 14px;
	}

	.rg-player-action--lines li::before {
		content: '';
		position: absolute;
		top: 0.55em;
		left: 0;
		width: 6px;
		height: 6px;
		background: var(--rg-player-action-who);
	}

	.rg-player-action--note,
	.rg-player-action--hint {
		margin: 0;
		color: var(--faint);
		font-size: var(--font-size-sm);
	}

	.rg-player-action--hint {
		font-size: var(--font-size-xs);
	}

	.rg-player-action--tag {
		display: inline-flex;
		align-items: center;
		gap: var(--space-4);
		padding: 6px var(--space-6);
		border: var(--border) solid var(--line);
		background: var(--control);
		font-size: var(--font-size-sm);
	}

	.rg-player-action--tag img {
		width: 24px;
		height: 24px;
	}

	.rg-player-action--tag b {
		color: var(--rg-player-action-track);
		font-family: var(--font-title);
		font-size: var(--font-size-md);
	}

	.rg-player-action--landmark {
		display: grid;
		place-items: center;
		width: 220px;
		height: 220px;
		border: var(--border) solid var(--line-soft);
		background: var(--choice-fill);
	}

	.rg-player-action--landmark img {
		width: 180px;
		height: 180px;
		image-rendering: pixelated;
	}

	.rg-player-action--caption {
		color: var(--gold);
		font-family: var(--font-title);
		font-size: var(--font-size-lg);
	}

	.rg-player-action--dice {
		display: flex;
		gap: var(--space-5);
	}

	@keyframes rg-player-action-timer {
		from {
			transform: scaleX(1);
		}

		to {
			transform: scaleX(0);
		}
	}

	@keyframes rg-player-action-in {
		from {
			opacity: 0;
			transform: translate(-50%, -46%);
		}
	}

	/* With reduced motion the panel appears without sliding; the timer still runs. */
	@media (prefers-reduced-motion: reduce) {
		.rg-player-action {
			animation: none;
		}
	}
</style>
