import BaseDataMigration from '../../scripts/dataMigrations/baseDataMigration';
import logger from '../../scripts/dataMigrations/logger';

class TestingDataMigration extends BaseDataMigration {
	constructor() {
		super({
			migrationName: '20260621_testing',
			migrationFilePath: 'prisma/dataMigrations/20260621_testing.ts',
		});
	}

	async up(): Promise<void> {
		logger.info(
			'This is a test migration created specifically for the data migration feature only for the up feature',
		);
	}

	async down(): Promise<void> {
		logger.info(
			'This is a test migration created specifically for the data migration feature only for the down feature',
		);
	}

	async verify(): Promise<boolean> {
		logger.info(
			'This is a test migration created specifically for the data migration feature only for the verify feature',
		);

		return true;
	}
}

export default new TestingDataMigration();
