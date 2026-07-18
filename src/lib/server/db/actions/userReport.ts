import type {
	ModerationReportStatus,
	UserReport,
	UserReportCategory,
} from '$generated/prisma/client';
import prisma from '../prisma';
import { createReportActions } from './reportFactory';

const userReportActions = createReportActions<UserReportCategory, UserReport>(
	prisma.userReport,
	'userId',
);

export const findUserReportsViaPagination = userReportActions.findPaginated;
export const findUserReportsFromUserId = userReportActions.findByTargetId;
export const deleteUserReportByIds = userReportActions.deleteByIds;
export const findUserReportById = userReportActions.findById;
export const updateUserReportStatus = userReportActions.updateStatus;

export const createUserReport = async ({
	description,
	category,
	userId,
}: {
	description: string | null | undefined;
	category: UserReportCategory;
	userId: string;
}) => {
	return await userReportActions.create({ description, category, targetId: userId });
};

export type { ModerationReportStatus };
