import type { PostCollection } from '@prisma/client';
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
	author: {
		id: string;
		username: string;
		profilePictureUrl: string;
	};
};

export type TCollectionOrderByColumn = 'createdAt' | 'updatedAt';
