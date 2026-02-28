import type { PostSourceType } from '$generated/prisma/client';
import { transformLabel } from '$lib/shared/helpers/labels';
import type { TPostSource } from '$lib/shared/types/posts';
import logger from '../../logging/logger';
import prisma from '../prisma';

export const getPostSourcesByPostId = async (postId: string) => {
	const postSources = await prisma.postSource.findMany({
		where: {
			posts: {
				some: { id: postId },
			},
		},
	});

	return postSources;
};

export const createPostSource = async (
	postId: string,
	characterName: string,
	sourceTitle: string,
	sourceType: PostSourceType,
) => {
	const transformed = {
		characterName: transformLabel(characterName),
		sourceTitle: transformLabel(sourceTitle),
		sourceType,
	};

	const postSource = await prisma.postSource.upsert({
		where: {
			sourceTitle_sourceType_characterName: {
				sourceTitle: transformed.sourceTitle,
				sourceType: transformed.sourceType,
				characterName: transformed.characterName,
			},
		},
		create: transformed,
		update: {},
	});

	await prisma.post.update({
		where: { id: postId },
		data: {
			sources: {
				connect: { id: postSource.id },
			},
		},
	});

	return postSource;
};

export const createPostSources = async (results: TPostSource[]) => {
	const uniquePostIds = [...new Set(results.map((r) => r.postId))];
	const existingPosts = await prisma.post.findMany({
		where: { id: { in: uniquePostIds } },
		select: { id: true },
	});
	const existingPostIds = new Set(existingPosts.map((p) => p.id));

	const validResults = results.filter((r) => existingPostIds.has(r.postId));
	const skippedCount = results.length - validResults.length;
	if (skippedCount > 0) {
		const skippedPostIds = uniquePostIds.filter((id) => !existingPostIds.has(id));
		logger.warn(
			`Skipped ${skippedCount} post classification result(s) - post(s) not found: ${skippedPostIds.join(', ')}`,
		);
	}

	const transformedResults = validResults.map((result) => ({
		...result,
		characterName: transformLabel(result.characterName),
		sourceTitle: transformLabel(result.sourceTitle),
	}));

	// Deduplicate by (postId, sourceTitle, sourceType, characterName) to avoid unique constraint violations
	const seen = new Set<string>();
	const dedupedResults = transformedResults.filter((r) => {
		const key = `${r.postId}:${r.sourceTitle}:${r.sourceType}:${r.characterName}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});

	if (dedupedResults.length === 0) {
		return { count: 0 };
	}

	const count = await prisma.$transaction(async (tx) => {
		let created = 0;
		for (const result of dedupedResults) {
			const postSource = await tx.postSource.upsert({
				where: {
					sourceTitle_sourceType_characterName: {
						sourceTitle: result.sourceTitle,
						sourceType: result.sourceType,
						characterName: result.characterName,
					},
				},
				create: {
					sourceTitle: result.sourceTitle,
					sourceType: result.sourceType,
					characterName: result.characterName,
				},
				update: {},
			});

			await tx.post.update({
				where: { id: result.postId },
				data: {
					sources: {
						connect: { id: postSource.id },
					},
				},
			});
			created++;
		}
		return created;
	});

	return { count };
};
