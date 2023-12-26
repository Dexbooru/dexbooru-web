import { ReportReasonCategory } from '../types/reports';

export const MAX_REPORT_REASON_DESCRIPTION_LENGTH = 350;

export const REPORT_REASON_CATEGORIES: ReportReasonCategory[] = [
	ReportReasonCategory.IMPROPER_TAGGING,
	ReportReasonCategory.OFFENSIVE_CONTENT,
	ReportReasonCategory.OFF_TOPIC,
	ReportReasonCategory.ILLEGAL_CONTENT,
	ReportReasonCategory.OTHER
];
