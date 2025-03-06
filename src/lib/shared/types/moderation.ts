import type { PostCollectionReport, PostReport, UserReport } from '@prisma/client';
import type { TUser } from './users';

export type TModerationPaginationData = {
	moderators: TUser[];
	postReportPageNumber: number;
	userReportPageNumber: number;
	postCollectionReportPageNumber: number;
	postReports: PostReport[];
	userReports: UserReport[];
	postCollectionReports: PostCollectionReport[];
};
