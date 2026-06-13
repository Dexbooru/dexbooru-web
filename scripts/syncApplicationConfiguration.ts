import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import { PrismaClient, Prisma } from '../src/generated/prisma/client';
import {
	APPLICATION_CONFIGURATION_SINGLETON_ID,
	APPLICATION_CONFIGURATION_DEFAULTS,
	APPLICATION_CONFIGURATION_VARCHAR_FIELD_MAPPINGS,
	flattenApplicationConfigurationYaml,
	getMappedVarcharConstraint,
	type TApplicationConfiguration,
} from '../src/lib/shared/applicationConfiguration';
import { parse } from 'yaml';
import { existsSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import logger from '../src/lib/server/logging/logger';

const DEFAULT_APPLICATION_CONFIGURATION_YAML_PATH = './instance-configuration.yaml';

const resolveYamlPath = () => {
	const configuredPath = process.env.APPLICATION_CONFIGURATION_YAML_PATH?.trim();
	const candidatePath =
		configuredPath && configuredPath.length > 0
			? configuredPath
			: DEFAULT_APPLICATION_CONFIGURATION_YAML_PATH;
	return path.isAbsolute(candidatePath)
		? candidatePath
		: path.resolve(process.cwd(), candidatePath);
};

const replaceModelFieldVarcharLimit = (
	source: string,
	modelName: string,
	fieldName: string,
	newLimit: number,
) => {
	const modelPattern = new RegExp(`model\\s+${modelName}\\s+\\{[\\s\\S]*?\\n\\}`, 'm');
	const modelMatch = source.match(modelPattern);
	if (!modelMatch) return source;

	const modelBlock = modelMatch[0];
	const fieldPattern = new RegExp(`(^\\s*${fieldName}\\s+[^\\n]*@db\\.VarChar\\()(\\d+)(\\))`, 'm');
	if (!fieldPattern.test(modelBlock)) return source;

	const nextModelBlock = modelBlock.replace(
		fieldPattern,
		(_match, left, _limit, right) => `${left}${newLimit}${right}`,
	);
	return source.replace(modelBlock, nextModelBlock);
};

const syncSchemaFiles = async (configuration: TApplicationConfiguration) => {
	const updatesBySchema = new Map<string, { model: string; field: string; limit: number }[]>();

	for (const mapping of APPLICATION_CONFIGURATION_VARCHAR_FIELD_MAPPINGS) {
		const schemaPath = path.resolve(process.cwd(), mapping.schemaFile);
		const limit = getMappedVarcharConstraint(mapping, configuration);
		const updates = updatesBySchema.get(schemaPath) ?? [];
		updates.push({
			model: mapping.table,
			field: mapping.column,
			limit,
		});
		updatesBySchema.set(schemaPath, updates);
	}

	for (const [schemaPath, updates] of updatesBySchema.entries()) {
		const currentSchema = await readFile(schemaPath, 'utf8');
		let nextSchema = currentSchema;
		for (const update of updates) {
			nextSchema = replaceModelFieldVarcharLimit(
				nextSchema,
				update.model,
				update.field,
				update.limit,
			);
		}

		if (nextSchema !== currentSchema) {
			await writeFile(schemaPath, nextSchema, 'utf8');
		}
	}
};

const updateDatabaseVarcharConstraints = async (
	prismaClient: PrismaClient,
	configuration: TApplicationConfiguration,
) => {
	for (const mapping of APPLICATION_CONFIGURATION_VARCHAR_FIELD_MAPPINGS) {
		const limit = getMappedVarcharConstraint(mapping, configuration);
		await prismaClient.$executeRaw(
			Prisma.sql`ALTER TABLE ${Prisma.raw(`"${mapping.table}"`)} ALTER COLUMN ${Prisma.raw(`"${mapping.column}"`)} TYPE VARCHAR(${Prisma.raw(limit.toString())})`,
		);
	}
};

async function main() {
	if (!process.env.DATABASE_URL) {
		throw new Error('DATABASE_URL environment variable is not set.');
	}

	const yamlPath = resolveYamlPath();
	if (!existsSync(yamlPath)) {
		logger.info(
			`No configuration YAML found at ${yamlPath}. Skipping sync and keeping database defaults.`,
		);
		return;
	}

	const adapter = new PrismaPg({
		connectionString: process.env.DATABASE_URL,
	});
	const prisma = new PrismaClient({ adapter });
	await prisma.$connect();

	try {
		const yamlContent = await readFile(yamlPath, 'utf8');
		if (!yamlContent.trim()) {
			logger.info(`Configuration YAML at ${yamlPath} is empty. Nothing to sync.`);
			return;
		}

		const parsedYaml = parse(yamlContent) as Record<string, unknown>;
		const flattenedOverrides = flattenApplicationConfigurationYaml(parsedYaml);

		await prisma.$executeRaw(
			Prisma.sql`INSERT INTO ${Prisma.raw('"ApplicationConfiguration"')} ("id") VALUES (${APPLICATION_CONFIGURATION_SINGLETON_ID}) ON CONFLICT ("id") DO NOTHING`,
		);

		const currentRows = (await prisma.$queryRaw(
			Prisma.sql`SELECT * FROM ${Prisma.raw('"ApplicationConfiguration"')} WHERE "id" = ${APPLICATION_CONFIGURATION_SINGLETON_ID} LIMIT 1`,
		)) as TApplicationConfiguration[];
		const currentConfiguration = currentRows[0] ?? {
			id: APPLICATION_CONFIGURATION_SINGLETON_ID,
			...APPLICATION_CONFIGURATION_DEFAULTS,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const mergedConfiguration = {
			...currentConfiguration,
			...flattenedOverrides,
		};

		const updates = Object.entries(flattenedOverrides);
		if (updates.length > 0) {
			const updateExpressions = Prisma.join(
				updates.map(([key, value]) => Prisma.sql`${Prisma.raw(`"${key}"`)} = ${Number(value)}`),
				', ',
			);

			await prisma.$executeRaw(
				Prisma.sql`
					UPDATE ${Prisma.raw('"ApplicationConfiguration"')}
					SET ${updateExpressions}, "updatedAt" = NOW()
					WHERE "id" = ${APPLICATION_CONFIGURATION_SINGLETON_ID}
				`,
			);
		}

		await updateDatabaseVarcharConstraints(prisma, mergedConfiguration);
		await syncSchemaFiles(mergedConfiguration);

		logger.info(`Application configuration synchronized from YAML at ${yamlPath}.`);
	} finally {
		await prisma.$disconnect();
	}
}

main().catch((error) => {
	logger.error('Failed to synchronize application configuration:', error);
	process.exit(1);
});
