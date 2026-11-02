// Every engine module can be imported first, in its own fresh process (#166).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { promisify } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';

const run = promisify(execFile);
const engine = fileURLToPath(new URL('../src/lib/engine/', import.meta.url));

test('no engine module throws when it is imported first', async () => {
	const modules = readdirSync(engine, { recursive: true })
		.map(String)
		.filter((file) => file.endsWith('.js'))
		.sort();
	assert.ok(modules.length > 100, 'the engine modules were found');
	const failed = [];
	const queue = [...modules];
	const worker = async () => {
		for (let file = queue.shift(); file; file = queue.shift()) {
			const url = pathToFileURL(engine + file).href;
			try {
				await run(process.execPath, [
					'--input-type=module',
					'-e',
					`await import(${JSON.stringify(url)})`,
				]);
			} catch (error) {
				failed.push(
					`${file}: ${String(error.stderr)
						.split('\n')
						.find((l) => /Error/.test(l))}`
				);
			}
		}
	};
	await Promise.all(Array.from({ length: 8 }, worker));
	assert.deepEqual(failed.sort(), []);
}, 120000);
