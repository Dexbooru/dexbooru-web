import type {
	ModerationReportStatus,
	PostReport,
	PostReportCategory,
} from '$generated/prisma/client';
import prisma from '../prisma';
import { createReportActions } from './reportFactory';

const postReportActions = createReportActions<PostReportCategory, PostReport>(
	prisma.postReport,
	'postId',
);

export const findPostReportsViaPagination = postReportActions.findPaginated;
export const findPostReportsFromPostId = postReportActions.findByTargetId;
export const deletePostReportByIds = postReportActions.deleteByIds;
export const updatePostReportStatus = postReportActions.updateStatus;

export const createPostReport = async ({
	description,
	category,
	postId,
}: {
	description: string | null | undefined;
	category: PostReportCategory;
	postId: string;
}) => {
	return await postReportActions.create({ description, category, targetId: postId });
};

export type { ModerationReportStatus };
