import type { ModerationReportStatus } from '$generated/prisma/client';
import type { TPost, TPostOrderByColumn, TPostPaginationData } from '$lib/shared/types/posts';
import type { RequestEvent } from '@sveltejs/kit';
import type {
	TControllerHandlerVariant,
	TInferRequestSchema,
	TRequestSchema,
} from '../../types/controllers';

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
	updateStatus: (reportId: string, status: ModerationReportStatus) => Promise<TReport>;
	onStatusUpdated?: (
		reportId: string,
		reviewStatus: ModerationReportStatus,
		updatedReport: TReport,
	) => Promise<void>;
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
