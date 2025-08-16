import { PrismaClient } from '@prisma/client';
import minimist from 'minimist';
import aggregateDanbooruPosts, { TAggregateOptions } from './helpers/aggregateDanbooruData';
import dumpDanbooruData from './helpers/dumpDanbooruData';
import dbFactory from './helpers/factories';
import createLogger from './helpers/logger';

async function main() {
	const logger = createLogger('debug');
	const dbClient = new PrismaClient();

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

		const mockUsers = dbFactory.user.createMany(20);
		const userWriteResult = await dbClient.user.createMany({
			data: mockUsers,
		});

		logger.debug(`Inserted ${userWriteResult.count} mock users into the database.`);

		await dbClient.$connect();

		await dumpDanbooruData({
			mockUsers,
			dbClient,
			logger,
		});

		const dbPostCount = await dbClient.post.count();
		const dbPosts = await dbClient.post.findMany({ select: { id: true } });
		const comments = dbFactory.comment.createMany(dbPostCount * 3);

		let commentIndex = 0;
		dbPosts.forEach((post) => {
			const postComments = comments.slice(commentIndex, commentIndex + 3);
			postComments.forEach((comment) => {
				comment.postId = post.id;

				const usersIndex = Math.floor(Math.random() * mockUsers.length);
				comment.authorId = mockUsers[usersIndex].id;
			});

			commentIndex += 3;
		});

		const commentWriteResult = await dbClient.comment.createMany({
			data: comments,
		});

		logger.info(`Inserted ${commentWriteResult.count} comments into the database.`);
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
