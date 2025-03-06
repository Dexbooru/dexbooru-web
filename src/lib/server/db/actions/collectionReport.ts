import { MAXIMUM_REPORTS_PER_PAGE } from '$lib/shared/constants/reports';
import type { ModerationReportStatus, PostCollectionReportCategory } from '@prisma/client';
import prisma from '../prisma';

export const findPostCollectionsReportsViaPagination = async (
	pageNumber: number,
	reviewStatus: ModerationReportStatus,
	category: PostCollectionReportCategory | undefined,
) => {
	return await prisma.postCollectionReport.findMany({
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

export const findPostCollectionReportsFromCollectionId = async (postCollectionId: string) => {
	const reports = await prisma.postCollectionReport.findMany({
		where: {
			postCollectionId,
		},
	});

	return reports;
};

export const createPostCollectionReport = async ({
	description,
	category,
	postCollectionId,
}: {
	description: string | null | undefined;
	category: PostCollectionReportCategory;
	postCollectionId: string | null;
}) => {
	const report = await prisma.postCollectionReport.create({
		data: {
			description,
			postCollectionId,
			category,
		},
	});

	return report;
};

export const deletePostCollectionReportByIds = async (
	postCollectionId: string,
	reportId: string,
) => {
	const report = await prisma.postCollectionReport.delete({
		where: {
			id: reportId,
			postCollectionId,
		},
	});

	return report;
};
