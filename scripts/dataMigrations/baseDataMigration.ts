import logger from './logger';
import {
	CustomDataMigrationStatus,
	type CustomDataMigration,
} from '../../src/generated/prisma/client';
import {
	createCustomDataMigration,
	findCustomDataMigrationByName,
	timeMigrationOperation,
	updateCustomDataMigrationStatus,
} from './utils';

type BaseDataMigrationOptions = {
	migrationName: string;
	migrationFilePath: string;
	migrationTimeoutMs?: number;
	verifyMigration?: boolean;
	rollbackOnError?: boolean;
	maxRetries?: number;
};

abstract class BaseDataMigration {
	options: BaseDataMigrationOptions;
	private migrationRecord: CustomDataMigration | undefined;

	constructor(options: BaseDataMigrationOptions) {
		this.options = this.applyDefaultOptionsIfNeeded(options);
	}

	abstract up(): Promise<void>;
	abstract down(): Promise<void>;
	abstract verify(): Promise<boolean>;

	async register(): Promise<CustomDataMigration> {
		if (this.migrationRecord) {
			return this.migrationRecord;
		}

		const existingMigration = await findCustomDataMigrationByName(this.options.migrationName);

		if (existingMigration) {
			this.migrationRecord = existingMigration;
			logger.info(
				`Migration ${this.options.migrationName} already registered with status ${existingMigration.status}`,
			);
			return existingMigration;
		}

		const newMigration = await createCustomDataMigration({
			name: this.options.migrationName,
			scriptFilePath: this.options.migrationFilePath,
			status: CustomDataMigrationStatus.PENDING,
		});

		this.migrationRecord = newMigration;
		logger.info(
			`Registered migration ${this.options.migrationName} at ${this.options.migrationFilePath}`,
		);
		return newMigration;
	}

	async apply(): Promise<boolean> {
		const {
			migrationName,
			migrationFilePath,
			migrationTimeoutMs,
			verifyMigration,
			rollbackOnError,
			maxRetries,
		} = this.options;

		const migrationRecord = await this.register();
		let attempt = 0;

		while (attempt <= maxRetries!) {
			if (attempt > 0) {
				logger.info(
					`Retrying migration ${migrationName} (attempt ${attempt + 1} of ${maxRetries! + 1})`,
				);
			} else {
				logger.info(`Applying migration ${migrationName} located at ${migrationFilePath}`);
			}

			try {
				await timeMigrationOperation(
					`Migration ${migrationName} apply`,
					() => this.up(),
					migrationTimeoutMs!,
				);

				if (verifyMigration) {
					const verified = await timeMigrationOperation(
						`Migration ${migrationName} verify`,
						() => this.verify(),
						migrationTimeoutMs!,
					);
					if (typeof verified !== 'boolean') {
						throw new Error(
							`Migration ${migrationName} verify returned non-boolean value: ${verified}`,
						);
					}

					if (!verified) {
						throw new Error(`Migration ${migrationName} verification returned false`);
					}

					logger.info(`Migration ${migrationName} verified successfully`);
				}

				await updateCustomDataMigrationStatus(
					migrationRecord.id,
					CustomDataMigrationStatus.APPLIED,
				);
				this.migrationRecord = { ...migrationRecord, status: CustomDataMigrationStatus.APPLIED };
				logger.info(`Migration ${migrationName} applied successfully`);
				return true;
			} catch (error) {
				logger.error(`Migration ${migrationName} failed on attempt ${attempt + 1}`, error);

				if (rollbackOnError) {
					try {
						logger.info(`Rolling back migration ${migrationName}`);
						await timeMigrationOperation(
							`Migration ${migrationName} down`,
							() => this.down(),
							migrationTimeoutMs!,
						);
						logger.info(`Migration ${migrationName} rolled back successfully`);
					} catch (rollbackError) {
						logger.error(`Migration ${migrationName} rollback failed`, rollbackError);
					}
				}

				if (attempt >= maxRetries!) {
					await updateCustomDataMigrationStatus(migrationRecord.id, 'FAILED');
					this.migrationRecord = { ...migrationRecord, status: 'FAILED' };
					logger.error(
						`Migration ${migrationName} failed after ${maxRetries! + 1} attempt(s). Fix the migration and re-run manually with datamigration:run-one`,
					);
					return false;
				}

				attempt += 1;
			}
		}

		return false;
	}

	private applyDefaultOptionsIfNeeded(options: BaseDataMigrationOptions): BaseDataMigrationOptions {
		return {
			...options,
			verifyMigration: options.verifyMigration ?? true,
			rollbackOnError: options.rollbackOnError ?? true,
			migrationTimeoutMs: options.migrationTimeoutMs ?? 120000,
			maxRetries: options.maxRetries ?? 1,
		};
	}
}

export type { BaseDataMigrationOptions };
export default BaseDataMigration;
