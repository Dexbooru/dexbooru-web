import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockPrisma } from '../../mocks/prisma';
import {
	findTopKMostViewedPosts,
	findTopKMostLikedPosts,
	findTopKPopularTags,
	findTopKPopularArtists,
} from '$lib/server/db/actions/analytics';

describe('analytics actions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('findTopKMostViewedPosts', () => {
		it('should return empty array if k <= 0', async () => {
			const result = await findTopKMostViewedPosts(0, 24);
			expect(result).toEqual([]);
			expect(mockPrisma.post.findMany).not.toHaveBeenCalled();
		});

		it('should call prisma.post.findMany with correct arguments', async () => {
			const mockPosts = [{ id: '1', views: 100 }];
			mockPrisma.post.findMany.mockResolvedValue(mockPosts);

			const result = await findTopKMostViewedPosts(5, 24);

			expect(result).toEqual(mockPosts);
			expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
				select: {
					id: true,
					createdAt: true,
					description: true,
					views: true,
					author: {
						select: {
							username: true,
							profilePictureUrl: true,
						},
					},
				},
				where: {
					createdAt: {
						gte: expect.any(Date),
					},
				},
				orderBy: {
					views: 'desc',
				},
				take: 5,
			});
		});
	});

	describe('findTopKMostLikedPosts', () => {
		it('should return empty array if k <= 0', async () => {
			const result = await findTopKMostLikedPosts(0, 24);
			expect(result).toEqual([]);
			expect(mockPrisma.post.findMany).not.toHaveBeenCalled();
		});

		it('should call prisma.post.findMany with correct arguments', async () => {
			const mockPosts = [{ id: '1', likes: 100 }];
			mockPrisma.post.findMany.mockResolvedValue(mockPosts);

			const result = await findTopKMostLikedPosts(5, 24);

			expect(result).toEqual(mockPosts);
			expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
				select: {
					id: true,
					createdAt: true,
					description: true,
					likes: true,
					author: {
						select: {
							username: true,
							profilePictureUrl: true,
						},
					},
				},
				where: {
					createdAt: {
						gte: expect.any(Date),
					},
				},
				orderBy: {
					likes: 'desc',
				},
				take: 5,
			});
		});
	});

	describe('findTopKPopularTags', () => {
		it('should return empty array if k <= 0', async () => {
			const result = await findTopKPopularTags(0);
			expect(result).toEqual([]);
			expect(mockPrisma.tag.findMany).not.toHaveBeenCalled();
		});

		it('should call prisma.tag.findMany with correct arguments', async () => {
			const mockTags = [{ name: 'tag1', postCount: 10 }];
			mockPrisma.tag.findMany.mockResolvedValue(mockTags);

			const result = await findTopKPopularTags(5);

			expect(result).toEqual(mockTags);
			expect(mockPrisma.tag.findMany).toHaveBeenCalledWith({
				select: {
					name: true,
					postCount: true,
				},
				orderBy: {
					postCount: 'desc',
				},
				take: 5,
			});
		});
	});

	describe('findTopKPopularArtists', () => {
		it('should return empty array if k <= 0', async () => {
			const result = await findTopKPopularArtists(0);
			expect(result).toEqual([]);
			expect(mockPrisma.artist.findMany).not.toHaveBeenCalled();
		});

		it('should call prisma.artist.findMany with correct arguments', async () => {
			const mockArtists = [{ name: 'artist1', postCount: 10 }];
			mockPrisma.artist.findMany.mockResolvedValue(mockArtists);

			const result = await findTopKPopularArtists(5);

			expect(result).toEqual(mockArtists);
			expect(mockPrisma.artist.findMany).toHaveBeenCalledWith({
				select: {
					name: true,
					postCount: true,
				},
				orderBy: {
					postCount: 'desc',
				},
				take: 5,
			});
		});
	});
});
