// The HTTP server: serving public/ safely, caching headers and the API fallback.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { symlink, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { server } from '../server.mjs';

// listen() binds a tick after it is called, so wait before checking that the import didn't call it.
await new Promise((resolve) => setTimeout(resolve, 50));
const addressAfterImport = server.address();
let port;

before(async () => {
	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
	port = server.address().port;
});
after(() => server.close());

// Raw request paths: fetch() would normalise the encodings these attacks rely on.
const get = (path, headers = {}) =>
	new Promise((resolve, reject) => {
		http.get({ host: '127.0.0.1', port, path, headers }, (res) => {
			let body = '';
			res.setEncoding('latin1');
			res.on('data', (chunk) => {
				body += chunk;
			});
			res.on('end', () =>
				resolve({ status: res.statusCode, headers: res.headers, body })
			);
		}).on('error', reject);
	});

test('importing the server does not listen', () => {
	assert.equal(addressAfterImport, null);
});

test('starts when run through a symlinked path', async () => {
	const dir = await mkdtemp(join(tmpdir(), 'rug-'));
	const link = join(dir, 'app');
	await symlink(fileURLToPath(new URL('..', import.meta.url)), link);
	const child = spawn(process.execPath, [join(link, 'server.mjs')], {
		env: { ...process.env, PORT: '0' },
		stdio: ['ignore', 'pipe', 'pipe'],
	});
	try {
		const output = await new Promise((resolve, reject) => {
			const timer = setTimeout(
				() => reject(new Error('no startup line within 5 seconds')),
				5000
			);
			child.stdout.on('data', (chunk) => {
				clearTimeout(timer);
				resolve(String(chunk));
			});
			child.on('exit', (code) => {
				clearTimeout(timer);
				resolve(`exited with code ${code}`);
			});
		});
		assert.match(output, /The Rug Game: http:/);
	} finally {
		child.kill();
		await rm(dir, { recursive: true, force: true });
	}
});

test('serves the placeholder page', async () => {
	const home = await get('/');
	assert.equal(home.status, 200);
	assert.match(home.headers['content-type'], /^text\/html/);
	assert.match(home.body, /The Rug Game/);
	assert.equal(home.headers['x-content-type-options'], 'nosniff');
});

test('serves the favicon and fonts with long caching', async () => {
	const icon = await get('/favicon.svg');
	assert.equal(icon.status, 200);
	assert.equal(icon.headers['content-type'], 'image/svg+xml');
	for (const name of ['alagard', 'vcr-osd-mono']) {
		const font = await get(`/fonts/${name}.ttf`);
		assert.equal(font.status, 200, name);
		assert.equal(font.headers['content-type'], 'font/ttf');
		assert.equal(font.headers['cache-control'], 'public, max-age=604800');
	}
});

test('revalidates with weak ETags', async () => {
	const first = await get('/');
	assert.match(first.headers.etag, /^W\//);
	assert.equal(first.headers['cache-control'], 'no-cache');
	const second = await get('/', { 'If-None-Match': first.headers.etag });
	assert.equal(second.status, 304);
});

test('never serves files outside public/', async () => {
	const attacks = [
		'/file:/etc/hosts',
		'/file:///etc/hosts',
		'/%2e%2e/server.mjs',
		'/%252e%252e/server.mjs',
		'/..%2fserver.mjs',
		'/%2fetc%2fhosts',
		'/fonts/%00',
		'/%2e%2e/.git/config',
	];
	for (const path of attacks) {
		const res = await get(path);
		assert.notEqual(res.status, 200, path);
		assert.doesNotMatch(
			res.body,
			/node:http|repositoryformatversion|localhost/,
			path
		);
	}
});

test('rejects malformed percent-encoding and unparseable paths', async () => {
	for (const path of ['/%E0%A4%A', '//', '//[']) {
		assert.equal((await get(path)).status, 400, path);
	}
	assert.equal((await get('/')).status, 200, 'the server keeps answering');
});

test('serves built bundles with immutable caching', async () => {
	const home = await get('/');
	const script = home.body.match(
		/<script type="module"[^>]*src="(\/assets\/[^"]+\.js)"/
	);
	assert.ok(script, 'the built page loads a hashed bundle from /assets/');
	const bundle = await get(script[1]);
	assert.equal(bundle.status, 200);
	assert.match(bundle.headers['content-type'], /^text\/javascript/);
	assert.equal(
		bundle.headers['cache-control'],
		'public, max-age=31536000, immutable'
	);
	assert.equal(
		home.headers['cache-control'],
		'no-cache',
		'the page itself is always revalidated'
	);
});

test('unknown API paths answer JSON', async () => {
	const res = await get('/api/nothing');
	assert.equal(res.status, 404);
	assert.match(res.headers['content-type'], /^application\/json/);
	assert.deepEqual(JSON.parse(res.body), { error: 'Unknown request.' });
});
