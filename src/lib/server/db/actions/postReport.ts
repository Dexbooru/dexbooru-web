import { MAXIMUM_REPORTS_PER_PAGE } from '$lib/shared/constants/reports';
import type { ModerationReportStatus, PostReportCategory } from '@prisma/client';
import prisma from '../prisma';

export const findPostReportsViaPagination = async (
	pageNumber: number,
	reviewStatus: ModerationReportStatus,
	category: PostReportCategory | undefined,
) => {
	return await prisma.postReport.findMany({
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

export const findPostReportsFromPostId = async (postId: string) => {
	const reports = await prisma.postReport.findMany({
		where: {
			postId,
		},
	});

	return reports;
};

export const createPostReport = async ({
	description,
	category,
	postId,
}: {
	description: string | null | undefined;
	category: PostReportCategory;
	postId: string;
}) => {
	const report = await prisma.postReport.create({
		data: {
			description,
			postId,
			category,
		},
	});

	return report;
};

export const deletePostReportByIds = async (postId: string, reportId: string) => {
	const report = await prisma.postReport.delete({
		where: {
			id: reportId,
			postId,
		},
	});

	return report;
};
