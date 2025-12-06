import type { TPostSource } from '$lib/shared/types/posts';
import type { PostSourceType } from '@prisma/client';
import prisma from '../prisma';

export const createPostSource = async (
	postId: string,
	characterName: string,
	sourceTitle: string,
	sourceType: PostSourceType,
) => {
	const newPostSource = await prisma.postSource.create({
		data: {
			postId,
			characterName,
			sourceTitle,
			sourceType,
		},
	});

	return newPostSource;
};

export const createPostSources = async (results: TPostSource[]) => {
	const batchResult = await prisma.postSource.createMany({
		data: results,
		skipDuplicates: true,
	});

	return batchResult;
};
