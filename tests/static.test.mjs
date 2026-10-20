// The HTTP server: serving public/ safely, caching headers and the API fallback.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { server } from '../server.mjs';

const listeningOnImport = server.listening;
let port;

before(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  port = server.address().port;
});
after(() => server.close());

// Raw request paths: fetch() would normalise the encodings these attacks rely on.
const get = (path, headers = {}) => new Promise((resolve, reject) => {
  http.get({ host: '127.0.0.1', port, path, headers }, res => {
    let body = '';
    res.setEncoding('latin1');
    res.on('data', chunk => { body += chunk; });
    res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
  }).on('error', reject);
});

test('importing the server does not listen', () => {
  assert.equal(listeningOnImport, false);
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
  const attacks = ['/file:/etc/hosts', '/file:///etc/hosts', '/%2e%2e/server.mjs', '/%252e%252e/server.mjs', '/..%2fserver.mjs', '/%2fetc%2fhosts', '/fonts/%00', '/%2e%2e/.git/config'];
  for (const path of attacks) {
    const res = await get(path);
    assert.notEqual(res.status, 200, path);
    assert.doesNotMatch(res.body, /node:http|repositoryformatversion|localhost/, path);
  }
});

test('rejects malformed percent-encoding', async () => {
  assert.equal((await get('/%E0%A4%A')).status, 400);
  assert.equal((await get('/')).status, 200, 'the server keeps answering');
});

test('unknown API paths answer JSON', async () => {
  const res = await get('/api/nothing');
  assert.equal(res.status, 404);
  assert.match(res.headers['content-type'], /^application\/json/);
  assert.deepEqual(JSON.parse(res.body), { error: 'Unknown request.' });
});
