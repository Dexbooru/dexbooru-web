import type {
	ModerationReportStatus,
	PostCollectionReport,
	PostCollectionReportCategory,
} from '$generated/prisma/client';
import prisma from '../prisma';
import { createReportActions } from './reportFactory';

const collectionReportActions = createReportActions<
	PostCollectionReportCategory,
	PostCollectionReport
>(prisma.postCollectionReport, 'postCollectionId');

export const findPostCollectionsReportsViaPagination = collectionReportActions.findPaginated;
export const findPostCollectionReportsFromCollectionId = collectionReportActions.findByTargetId;
export const deletePostCollectionReportByIds = collectionReportActions.deleteByIds;
export const findPostCollectionReportById = collectionReportActions.findById;
export const updatePostCollectionReportStatus = collectionReportActions.updateStatus;

export const createPostCollectionReport = async ({
	description,
	category,
	postCollectionId,
}: {
	description: string | null | undefined;
	category: PostCollectionReportCategory;
	postCollectionId: string | null;
}) => {
	return await collectionReportActions.create({
		description,
		category,
		targetId: postCollectionId ?? '',
	});
};

export type { ModerationReportStatus };
