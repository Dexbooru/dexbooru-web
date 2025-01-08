import type { PostReportCategory } from '@prisma/client';

export const createPostReport = async (
	postId: string,
	reportReasonCategory: PostReportCategory,
	description: string,
) => {
	return await fetch(`/api/post/${postId}/reports`, {
		method: 'POST',
		body: JSON.stringify({ category: reportReasonCategory, description }),
	});
};
