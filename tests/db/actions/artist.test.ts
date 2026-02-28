import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.unmock('$lib/server/db/actions/artist');

import { mockPrisma } from '../../mocks/prisma';
import {
	updateArtistMetadata,
	findArtistMetadata,
	decrementArtistPostCount,
	incrementArtistPostCount,
	findPostsByArtistName,
	getArtistsWithStartingLetter,
} from '$lib/server/db/actions/artist';

describe('artist actions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('updateArtistMetadata', () => {
		it('should call prisma.artist.update with correct arguments', async () => {
			const artistName = 'artist1';
			const description = 'desc';
			const socialMediaLinks = ['link1'];
			const mockArtist = { name: artistName, description, socialMediaLinks };
			mockPrisma.artist.update.mockResolvedValue(mockArtist);

			const result = await updateArtistMetadata(artistName, description, socialMediaLinks);

			expect(result).toEqual(mockArtist);
			expect(mockPrisma.artist.update).toHaveBeenCalledWith({
				where: { name: artistName },
				data: {
					updatedAt: expect.any(Date),
					description,
					socialMediaLinks: { set: socialMediaLinks },
				},
			});
		});
	});

	describe('findArtistMetadata', () => {
		it('should call prisma.artist.findUnique with correct arguments', async () => {
			const artistName = 'artist1';
			const mockArtist = { name: artistName };
			mockPrisma.artist.findUnique.mockResolvedValue(mockArtist);

			const result = await findArtistMetadata(artistName);

			expect(result).toEqual(mockArtist);
			expect(mockPrisma.artist.findUnique).toHaveBeenCalledWith({
				where: { name: artistName },
			});
		});
	});

	describe('decrementArtistPostCount', () => {
		it('should call prisma.artist.updateMany with correct arguments', async () => {
			const artists = ['artist1', 'artist2'];
			await decrementArtistPostCount(artists);

			expect(mockPrisma.artist.updateMany).toHaveBeenCalledWith({
				where: { name: { in: artists } },
				data: { postCount: { decrement: 1 } },
			});
		});
	});

	describe('incrementArtistPostCount', () => {
		it('should call prisma.artist.updateMany with correct arguments', async () => {
			const artists = ['artist1', 'artist2'];
			await incrementArtistPostCount(artists);

			expect(mockPrisma.artist.updateMany).toHaveBeenCalledWith({
				where: { name: { in: artists } },
				data: { postCount: { increment: 1 } },
			});
		});
	});

	describe('findPostsByArtistName', () => {
		it('should call prisma.post.findMany with correct arguments', async () => {
			const artistName = 'artist1';
			const pageNumber = 1;
			const pageLimit = 10;
			const orderBy = 'createdAt';
			const ascending = false;
			const mockPosts = [{ id: '1' }];
			mockPrisma.post.findMany.mockResolvedValue(mockPosts);

			const result = await findPostsByArtistName(
				artistName,
				pageNumber,
				pageLimit,
				orderBy,
				ascending,
			);

			expect(result).toEqual(mockPosts);
			expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
				where: {
					moderationStatus: { in: ['PENDING', 'APPROVED'] },
					artistString: { contains: artistName },
				},
				orderBy: { [orderBy]: 'desc' },
				skip: pageNumber * pageLimit,
				take: pageLimit,
				select: undefined,
			});
		});
	});

	describe('getArtistsWithStartingLetter', () => {
		it('should call prisma.artist.findMany with correct arguments', async () => {
			const letter = 'a';
			const pageNumber = 0;
			const mockArtists = [{ name: 'artist1' }];
			mockPrisma.artist.findMany.mockResolvedValue(mockArtists);

			const result = await getArtistsWithStartingLetter(letter, pageNumber);

			expect(result).toEqual(mockArtists);
			expect(mockPrisma.artist.findMany).toHaveBeenCalledWith({
				where: {
					OR: [{ name: { startsWith: letter } }, { name: { startsWith: letter.toLowerCase() } }],
				},
				orderBy: { name: 'asc' },
				skip: 0,
				take: 100, // MAXIMUM_ARTISTS_PER_PAGE is 100
				select: { name: true, postCount: true },
			});
		});
	});
});
