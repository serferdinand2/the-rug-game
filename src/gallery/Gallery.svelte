<!-- The public card reference: searchable catalog groups, real game card faces, and labelled unfinished slots. -->
<script>
	import CardEntry from './CardEntry.svelte';
	import {
		CARD_GROUPS,
		GALLERY_EXPANSIONS,
		GALLERY_GROUPS,
		galleryAssets,
		groupCount,
	} from './gallery-data.js';

	let group = $state('civ');
	let expansion = $state('all');
	let query = $state('');
	let limit = $state(48);
	const matches = $derived(galleryAssets({ group, expansion, query }));
	const visible = $derived(matches.slice(0, limit));
	const sections = $derived(
		GALLERY_GROUPS.flatMap((kind) =>
			GALLERY_EXPANSIONS.map((edition) => ({
				id: `${kind.id}-${edition.code}`,
				label: kind.label,
				expansion: edition.name,
				assets: visible.filter(
					(asset) =>
						asset.group === kind.id &&
						asset.expansion === edition.code
				),
			}))
		).filter((section) => section.assets.length)
	);

	/** @param {string} value */
	function chooseGroup(value) {
		group = value;
		limit = 48;
	}
	/** @param {string} value */
	function chooseExpansion(value) {
		expansion = value;
		limit = 48;
	}
	/** @param {Event} event */
	function search(event) {
		query = /** @type {HTMLInputElement} */ (event.currentTarget).value;
		if (query.trim()) group = 'all';
		limit = 48;
	}
</script>

<svelte:head>
	<meta
		name="description"
		content="Browse every card and asset in The Rug Game by type and expansion." />
</svelte:head>

<div class="rg-gallery">
	<header class="rg-gallery__header">
		<a
			class="rg-gallery__back"
			href="/">← Back to game</a>
		<div>
			<h1>Card gallery</h1>
			<p>Cards and artwork from the game catalog</p>
		</div>
	</header>
	<main class="rg-gallery__main">
		<div class="rg-gallery__tools">
			<label class="rg-gallery__search"
				>Search cards and assets <input
					type="search"
					value={query}
					oninput={search}
					placeholder="Search by name" /></label>
			<div
				class="rg-gallery__expansions"
				aria-label="Filter by expansion">
				<button
					type="button"
					class:active={expansion === 'all'}
					onclick={() => chooseExpansion('all')}>All editions</button>
				{#each GALLERY_EXPANSIONS as edition (edition.code)}
					<button
						type="button"
						class:active={expansion === edition.code}
						onclick={() => chooseExpansion(edition.code)}
						>{edition.name}</button>
				{/each}
			</div>
		</div>
		<nav
			class="rg-gallery__groups"
			aria-label="Asset types">
			<button
				type="button"
				class:active={group === 'all'}
				onclick={() => chooseGroup('all')}>All types</button>
			{#each GALLERY_GROUPS as kind (kind.id)}
				<button
					type="button"
					class:active={group === kind.id}
					onclick={() => chooseGroup(kind.id)}
					>{kind.label} <span>{groupCount(kind.id)}</span></button>
			{/each}
		</nav>
		<p class="rg-gallery__count">
			Showing {visible.length} of {matches.length}
			{group === 'all'
				? 'catalog items'
				: GALLERY_GROUPS.find(
						(kind) => kind.id === group
					)?.label.toLowerCase()}
		</p>
		{#if matches.length === 0}
			<p class="rg-gallery__empty">
				No matching cards or assets. Try another name or edition.
			</p>
		{:else}
			{#each sections as section (section.id)}
				<section class="rg-gallery__section">
					<h2>
						{section.label}
						<span
							>{section.expansion} · {section.assets
								.length}</span>
					</h2>
					<div
						class="rg-gallery__cards"
						style={`--card-col:${CARD_GROUPS.includes(section.assets[0].group) && ['civ', 'tech'].includes(section.assets[0].group) ? '425px' : '319px'}`}>
						{#each section.assets as asset (asset.id)}<CardEntry
								{asset} />{/each}
					</div>
				</section>
			{/each}
			{#if visible.length < matches.length}
				<button
					class="rg-gallery__more"
					type="button"
					onclick={() => (limit += 48)}
					>Show more ({matches.length - visible.length} remaining)</button>
			{/if}
		{/if}
	</main>
</div>

<style>
	.rg-gallery {
		min-height: 100vh;
		background: var(--texture) var(--surface);
	}
	.rg-gallery__header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 24px;
		padding: 24px clamp(20px, 4vw, 56px);
		background: var(--chrome);
		border-bottom: 1px solid var(--line-strong);
	}
	.rg-gallery__back {
		color: var(--text);
		text-decoration: none;
		white-space: nowrap;
	}
	.rg-gallery__back:hover {
		color: var(--gold);
		text-decoration: underline;
	}
	.rg-gallery__header h1 {
		margin: 0;
		color: var(--gold);
		font: 700 clamp(28px, 3vw, 38px)/1.1 var(--font-title);
	}
	.rg-gallery__header p {
		margin: 6px 0 0;
		color: var(--muted);
	}
	.rg-gallery__main {
		max-width: 1800px;
		margin: 0 auto;
		padding: 24px clamp(20px, 4vw, 56px) 80px;
	}
	.rg-gallery__tools {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		justify-content: space-between;
		gap: 20px;
	}
	.rg-gallery__search {
		display: grid;
		gap: 8px;
		min-width: min(100%, 300px);
		color: var(--text);
		font-weight: 700;
	}
	.rg-gallery__search input {
		min-height: 42px;
		padding: 8px 12px;
		color: var(--text);
		background: var(--control);
		border: 1px solid var(--line-strong);
	}
	.rg-gallery__search input::placeholder {
		color: var(--muted);
	}
	.rg-gallery__expansions,
	.rg-gallery__groups {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.rg-gallery__groups {
		margin-top: 24px;
		padding-top: 20px;
		border-top: 1px solid var(--line);
	}
	.rg-gallery button {
		min-height: 36px;
		padding: 7px 11px;
		color: var(--text);
		background: var(--control);
		border: 1px solid var(--line-strong);
	}
	.rg-gallery button:hover,
	.rg-gallery button:focus-visible {
		border-color: var(--gold);
	}
	.rg-gallery button.active {
		color: var(--ink);
		background: var(--gold);
		border-color: var(--gold);
	}
	.rg-gallery__groups button span {
		margin-left: 5px;
		opacity: 0.75;
		font-size: 12px;
	}
	.rg-gallery__count {
		margin: 26px 0 0;
		color: var(--muted);
	}
	.rg-gallery__section {
		margin-top: 28px;
	}
	.rg-gallery__section h2 {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 12px;
		margin: 0 0 18px;
		color: var(--text);
		font: 700 24px/1.2 var(--font-title);
	}
	.rg-gallery__section h2 span {
		color: var(--muted);
		font: 400 14px/1.2 var(--font-body);
	}
	.rg-gallery__cards {
		display: grid;
		grid-template-columns: repeat(
			auto-fill,
			minmax(min(100%, var(--card-col)), 1fr)
		);
		align-items: start;
		gap: 28px 22px;
	}
	.rg-gallery__empty {
		padding: 44px 0;
		color: var(--muted);
	}
	.rg-gallery__more {
		display: block;
		margin: 40px auto 0;
	}
</style>
