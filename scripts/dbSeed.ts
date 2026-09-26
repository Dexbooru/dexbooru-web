import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import minimist from 'minimist';
import { Prisma, PrismaClient, UserRole } from '../src/generated/prisma/client';
import { APPLICATION_CONFIGURATION_SINGLETON_ID } from '../src/lib/shared/applicationConfiguration';
import { hashPassword } from '../src/lib/server/helpers/password';
import aggregateDanbooruPosts from './helpers/aggregateDanbooruData';
import type { TAggregateOptions } from './helpers/aggregateDanbooruData';
import dumpData from './helpers/dumpData';
import factories from './helpers/factories';
import createLogger from './helpers/logger';
import { MOCK_USER_PASSWORD, SEEDED_LOGIN_ACCOUNTS } from './helpers/seedAccounts';

async function main() {
	const logger = createLogger('debug');

	if (!process.env.DATABASE_URL) {
		logger.error('DATABASE_URL environment variable is not set.');
		process.exit(1);
	}

	const adapter = new PrismaPg({
		connectionString: process.env.DATABASE_URL,
	});
	const dbClient = new PrismaClient({ adapter });
	await dbClient.$connect();
	await dbClient.$executeRaw(
		Prisma.sql`INSERT INTO ${Prisma.raw('"ApplicationConfiguration"')} ("id") VALUES (${APPLICATION_CONFIGURATION_SINGLETON_ID}) ON CONFLICT ("id") DO NOTHING`,
	);

	const args = minimist(process.argv.slice(2), {
		string: ['blacklistedTags', 'outputDir', 'logLevel'],
		boolean: ['clean', 'useLocalData'],
		alias: {
			amount: 'post-count',
			batchSize: 'batch-size',
			blacklistedTags: 'blacklisted-tags',
			outputDir: 'output-dir',
			batchDelay: 'batch-delay',
			postDelay: 'post-delay',
			logLevel: 'log-level',
			useLocalData: 'local-data',
		},
		default: {
			clean: true,
			useLocalData: false,
		},
	}) as TAggregateOptions;

	try {
		const aggregationResult = await aggregateDanbooruPosts(args);
		logger.debug(aggregationResult);

		if (aggregationResult.totalWritten === 0) {
			logger.debug(
				`No posts were written to the database. Check if the provided filters match any posts.`,
			);
			return;
		}

		await dumpData({
			dbClient,
			logger,
			outputDir: aggregationResult.outputDir,
		});

		const mockPasswordHash = await hashPassword(MOCK_USER_PASSWORD);
		for (const account of SEEDED_LOGIN_ACCOUNTS) {
			await dbClient.user.create({
				data: factories.user({
					username: account.username,
					role: UserRole[account.role],
					password: mockPasswordHash,
				}),
			});
			logger.debug(
				`Created ${account.role} user with username: ${account.username} and password: ${MOCK_USER_PASSWORD}`,
			);
		}
	} catch (error) {
		logger.error('An error occurred during the aggregation or database operations:', error);
	} finally {
		await dbClient.$disconnect();

		logger.info('Database connection closed.');
		logger.info('Script execution completed.');
		logger.close();
		process.exit(0);
	}
}

main();
