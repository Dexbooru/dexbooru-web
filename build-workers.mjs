import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import ts from 'typescript';

const workerSourceDirectory = resolve('src/lib/server/workers');
const workerOutputDirectory = resolve('build/server/chunks');

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

const compilerOptions = {
	target: ts.ScriptTarget.ES2022,
	module: ts.ModuleKind.NodeNext,
	moduleResolution: ts.ModuleResolutionKind.NodeNext,
	esModuleInterop: true,
	skipLibCheck: true,
	types: ['node'],
	rootDir: workerSourceDirectory,
	outDir: workerOutputDirectory,
	noEmitOnError: true,
};
const program = ts.createProgram(workerEntries, compilerOptions);
const emitResult = program.emit();
const diagnostics = [...ts.getPreEmitDiagnostics(program), ...emitResult.diagnostics];

if (diagnostics.length > 0) {
	const message = ts.formatDiagnosticsWithColorAndContext(diagnostics, {
		getCanonicalFileName: (fileName) => fileName,
		getCurrentDirectory: process.cwd,
		getNewLine: () => '\n',
	});
	throw new Error(`Failed to compile worker entries:\n${message}`);
}

console.log(`Compiled ${workerEntries.length} worker thread module(s).`);
