import type { PostReportCategory } from '@prisma/client';

export const MAXIMUM_REPORT_REASON_DESCRIPTION_LENGTH = 250;
export const REPORT_REASON_CATEGORIES: PostReportCategory[] = [
	'ILLEGAL',
	'IMPROPER_TAGGING',
	'INAPPROPRIATE',
	'OFF_TOPIC',
	'OTHER',
	'SPAM',
];
