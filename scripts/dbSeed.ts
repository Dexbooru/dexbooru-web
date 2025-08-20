import { PrismaClient } from '@prisma/client';
import minimist from 'minimist';
import aggregateDanbooruPosts, { TAggregateOptions } from './helpers/aggregateDanbooruData';
import dumpData from './helpers/dumpData';
import createLogger from './helpers/logger';

async function main() {
	const logger = createLogger('debug');
	const dbClient = new PrismaClient();
	await dbClient.$connect();

	const args = minimist(process.argv.slice(2)) as TAggregateOptions;

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
		});

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
