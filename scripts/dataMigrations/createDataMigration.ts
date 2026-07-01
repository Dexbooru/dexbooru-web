import path from 'path';
import readline from 'readline';
import fs from 'fs';
import logger from './logger';

const CURRENT_DATE = new Date(Date.now()).toISOString().split('T')[0]!.replaceAll('-', '');
const DATA_MIGRATION_FOLDER_PATH = path.join(process.cwd(), 'prisma', 'dataMigrations');

const toClassName = (migrationName: string) => {
	const segments = migrationName.split(/[_-]+/).filter(Boolean);
	const classSegments = segments.map(
		(segment) => segment.charAt(0).toUpperCase() + segment.slice(1),
	);
	return `${classSegments.join('')}DataMigration`;
};

const buildMigrationTemplate = (
	fullMigrationName: string,
	relativeFilePath: string,
	className: string,
) => {
	return `import BaseDataMigration from '../../scripts/dataMigrations/baseDataMigration';

class ${className} extends BaseDataMigration {
	constructor() {
		super({
			migrationName: '${fullMigrationName}',
			migrationFilePath: '${relativeFilePath}',
		});
	}

	async up(): Promise<void> {}

	async down(): Promise<void> {}

	async verify(): Promise<boolean> {
		return true;
	}
}

export default new ${className}();
`;
};

const askQuestion = (question: string): Promise<string> => {
	return new Promise((resolve) => {
		const rlInterface = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		rlInterface.question(question, (answer) => {
			rlInterface.close();
			resolve(answer);
		});
	});
};

const buildMigrationFilePath = (migrationName: string) => {
	return path.join(DATA_MIGRATION_FOLDER_PATH, `${CURRENT_DATE}_${migrationName}.ts`);
};

let migrationName = process.argv[2];

if (!migrationName) {
	migrationName = await askQuestion(
		`Enter the data migration name (will be saved at ${DATA_MIGRATION_FOLDER_PATH}): `,
	);
}

if (!migrationName) {
	throw new Error('Migration name is required');
}

const fullMigrationName = `${CURRENT_DATE}_${migrationName}`;
const migrationFilePath = buildMigrationFilePath(migrationName);
const relativeFilePath = path.join(
	'prisma',
	'dataMigrations',
	`${CURRENT_DATE}_${migrationName}.ts`,
);
const className = toClassName(migrationName);
const migrationTemplate = buildMigrationTemplate(fullMigrationName, relativeFilePath, className);

logger.info(`A new data migration file will be created at: ${migrationFilePath}`);

fs.writeFileSync(migrationFilePath, migrationTemplate);

logger.info(`Migration file created successfully at: ${migrationFilePath}`);
