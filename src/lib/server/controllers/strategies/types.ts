import type { ModerationReportStatus } from '$generated/prisma/client';
import type { TPost, TPostOrderByColumn, TPostPaginationData } from '$lib/shared/types/posts';
import type { RequestEvent } from '@sveltejs/kit';
import type {
	TControllerHandlerVariant,
	TInferRequestSchema,
	TRequestSchema,
} from '../../types/controllers';
import type { TUploadCompletedResult } from '../../types/upload';

export type TWithRemoteCacheOptions<T> = {
	cacheKey: string;
	ttlSeconds: number;
	/** Static flag or predicate evaluated after compute (e.g. skip caching empty results). */
	shouldCache?: boolean | ((computed: T) => boolean);
	/** Override TTL based on the computed value (e.g. longer TTL for empty search results). */
	resolveTtl?: (computed: T) => number;
	getAssociateKeys?: (computed: T) => string[];
	compute: () => Promise<T>;
};

export type TPostsByLabelStrategy = {
	schema: TRequestSchema;
	getLabel: (data: TInferRequestSchema<TRequestSchema>) => string;
	buildCacheKey: (
		label: string,
		pageNumber: number,
		orderBy: TPostOrderByColumn,
		ascending: boolean,
	) => string;
	cacheTtlSeconds: number;
	findPosts: (args: {
		label: string;
		pageNumber: number;
		pageLimit: number;
		orderBy: TPostOrderByColumn;
		ascending: boolean;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		selectors?: any;
	}) => Promise<TPost[]>;
	shouldCache?: (handlerType: TControllerHandlerVariant) => boolean;
	enrichResponse?: (
		pagination: TPostPaginationData,
		label: string,
	) => TPostPaginationData & Record<string, unknown>;
	successMessage: (label: string) => string;
	errorMessage: string;
};

export type TReportTargetResolution = {
	id: string;
};

export type TReportStrategy<TReport = unknown, TCategory = string> = {
	entityLabel: string;
	responseCollectionKey: string;
	responseCreatedKey: string;
	schemas: {
		create: TRequestSchema;
		getByTarget: TRequestSchema;
		getGeneral: TRequestSchema;
		delete: TRequestSchema;
		updateStatus: TRequestSchema;
	};
	resolveCreateTarget: (
		pathParams: Record<string, string>,
	) => Promise<TReportTargetResolution | null>;
	resolveGetTarget: (pathParams: Record<string, string>) => Promise<TReportTargetResolution | null>;
	resolveDeleteTarget: (
		pathParams: Record<string, string>,
	) => Promise<TReportTargetResolution | null>;
	missingTargetMessage: (operation: 'create' | 'get' | 'delete') => string;
	create: (input: {
		description: string | null | undefined;
		category: TCategory;
		targetId: string;
	}) => Promise<TReport>;
	findByTargetId: (targetId: string) => Promise<TReport[]>;
	findPaginated: (
		pageNumber: number,
		reviewStatus: ModerationReportStatus,
		category: TCategory | undefined,
	) => Promise<TReport[]>;
	deleteByIds: (targetId: string, reportId: string) => Promise<TReport>;
	/** Implementations with moderation side effects must keep them atomic with the status write. */
	updateStatus: (reportId: string, status: ModerationReportStatus) => Promise<TReport>;
};

export type TReportHandlers = {
	handleCreate: (event: RequestEvent) => Promise<unknown>;
	handleGetByTarget: (
		event: RequestEvent,
		handlerType: TControllerHandlerVariant,
	) => Promise<unknown>;
	handleGetGeneral: (event: RequestEvent) => Promise<unknown>;
	handleDelete: (event: RequestEvent) => Promise<unknown>;
	handleUpdateStatus: (event: RequestEvent) => Promise<unknown>;
};

export type TCreatePostDuplicate = {
	id: string;
	imageUrls: string[];
	description: string | null;
};

export type TCreatePostRecord = {
	id: string;
	description: string;
	imageUrls: string[];
	createdAt: Date;
	author?: {
		id: string;
		username: string;
		profilePictureUrl: string;
	} | null;
};

export type TCreatePostFormInput = {
	description: string;
	tags: string[];
	artists: string[];
	isNsfw: boolean;
	postPictures: File[];
	sourceLink: string;
	uploadId?: string;
	ignoreDuplicates: boolean;
};

export type TCreatePostStrategy = {
	schema: TRequestSchema;
	maxDuplicatesToSearch: number;
	requireEmailVerified: boolean;
	messages: {
		emailUnverified: string;
		duplicatesDetected: string;
		success: string;
		unexpectedError: string;
		pipelineFailureFallback: string;
	};
	ensureAuthorCanUpload: (
		authorId: string,
	) => Promise<{ ok: true } | { ok: false; reason: string }>;
	uploadImages: (
		postPictures: File[],
		isNsfw: boolean,
		uploadId?: string,
	) => Promise<TUploadCompletedResult>;
	findDuplicates: (imageHashes: string[], limit: number) => Promise<TCreatePostDuplicate[]>;
	deleteUploadedImages: (imageUrls: string[]) => Promise<unknown>;
	createPost: (input: {
		sourceLink: string;
		description: string;
		isNsfw: boolean;
		tags: string[];
		artists: string[];
		imageUrls: string[];
		imageWidths: number[];
		imageHeights: number[];
		imageHashes: string[];
		authorId: string;
	}) => Promise<TCreatePostRecord>;
	deletePost: (postId: string) => Promise<unknown>;
	afterCreate: (ctx: {
		post: TCreatePostRecord;
		originalImageUrls: string[];
		uploadId?: string;
	}) => Promise<void> | void;
	onFormActionSuccess: (ctx: {
		post: TCreatePostRecord;
		originalImageUrls: string[];
		uploadId?: string;
		authorId: string;
	}) => Promise<void> | void;
	getFormRedirectPath: (postId: string) => string;
};
