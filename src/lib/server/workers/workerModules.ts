import { constants as fsConstants } from 'node:fs';
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Worker } from 'node:worker_threads';
import { dev } from '$app/environment';
import logger from '../logging/logger';

export const WORKER_MODULE_NAMES = ['imageTransformWorker'] as const;

export type TWorkerModuleName = (typeof WORKER_MODULE_NAMES)[number];

export const WORKERS_BUILD_DIRECTORY = 'build/workers';
export const WORKERS_MANIFEST_FILENAME = 'manifest.json';

export type TWorkersManifest = {
	modules: string[];
};

const WORKER_ONLINE_TIMEOUT_MS = 10_000;

export const getWorkerModulePath = (moduleName: TWorkerModuleName): string => {
	if (dev) {
		return fileURLToPath(new URL(`./${moduleName}.ts`, import.meta.url));
	}

	return join(process.cwd(), WORKERS_BUILD_DIRECTORY, `${moduleName}.js`);
};

export const getWorkerModuleUrl = (moduleName: TWorkerModuleName): URL =>
	pathToFileURL(getWorkerModulePath(moduleName));

export const getWorkersManifestPath = (): string =>
	join(process.cwd(), WORKERS_BUILD_DIRECTORY, WORKERS_MANIFEST_FILENAME);

export const assertWorkerModuleReadable = async (
	moduleName: TWorkerModuleName,
): Promise<string> => {
	const workerPath = getWorkerModulePath(moduleName);
	await access(workerPath, fsConstants.R_OK);
	return workerPath;
};

const assertProductionWorkersManifest = async (): Promise<void> => {
	const manifestPath = getWorkersManifestPath();
	let manifest: TWorkersManifest;

	try {
		manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as TWorkersManifest;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new Error(
			`Worker preflight failed — missing build-workers.mjs manifest at ${manifestPath}: ${message}`,
			{ cause: error },
		);
	}

	if (!Array.isArray(manifest.modules) || manifest.modules.length === 0) {
		throw new Error(
			`Worker preflight failed — invalid or empty workers manifest at ${manifestPath}`,
		);
	}

	const manifestModules = new Set(manifest.modules);
	const missingFromManifest = WORKER_MODULE_NAMES.filter(
		(moduleName) => !manifestModules.has(`${moduleName}.js`),
	);

	if (missingFromManifest.length > 0) {
		throw new Error(
			`Worker preflight failed — compiled workers manifest is missing expected modules: ${missingFromManifest.join(', ')}`,
		);
	}
};

const assertWorkerModuleLoads = async (moduleName: TWorkerModuleName): Promise<void> => {
	const workerPath = await assertWorkerModuleReadable(moduleName);
	const workerUrl = pathToFileURL(workerPath);

	await new Promise<void>((resolve, reject) => {
		const worker = new Worker(workerUrl, {
			...(dev ? { execArgv: ['--import', 'tsx'] } : {}),
		});

		const timer = setTimeout(() => {
			void worker.terminate();
			reject(
				new Error(
					`timed out after ${WORKER_ONLINE_TIMEOUT_MS}ms waiting for worker to come online (${workerPath})`,
				),
			);
		}, WORKER_ONLINE_TIMEOUT_MS);

		worker.once('online', () => {
			clearTimeout(timer);
			void worker.terminate().then(() => resolve(), reject);
		});

		worker.once('error', (error) => {
			clearTimeout(timer);
			void worker.terminate();
			reject(error);
		});
	});

	logger.info('Worker module preflight ok', {
		moduleName,
		path: getWorkerModulePath(moduleName),
	});
};

export const assertWorkerModulesReady = async (): Promise<void> => {
	if (!dev) {
		await assertProductionWorkersManifest();
	}

	const failures: string[] = [];

	for (const moduleName of WORKER_MODULE_NAMES) {
		try {
			await assertWorkerModuleLoads(moduleName);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			failures.push(`${moduleName} (${getWorkerModulePath(moduleName)}): ${message}`);
		}
	}

	if (failures.length > 0) {
		throw new Error(
			`Worker preflight failed — modules missing, unreadable, or unloadable:\n${failures.join('\n')}`,
		);
	}
};
