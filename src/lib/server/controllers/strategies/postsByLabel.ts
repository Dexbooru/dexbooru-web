import { findPostsByArtistName } from '../../db/actions/artist';
import { findPostsByAuthorId } from '../../db/actions/post';
import { findPostsByCharacterName, findPostsBySourceTitle } from '../../db/actions/postSource';
import { findPostsByTagName } from '../../db/actions/tag';
import {
	CACHE_TIME_ARTIST_POSTS,
	CACHE_TIME_CHARACTER_POSTS,
	CACHE_TIME_SOURCE_POSTS,
	CACHE_TIME_TAG_POSTS,
	getCacheKeyForPostAuthor,
	getCacheKeyWithPostCategoryWithLabel,
} from '../cache-strategies/posts';
import {
	GetPostsByAuthorSchema,
	GetPostsWithArtistNameSchema,
	GetPostsWithCharacterNameSchema,
	GetPostsWithSourceTitleSchema,
	GetPostsWithTagNameSchema,
} from '../request-schemas/posts';
import { createCachedPaginatedHandler } from './createCachedPaginatedHandler';
import type { TPostsByLabelStrategy } from './types';

const getNameLabel = (data: { pathParams: { name: string } }) => data.pathParams.name;

const tagStrategy: TPostsByLabelStrategy = {
	schema: GetPostsWithTagNameSchema,
	getLabel: getNameLabel as TPostsByLabelStrategy['getLabel'],
	buildCacheKey: (label, pageNumber, orderBy, ascending) =>
		getCacheKeyWithPostCategoryWithLabel('tag', label, pageNumber, orderBy, ascending),
	cacheTtlSeconds: CACHE_TIME_TAG_POSTS,
	findPosts: ({ label, pageNumber, pageLimit, orderBy, ascending, selectors }) =>
		findPostsByTagName(label, pageNumber, pageLimit, orderBy, ascending, selectors),
	successMessage: (label) => `Successfully fetched the posts with the tag name of: ${label}`,
	errorMessage:
		'An unexpected error occurred while fetching the posts with tags with a certain name',
};

const artistStrategy: TPostsByLabelStrategy = {
	schema: GetPostsWithArtistNameSchema,
	getLabel: getNameLabel as TPostsByLabelStrategy['getLabel'],
	buildCacheKey: (label, pageNumber, orderBy, ascending) =>
		getCacheKeyWithPostCategoryWithLabel('artist', label, pageNumber, orderBy, ascending),
	cacheTtlSeconds: CACHE_TIME_ARTIST_POSTS,
	findPosts: ({ label, pageNumber, pageLimit, orderBy, ascending, selectors }) =>
		findPostsByArtistName(label, pageNumber, pageLimit, orderBy, ascending, selectors),
	successMessage: (label) => `Successfully fetched the posts with the artist name of: ${label}`,
	errorMessage:
		'An unexpected error occurred while fetching the posts with artists with a certain name',
};

const characterStrategy: TPostsByLabelStrategy = {
	schema: GetPostsWithCharacterNameSchema,
	getLabel: getNameLabel as TPostsByLabelStrategy['getLabel'],
	buildCacheKey: (label, pageNumber, orderBy, ascending) =>
		getCacheKeyWithPostCategoryWithLabel('character', label, pageNumber, orderBy, ascending),
	cacheTtlSeconds: CACHE_TIME_CHARACTER_POSTS,
	findPosts: ({ label, pageNumber, pageLimit, orderBy, ascending, selectors }) =>
		findPostsByCharacterName(label, pageNumber, pageLimit, orderBy, ascending, selectors),
	successMessage: (label) => `Successfully fetched the posts with the character name of: ${label}`,
	errorMessage: 'An unexpected error occurred while fetching the posts with the character name',
};

const sourceStrategy: TPostsByLabelStrategy = {
	schema: GetPostsWithSourceTitleSchema,
	getLabel: getNameLabel as TPostsByLabelStrategy['getLabel'],
	buildCacheKey: (label, pageNumber, orderBy, ascending) =>
		getCacheKeyWithPostCategoryWithLabel('source', label, pageNumber, orderBy, ascending),
	cacheTtlSeconds: CACHE_TIME_SOURCE_POSTS,
	findPosts: ({ label, pageNumber, pageLimit, orderBy, ascending, selectors }) =>
		findPostsBySourceTitle(label, pageNumber, pageLimit, orderBy, ascending, selectors),
	successMessage: (label) => `Successfully fetched the posts from the source: ${label}`,
	errorMessage: 'An unexpected error occurred while fetching the posts from the source',
};

const authorStrategy: TPostsByLabelStrategy = {
	schema: GetPostsByAuthorSchema,
	getLabel: ((data: { pathParams: { username: string } }) =>
		data.pathParams.username) as TPostsByLabelStrategy['getLabel'],
	buildCacheKey: (label, pageNumber, orderBy, ascending) =>
		getCacheKeyForPostAuthor(label, pageNumber, orderBy, ascending),
	cacheTtlSeconds: CACHE_TIME_ARTIST_POSTS,
	findPosts: ({ label, pageNumber, pageLimit, orderBy, ascending, selectors }) =>
		findPostsByAuthorId(pageNumber, pageLimit, label, orderBy, ascending, selectors),
	shouldCache: (handlerType) => handlerType === 'page-server-load',
	enrichResponse: (pagination, label) => ({
		...pagination,
		author: label,
	}),
	successMessage: (label) => `Successfully fetched the posts with the author username of: ${label}`,
	errorMessage: 'An unexpected error occurred while fetching the author posts',
};

export const handleGetPostsWithTagName = createCachedPaginatedHandler(tagStrategy);
export const handleGetPostsWithArtistName = createCachedPaginatedHandler(artistStrategy);
export const handleGetPostsWithCharacterName = createCachedPaginatedHandler(characterStrategy);
export const handleGetPostsWithSourceTitle = createCachedPaginatedHandler(sourceStrategy);
export const handleGetPostsByAuthor = createCachedPaginatedHandler(authorStrategy);
