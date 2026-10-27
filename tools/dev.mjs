// Local development: runs the Node server (restarting on change) and Vite's dev server side by side.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const vite = fileURLToPath(
	new URL('../node_modules/vite/bin/vite.js', import.meta.url)
);
const children = [
	spawn(
		process.execPath,
		['--watch', '--env-file-if-exists=.env', 'server/server.mjs'],
		{ cwd: root, stdio: 'inherit' }
	),
	spawn(process.execPath, [vite], { cwd: root, stdio: 'inherit' }),
];

// Stopping either one, or pressing Ctrl+C, stops both.
const stop = () => {
	for (const child of children) {
		child.kill();
	}
};
for (const child of children) {
	child.on('exit', stop);
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
