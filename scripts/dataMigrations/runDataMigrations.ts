import 'dotenv/config';
import { readdirSync } from 'fs';
import path from 'path';
import logger from './logger';
import prisma from './db';
import { loadDataMigrationFromFile } from './utils';

const CUSTOM_DATA_MIGRATION_FOLDER = path.join(process.cwd(), 'prisma', 'dataMigrations');

const listMigrationFiles = () => {
	return readdirSync(CUSTOM_DATA_MIGRATION_FOLDER)
		.filter((fileName) => fileName.endsWith('.ts'))
		.sort();
};

const runDataMigrations = async () => {
	if (!process.env.DATABASE_URL) {
		logger.error('DATABASE_URL environment variable is not set.');
		return 1;
	}

	const migrationFiles = listMigrationFiles();
	let appliedCount = 0;
	let failedCount = 0;
	let skippedCount = 0;

	logger.info(
		`Discovered ${migrationFiles.length} data migration file(s) in ${CUSTOM_DATA_MIGRATION_FOLDER}`,
	);

	for (const fileName of migrationFiles) {
		const relativeFilePath = path.join('prisma', 'dataMigrations', fileName);
		const loadResult = await loadDataMigrationFromFile(relativeFilePath);

		if (!loadResult.ok) {
			skippedCount += 1;
			continue;
		}

		const migration = loadResult.migration;
		const migrationRecord = await migration.register();

		if (migrationRecord.status !== 'PENDING') {
			logger.info(
				`Skipping migration ${migrationRecord.name} with status ${migrationRecord.status}`,
			);
			continue;
		}

		const applied = await migration.apply();

		if (applied) {
			appliedCount += 1;
		} else {
			failedCount += 1;
		}
	}

	logger.info(
		`Data migration run complete. Applied: ${appliedCount}, Failed: ${failedCount}, Skipped: ${skippedCount}`,
	);

	if (failedCount > 0 || skippedCount > 0) {
		return 1;
	}

	return 0;
};

let exitCode = 0;

runDataMigrations()
	.catch((error) => {
		logger.error('Data migration run failed', error);
		exitCode = 1;
	})
	.then((code) => {
		if (code !== undefined) {
			exitCode = code;
		}
	})
	.finally(async () => {
		await prisma.$disconnect();
		process.exit(exitCode);
	});
