import type { PostReportCategory } from '@prisma/client';
import prisma from '../prisma';

export const findPostReportsFromPostId = async (postId: string) => {
	const reports = await prisma.postReport.findMany({
		where: {
			id: postId,
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
