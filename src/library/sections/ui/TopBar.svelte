<!-- Library section: TopBar as the launch header with a title, the lobby header, the game header with player chips, and without its rule. -->
<script>
	import IconButton from '../../../lib/components/ui/IconButton.svelte';
	import PlayerChip from '../../../lib/components/player/PlayerChip.svelte';
	import Menu from '../../../lib/components/ui/Menu.svelte';
	import TopBar from '../../../lib/components/ui/TopBar.svelte';
	import Example from '../../Example.svelte';
	import Section from '../../Section.svelte';

	/** @typedef {import('../../../lib/component-event.js').ComponentEvent} ComponentEvent */

	const PLAYERS = /** @type {const} */ ([
		{ seat: 1, name: 'You', civilization: 'Alchemists', vp: 37 },
		{ seat: 2, name: 'Ana', civilization: 'Militants', vp: 41 },
		{ seat: 3, name: 'Marko', civilization: 'Nomads', vp: 33 },
		{ seat: 4, name: 'Vera', civilization: 'Futurists', vp: 29 },
	]);

	let muted = $state(true);
	let menuOpen = $state(false);
	/** @type {HTMLElement | undefined} */
	let menuToggle = $state();

	/**
	 * @param {ComponentEvent} event
	 */
	const menuToggleClickHandler = (event) => {
		menuToggle = event.target;
		menuOpen = !menuOpen;
	};

	/**
	 * Escape and a choice return the focus to the toggle; Tab moves on.
	 * @param {ComponentEvent} event
	 */
	const menuCloseHandler = (event) => {
		if (event.value !== 'tab') {
			menuToggle?.focus();
		}
	};
</script>

{#snippet launchControls()}
	<IconButton
		icon="sound"
		label="Mute"
		{muted}
		onIconButtonClick={() => (muted = !muted)} />
	<div style:position="relative">
		<IconButton
			icon="menu"
			label="Menu"
			expanded={menuOpen}
			onIconButtonClick={menuToggleClickHandler} />
		<div
			style:position="absolute"
			style:top="calc(100% + 5px)"
			style:right="0"
			style:z-index="var(--layer-popover)">
			<Menu
				label="Menu"
				items={[
					{ id: 'help', label: 'How to play' },
					{ id: 'about', label: 'About this project' },
				]}
				bind:open={menuOpen}
				onMenuClose={menuCloseHandler} />
		</div>
	</div>
{/snippet}

{#snippet lobbyControls()}
	<IconButton
		icon="sound"
		label="Mute"
		muted />
	<IconButton
		icon="menu"
		label="Menu"
		expanded={false} />
{/snippet}

{#snippet gameControls()}
	<IconButton
		icon="sound"
		label="Mute"
		muted={false} />
	<IconButton
		icon="history"
		label="History" />
	<IconButton
		icon="menu"
		label="Menu"
		expanded={false} />
{/snippet}

{#snippet playerChips(/** @type {boolean} */ filled)}
	<div
		style:display="flex"
		style:gap="var(--space-4)">
		{#each PLAYERS as player (player.seat)}
			<PlayerChip
				{...player}
				current={player.seat === 1}
				{filled} />
		{/each}
	</div>
{/snippet}

{#snippet chips()}
	{@render playerChips(false)}
{/snippet}

{#snippet filledChips()}
	{@render playerChips(true)}
{/snippet}

<Section
	name="TopBar"
	area="ui"
	description="The 58px header on every page: the brand at the left, a sentence or the player chips in the centre, and the controls at the right.">
	<Example
		label={'title="Build a civilization that stands the test of time" controls={…}  (sound and menu work)'}
		surface="chrome"
		wide>
		<TopBar
			title="Build a civilization that stands the test of time"
			controls={launchControls} />
	</Example>
	<Example
		label={'controls={…}'}
		surface="chrome"
		wide>
		<TopBar controls={lobbyControls} />
	</Example>
	<Example
		label={'center={player chips} controls={…}'}
		surface="chrome"
		wide>
		<TopBar
			center={chips}
			controls={gameControls} />
	</Example>
	<Example
		label={'center={filled player chips} controls={…} divider={false}  (over the player overview)'}
		surface="chrome"
		wide>
		<TopBar
			center={filledChips}
			controls={gameControls}
			divider={false} />
	</Example>
</Section>
