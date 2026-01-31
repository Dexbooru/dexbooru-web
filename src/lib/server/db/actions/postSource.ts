import type { PostSourceType } from '$generated/prisma/client';
import { transformLabel } from '$lib/shared/helpers/labels';
import type { TPostSource } from '$lib/shared/types/posts';
import prisma from '../prisma';

export const getPostSourcesByPostId = async (postId: string) => {
	const postSources = await prisma.postSource.findMany({
		where: {
			postId,
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
	const transformedPostResults: TPostSource[] = results.map((result) => {
		return {
			...result,
			characterName: transformLabel(result.characterName),
			sourceTitle: transformLabel(result.sourceTitle),
		};
	});

	const batchResult = await prisma.postSource.createMany({
		data: transformedPostResults,
		skipDuplicates: true,
	});

	return batchResult;
};
