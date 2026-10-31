<!-- The tooltip (#137): a large chrome box with an arrow that shows an element's title in place of the browser's small one. Mounted once at the page root, it follows every titled element hovered or focused from the keyboard. -->
<script module>
	/**
	 * Properties of the Tooltip component itself.
	 * @typedef {Object} TooltipOwnProps
	 * @property {'fixed' | 'inline'} [placement='fixed'] - fixed: once at the page root, it shows the title of whatever is hovered or focused from the keyboard; inline: `text` in the page's flow, as on the library page
	 * @property {string} [text=''] - What an inline tooltip says; its line breaks are kept
	 * @property {'top' | 'bottom'} [side='top'] - The side of its target an inline tooltip sits on, so its arrow points down or up
	 * @property {number} [delay=250] - Milliseconds of hover or focus before a fixed tooltip shows; moving on from one that shows skips the wait
	 */

	/**
	 * Properties for the Tooltip component, including any attributes for its root element.
	 * @typedef {TooltipOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} TooltipProps
	 *
	 * @example
	 * <!-- Once, at the page root: every element's title then shows in it. -->
	 * <Tooltip />
	 *
	 * <Tooltip placement="inline" text="Close the seat" />
	 */
</script>

<script>
	import { tick } from 'svelte';
	import { clockTime } from '../../now.svelte.js';
	import { placeTooltip, tooltipText } from '../../tooltip.js';
	import LandmarkHoverDetail from '../board/LandmarkHoverDetail.svelte';

	/** @type {TooltipProps} */
	let {
		placement = 'fixed',
		text = '',
		side = 'top',
		delay = 250,
		...attr
	} = $props();

	/** Where a title waits while its tooltip shows. The element keeps an empty title meanwhile, which hides the browser's own tooltip. */
	const HELD = 'data-rg-title';
	/** How long after one tooltip closes the next one shows without the wait, so a row of spaces reads as the pointer runs along it. */
	const WARM_MS = 300;

	/** @type {HTMLDivElement | undefined} */
	let element = $state();
	/** The followed title, trimmed. */
	let followed = $state('');
	let followedLandmark = $state('');
	let open = $state(false);
	let place = $state(
		/** @type {import('../../tooltip.js').TooltipPlace | null} */ (null)
	);

	/**
	 * The element whose title shows, or is about to.
	 * @type {Element | null}
	 */
	let target = null;
	/**
	 * How the target was reached: a focused one closes on blur, a hovered one when the pointer leaves.
	 * @type {'pointer' | 'focus'}
	 */
	let via = 'pointer';
	/**
	 * The element a press or a key closed the tooltip of; it shows again only once the pointer has left it.
	 * @type {Element | null}
	 */
	let dismissed = null;
	let warmUntil = 0;
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let timer;
	/** @type {MutationObserver | undefined} */
	let observer;

	let content = $derived(placement === 'inline' ? text : followed);
	let shownSide = $derived(
		placement === 'inline' ? side : (place?.side ?? 'top')
	);

	// An element that leaves the page fires no pointer event, so while a tooltip shows, the clocks' shared tick (#89)
	// checks that its element is still there.
	$effect(() => {
		if (open) {
			clockTime.now;
			if (!target?.isConnected) {
				release();
			}
		}
	});

	$effect(() => {
		if (placement !== 'fixed') {
			return;
		}
		observer = new MutationObserver(titleChangeHandler);
		/** @type {[string, EventListener][]} */
		const listeners = [
			['pointerover', /** @type {EventListener} */ (pointeroverHandler)],
			['pointerout', /** @type {EventListener} */ (pointeroutHandler)],
			['pointerdown', pointerdownHandler],
			['focusin', focusinHandler],
			['focusout', focusoutHandler],
			['keydown', keydownHandler],
			['scroll', scrollHandler],
		];
		for (const [type, listener] of listeners) {
			window.addEventListener(type, listener, true);
		}
		window.addEventListener('blur', release);
		window.addEventListener('resize', release);
		return () => {
			release();
			observer?.disconnect();
			for (const [type, listener] of listeners) {
				window.removeEventListener(type, listener, true);
			}
			window.removeEventListener('blur', release);
			window.removeEventListener('resize', release);
		};
	});

	/** @param {PointerEvent} event */
	const pointeroverHandler = (event) => {
		if (event.pointerType === 'touch') {
			return;
		}
		const found = titled(event.target);
		if (found !== dismissed) {
			dismissed = null;
		}
		if (found && found === target) {
			via = 'pointer';
			return;
		}
		if (!found || found === dismissed) {
			release();
			return;
		}
		follow(found, 'pointer');
	};

	/** @param {PointerEvent} event */
	const pointeroutHandler = (event) => {
		// Leaving the window: no pointerover follows to close it.
		if (!event.relatedTarget) {
			release();
		}
	};

	/** @param {Event} event */
	const pointerdownHandler = (event) => {
		dismissed = titled(event.target);
		release();
	};

	/** @param {Event} event */
	const focusinHandler = (event) => {
		const focused = event.target;
		if (
			!(focused instanceof Element) ||
			!focused.matches(':focus-visible')
		) {
			return;
		}
		const found = titled(focused);
		if (found && found !== target) {
			follow(found, 'focus');
		}
	};

	const focusoutHandler = () => {
		if (via === 'focus') {
			release();
		}
	};

	const keydownHandler = () => {
		if (target) {
			dismissed = target;
			release();
		}
	};

	/** @param {Event} event */
	const scrollHandler = (event) => {
		const scrolled = event.target;
		// Only a scroll that moves the element closes its tooltip; a log filling up elsewhere leaves it open.
		if (
			target &&
			(scrolled === document ||
				(scrolled instanceof Node && scrolled.contains(target)))
		) {
			release();
		}
	};

	const titleChangeHandler = () => {
		if (!target) {
			return;
		}
		followedLandmark = target.getAttribute('data-landmark') ?? '';
		const title = target.getAttribute('title');
		// The empty title is the hold itself.
		if (title === '') {
			return;
		}
		if (title === null) {
			target.removeAttribute(HELD);
			followed = '';
			followedLandmark = '';
			return;
		}
		target.setAttribute(HELD, title);
		target.setAttribute('title', '');
		followed = tooltipText(title);
		if (open) {
			show();
		}
	};

	/**
	 * The element whose title a pointer or focus shows: the nearest with a title, as the browser picks it.
	 * @param {EventTarget | null} node
	 * @returns {Element | null}
	 */
	function titled(node) {
		return node instanceof Element ? node.closest('[title]') : null;
	}

	/**
	 * Holds an element's title and shows it after the wait.
	 * @param {Element} found
	 * @param {'pointer' | 'focus'} how
	 */
	function follow(found, how) {
		const warm = open || performance.now() < warmUntil;
		release();
		const title = found.getAttribute('title') ?? '';
		// An empty title shows nothing, as in the browser.
		if (!tooltipText(title)) {
			return;
		}
		target = found;
		via = how;
		followedLandmark = found.getAttribute('data-landmark') ?? '';
		found.setAttribute(HELD, title);
		found.setAttribute('title', '');
		followed = tooltipText(title);
		observer?.observe(found, {
			attributes: true,
			attributeFilter: ['title', 'data-landmark'],
		});
		timer = setTimeout(show, warm ? 0 : delay);
	}

	/** Gives the followed element its title back and closes the tooltip. */
	function release() {
		clearTimeout(timer);
		if (open) {
			warmUntil = performance.now() + WARM_MS;
		}
		if (target) {
			// A title the page changed just now still counts.
			if (observer?.takeRecords().length) {
				titleChangeHandler();
			}
			observer?.disconnect();
			const held = target.getAttribute(HELD);
			if (held !== null) {
				target.setAttribute('title', held);
				target.removeAttribute(HELD);
			}
			target = null;
		}
		open = false;
		place = null;
		followedLandmark = '';
	}

	/** Opens the tooltip unseen, measures it, then places it by its element and fades it in. */
	async function show() {
		const shown = target;
		if (!shown?.isConnected || !followed) {
			return;
		}
		open = true;
		await tick();
		if (target !== shown || !element) {
			return;
		}
		const page = document.documentElement;
		place = placeTooltip(
			shown.getBoundingClientRect(),
			element.getBoundingClientRect(),
			{ width: page.clientWidth, height: page.clientHeight }
		);
	}
</script>

{#if placement === 'inline' || (open && content)}
	<div
		bind:this={element}
		role="tooltip"
		{...attr}
		class="rg-tooltip rg-tooltip--{placement} rg-tooltip--{shownSide} {attr.class
			? attr.class
			: ''}"
		class:rg-tooltip--placed={placement === 'inline' || Boolean(place)}
		style:left={place ? `${place.left}px` : undefined}
		style:top={place ? `${place.top}px` : undefined}>
		<span
			class="rg-tooltip--arrow"
			style:left={place ? `${place.arrow}px` : undefined}></span>
		<span class="rg-tooltip--text">{content}</span>
		{#if placement === 'fixed' && followedLandmark}
			<LandmarkHoverDetail id={followedLandmark} />
		{/if}
	</div>
{/if}

<style>
	.rg-tooltip {
		width: max-content;
		max-width: min(360px, calc(100vw - var(--space-8)));
		padding: var(--space-4) var(--space-6);
		border: var(--border) solid var(--line);
		border-radius: var(--radius);
		background: var(--chrome);
		box-shadow: var(--shadow-float);
		color: var(--text);
		font: var(--font-size-base) / var(--leading-normal) var(--font-body);
		text-align: left;
		pointer-events: none;
	}

	.rg-tooltip--fixed {
		position: fixed;
		z-index: var(--layer-tooltip);
		top: 0;
		left: 0;
		opacity: 0;
		transition: opacity var(--duration-fast) var(--ease);
	}

	.rg-tooltip--inline {
		position: relative;
		display: inline-block;
	}

	.rg-tooltip--placed {
		opacity: 1;
	}

	/* A square turned on its corner, filled like the box so it covers the box's border where they meet, with only
	   its two outer sides drawn. */
	.rg-tooltip--arrow {
		position: absolute;
		left: 50%;
		width: 10px;
		height: 10px;
		border: var(--border) solid var(--line);
		background: var(--chrome);
		transform: translateX(-50%) rotate(45deg);
	}

	.rg-tooltip--top .rg-tooltip--arrow {
		bottom: -6px;
		border-top: 0;
		border-left: 0;
	}

	.rg-tooltip--bottom .rg-tooltip--arrow {
		top: -6px;
		border-right: 0;
		border-bottom: 0;
	}

	.rg-tooltip--text {
		position: relative;
		white-space: pre-line;
		overflow-wrap: break-word;
	}
</style>
