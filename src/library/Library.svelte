<!-- The component library page (#48): a sidebar by area, every section in src/library/sections/ in order, then the art. -->
<script module>
	/**
	 * Properties of the Library component itself.
	 * @typedef {Object} LibraryOwnProps
	 * @property {string} [title='Components'] - The page title beside the brand
	 */

	/**
	 * Properties for the Library component, including any attributes for its root element.
	 * @typedef {LibraryOwnProps & import('svelte/elements').HTMLAttributes<HTMLDivElement>} LibraryProps
	 *
	 * @example
	 * mount(Library, { target: document.getElementById('app') });
	 */

	/**
	 * One component's section on the page.
	 * @typedef {Object} LibraryEntry
	 * @property {string} area - Area folder, such as 'board'
	 * @property {string} name - Component name, such as 'TrackSpace'
	 * @property {string} id - Anchor id, such as 'track-space'
	 * @property {import('svelte').Component} section - The section component
	 */

	/** The areas in page order, with their headings. */
	export const AREAS = Object.freeze([
		{ id: 'ui', name: 'Interface' },
		{ id: 'board', name: 'Board' },
		{ id: 'player', name: 'Player' },
		{ id: 'prompts', name: 'Prompts' },
		{ id: 'lobby', name: 'Lobby' },
		{ id: 'log', name: 'Log' },
		{ id: 'results', name: 'Results' },
	]);

	/**
	 * The anchor id for a component name.
	 * @param {string} name - A PascalCase name, such as 'TrackSpace'
	 * @returns {string} Its kebab-case id, such as 'track-space'
	 */
	export function anchorId(name) {
		return name.replace(/(?<!^)([A-Z])/g, '-$1').toLowerCase();
	}
</script>

<script>
	import ArtTile from './ArtTile.svelte';
	import Section from './Section.svelte';
	import {
		ART_SECTIONS,
		PARTS,
		PICTURES,
		DEFERRED_ART,
		artAnchor,
		artDescription,
	} from './art.js';
	import { EXPANSIONS } from '../lib/art/catalog.js';

	const EXPANSION_NAMES = new Map(
		EXPANSIONS.map(({ code, name }) => [code, name])
	);

	/** @type {LibraryProps} */
	let { title = 'Components', ...attr } = $props();

	/**
	 * Names the art issues that draw a section, such as 'art issue #9 draws them'.
	 * @param {number[]} issues
	 * @returns {string}
	 */
	function issueText(issues) {
		const names = issues.map((issue) => `#${issue}`);
		if (names.length === 1) {
			return `art issue ${names[0]} draws them`;
		}
		return `art issues ${names.slice(0, -1).join(', ')} and ${names.at(-1)} draw them`;
	}

	const modules = /** @type {Record<string, import('svelte').Component>} */ (
		import.meta.glob('./sections/*/*.svelte', {
			eager: true,
			import: 'default',
		})
	);

	/** @type {LibraryEntry[]} */
	const entries = Object.entries(modules)
		.map(([path, section]) => {
			const [, area = '', name = ''] =
				path.match(/^\.\/sections\/(\w+)\/(\w+)\.svelte$/) ?? [];
			return { area, name, id: anchorId(name), section };
		})
		.sort(
			(a, b) =>
				AREAS.findIndex((area) => area.id === a.area) -
					AREAS.findIndex((area) => area.id === b.area) ||
				a.name.localeCompare(b.name)
		);
</script>

<div
	{...attr}
	class="rg-library {attr.class ? attr.class : ''}">
	<nav
		class="rg-library--nav"
		aria-label="Components">
		<p class="rg-library--brand">The Rug Game</p>
		<h1 class="rg-library--title">{title}</h1>
		{#each AREAS as area (area.id)}
			{@const items = entries.filter((entry) => entry.area === area.id)}
			{#if items.length}
				<h2 class="rg-library--area">{area.name}</h2>
				<ul class="rg-library--links">
					{#each items as entry (entry.id)}
						<li>
							<a
								class="rg-library--link"
								href="#{entry.id}">{entry.name}</a>
						</li>
					{/each}
				</ul>
			{/if}
		{/each}
		<h2 class="rg-library--area">Art</h2>
		<ul class="rg-library--links">
			<li>
				<a
					class="rg-library--link"
					href="#{artAnchor('parts')}">Scene parts</a>
			</li>
			{#each ART_SECTIONS as section (section.id)}
				<li>
					<a
						class="rg-library--link"
						href="#{artAnchor(section.id)}"
						>{section.label}
						<span class="rg-library--count"
							>{DEFERRED_ART[section.id]
								? 'Text / later'
								: `${section.drawn}/${section.total}`}</span
						></a>
				</li>
			{/each}
		</ul>
	</nav>
	<main class="rg-library--main">
		{#each entries as entry (entry.id)}
			{@const Section = entry.section}
			<Section />
		{/each}
		<Section
			id={artAnchor('parts')}
			name="Scene parts"
			area="art"
			description="One sample of each scene part in art/parts/, which the drawings combine, at 2× and 4×. The art is drawn live from the art toolkit, so a changed drawing shows here at once in npm run dev; npm run art writes the SVGs the game uses.">
			{#each PARTS as part (part.label)}
				<ArtTile
					name={part.label}
					picture={part.picture} />
			{/each}
		</Section>
		{#each ART_SECTIONS as section (section.id)}
			<Section
				id={artAnchor(section.id)}
				name={section.label}
				area="art"
				description={artDescription(section)}>
				{#if !DEFERRED_ART[section.id]}
					{#each section.lists as list (list.expansion)}
						{#if list.expansion}
							<h3 class="rg-library--expansion">
								{list.expansion}
							</h3>
						{/if}
						{#each list.tiles as tile (tile.asset.id)}
							<ArtTile
								name={tile.asset.name}
								id={tile.asset.id}
								example={tile.asset.example}
								picture={PICTURES.get(tile.asset.id)}
								plots={tile.plots}
								expansion={tile.showExpansion
									? EXPANSION_NAMES.get(tile.asset.expansion)
									: undefined}
								issue={tile.asset.issue} />
						{/each}
					{/each}
				{/if}
			</Section>
		{/each}
	</main>
</div>

<style>
	.rg-library {
		display: grid;
		grid-template-columns: 240px minmax(0, 1fr);
		min-height: 100vh;
	}

	.rg-library--nav {
		position: sticky;
		top: 0;
		height: 100vh;
		overflow: auto;
		padding: var(--space-10) var(--space-9);
		border-right: var(--border) solid var(--line-soft);
		background: var(--chrome);
	}

	.rg-library--brand {
		margin: 0;
		font: var(--weight-bold) var(--font-size-2xl) / var(--leading-none)
			var(--font-title);
		letter-spacing: var(--letter-spacing-title);
		text-transform: uppercase;
		color: var(--gold);
	}

	.rg-library--title {
		margin: var(--space-3) 0 var(--space-10);
		font: var(--weight-bold) var(--font-size-base) / var(--leading-snug)
			var(--font-body);
		color: var(--muted);
	}

	.rg-library--area {
		margin: var(--space-9) 0 var(--space-3);
		font: var(--weight-bold) var(--font-size-2xs) / var(--leading-none)
			var(--font-body);
		letter-spacing: var(--letter-spacing-caps);
		text-transform: uppercase;
		color: var(--bronze);
	}

	.rg-library--links {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.rg-library--link {
		display: block;
		padding: var(--space-2) var(--space-4);
		color: var(--muted);
		font-size: var(--font-size-sm);
		text-decoration: none;
	}

	.rg-library--count {
		margin-left: var(--space-2);
		color: var(--muted);
		font-size: var(--font-size-3xs);
	}

	.rg-library--expansion {
		flex-basis: 100%;
		margin: var(--space-4) 0 0;
		color: var(--muted);
		font-size: var(--font-size-sm);
		font-weight: var(--weight-regular);
	}

	.rg-library--link:hover {
		background: var(--raised);
		color: var(--gold);
	}

	.rg-library--main {
		min-width: 0;
		padding: var(--space-10) var(--space-11) calc(var(--space-11) * 3);
		background: var(--ink);
	}
</style>
