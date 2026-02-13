import type { ModerationReportStatus, PostReportCategory } from '$generated/prisma/enums';
import {
	createPostReport,
	deletePostReportByIds,
	findPostReportsViaPagination,
	updatePostReportStatus,
} from '$lib/server/db/actions/postReport';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockPrisma } from '../../mocks/prisma';

describe('postReport actions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('findPostReportsViaPagination', () => {
		it('should call prisma.postReport.findMany with correct arguments', async () => {
			const pageNumber = 1;
			const reviewStatus = 'PENDING' as ModerationReportStatus;
			const category = 'OTHER' as PostReportCategory;
			mockPrisma.postReport.findMany.mockResolvedValue([]);

			await findPostReportsViaPagination(pageNumber, reviewStatus, category);

			expect(mockPrisma.postReport.findMany).toHaveBeenCalledWith({
				where: {
					reviewStatus,
					category,
				},
				skip: pageNumber * 30,
				take: 30,
				orderBy: {
					createdAt: 'desc',
				},
			});
		});
	});

	describe('createPostReport', () => {
		it('should call prisma.postReport.create with correct arguments', async () => {
			const description = 'desc';
			const category = 'OTHER' as PostReportCategory;
			const postId = 'p1';
			mockPrisma.postReport.create.mockResolvedValue({});

			await createPostReport({ description, category, postId });

			expect(mockPrisma.postReport.create).toHaveBeenCalledWith({
				data: {
					description,
					postId,
					category,
				},
			});
		});
	});

	describe('deletePostReportByIds', () => {
		it('should call prisma.postReport.delete with correct arguments', async () => {
			const postId = 'p1';
			const reportId = 'rep1';
			mockPrisma.postReport.delete.mockResolvedValue({});

			await deletePostReportByIds(postId, reportId);

			expect(mockPrisma.postReport.delete).toHaveBeenCalledWith({
				where: {
					id: reportId,
					postId,
				},
			});
		});
	});

	describe('updatePostReportStatus', () => {
		it('should call prisma.postReport.update with correct arguments', async () => {
			const reportId = 'rep1';
			const status = 'APPROVED' as ModerationReportStatus;
			mockPrisma.postReport.update.mockResolvedValue({});

			await updatePostReportStatus(reportId, status);

			expect(mockPrisma.postReport.update).toHaveBeenCalledWith({
				where: { id: reportId },
				data: { reviewStatus: status },
			});
		});
	});
});
