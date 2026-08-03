import { execFileSync } from 'node:child_process';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const typescriptPackageDirectory = dirname(require.resolve('typescript/package.json'));
const tscEntry = join(typescriptPackageDirectory, 'lib/tsc.js');

const workerSourceDirectory = resolve('src/lib/server/workers');
const workerOutputDirectory = resolve('build/workers');
const workersTsconfig = resolve('tsconfig.workers.json');
const workersManifestPath = join(workerOutputDirectory, 'manifest.json');

const discoverWorkerEntries = async (directory) => {
	const entries = await readdir(directory, { withFileTypes: true });
	const workerEntries = await Promise.all(
		entries.map(async (entry) => {
			const entryPath = resolve(directory, entry.name);

			if (entry.isDirectory()) {
				return discoverWorkerEntries(entryPath);
			}

			return entry.isFile() && entry.name.endsWith('Worker.ts') ? [entryPath] : [];
		}),
	);

	return workerEntries.flat();
};

const workerEntries = await discoverWorkerEntries(workerSourceDirectory);

if (workerEntries.length === 0) {
	throw new Error(`No worker entries found in ${workerSourceDirectory}`);
}

execFileSync(process.execPath, [tscEntry, '-p', workersTsconfig], {
	stdio: 'inherit',
	cwd: dirname(fileURLToPath(import.meta.url)),
});

await mkdir(workerOutputDirectory, { recursive: true });

const modules = workerEntries
	.map((entryPath) => basename(entryPath).replace(/\.ts$/u, '.js'))
	.sort();

await writeFile(workersManifestPath, `${JSON.stringify({ modules }, null, '\t')}\n`, 'utf8');

process.stdout.write(
	`Compiled ${workerEntries.length} worker thread module(s) → ${workerOutputDirectory}\n`,
);
