import 'dotenv/config';
import logger from './logger';
import prisma from './db';
import { loadDataMigrationFromFile } from './utils';

const migrationFilePath = process.argv[2];

const runSingleDataMigration = async () => {
	if (!process.env.DATABASE_URL) {
		logger.error('DATABASE_URL environment variable is not set.');
		return 1;
	}

	if (!migrationFilePath) {
		logger.error(
			'Migration file path is required. Usage: pnpm datamigration:run-one <path-to-migration-file>',
		);
		return 1;
	}

	logger.info(`Manually running data migration at ${migrationFilePath}`);

	const loadResult = await loadDataMigrationFromFile(migrationFilePath);

	if (!loadResult.ok) {
		return 1;
	}

	const migration = loadResult.migration;
	await migration.register();
	const applied = await migration.apply();

	if (!applied) {
		return 1;
	}

	return 0;
};

let exitCode = 0;

runSingleDataMigration()
	.catch((error) => {
		logger.error('Manual data migration run failed', error);
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
