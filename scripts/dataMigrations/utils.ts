import { existsSync } from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import prisma from './db';
import logger from './logger';
import type {
	CustomDataMigration,
	CustomDataMigrationStatus,
} from '../../src/generated/prisma/client';
import type { CustomDataMigrationCreateInput } from '../../src/generated/prisma/models';
import type BaseDataMigration from './baseDataMigration';

type LoadDataMigrationResult =
	| { ok: true; migration: BaseDataMigration }
	| { ok: false; reason: string };

const formatElapsedDuration = (durationMs: number): string => {
	if (durationMs < 1000) {
		return `${Math.round(durationMs)}ms`;
	}

	const seconds = durationMs / 1000;
	if (seconds < 60) {
		return seconds < 10 ? `${seconds.toFixed(1)}s` : `${Math.round(seconds)}s`;
	}

	const minutes = seconds / 60;
	if (minutes < 60) {
		return minutes < 10 ? `${minutes.toFixed(1)}min` : `${Math.round(minutes)}min`;
	}

	const hours = minutes / 60;
	return hours < 10 ? `${hours.toFixed(1)}hr` : `${Math.round(hours)}hr`;
};

const timeMigrationOperation = async <T>(
	operationLabel: string,
	operation: () => Promise<T>,
	timeoutMs: number,
): Promise<T> => {
	const startedAt = performance.now();
	let timeoutId: ReturnType<typeof setTimeout> | undefined;

	try {
		return await Promise.race([
			operation(),
			new Promise<never>((_, reject) => {
				timeoutId = setTimeout(() => {
					reject(
						new Error(`${operationLabel} timed out after ${formatElapsedDuration(timeoutMs)}`),
					);
				}, timeoutMs);
			}),
		]);
	} finally {
		if (timeoutId !== undefined) {
			clearTimeout(timeoutId);
		}

		logger.info(
			`${operationLabel} elapsed ${formatElapsedDuration(performance.now() - startedAt)}`,
		);
	}
};

const createCustomDataMigration = async (args: CustomDataMigrationCreateInput) => {
	const newCustomDataMigration = await prisma.customDataMigration.create({
		data: args,
	});

	return newCustomDataMigration;
};

const updateCustomDataMigrationStatus = async (
	customMigrationId: string,
	newMigrationStatus: CustomDataMigrationStatus,
) => {
	const updatedCustomDataMigration = await prisma.customDataMigration.update({
		where: { id: customMigrationId },
		data: {
			status: newMigrationStatus,
		},
	});

	return updatedCustomDataMigration;
};

const findCustomDataMigrationByName = async (name: string) => {
	return prisma.customDataMigration.findUnique({
		where: { name },
	});
};

const findPendingCustomDataMigrations = async () => {
	return prisma.customDataMigration.findMany({
		where: { status: 'PENDING' },
		orderBy: { createdAt: 'asc' },
	});
};

const loadDataMigrationFromFile = async (filePath: string): Promise<LoadDataMigrationResult> => {
	const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);

	if (!existsSync(absolutePath)) {
		const reason = `Migration file not found at ${absolutePath}`;
		logger.error(reason);
		return { ok: false, reason };
	}

	let migrationModule: { default?: unknown };

	try {
		migrationModule = await import(pathToFileURL(absolutePath).href);
	} catch (error) {
		const reason = `Failed to import migration file at ${absolutePath}`;
		logger.error(reason, error);
		return { ok: false, reason };
	}

	if (migrationModule.default === undefined || migrationModule.default === null) {
		const reason = `Migration file at ${absolutePath} is missing a default export`;
		logger.error(reason);
		return { ok: false, reason };
	}

	const { default: BaseDataMigrationClass } = await import('./baseDataMigration');

	if (!(migrationModule.default instanceof BaseDataMigrationClass)) {
		const reason = `Migration file at ${absolutePath} must default-export an instance of BaseDataMigration`;
		logger.error(reason);
		return { ok: false, reason };
	}

	return { ok: true, migration: migrationModule.default };
};

export type { CustomDataMigration, LoadDataMigrationResult };
export {
	createCustomDataMigration,
	findCustomDataMigrationByName,
	findPendingCustomDataMigrations,
	loadDataMigrationFromFile,
	timeMigrationOperation,
	updateCustomDataMigrationStatus,
};
