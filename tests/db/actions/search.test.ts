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

		it('excludes rejected posts by default', async () => {
			mockPrisma.$queryRaw.mockResolvedValue([]);

			await searchForPosts('query', 10);

			const statement = mockPrisma.$queryRaw.mock.calls[0]?.[0] as {
				strings: string[];
			};
			expect(statement.strings.join('')).toContain(
				`p."moderationStatus" IN ('PENDING', 'APPROVED')`,
			);
		});

		it('allows rejected posts for moderation roles', async () => {
			mockPrisma.$queryRaw.mockResolvedValue([]);

			await searchForPosts('query', 10, true);

			const statement = mockPrisma.$queryRaw.mock.calls[0]?.[0] as {
				strings: string[];
			};
			expect(statement.strings.join('')).not.toContain('p."moderationStatus"');
		});
	});

	describe('searchForUsers', () => {
		it('should call prisma.$queryRaw with correct arguments', async () => {
			mockPrisma.$queryRaw.mockResolvedValue([]);
			await searchForUsers('query', 10);
			expect(mockPrisma.$queryRaw).toHaveBeenCalled();
		});
	});

	it.each([
		['tags', searchForTags],
		['artists', searchForArtists],
		['collections', searchForCollections],
		['posts', searchForPosts],
		['users', searchForUsers],
	])('parameterizes untrusted values when searching %s', async (_, search) => {
		const injectionQuery = "x' || (1/0)::text || 'x";
		mockPrisma.$queryRaw.mockResolvedValue([]);

		await search(injectionQuery, 10);

		const statement = mockPrisma.$queryRaw.mock.calls[0]?.[0] as {
			strings: string[];
			values: unknown[];
		};
		expect(statement.strings.join('')).not.toContain(injectionQuery);
		expect(statement.values).toContain(injectionQuery);
		expect(statement.values).toContain(`%${injectionQuery}%`);
		expect(statement.values).toContain(10);
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
