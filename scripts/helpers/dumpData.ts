import { faker } from '@faker-js/faker';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { PrismaClient, User } from '../../src/generated/prisma/client';
import { TDanbooruPost } from './aggregateDanbooruData';
import factories from './factories';
import buildLogger from './logger';

const TOTAL_ARTISTS = 3000;
const BUFFER_SIZE = 20;
const DATASET_DIR = path.join('../', 'mock_data', 'danbooru');
const ARTIST_SAMPLE_MIN = 1;
const ARTIST_SAMPLE_MAX = 6;
const DELETION_MODELS = [
	'user',
	'comment',
	'postCollection',
	'post',
	'artist',
	'tag',
	'userPreference',
];

const getJsonlFiles = (dir: string) =>
	fs
		.readdirSync(dir, { withFileTypes: true })
		.filter((d) => d.isFile() && d.name.endsWith('.jsonl'))
		.map((d) => path.join(dir, d.name))
		.sort();

const getRandomArtists = (artists: string[]) => {
	const artistSet = new Set<string>();
	const sampleSize = faker.number.int({ min: ARTIST_SAMPLE_MIN, max: ARTIST_SAMPLE_MAX });
	while (artistSet.size < sampleSize) {
		const randomArtist = artists[Math.floor(Math.random() * artists.length)];
		artistSet.add(randomArtist);
	}
	return Array.from(artistSet);
};

const getRandomUser = (users: User[]) => {
	return users[Math.floor(Math.random() * users.length)];
};

const generatePostCreationPromise = (
	user: User,
	post: TDanbooruPost,
	artists: string[],
	description: string,
	prismaClient: PrismaClient,
) => {
	artists.sort();
	post.tags.sort();

	return prismaClient.post.create({
		data: {
			sourceLink: 'https://danbooru.donmai.us/posts/' + post.imageUrl.split('/')[4],
			authorId: user.id,
			description,
			isNsfw: post.isNsfw,
			views: post.views,
			likes: post.likes,
			imageUrls: [post.imageUrl],
			createdAt: new Date(post.createdAt),
			artists: {
				connectOrCreate: artists.map((artist) => ({
					where: { name: artist },
					create: { name: artist },
				})),
			},
			artistString: artists.join(','),
			tags: {
				connectOrCreate: post.tags.map((tag) => ({
					where: { name: tag },
					create: { name: tag },
				})),
			},
			tagString: post.tags.join(','),
		},
	});
};

async function* readJsonl(filePath: string): AsyncGenerator<TDanbooruPost> {
	const stream = fs.createReadStream(filePath, { encoding: 'utf-8' });
	const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
	for await (const line of rl) {
		const trimmed = line.trim();
		if (!trimmed) continue;
		yield JSON.parse(trimmed) as TDanbooruPost;
	}
}

const renderTable = (rows: Array<[string, string | number]>) => {
	const col1 = Math.max(...rows.map((r) => r[0].length), 'Metric'.length) + 2;
	const col2 = Math.max(...rows.map((r) => String(r[1]).length), 'Value'.length) + 2;
	const line = '┌' + '─'.repeat(col1) + '┬' + '─'.repeat(col2) + '┐\n';
	const mid = '├' + '─'.repeat(col1) + '┼' + '─'.repeat(col2) + '┤\n';
	const end = '└' + '─'.repeat(col1) + '┴' + '─'.repeat(col2) + '┘\n';
	const header = '│' + 'Metric'.padEnd(col1) + '│' + 'Value'.padEnd(col2) + '│\n';
	const body = rows
		.map((r) => '│' + r[0].padEnd(col1) + '│' + String(r[1]).padEnd(col2) + '│\n')
		.join('');
	return '\n' + line + header + mid + body + end;
};

