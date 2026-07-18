import type {
	PostCollectionReport,
	PostCollectionReportCategory,
	PostReport,
	PostReportCategory,
	UserReport,
	UserReportCategory,
} from '$generated/prisma/client';
import { UUID_REGEX } from '$lib/shared/constants/search';
import { findCollectionById, updateCollectionModerationStatus } from '../../db/actions/collection';
import {
	createPostCollectionReport,
	deletePostCollectionReportByIds,
	findPostCollectionReportById,
	findPostCollectionReportsFromCollectionId,
	findPostCollectionsReportsViaPagination,
	updatePostCollectionReportStatus,
} from '../../db/actions/collectionReport';
import { findPostById } from '../../db/actions/post';
import {
	createPostReport,
	deletePostReportByIds,
	findPostReportsFromPostId,
	findPostReportsViaPagination,
	updatePostReportStatus,
} from '../../db/actions/postReport';
import { findUserById, findUserByName, updateUserModerationStatus } from '../../db/actions/user';
import {
	createUserReport,
	deleteUserReportByIds,
	findUserReportById,
	findUserReportsFromUserId,
	findUserReportsViaPagination,
	updateUserReportStatus,
} from '../../db/actions/userReport';
import {
	CreatePostCollectionReportSchema,
	DeletePostCollectionReportSchema,
	GetPostCollectionReportsSchema,
	GetPostCollectionsReportsSchema,
	UpdatePostCollectionReportStatusSchema,
} from '../request-schemas/collectionReports';
import {
	CreatePostReportSchema,
	DeletePostReportSchema,
	GetPostReportsSchema,
	GetPostsReportsSchema,
	UpdatePostReportStatusSchema,
} from '../request-schemas/postReports';
import {
	CreateUserReportSchema,
	DeleteUserReportSchema,
	GetUserReportsSchema,
	GetUsersReportsSchema,
	UpdateUserReportStatusSchema,
} from '../request-schemas/userReports';
import { createReportHandlers } from './createReportHandlers';
import type { TReportStrategy } from './types';

const pathParam = (pathParams: Record<string, string>, key: string): string =>
	pathParams[key] ?? '';

const postReportStrategy: TReportStrategy<PostReport, PostReportCategory> = {
	entityLabel: 'post',
	responseCollectionKey: 'postReports',
	responseCreatedKey: 'newPostReport',
	schemas: {
		create: CreatePostReportSchema,
		getByTarget: GetPostReportsSchema,
		getGeneral: GetPostsReportsSchema,
		delete: DeletePostReportSchema,
		updateStatus: UpdatePostReportStatusSchema,
	},
	resolveCreateTarget: async (pathParams) => ({ id: pathParam(pathParams, 'postId') }),
	resolveGetTarget: async (pathParams) => {
		const post = await findPostById(pathParam(pathParams, 'postId'), { id: true });
		return post ? { id: post.id } : null;
	},
	resolveDeleteTarget: async (pathParams) => ({ id: pathParam(pathParams, 'postId') }),
	missingTargetMessage: (operation) => {
		if (operation === 'get') {
			return 'The post you are trying to fetch reports for does not exist.';
		}
		return 'The post you are trying to report does not exist.';
	},
	create: ({ description, category, targetId }) =>
		createPostReport({ description, category, postId: targetId }),
	findByTargetId: findPostReportsFromPostId,
	findPaginated: findPostReportsViaPagination,
	deleteByIds: deletePostReportByIds,
	updateStatus: updatePostReportStatus,
};

const userReportStrategy: TReportStrategy<UserReport, UserReportCategory> = {
	entityLabel: 'user',
	responseCollectionKey: 'userReports',
	responseCreatedKey: 'newUserReport',
	schemas: {
		create: CreateUserReportSchema,
		getByTarget: GetUserReportsSchema,
		getGeneral: GetUsersReportsSchema,
		delete: DeleteUserReportSchema,
		updateStatus: UpdateUserReportStatusSchema,
	},
	resolveCreateTarget: async (pathParams) => {
		const user = await findUserByName(pathParam(pathParams, 'username'), { id: true });
		return user ? { id: user.id } : null;
	},
	resolveGetTarget: async (pathParams) => {
		const username = pathParam(pathParams, 'username');
		const dbFindFn = UUID_REGEX.test(username) ? findUserById : findUserByName;
		const user = await dbFindFn(username, { id: true });
		return user ? { id: user.id } : null;
	},
	resolveDeleteTarget: async (pathParams) => {
		const user = await findUserByName(pathParam(pathParams, 'username'), { id: true });
		return user ? { id: user.id } : null;
	},
	missingTargetMessage: (operation) => {
		if (operation === 'create') {
			return 'The user you are trying to report does not exist.';
		}
		if (operation === 'delete') {
			return 'The user you are trying to delete a report for does not exist.';
		}
		return 'The user you are trying to fetch reports for does not exist.';
	},
	create: ({ description, category, targetId }) =>
		createUserReport({ description, category, userId: targetId }),
	findByTargetId: findUserReportsFromUserId,
	findPaginated: findUserReportsViaPagination,
	deleteByIds: deleteUserReportByIds,
	updateStatus: updateUserReportStatus,
	onStatusUpdated: async (reportId, reviewStatus) => {
		if (reviewStatus !== 'ACCEPTED') return;
		const report = await findUserReportById(reportId);
		if (report && 'userId' in report && report.userId) {
			await updateUserModerationStatus(report.userId as string, 'FLAGGED');
		}
	},
};

