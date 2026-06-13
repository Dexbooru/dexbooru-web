import { Prisma } from '$generated/prisma/client';
import {
	getChangedVarcharMappings,
	getMappedVarcharConstraint,
	type TApplicationConfiguration,
	type TConfigurationSchemaFieldMapping,
	type TPartialApplicationConfiguration,
} from '$lib/shared/applicationConfiguration';
import prisma from '../db/prisma';
import { SEARCHABLE_TABLE_CONFIG, tableRequiresSearchableRebuild } from './searchableColumns';

const groupMappingsByTable = (mappings: TConfigurationSchemaFieldMapping[]) => {
	const mappingsByTable = new Map<string, TConfigurationSchemaFieldMapping[]>();

	for (const mapping of mappings) {
		const tableMappings = mappingsByTable.get(mapping.table) ?? [];
		tableMappings.push(mapping);
		mappingsByTable.set(mapping.table, tableMappings);
	}

	return mappingsByTable;
};

const dropSearchableColumn = async (table: string, indexName: string) => {
	await prisma.$executeRaw(Prisma.sql`DROP INDEX IF EXISTS ${Prisma.raw(indexName)}`);
	await prisma.$executeRaw(
		Prisma.sql`ALTER TABLE ${Prisma.raw(`"${table}"`)} DROP COLUMN IF EXISTS searchable`,
	);
};

const recreateSearchableColumn = async (table: string, indexName: string, expression: string) => {
	await prisma.$executeRaw(
		Prisma.sql`ALTER TABLE ${Prisma.raw(`"${table}"`)} ADD COLUMN searchable tsvector GENERATED ALWAYS AS (${Prisma.raw(expression)}) STORED`,
	);
	await prisma.$executeRaw(
		Prisma.sql`CREATE INDEX ${Prisma.raw(indexName)} ON ${Prisma.raw(`"${table}"`)} USING GIN(searchable)`,
	);
};

const alterTableVarcharColumns = async (
	table: string,
	mappings: TConfigurationSchemaFieldMapping[],
	configuration: TApplicationConfiguration,
) => {
	for (const mapping of mappings) {
		const varcharLimit = getMappedVarcharConstraint(mapping, configuration);
		await prisma.$executeRaw(
			Prisma.sql`ALTER TABLE ${Prisma.raw(`"${table}"`)} ALTER COLUMN ${Prisma.raw(`"${mapping.column}"`)} TYPE VARCHAR(${Prisma.raw(varcharLimit.toString())})`,
		);
	}
};

type TSyncDatabaseVarcharConstraintsInput = {
	updates: TPartialApplicationConfiguration;
	previousConfiguration: TApplicationConfiguration;
	nextConfiguration: TApplicationConfiguration;
};

export const syncDatabaseVarcharConstraints = async ({
	updates,
	previousConfiguration,
	nextConfiguration,
}: TSyncDatabaseVarcharConstraintsInput) => {
	const changedMappings = getChangedVarcharMappings(
		updates,
		previousConfiguration,
		nextConfiguration,
	);
	if (changedMappings.length === 0) {
		return;
	}

	const mappingsByTable = groupMappingsByTable(changedMappings);

	for (const [table, mappings] of mappingsByTable) {
		const columns = mappings.map((mapping) => mapping.column);
		const searchableConfig = SEARCHABLE_TABLE_CONFIG[table];
		const needsSearchableRebuild =
			searchableConfig !== undefined && tableRequiresSearchableRebuild(table, columns);

		if (needsSearchableRebuild) {
			await dropSearchableColumn(table, searchableConfig.indexName);
		}

		await alterTableVarcharColumns(table, mappings, nextConfiguration);

		if (needsSearchableRebuild) {
			await recreateSearchableColumn(
				table,
				searchableConfig.indexName,
				searchableConfig.expression,
			);
		}
	}
};
