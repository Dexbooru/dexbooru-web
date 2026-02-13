import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockPrisma } from '../../mocks/prisma';
import {
	searchForTags,
	searchForArtists,
	searchForCollections,
	searchForPosts,
	searchForUsers,
	searchAllSections,
} from '$lib/server/db/actions/search';

describe('search actions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('searchForTags', () => {
		it('should call prisma.$queryRaw with correct arguments', async () => {
			mockPrisma.$queryRaw.mockResolvedValue([]);
			await searchForTags('query', 10);
			expect(mockPrisma.$queryRaw).toHaveBeenCalled();
		});
	});

	describe('searchForArtists', () => {
		it('should call prisma.$queryRaw with correct arguments', async () => {
			mockPrisma.$queryRaw.mockResolvedValue([]);
			await searchForArtists('query', 10);
			expect(mockPrisma.$queryRaw).toHaveBeenCalled();
		});
	});

	describe('searchForCollections', () => {
		it('should call prisma.$queryRaw with correct arguments', async () => {
			mockPrisma.$queryRaw.mockResolvedValue([]);
			await searchForCollections('query', 10);
			expect(mockPrisma.$queryRaw).toHaveBeenCalled();
		});
	});

	describe('searchForPosts', () => {
		it('should call prisma.$queryRaw with correct arguments', async () => {
			mockPrisma.$queryRaw.mockResolvedValue([]);
			await searchForPosts('query', 10);
			expect(mockPrisma.$queryRaw).toHaveBeenCalled();
		});
	});

	describe('searchForUsers', () => {
		it('should call prisma.$queryRaw with correct arguments', async () => {
			mockPrisma.$queryRaw.mockResolvedValue([]);
			await searchForUsers('query', 10);
			expect(mockPrisma.$queryRaw).toHaveBeenCalled();
		});
	});

	describe('searchAllSections', () => {
		it('should call all search functions', async () => {
			mockPrisma.$queryRaw.mockResolvedValue([]);
			const result = await searchAllSections('query', 10);
			expect(result).toHaveProperty('posts');
			expect(result).toHaveProperty('users');
			expect(result).toHaveProperty('tags');
			expect(result).toHaveProperty('artists');
			expect(result).toHaveProperty('collections');
		});
	});
});
