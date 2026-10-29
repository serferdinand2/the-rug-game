<!-- The landing page (#25 design §5), as in docs/ui/launch.html: sign in by name, create or join a table, or pick an open one. -->
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
	import Button from '../lib/components/ui/Button.svelte';
	import Divider from '../lib/components/ui/Divider.svelte';
	import Panel from '../lib/components/ui/Panel.svelte';
	import TextInput from '../lib/components/ui/TextInput.svelte';
	import OpenTableRow from '../lib/components/lobby/OpenTableRow.svelte';
	import { untrack } from 'svelte';
	import { rulesLabel, validCode } from '../lib/lobby.js';

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
						<OpenTableRow
							code={table.code}
							players={table.seats}
							rules={rulesLabel(table.version)}
							onOpenTableRowJoin={openTableJoinHandler} />
					{/each}
				</div>
			{/if}
		</Panel>
	</div>
</main>

<style>
	.rg-landing {
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
		display: grid;
		gap: var(--space-8);
		width: min(var(--launch-width), 100%);
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

	.rg-landing--empty {
		margin: 0;
		color: var(--muted);
		font-size: var(--font-size-md);
	}
</style>
