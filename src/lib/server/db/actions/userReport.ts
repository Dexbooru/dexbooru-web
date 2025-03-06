import { MAXIMUM_REPORTS_PER_PAGE } from '$lib/shared/constants/reports';
import type { ModerationReportStatus, UserReportCategory } from '@prisma/client';
import prisma from '../prisma';

export const findUserReportsViaPagination = async (
	pageNumber: number,
	reviewStatus: ModerationReportStatus,
	category: UserReportCategory | undefined,
) => {
	return await prisma.userReport.findMany({
		where: {
			reviewStatus,
			...(category ? { category } : {}),
		},
		skip: pageNumber * MAXIMUM_REPORTS_PER_PAGE,
		take: MAXIMUM_REPORTS_PER_PAGE,
		orderBy: {
			createdAt: 'desc',
		},
	});
};

export const findUserReportsFromUserId = async (userId: string) => {
	const reports = await prisma.userReport.findMany({
		where: {
			userId,
		},
	});

	return reports;
};

export const createUserReport = async ({
	description,
	category,
	userId,
}: {
	description: string | null | undefined;
	category: UserReportCategory;
	userId: string;
}) => {
	const report = await prisma.userReport.create({
		data: {
			description,
			userId,
			category,
		},
	});

	return report;
};

export const deleteUserReportByIds = async (userId: string, reportId: string) => {
	const report = await prisma.userReport.delete({
		where: {
			id: reportId,
			userId,
		},
	});

	return report;
};
