import { Prisma } from '$generated/prisma/client';
import {
	APPLICATION_CONFIGURATION_VARCHAR_FIELD_MAPPINGS,
	getMappedVarcharConstraint,
	type TApplicationConfiguration,
} from '$lib/shared/applicationConfiguration';
import prisma from '../db/prisma';

export const syncDatabaseVarcharConstraints = async (configuration: TApplicationConfiguration) => {
	for (const mapping of APPLICATION_CONFIGURATION_VARCHAR_FIELD_MAPPINGS) {
		const varcharLimit = getMappedVarcharConstraint(mapping, configuration);
		await prisma.$executeRaw(
			Prisma.sql`ALTER TABLE ${Prisma.raw(`"${mapping.table}"`)} ALTER COLUMN ${Prisma.raw(`"${mapping.column}"`)} TYPE VARCHAR(${Prisma.raw(varcharLimit.toString())})`,
		);
	}
};
