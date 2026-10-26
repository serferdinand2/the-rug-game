// The Rug Game's HTTP server: serves public/ and hands /api/ requests to the table API (api.mjs), which keeps every table in memory.
import http from 'node:http';
import { realpathSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { gzip } from 'node:zlib';
import { rateLimiter, clientAddress } from './limits.mjs';
import { createApi, sendJson } from './api.mjs';

/** The server's settings. The API reads the waits and limits on every use, so tests can shorten or raise them. */
export const config = {
	host: process.env.HOST || '127.0.0.1',
	port: Number(process.env.PORT || 3020),
	trustProxy: process.env.TRUST_PROXY === 'true',
	// How long a state request waits for its table to change.
	longPollMs: 25_000,
	// How long a session lasts unused, and how many the server keeps.
	sessionMs: 24 * 60 * 60 * 1000,
	maxSessions: 10_000,
	// Requests per address a minute: every /api/ request, new tables and logins (#23 design §9).
	apiLimit: 1800,
	createLimit: 20,
	loginLimit: 30,
};

/** The table API: every table and session in memory. */
export const api = createApi(config);

const publicDir = fileURLToPath(new URL('./public/', import.meta.url));
const apiLimiter = rateLimiter(() => config.apiLimit, 60_000);
const gzipAsync = promisify(gzip);
const zipped = new Map();
const types = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.txt': 'text/plain; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.ico': 'image/x-icon',
	'.ttf': 'font/ttf',
	'.woff2': 'font/woff2',
};
const compressible = new Set(['.html', '.js', '.css', '.json', '.svg']);

async function handleApi(req, res) {
	const address = clientAddress(req, config.trustProxy);
	if (!apiLimiter.allow(String(address))) {
		return sendJson(res, 429, {
			error: 'Too many requests. Try again shortly.',
		});
	}
	return api.handle(req, res, address);
}

/**
 * Chooses how long browsers may keep a file from public/.
 * @param {string} path - The file's path inside public/
 * @returns {string} The Cache-Control header value.
 */
function cacheControl(path) {
	if (path.startsWith('assets/')) {
		return 'public, max-age=31536000, immutable';
	}
	if (/^(art|fonts)\//.test(path)) {
		return 'public, max-age=604800';
	}
	return 'no-cache';
}

async function serveStatic(req, res, pathname) {
	// Resolve as a plain file path (never a URL, which would honour file: and %2e%2e) and refuse anything outside public/.
	let path;
	try {
		path =
			pathname === '/'
				? 'index.html'
				: decodeURIComponent(pathname.slice(1));
	} catch {
		res.writeHead(400);
		return res.end('Bad request');
	}
	const file = resolve(publicDir, path);
	if (!file.startsWith(publicDir) || path.includes('\0')) {
		res.writeHead(403);
		return res.end();
	}
	const info = await stat(file).catch(() => null);
	if (!info?.isFile()) {
		res.writeHead(404);
		return res.end('Not found');
	}
	// Vite's bundles have content hashes in their names, so they never change; art and fonts rarely change and are
	// kept for a week; the page itself is checked on every load so a new deploy is picked up.
	const type = extname(file);
	const etag = `W/"${info.size.toString(36)}-${info.mtime.getTime().toString(36)}"`;
	const headers = {
		'Content-Type': types[type] || 'application/octet-stream',
		'Cache-Control': cacheControl(path),
		ETag: etag,
		Vary: 'Accept-Encoding',
	};
	if (req.headers['if-none-match']?.split(/\s*,\s*/).includes(etag)) {
		res.writeHead(304, headers);
		return res.end();
	}
	if (
		compressible.has(type) &&
		/\bgzip\b/.test(req.headers['accept-encoding'] || '')
	) {
		let cached = zipped.get(file);
		if (cached?.etag !== etag) {
			cached = { etag, data: await gzipAsync(await readFile(file)) };
			zipped.set(file, cached);
		}
		res.writeHead(200, { ...headers, 'Content-Encoding': 'gzip' });
		return res.end(cached.data);
	}
	// Read before writing the head: a file that fails to read must become an error, not an empty 200.
	const data = await readFile(file);
	res.writeHead(200, headers);
	res.end(data);
}

export const server = http.createServer(async (req, res) => {
	res.setHeader('X-Content-Type-Options', 'nosniff');
	res.setHeader('Referrer-Policy', 'no-referrer');
	let pathname;
	try {
		({ pathname } = new URL(req.url, 'http://localhost'));
	} catch {
		// Paths such as // or //[ read as a host name and can't be parsed; they are the client's mistake.
		res.writeHead(400);
		return res.end('Bad request');
	}
	try {
		if (pathname === '/api' || pathname.startsWith('/api/')) {
			return await handleApi(req, res);
		}
		return await serveStatic(req, res, pathname);
	} catch (error) {
		// Anything that reaches here is a server fault: it stays in the server log, and the player sees a generic message.
		console.error(error);
		if (res.headersSent) {
			return res.end();
		}
		sendJson(res, 500, { error: 'Something went wrong. Try again.' });
	}
});

// Every minute: request counts for quiet addresses are forgotten, and idle tables and sessions expire.
setInterval(() => {
	apiLimiter.sweep();
	api.sweep();
}, 60_000).unref();

// Listen only when run directly, so tests can import the server and choose their own port. The started path is
// resolved through symlinks because import.meta.url always holds the real path (as in /srv/app/current/server.mjs).
if (
	process.argv[1] &&
	realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
) {
	server.listen(config.port, config.host, () => {
		const shown = ['0.0.0.0', '::'].includes(config.host)
			? '127.0.0.1'
			: config.host.includes(':')
				? `[${config.host}]`
				: config.host;
		console.log(`The Rug Game: http://${shown}:${config.port}`);
	});
}
