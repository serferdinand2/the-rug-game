<!-- Library section: Menu open with actions and with links, each under its menu toggle. -->
<script>
	import IconButton from '../../../lib/components/ui/IconButton.svelte';
	import Menu from '../../../lib/components/ui/Menu.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	/** @typedef {import('../../../lib/component-event.js').ComponentEvent} ComponentEvent */

	const ACTIONS = [
		{ id: 'help', label: 'How to play' },
		{ id: 'about', label: 'About this project' },
		{ id: 'lobby', label: 'Open lobby' },
		{ id: 'play', label: 'Open play mockup' },
	];
	const LINKS = [
		{ id: 'launch', label: 'Launch page', href: '#menu' },
		{ id: 'lobby', label: 'Lobby page', href: '#menu' },
		{ id: 'game', label: 'Game page', href: '#menu' },
	];

	let actionsOpen = $state(true);
	let linksOpen = $state(true);
	let chosen = $state('');

	/** @type {HTMLElement | undefined} */
	let actionsToggle = $state();
	/** @type {HTMLElement | undefined} */
	let linksToggle = $state();

	/**
	 * @param {ComponentEvent} event
	 */
	const actionsToggleClickHandler = (event) => {
		actionsToggle = event.target;
		actionsOpen = !actionsOpen;
	};

	/**
	 * @param {ComponentEvent} event
	 */
	const linksToggleClickHandler = (event) => {
		linksToggle = event.target;
		linksOpen = !linksOpen;
	};

	/**
	 * @param {ComponentEvent} event
	 */
	const actionsSelectHandler = (event) => {
		chosen = event.value;
	};

	/**
	 * Escape and a choice return the focus to the toggle; Tab moves on.
	 * @param {ComponentEvent} event
	 * @param {HTMLElement | undefined} toggle
	 */
	const menuCloseHandler = (event, toggle) => {
		if (event.value !== 'tab') {
			toggle?.focus();
		}
	};
</script>

<Section
	name="Menu"
	area="ui"
	description="The header's popover: actions or links under the menu button. The arrow keys move between entries, and Escape closes it and returns to the button.">
	<Example
		label={`open={${actionsOpen}}${chosen ? `  onMenuSelect → "${chosen}"` : ''}  (choose an entry, or press Escape)`}
		surface="chrome"
		width={260}>
		<div
			style:display="flex"
			style:justify-content="flex-end">
			<IconButton
				icon="menu"
				label="Menu"
				expanded={actionsOpen}
				onIconButtonClick={actionsToggleClickHandler} />
		</div>
		<div
			style:min-height="160px"
			style:padding-top="5px">
			<Menu
				label="Menu"
				items={ACTIONS}
				bind:open={actionsOpen}
				onMenuSelect={actionsSelectHandler}
				onMenuClose={(/** @type {ComponentEvent} */ event) =>
					menuCloseHandler(event, actionsToggle)} />
		</div>
	</Example>
	<Example
		label={`items with href open={${linksOpen}}`}
		surface="chrome"
		width={260}>
		<div
			style:display="flex"
			style:justify-content="flex-end">
			<IconButton
				icon="menu"
				label="Pages"
				expanded={linksOpen}
				onIconButtonClick={linksToggleClickHandler} />
		</div>
		<div
			style:min-height="125px"
			style:padding-top="5px">
			<Menu
				label="Pages"
				items={LINKS}
				bind:open={linksOpen}
				onMenuClose={(/** @type {ComponentEvent} */ event) =>
					menuCloseHandler(event, linksToggle)} />
		</div>
	</Example>
</Section>
