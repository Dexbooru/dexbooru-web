import { capitalize } from '$lib/shared/helpers/util';
import type {
	PostCollectionReportCategory,
	PostReportCategory,
	UserReportCategory,
} from '@prisma/client';

export const normalizeReportReasonName = (
	reasonCategory: UserReportCategory | PostReportCategory | PostCollectionReportCategory,
) => {
	return capitalize(reasonCategory).replaceAll('_', ' ');
};
