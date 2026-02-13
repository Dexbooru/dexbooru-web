import type { ModerationReportStatus, PostCollectionReportCategory } from '$generated/prisma/enums';
import {
	createPostCollectionReport,
	deletePostCollectionReportByIds,
	findPostCollectionsReportsViaPagination,
	updatePostCollectionReportStatus,
} from '$lib/server/db/actions/collectionReport';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockPrisma } from '../../mocks/prisma';

describe('collectionReport actions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('findPostCollectionsReportsViaPagination', () => {
		it('should call prisma.postCollectionReport.findMany with correct arguments', async () => {
			const pageNumber = 1;
			const reviewStatus = 'PENDING' as ModerationReportStatus;
			const category = 'OTHER' as PostCollectionReportCategory;
			mockPrisma.postCollectionReport.findMany.mockResolvedValue([]);

			await findPostCollectionsReportsViaPagination(pageNumber, reviewStatus, category);

			expect(mockPrisma.postCollectionReport.findMany).toHaveBeenCalledWith({
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

	describe('createPostCollectionReport', () => {
		it('should call prisma.postCollectionReport.create with correct arguments', async () => {
			const description = 'desc';
			const category = 'OTHER' as PostCollectionReportCategory;
			const postCollectionId = 'coll1';
			mockPrisma.postCollectionReport.create.mockResolvedValue({});

			await createPostCollectionReport({ description, category, postCollectionId });

			expect(mockPrisma.postCollectionReport.create).toHaveBeenCalledWith({
				data: {
					description,
					postCollectionId,
					category,
				},
			});
		});
	});

	describe('deletePostCollectionReportByIds', () => {
		it('should call prisma.postCollectionReport.delete with correct arguments', async () => {
			const postCollectionId = 'coll1';
			const reportId = 'rep1';
			mockPrisma.postCollectionReport.delete.mockResolvedValue({});

			await deletePostCollectionReportByIds(postCollectionId, reportId);

			expect(mockPrisma.postCollectionReport.delete).toHaveBeenCalledWith({
				where: {
					id: reportId,
					postCollectionId,
				},
			});
		});
	});

	describe('updatePostCollectionReportStatus', () => {
		it('should call prisma.postCollectionReport.update with correct arguments', async () => {
			const reportId = 'rep1';
			const status = 'APPROVED' as ModerationReportStatus;
			mockPrisma.postCollectionReport.update.mockResolvedValue({});

			await updatePostCollectionReportStatus(reportId, status);

			expect(mockPrisma.postCollectionReport.update).toHaveBeenCalledWith({
				where: { id: reportId },
				data: { reviewStatus: status },
			});
		});
	});
});
