import { PrismaClient } from '@prisma/client';
import { parseArgs } from 'node:util';
import FakerMockGenerator from './mockModels';

const scriptArgumentOptions = {
	'user-count': { type: 'string' },
	'post-count': { type: 'string' },
	'comment-count': { type: 'string' },
	'tag-count': { type: 'string' },
	'artist-count': { type: 'string' },
	seed: { type: 'string' },
} as const;

const client = new PrismaClient();

async function main() {
	const { values } = parseArgs({ options: scriptArgumentOptions });
	const numberOfUsers = Number(values['user-count'] || 20);
	const numberOfPosts = Number(values['post-count'] || 1000);
	const numberOfTags = Number(values['tag-count'] || 500);
	const numberOfArtists = Number(values['artist-count'] || 250);
	const numberOfComments = Number(values['comment-count'] || 20_000);
	const seed = Number(values['seed'] || 69_420);

	const mockGenerator = new FakerMockGenerator({
		modelSettings: {
			numberOfArtists,
			numberOfComments,
			numberOfTags,
			numberOfPosts,
			numberOfUsers,
		},
		seed,
	});
	const { mockUsers, mockPosts, mockArtists, mockTags, mockComments } =
		await mockGenerator.generateAllModels();

	await client.user.createMany({
		data: mockUsers,
	});

	await client.tag.createMany({
		data: mockTags,
	});

	await client.artist.createMany({
		data: mockArtists,
	});

	await client.userPreference.createMany({
		data: mockUsers.map((user) => {
			return {
				userId: user.id,
			};
		}),
	});

	const postCreationPromises = mockPosts.map((mockPost) => {
		return client.post.create({
			data: {
				...mockPost,
				sourceLink: 'https://example.com',
				artists: {
					connectOrCreate: mockPost.artists.map((artist) => {
						return {
							where: { name: artist.name },
							create: { id: artist.id, name: artist.name },
						};
					}),
				},
				tags: {
					connectOrCreate: mockPost.tags.map((tag) => {
						return {
							where: { name: tag.name },
							create: { id: tag.id, name: tag.name },
						};
					}),
				},
			},
		});
	});

	await client.$transaction(postCreationPromises);

	await client.comment.createMany({
		data: mockComments,
	});
}

main()
	.then(() => {
		console.log('Done seeding the database');
	})
	.catch((error) => {
		console.error(error);
		process.exit(1);
	})
	.finally(async () => {
		await client.$disconnect();
	});
