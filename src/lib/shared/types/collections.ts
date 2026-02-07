import type { CollectionModerationStatus, PostCollection } from '$generated/prisma/client';
import type { TPost } from './posts';

export type TCollectionPaginationData = {
	collections: TPostCollection[];
	pageNumber: number;
	orderBy: TCollectionOrderByColumn;
	ascending: boolean;
};

export type TUpdateCollectionBody = {
	title: string;
	description: string;
};

export type TCollectionHiddenPageData = {
	nsfwCollections: TPostCollection[];
};

export type TPostCollection = PostCollection & {
	posts: TPost[];
	moderationStatus: CollectionModerationStatus;
	author: {
		id: string;
		username: string;
		profilePictureUrl: string;
	};
};

export type TCollectionOrderByColumn = 'createdAt' | 'updatedAt';
