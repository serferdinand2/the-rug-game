<!-- Library section: Menu open with actions, with links and with an on/off switch, each under its menu toggle. -->
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
	let switchOpen = $state(true);
	let chosen = $state('');
	let darkCards = $state(false);

	let switches = $derived([
		{ id: 'help', label: 'How to play' },
		{ id: 'cards', label: 'Dark cards', checked: darkCards },
		{ id: 'leave', label: 'Leave table' },
	]);

	/** @type {HTMLElement | undefined} */
	let actionsToggle = $state();
	/** @type {HTMLElement | undefined} */
	let linksToggle = $state();
	/** @type {HTMLElement | undefined} */
	let switchToggle = $state();

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
	const switchToggleClickHandler = (event) => {
		switchToggle = event.target;
		switchOpen = !switchOpen;
	};

	/**
	 * @param {ComponentEvent} event
	 */
	const actionsSelectHandler = (event) => {
		chosen = event.value;
	};

	/**
	 * The switch turns and the menu stays open; the other entries close it.
	 * @param {ComponentEvent} event
	 */
	const switchSelectHandler = (event) => {
		if (event.value === 'cards') {
			darkCards = !darkCards;
		}
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
	description="The header's popover: actions, links or on/off switches under the menu button. The arrow keys move between entries, and Escape closes it and returns to the button. A switch stays open when chosen, so it shows itself turning.">
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
	<Example
		label={`items with checked={${darkCards}} open={${switchOpen}}  (choose Dark cards: it turns and the menu stays open)`}
		surface="chrome"
		width={260}>
		<div
			style:display="flex"
			style:justify-content="flex-end">
			<IconButton
				icon="menu"
				label="Switches"
				expanded={switchOpen}
				onIconButtonClick={switchToggleClickHandler} />
		</div>
		<div
			style:min-height="125px"
			style:padding-top="5px">
			<Menu
				label="Switches"
				items={switches}
				bind:open={switchOpen}
				onMenuSelect={switchSelectHandler}
				onMenuClose={(/** @type {ComponentEvent} */ event) =>
					menuCloseHandler(event, switchToggle)} />
		</div>
	</Example>
</Section>
