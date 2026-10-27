// The Vite setup: Svelte settings reach the build, and the dev server and proxy match the documented address and port.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, createServer, resolveConfig } from 'vite';

const configFile = fileURLToPath(new URL('../vite.config.js', import.meta.url));
// Throwaway projects live inside node_modules so their imports resolve the installed Svelte.
const scratch = fileURLToPath(new URL('../node_modules/', import.meta.url));

test('the build enforces runes mode from svelte.config.js', async () => {
	const root = await mkdtemp(join(scratch, '.rug-legacy-'));
	try {
		await writeFile(
			join(root, 'index.html'),
			'<div id="app"></div><script type="module" src="/main.js"></script>'
		);
		await writeFile(
			join(root, 'main.js'),
			"import Legacy from './Legacy.svelte';\nconsole.log(Legacy);\n"
		);
		await writeFile(
			join(root, 'Legacy.svelte'),
			'<script>export let name;</script><p>{name}</p>\n'
		);
		await assert.rejects(
			build({
				configFile,
				root,
				logLevel: 'silent',
				build: {
					outDir: join(root, 'out'),
					write: false,
					// The throwaway project has one page, not the app's two.
					rolldownOptions: { input: join(root, 'index.html') },
				},
			}),
			/runes mode/
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('the app builds from the project root, copying static/ as is', async () => {
	const config = await resolveConfig(
		{ configFile, logLevel: 'silent' },
		'build'
	);
	const root = fileURLToPath(new URL('..', import.meta.url));
	assert.equal(join(config.root, '/'), root);
	assert.equal(join(config.publicDir), join(root, 'static'));
	assert.equal(join(config.build.outDir), join(root, 'build'));
});

test('the build includes the game, component library and card review', async () => {
	const config = await resolveConfig(
		{ configFile, logLevel: 'silent' },
		'build'
	);
	const root = fileURLToPath(new URL('..', import.meta.url));
	assert.deepEqual(config.build.rolldownOptions.input, {
		game: join(root, 'index.html'),
		components: join(root, 'components.html'),
		cards: join(root, 'docs/ui/collectors-review.html'),
	});
	assert.deepEqual(config.optimizeDeps.entries, [
		'index.html',
		'components.html',
	]);
});

test('the dev server answers on 127.0.0.1', async () => {
	const server = await createServer({
		configFile,
		logLevel: 'silent',
		server: { port: 0 },
	});
	try {
		await server.listen();
		const { port } = /** @type {import('node:net').AddressInfo} */ (
			server.httpServer?.address()
		);
		const res = await fetch(`http://127.0.0.1:${port}/`);
		assert.equal(res.status, 200);
	} finally {
		await server.close();
	}
});

test('the dev proxy follows PORT from .env', async () => {
	const dir = await mkdtemp(join(tmpdir(), 'rug-env-'));
	const previous = process.cwd();
	const saved = process.env.PORT;
	try {
		delete process.env.PORT;
		await writeFile(join(dir, '.env'), 'PORT=3999\n');
		process.chdir(dir);
		const config = await resolveConfig(
			{ configFile, logLevel: 'silent' },
			'serve'
		);
		assert.equal(config.server.proxy?.['/api'], 'http://127.0.0.1:3999');
	} finally {
		process.chdir(previous);
		if (saved === undefined) {
			delete process.env.PORT;
		} else {
			process.env.PORT = saved;
		}
		await rm(dir, { recursive: true, force: true });
	}
});
