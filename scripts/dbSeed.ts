import { PrismaClient, UserRole } from '@prisma/client';
import minimist from 'minimist';
import { hashPassword } from '../src/lib/server/helpers/password';
import aggregateDanbooruPosts, { TAggregateOptions } from './helpers/aggregateDanbooruData';
import dumpData from './helpers/dumpData';
import factories from './helpers/factories';
import createLogger from './helpers/logger';

const OWNER_USERNAME = 'owner';
const OWNER_PASSWORD = 'password';

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

		const ownerPassword = await hashPassword(OWNER_PASSWORD);
		const ownerUser = factories.user({
			username: OWNER_USERNAME,
			role: UserRole.OWNER,
			password: ownerPassword,
		});

		await dbClient.user.create({
			data: ownerUser,
		});
		logger.debug(
			`Created owner user with username: ${OWNER_USERNAME} and password: ${OWNER_PASSWORD}`,
		);
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
