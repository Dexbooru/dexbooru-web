import type { PostCollectionReport, PostReport, UserReport } from '$generated/prisma/client';
import type { TPost } from './posts';
import type { TUser } from './users';

export type TModerationPaginationData = {
	moderators: TUser[];
	postReportPageNumber: number;
	userReportPageNumber: number;
	postCollectionReportPageNumber: number;
	pendingPostsPageNumber: number;
	postReports: PostReport[];
	userReports: UserReport[];
	postCollectionReports: PostCollectionReport[];
	pendingPosts: TPost[];
};
