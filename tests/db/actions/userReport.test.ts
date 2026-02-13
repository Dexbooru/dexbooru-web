import type { ModerationReportStatus, UserReportCategory } from '$generated/prisma/enums';
import {
	createUserReport,
	findUserReportsViaPagination,
	updateUserReportStatus,
} from '$lib/server/db/actions/userReport';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockPrisma } from '../../mocks/prisma';

describe('userReport actions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('findUserReportsViaPagination', () => {
		it('should call prisma.userReport.findMany with correct arguments', async () => {
			const pageNumber = 1;
			mockPrisma.userReport.findMany.mockResolvedValue([]);
			await findUserReportsViaPagination(
				pageNumber,
				'PENDING' as ModerationReportStatus,
				undefined,
			);
			expect(mockPrisma.userReport.findMany).toHaveBeenCalledWith({
				where: { reviewStatus: 'PENDING' },
				skip: pageNumber * 30,
				take: 30,
				orderBy: { createdAt: 'desc' },
			});
		});
	});

	describe('createUserReport', () => {
		it('should call prisma.userReport.create', async () => {
			await createUserReport({
				description: 'desc',
				category: 'OTHER' as UserReportCategory,
				userId: 'u1',
			});
			expect(mockPrisma.userReport.create).toHaveBeenCalledWith({
				data: { description: 'desc', category: 'OTHER', userId: 'u1' },
			});
		});
	});

	describe('updateUserReportStatus', () => {
		it('should call prisma.userReport.update', async () => {
			await updateUserReportStatus('r1', 'APPROVED' as ModerationReportStatus);
			expect(mockPrisma.userReport.update).toHaveBeenCalledWith({
				where: { id: 'r1' },
				data: { reviewStatus: 'APPROVED' },
			});
		});
	});
});
