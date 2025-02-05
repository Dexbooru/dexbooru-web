import type { TCollectionOrderByColumn } from '$lib/shared/types/collections';

export const getCacheKeyForCollectionsForPost = (postId: string) => {
	return `collection-post-${postId}`;
};

export const getCacheKeyForIndividualCollection = (collectionId: string) => {
	return `collection-${collectionId}`;
};

export const getCacheKeyForIndividualCollectionKeys = (collectionId: string) => {
	return `collectionkeys-${collectionId}`;
};

export const getCacheKeyForAuthorCollections = (
	authorId: string,
	orderBy: TCollectionOrderByColumn,
	ascending: boolean,
	pageNumber: number,
) => {
	return `collections-author-${authorId}-${orderBy}-${ascending}-${pageNumber}`;
};

export const getCacheKeyForGeneralCollectionPagination = (
	orderBy: TCollectionOrderByColumn,
	ascending: boolean,
	pageNumber: number,
) => {
	return `collection-${orderBy}-${ascending}-${pageNumber}`;
};

export const CACHE_TIME_INDIVIDUAL_COLLECTIONS_FOR_POST = 60;
export const CACHE_TIME_INDIVIDUAL_COLLECTION = 60;
export const CACHE_TIME_AUTHOR_COLLECTIONS = 30;
export const CACHE_TIME_COLLECTION_GENERAL = 60;
