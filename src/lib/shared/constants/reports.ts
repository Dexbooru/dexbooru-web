import type {
	PostCollectionReportCategory,
	PostReportCategory,
	UserReportCategory,
} from '$generated/prisma/client';

export const MAXIMUM_REPORTS_PER_PAGE = 30;
export const MAXIMUM_REPORT_REASON_DESCRIPTION_LENGTH = 250;
export const REPORT_POST_REASON_CATEGORIES: PostReportCategory[] = [
	'ILLEGAL',
	'IMPROPER_TAGGING',
	'INAPPROPRIATE',
	'OFF_TOPIC',
	'OTHER',
	'SPAM',
];

export const REPORT_POST_COLLECTION_REASON_CATEGORIES: PostCollectionReportCategory[] = [
	'INAPPROPRIATE_TITLE',
	'INAPPROPRIATE_DESCRIPTION',
	'OTHER',
];

export const REPORT_USER_REASON_CATEGORIES: UserReportCategory[] = [
	'NSFW_PROFILE_PICTURE',
	'INAPPROPRIATE_USERNAME',
	'OTHER',
];