const collectionReportStrategy: TReportStrategy<
	PostCollectionReport,
	PostCollectionReportCategory
> = {
	entityLabel: 'post collection',
	responseCollectionKey: 'postCollectionReports',
	responseCreatedKey: 'newPostCollectionReport',
	schemas: {
		create: CreatePostCollectionReportSchema,
		getByTarget: GetPostCollectionReportsSchema,
		getGeneral: GetPostCollectionsReportsSchema,
		delete: DeletePostCollectionReportSchema,
		updateStatus: UpdatePostCollectionReportStatusSchema,
	},
	resolveCreateTarget: async (pathParams) => {
		const collection = await findCollectionById(pathParam(pathParams, 'collectionId'), {
			id: true,
		});
		return collection ? { id: collection.id } : null;
	},
	resolveGetTarget: async (pathParams) => {
		const collection = await findCollectionById(pathParam(pathParams, 'collectionId'), {
			id: true,
		});
		return collection ? { id: collection.id } : null;
	},
	resolveDeleteTarget: async (pathParams) => {
		const collection = await findCollectionById(pathParam(pathParams, 'collectionId'), {
			id: true,
		});
		return collection ? { id: collection.id } : null;
	},
	missingTargetMessage: (operation) => {
		if (operation === 'create') {
			return 'The post collection you are trying to report does not exist.';
		}
		if (operation === 'delete') {
			return 'The post collection you are trying to delete a report for does not exist.';
		}
		return 'The post collection you are trying to fetch reports for does not exist.';
	},
	create: ({ description, category, targetId }) =>
		createPostCollectionReport({ description, category, postCollectionId: targetId }),
	findByTargetId: findPostCollectionReportsFromCollectionId,
	findPaginated: findPostCollectionsReportsViaPagination,
	deleteByIds: deletePostCollectionReportByIds,
	updateStatus: updatePostCollectionReportStatus,
	onStatusUpdated: async (reportId, reviewStatus) => {
		if (reviewStatus !== 'ACCEPTED') return;
		const report = await findPostCollectionReportById(reportId);
		if (report && 'postCollectionId' in report && report.postCollectionId) {
			await updateCollectionModerationStatus(report.postCollectionId as string, 'FLAGGED');
		}
	},
};

const postReportHandlers = createReportHandlers(postReportStrategy);
const userReportHandlers = createReportHandlers(userReportStrategy);
const collectionReportHandlers = createReportHandlers(collectionReportStrategy);

export const handleCreatePostReport = postReportHandlers.handleCreate;
export const handleGetPostReports = postReportHandlers.handleGetByTarget;
export const handleGetPostsReportsGeneral = postReportHandlers.handleGetGeneral;
export const handleDeletePostReport = postReportHandlers.handleDelete;
export const handleUpdatePostReportStatus = postReportHandlers.handleUpdateStatus;

export const handleCreateUserReport = userReportHandlers.handleCreate;
export const handleGetUserReports = userReportHandlers.handleGetByTarget;
export const handleGetUserReportsGeneral = userReportHandlers.handleGetGeneral;
export const handleDeleteUserReport = userReportHandlers.handleDelete;
export const handleUpdateUserReportStatus = userReportHandlers.handleUpdateStatus;

export const handleCreatePostCollectionReport = collectionReportHandlers.handleCreate;
export const handleGetPostCollectionReports = collectionReportHandlers.handleGetByTarget;
export const handleGetPostCollectionsReportsGeneral = collectionReportHandlers.handleGetGeneral;
export const handleDeletePostCollectionReport = collectionReportHandlers.handleDelete;
export const handleUpdatePostCollectionReportStatus = collectionReportHandlers.handleUpdateStatus;
