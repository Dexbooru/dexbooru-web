import { Prisma } from '$generated/prisma/client';
import {
	APPLICATION_CONFIGURATION_DEFAULTS,
	APPLICATION_CONFIGURATION_SINGLETON_ID,
	type TApplicationConfiguration,
	type TPartialApplicationConfiguration,
} from '$lib/shared/applicationConfiguration';
import prisma from '../prisma';

const TABLE_NAME = Prisma.raw('"ApplicationConfiguration"');

export const findApplicationConfiguration = async (): Promise<TApplicationConfiguration | null> => {
	const rows = (await prisma.$queryRaw(
		Prisma.sql`SELECT * FROM ${TABLE_NAME} WHERE "id" = ${APPLICATION_CONFIGURATION_SINGLETON_ID} LIMIT 1`,
	)) as TApplicationConfiguration[] | undefined;

	if (!Array.isArray(rows)) return null;
	return rows[0] ?? null;
};

export const createDefaultApplicationConfiguration = async () => {
	await prisma.$executeRaw(
		Prisma.sql`INSERT INTO ${TABLE_NAME} ("id") VALUES (${APPLICATION_CONFIGURATION_SINGLETON_ID}) ON CONFLICT ("id") DO NOTHING`,
	);
};

export const getOrCreateApplicationConfiguration = async (): Promise<TApplicationConfiguration> => {
	await createDefaultApplicationConfiguration();
	const configuration = await findApplicationConfiguration();
	if (configuration) return configuration;

	return {
		id: APPLICATION_CONFIGURATION_SINGLETON_ID,
		...APPLICATION_CONFIGURATION_DEFAULTS,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
};

const getFieldUpdateExpression = (key: string, value: number | number[]) => {
	if (!Array.isArray(value)) {
		return Prisma.sql`${Prisma.raw(`"${key}"`)} = ${value}`;
	}
	// An empty JS array is not a usable int[] parameter, and a populated one needs an explicit cast.
	if (value.length === 0) {
		return Prisma.sql`${Prisma.raw(`"${key}"`)} = ARRAY[]::int[]`;
	}
	return Prisma.sql`${Prisma.raw(`"${key}"`)} = ${value}::int[]`;
};

export const updateApplicationConfiguration = async (
	configuration: TPartialApplicationConfiguration,
): Promise<TApplicationConfiguration> => {
	if (Object.keys(configuration).length === 0) {
		return await getOrCreateApplicationConfiguration();
	}

	const entries = Object.entries(configuration);
	const updates = Prisma.join(
		entries.map(([key, value]) => getFieldUpdateExpression(key, value)),
		', ',
	);

	const rows = (await prisma.$queryRaw(
		Prisma.sql`
			UPDATE ${TABLE_NAME}
			SET ${updates},
				"updatedAt" = NOW()
			WHERE "id" = ${APPLICATION_CONFIGURATION_SINGLETON_ID}
			RETURNING *
		`,
	)) as TApplicationConfiguration[] | undefined;

	const updatedConfiguration = Array.isArray(rows) ? rows[0] : null;
	if (updatedConfiguration) return updatedConfiguration;

	await createDefaultApplicationConfiguration();
	return await updateApplicationConfiguration(configuration);
};
