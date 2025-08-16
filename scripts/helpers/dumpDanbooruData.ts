import { Faker, en } from '@faker-js/faker';
import { PrismaClient, User } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { TDanbooruPost } from './aggregateDanbooruData';
import buildLogger from './logger';

const TOTAL_ARTISTS = 3000;
const BUFFER_SIZE = 20;
const DATASET_DIR = 'mock_data/danbooru';
const ARTIST_SAMPLE_MIN = 1;
const ARTIST_SAMPLE_MAX = 6;

const getJsonlFiles = (dir: string) =>
	fs
		.readdirSync(dir, { withFileTypes: true })
		.filter((d) => d.isFile() && d.name.endsWith('.jsonl'))
		.map((d) => path.join(dir, d.name))
		.sort();

const getRandomArtists = (faker: Faker, artists: string[]) => {
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

async function dumpDanbooruData({
	mockUsers: users,
	dbClient: prismaClient,
	logger,
}: {
	mockUsers: User[];
	dbClient: PrismaClient;
	logger: ReturnType<typeof buildLogger>;
}) {
	try {
		logger.info('Deleting existing posts, artists, and tags from the database');
		await prismaClient.tag.deleteMany({});
		await prismaClient.artist.deleteMany({});
		await prismaClient.post.deleteMany({});
		logger.info('Deleted all existing data');

		const faker = new Faker({ locale: [en] });
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
				})),
				skipDuplicates: true,
			});
		}

		if (artists.length > 0) {
			await prismaClient.artist.createMany({
				data: artists.map((artist) => ({
					id: faker.string.uuid(),
					name: artist,
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
							getRandomUser(users),
							post,
							getRandomArtists(faker, artists),
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
					getRandomUser(users),
					post,
					getRandomArtists(faker, artists),
					faker.lorem.paragraph(),
					prismaClient,
				),
			);
			await Promise.allSettled(postCreationPromises);
			postsProcessed += currentPostBuffer.length;
		}

		const table = renderTable([
			['Unique tags', tags.length],
			['Unique artists', artists.length],
			['Total posts discovered', totalPosts],
			['Total posts inserted', postsProcessed],
		]);
		console.log(table);
	} catch (error) {
		logger.error('Error during Danbooru data dump:', error);
		throw error;
	}
}

export default dumpDanbooruData;
