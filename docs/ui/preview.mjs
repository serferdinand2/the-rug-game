// Serve the UI reference pages without building or running the game.
import { createReadStream } from 'node:fs';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const UI_ROOT = import.meta.dirname;
const CONTENT_TYPES = {
	'.html': 'text/html; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.mjs': 'text/javascript; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.md': 'text/plain; charset=utf-8',
};

export const server = createServer((request, response) => {
	let pathname;
	try {
		pathname = decodeURIComponent(
			new URL(request.url || '/', 'http://127.0.0.1').pathname
		);
	} catch {
		response.writeHead(400).end('Bad request');
		return;
	}
	const file = resolve(
		UI_ROOT,
		pathname === '/' ? 'launch.html' : `.${pathname}`
	);
	if (!file.startsWith(`${UI_ROOT}${sep}`)) {
		response.writeHead(403).end('Forbidden');
		return;
	}
	response.setHeader(
		'Content-Type',
		CONTENT_TYPES[extname(file)] || 'application/octet-stream'
	);
	response.setHeader('Cache-Control', 'no-store');
	createReadStream(file)
		.on('error', () => {
			if (!response.headersSent) {
				response.writeHead(404);
			}
			response.end('Not found');
		})
		.pipe(response);
});

if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
	const port = Number(process.env.UI_PORT || 52990);
	server.listen(port, '127.0.0.1', () => {
		console.log(`UI references: http://127.0.0.1:${port}/launch.html`);
	});
}
