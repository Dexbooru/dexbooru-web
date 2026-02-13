import type { UserAuthenticationSource } from '$generated/prisma/enums';
import {
	deleteAccountLink,
	findLinkedAccountsFromUserId,
	findUserFromPlatformNameAndId,
	updateLinkedAccountsForUserFromId,
	upsertAccountLink,
} from '$lib/server/db/actions/linkedAccount';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockPrisma } from '../../mocks/prisma';

describe('linkedAccount actions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('updateLinkedAccountsForUserFromId', () => {
		it('should delete and update linked accounts', async () => {
			const userId = 'user1';
			const deletionPlatforms = ['DISCORD'] as UserAuthenticationSource[];
			const accountPlatformPublicities = { GOOGLE: true } as Partial<
				Record<UserAuthenticationSource, boolean | undefined>
			>;

			mockPrisma.linkedUserAccount.deleteMany.mockResolvedValue({ count: 1 });
			mockPrisma.linkedUserAccount.update.mockResolvedValue({});

			await updateLinkedAccountsForUserFromId(
				userId,
				deletionPlatforms,
				accountPlatformPublicities,
			);

			expect(mockPrisma.linkedUserAccount.deleteMany).toHaveBeenCalledWith({
				where: {
					userId,
					platform: { in: deletionPlatforms },
				},
			});
			expect(mockPrisma.linkedUserAccount.update).toHaveBeenCalledWith({
				where: {
					platform_userId: { platform: 'GOOGLE', userId },
				},
				data: { isPublic: true },
			});
		});

		it('should throw error if deletion count does not match', async () => {
			const userId = 'user1';
			const deletionPlatforms = ['DISCORD', 'GOOGLE'] as UserAuthenticationSource[];
			mockPrisma.linkedUserAccount.deleteMany.mockResolvedValue({ count: 1 });

			await expect(
				updateLinkedAccountsForUserFromId(userId, deletionPlatforms, {}),
			).rejects.toThrow();
		});
	});

	describe('findUserFromPlatformNameAndId', () => {
		it('should call prisma.linkedUserAccount.findFirst with correct arguments', async () => {
			const platformName = 'DISCORD' as UserAuthenticationSource;
			const platformUserId = 'p123';
			const mockUser = { id: 'u1', username: 'user1' };
			mockPrisma.linkedUserAccount.findFirst.mockResolvedValue({ user: mockUser });

			const result = await findUserFromPlatformNameAndId(platformName, platformUserId);

			expect(result).toEqual(mockUser);
			expect(mockPrisma.linkedUserAccount.findFirst).toHaveBeenCalledWith({
				relationLoadStrategy: 'join',
				where: { platform: platformName, platformUserId },
				select: expect.any(Object),
			});
		});
	});

	describe('findLinkedAccountsFromUserId', () => {
		it('should call prisma.linkedUserAccount.findMany with correct arguments', async () => {
			const userId = 'u1';
			mockPrisma.linkedUserAccount.findMany.mockResolvedValue([]);

			await findLinkedAccountsFromUserId(userId, false);

			expect(mockPrisma.linkedUserAccount.findMany).toHaveBeenCalledWith({
				where: { userId, isPublic: true },
			});
		});
	});

	describe('upsertAccountLink', () => {
		it('should call prisma.linkedUserAccount.upsert with correct arguments', async () => {
			const userId = 'u1';
			const platform = 'DISCORD' as UserAuthenticationSource;
			const platformUserId = 'p123';
			const platformUsername = 'puser';
			mockPrisma.linkedUserAccount.upsert.mockResolvedValue({});

			await upsertAccountLink(userId, platform, platformUserId, platformUsername);

			expect(mockPrisma.linkedUserAccount.upsert).toHaveBeenCalledWith({
				where: {
					platform_userId: { platform, userId },
				},
				update: { platformUserId, platformUsername },
				create: { userId, platform, platformUserId, platformUsername },
			});
		});
	});

	describe('deleteAccountLink', () => {
		it('should call prisma.linkedUserAccount.deleteMany with correct arguments', async () => {
			const userId = 'u1';
			const platform = 'DISCORD' as UserAuthenticationSource;
			mockPrisma.linkedUserAccount.deleteMany.mockResolvedValue({ count: 1 });

			await deleteAccountLink(userId, platform);

			expect(mockPrisma.linkedUserAccount.deleteMany).toHaveBeenCalledWith({
				where: { userId, platform },
			});
		});
	});
});
