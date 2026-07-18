import type { ModerationReportStatus } from '$generated/prisma/client';
import { MAXIMUM_REPORTS_PER_PAGE } from '$lib/shared/constants/reports';

// Prisma delegate surface used by report CRUD. Kept loose on purpose so each
// report model can share one factory without fighting Prisma's generated types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TReportDelegate = any;

export function createReportActions<TCategory, TReport>(
	delegate: TReportDelegate,
	foreignKey: string,
) {
	const findPaginated = async (
		pageNumber: number,
		reviewStatus: ModerationReportStatus,
		category: TCategory | undefined,
	): Promise<TReport[]> => {
		return (await delegate.findMany({
			where: {
				reviewStatus,
				...(category ? { category } : {}),
			},
			skip: pageNumber * MAXIMUM_REPORTS_PER_PAGE,
			take: MAXIMUM_REPORTS_PER_PAGE,
			orderBy: {
				createdAt: 'desc',
			},
		})) as TReport[];
	};

	const findByTargetId = async (targetId: string): Promise<TReport[]> => {
		return (await delegate.findMany({
			where: {
				[foreignKey]: targetId,
			},
		})) as TReport[];
	};

	const create = async ({
		description,
		category,
		targetId,
	}: {
		description: string | null | undefined;
		category: TCategory;
		targetId: string | null;
	}): Promise<TReport> => {
		return (await delegate.create({
			data: {
				description,
				category,
				[foreignKey]: targetId,
			},
		})) as TReport;
	};

	const deleteByIds = async (targetId: string, reportId: string): Promise<TReport> => {
		return (await delegate.delete({
			where: {
				id: reportId,
				[foreignKey]: targetId,
			},
		})) as TReport;
	};

	const findById = async (reportId: string): Promise<TReport | null> => {
		return (await delegate.findUnique({
			where: { id: reportId },
		})) as TReport | null;
	};

	const updateStatus = async (
		reportId: string,
		status: ModerationReportStatus,
	): Promise<TReport> => {
		return (await delegate.update({
			where: { id: reportId },
			data: { reviewStatus: status },
		})) as TReport;
	};

	return {
		findPaginated,
		findByTargetId,
		create,
		deleteByIds,
		findById,
		updateStatus,
	};
}
