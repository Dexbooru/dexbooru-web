import type {
	PostCollectionReportCategory,
	PostReportCategory,
	UserReportCategory,
} from '$generated/prisma/browser';
import { capitalize } from '$lib/shared/helpers/util';

export const normalizeReportReasonName = (
	reasonCategory: UserReportCategory | PostReportCategory | PostCollectionReportCategory,
) => {
	return capitalize(reasonCategory).replaceAll('_', ' ');
};