async function dumpData({
	dbClient: prismaClient,
	logger,
}: {
	dbClient: PrismaClient;
	logger: ReturnType<typeof buildLogger>;
}) {
	try {
		logger.info(`Deleting all records of: ${DELETION_MODELS.join(', ')} from the database`);

		for (const model of DELETION_MODELS) {
			// @ts-expect-error Dynamic model access
			await prismaClient[model as keyof PrismaClient].deleteMany({});
			logger.info(`Deleted all records from ${model}`);
		}

		logger.info('Deleted all existing data successfully');

		const mockUsers = factories.user.createMany(20);
		const userWriteResult = await prismaClient.user.createMany({
			data: mockUsers,
		});

		logger.debug(`Inserted ${userWriteResult.count} mock users into the database.`);

		const userPreferenceWriteResult = await prismaClient.userPreference.createMany({
			data: mockUsers.map((user) => ({ userId: user.id })),
		});

		logger.debug(`Inserted ${userPreferenceWriteResult.count} user preferences into the database.`);

		const files = getJsonlFiles(DATASET_DIR);
		if (files.length === 0) {
			logger.error(`No .jsonl files found in ${DATASET_DIR}`);
			return;
		}

		logger.info(`Found ${files.length} JSONL file(s) to process:`);
		files.forEach((file) => {
			const stats = fs.statSync(file);
			const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
			logger.info(`  • ${path.basename(file)} (${sizeMB} MB)`);
		});

		const artistSet = new Set<string>();
		while (artistSet.size < TOTAL_ARTISTS) {
			const randomArtist = faker.person.fullName().toLocaleLowerCase().trim();
			artistSet.add(randomArtist);
		}
		const artists = Array.from(artistSet);

		const tagSet = new Set<string>();
		let totalPosts = 0;
		for (const f of files) {
			for await (const post of readJsonl(f)) {
				totalPosts += 1;
				for (const tag of post.tags) tagSet.add(tag);
			}
		}
		const tags = Array.from(tagSet);

		logger.info('Adding artist and tag set to database');
		if (tags.length > 0) {
			await prismaClient.tag.createMany({
				data: tags.map((tag) => ({
					id: faker.string.uuid(),
					name: tag,
					description: faker.lorem.sentence(),
				})),
				skipDuplicates: true,
			});
		}

		if (artists.length > 0) {
			await prismaClient.artist.createMany({
				data: artists.map((artist) => ({
					id: faker.string.uuid(),
					name: artist,
					description: faker.lorem.sentence(),
					socialMediaLinks: factories.socialMediaLink.createMany(
						faker.number.int({ min: 0, max: 3 }),
					),
				})),
				skipDuplicates: true,
			});
		}
		logger.info('Done adding tags and artists');

		let postsProcessed = 0;
		let currentPostBuffer: TDanbooruPost[] = [];

		for (const f of files) {
			logger.info(`\n--- Processing file: ${path.basename(f)} ---`);
			for await (const post of readJsonl(f)) {
				currentPostBuffer.push(post);
				if (currentPostBuffer.length === BUFFER_SIZE) {
					const postCreationPromises = currentPostBuffer.map((post) =>
						generatePostCreationPromise(
							getRandomUser(mockUsers),
							post,
							getRandomArtists(artists),
							faker.lorem.paragraph(),
							prismaClient,
						),
					);
					await Promise.allSettled(postCreationPromises);
					postsProcessed += currentPostBuffer.length;
					logger.info(`Processed ${postsProcessed} posts so far`);
					currentPostBuffer = [];
				}
			}
			logger.info(`Finished processing ${path.basename(f)}`);
			logger.info('----------------------------------------\n');
		}

		if (currentPostBuffer.length > 0) {
			const postCreationPromises = currentPostBuffer.map((post) =>
				generatePostCreationPromise(
					getRandomUser(mockUsers),
					post,
					getRandomArtists(artists),
					faker.lorem.paragraph(),
					prismaClient,
				),
			);
			await Promise.allSettled(postCreationPromises);
			postsProcessed += currentPostBuffer.length;
		}

		const dbPostCount = await prismaClient.post.count();
		const dbPosts = await prismaClient.post.findMany({ select: { id: true } });
		const comments = factories.comment.createMany(dbPostCount * 3);

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

		const commentWriteResult = await prismaClient.comment.createMany({
			data: comments,
		});

		logger.info(`Inserted ${commentWriteResult.count} comments into the database.`);

		const table = renderTable([
			['Unique tags', tags.length],
			['Unique artists', artists.length],
			['Total posts discovered', totalPosts],
			['Total posts inserted', postsProcessed],
			['Total users inserted', userWriteResult.count],
			['Total comments inserted', commentWriteResult.count],
		]);
		console.log(table);
	} catch (error) {
		logger.error('Error during Dexbooru data dump:', error);
		throw error;
	}
}

export default dumpData;
