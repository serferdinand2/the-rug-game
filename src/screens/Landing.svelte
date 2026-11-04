<!-- The landing page (#25 design §5), as in docs/ui/launch.html: sign in by name, create or join a table, or pick an open one; a new open table rises into the list and the others make room (#175). -->
<script module>
	/**
	 * Properties of the Landing screen itself.
	 * @typedef {Object} LandingOwnProps
	 * @property {import('../lib/game.svelte.js').GameStore} store
	 */

	/**
	 * Properties for Landing, including any attributes for its root element.
	 * @typedef {LandingOwnProps & import('svelte/elements').HTMLAttributes<HTMLElement>} LandingProps
	 *
	 * @example
	 * <Landing {store} />
	 */
</script>

<script>
	import ArtFan from '../lib/components/ui/ArtFan.svelte';
	import Button from '../lib/components/ui/Button.svelte';
	import Divider from '../lib/components/ui/Divider.svelte';
	import Panel from '../lib/components/ui/Panel.svelte';
	import TextInput from '../lib/components/ui/TextInput.svelte';
	import OpenTableRow from '../lib/components/lobby/OpenTableRow.svelte';
	import { untrack } from 'svelte';
	import { glide, rise } from '../lib/transitions.js';
	import { expansionBadges, validCode } from '../lib/lobby.js';
	import { versionName } from '../lib/game-names.js';

	/** @type {LandingProps} */
	let { store, ...attr } = $props();

	// The field starts with the name last used, then belongs to the player.
	let name = $state(untrack(() => store.storedName));
	let code = $state('');
	let codeError = $state('');

	/**
	 * @param {SubmitEvent} event
	 */
	const createSubmitHandler = (event) => {
		event.preventDefault();
		store.createTable(name);
	};

	/**
	 * @param {SubmitEvent} event
	 */
	const joinSubmitHandler = (event) => {
		event.preventDefault();
		if (!validCode(code)) {
			codeError = 'Enter an 8-character table code.';
			return;
		}
		codeError = '';
		store.joinTable(name, code);
	};

	/**
	 * @param {import('../lib/component-event.js').ComponentEvent} event
	 */
	const openTableJoinHandler = (event) => {
		store.joinTable(name, event.value.code);
	};
</script>

<main
	{...attr}
	class="rg-landing {attr.class ? attr.class : ''}">
	<p class="rg-landing--lead">
		Advance through <span class="rg-landing--exploration">Exploration</span
		>,
		<span class="rg-landing--science">Science</span>,
		<span class="rg-landing--technology">Technology</span> and
		<span class="rg-landing--military">Military</span>.
	</p>
	<div class="rg-landing--stack">
		<ArtFan
			class="rg-landing--fan rg-landing--fan-left"
			cards={store.fans.left} />
		<ArtFan
			class="rg-landing--fan rg-landing--fan-right"
			cards={store.fans.right} />
		<Panel
			padding="large"
			aria-label="Create or join a table">
			<div class="rg-landing--form">
				{#if store.me?.saved}
					<div class="rg-landing--return">
						<Button
							mode="gold"
							size="large"
							block
							disabled={store.busy}
							onButtonClick={() => store.returnToGame()}
							>Return to your game</Button>
						<p class="rg-landing--note">
							Your game at table {store.me.saved} is waiting for you.
						</p>
					</div>
				{/if}
				<form
					class="rg-landing--group"
					onsubmit={createSubmitHandler}>
					<TextInput
						label="Your name"
						placeholder="Leave it empty to generate a mythical or historical name"
						autocomplete="nickname"
						maxlength={24}
						bind:value={name} />
					<Button
						type="submit"
						mode="gold"
						size="large"
						block
						disabled={store.busy}>Create a table</Button>
				</form>
				<Divider label="or join friends" />
				<form
					class="rg-landing--group"
					onsubmit={joinSubmitHandler}>
					<TextInput
						label="Table code"
						placeholder="8-character code"
						autocomplete="off"
						maxlength={8}
						error={codeError}
						bind:value={code} />
					<Button
						type="submit"
						mode="gold"
						size="large"
						block
						disabled={store.busy}>Join table</Button>
				</form>
				<p
					class="rg-landing--status"
					aria-live="polite">
					{store.status}
				</p>
			</div>
		</Panel>
		<Panel
			title="Open tables"
			titleFont="title">
			{#if store.tablesState === 'loading' && store.tables.length === 0}
				<p class="rg-landing--empty">Looking for tables…</p>
			{:else if store.tablesState === 'failed'}
				<p class="rg-landing--empty">
					Can't reach the server. Retrying…
				</p>
			{:else if store.tables.length === 0}
				<p class="rg-landing--empty">
					No open tables right now. Create one and invite your
					friends.
				</p>
			{:else}
				<div class="rg-landing--tables">
					{#each store.tables as table (table.code)}
						<!-- Each row in a box of its own, which the list can glide and bring in (#175). -->
						<div
							class="rg-landing--table"
							in:rise={{ y: 8 }}
							animate:glide>
							<OpenTableRow
								code={table.code}
								players={table.seats}
								rules={versionName(table.version)}
								expansions={expansionBadges(table.expansions)}
								onOpenTableRowJoin={openTableJoinHandler} />
						</div>
					{/each}
				</div>
			{/if}
		</Panel>
	</div>
</main>

<style>
	.rg-landing {
		animation: rg-landing-in var(--duration-slow) var(--ease-out);
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-11);
		padding: clamp(28px, 6vh, 70px) var(--space-9) 54px;
		background: var(--texture) var(--surface);
	}

	.rg-landing--lead {
		width: min(820px, 100%);
		margin: 0;
		color: var(--text);
		font: var(--weight-title) var(--font-size-display) / 1.35
			var(--font-title);
		text-align: center;
		text-wrap: balance;
	}

	.rg-landing--exploration {
		color: var(--exploration);
	}

	.rg-landing--science {
		color: var(--science);
	}

	.rg-landing--technology {
		color: var(--technology);
	}

	.rg-landing--military {
		color: var(--military);
	}

	.rg-landing--stack {
		position: relative;
		display: grid;
		gap: var(--space-8);
		width: min(var(--launch-width), 100%);
	}

	.rg-landing--stack :global(.rg-panel) {
		position: relative;
		z-index: 1;
	}

	/* The card fans lie beside the panels, outside the stack's flow. */
	.rg-landing--stack :global(.rg-landing--fan) {
		position: absolute;
		top: var(--space-9);
	}

	.rg-landing--stack :global(.rg-landing--fan-left) {
		right: calc(100% + 2 * var(--space-10));
	}

	.rg-landing--stack :global(.rg-landing--fan-right) {
		left: calc(100% + 2 * var(--space-10));
	}

	.rg-landing--form,
	.rg-landing--group {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.rg-landing--return {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		margin-bottom: var(--space-4);
	}

	.rg-landing--note {
		margin: 0;
		color: var(--muted);
		font-size: var(--font-size-sm);
		text-align: center;
	}

	.rg-landing--status {
		margin: 0;
		color: color-mix(in srgb, var(--gold) 70%, var(--text));
		font-size: var(--font-size-md);
		text-align: center;
	}

	.rg-landing--tables {
		display: grid;
		gap: var(--space-4);
	}

	.rg-landing--table {
		display: grid;
	}

	.rg-landing--empty {
		margin: 0;
		color: var(--muted);
		font-size: var(--font-size-md);
	}

	/* The screen fades in as it takes over from the last one, its content rising a little (issue 175). */
	@keyframes rg-landing-in {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.rg-landing {
			animation: none;
		}
	}
</style>
