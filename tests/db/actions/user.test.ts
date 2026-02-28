import type { UserRole } from '$generated/prisma/enums';
import {
	createFriend,
	createUser,
	findAllModerators,
	findUserById,
	getUserStatistics,
	updateEmailVerifiedByUserId,
	updateUserRoleById,
} from '$lib/server/db/actions/user';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.unmock('$lib/server/db/actions/user');

import { mockPrisma } from '../../mocks/prisma';

describe('user actions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('findAllModerators', () => {
		it('should call prisma.user.findMany with correct role filter', async () => {
			mockPrisma.user.findMany.mockResolvedValue([]);
			await findAllModerators();
			expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
				where: { role: { in: ['MODERATOR', 'OWNER'] } },
				select: expect.any(Object),
			});
		});
	});

	describe('updateUserRoleById', () => {
		it('should call prisma.user.update with correct role', async () => {
			const id = 'u1';
			const newRole = 'MODERATOR' as UserRole;
			mockPrisma.user.update.mockResolvedValue({});
			await updateUserRoleById(id, newRole);
			expect(mockPrisma.user.update).toHaveBeenCalledWith({
				where: { id },
				data: {
					role: newRole,
					superRolePromotionAt: expect.any(Date),
				},
			});
		});
	});

	describe('getUserStatistics', () => {
		it('should return aggregated stats', async () => {
			const userId = 'u1';
			mockPrisma.post.count.mockResolvedValue(10);
			mockPrisma.comment.count.mockResolvedValue(5);
			mockPrisma.post.aggregate.mockResolvedValue({
				_sum: { likes: 100, views: 1000 },
				_avg: { likes: 10, views: 100 },
			});

			const result = await getUserStatistics(userId);

			expect(result.totalPosts).toBe(10);
			expect(result.totalLikes).toBe(100);
			expect(result.averageViews).toBe(100);
		});
	});

	describe('createFriend', () => {
		it('should call prisma.user.update for both users', async () => {
			mockPrisma.user.update.mockResolvedValue({});
			await createFriend('u1', 'u2');
			expect(mockPrisma.user.update).toHaveBeenCalledTimes(2);
		});
	});

	describe('findUserById', () => {
		it('should call prisma.user.findUnique', async () => {
			mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1' });
			await findUserById('u1');
			expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
				where: { id: 'u1' },
				select: undefined,
			});
		});
	});

	describe('createUser', () => {
		it('should call prisma.user.create with emailVerified false by default', async () => {
			mockPrisma.user.create.mockResolvedValue({ id: 'u1' });
			await createUser('user', 'email', 'pass', 'pfp');
			expect(mockPrisma.user.create).toHaveBeenCalledWith({
				data: {
					username: 'user',
					email: 'email',
					password: 'pass',
					profilePictureUrl: 'pfp',
					emailVerified: false,
				},
			});
		});

		it('should call prisma.user.create with emailVerified true when passed', async () => {
			mockPrisma.user.create.mockResolvedValue({ id: 'u1' });
			await createUser('user', 'email', 'pass', 'pfp', true);
			expect(mockPrisma.user.create).toHaveBeenCalledWith({
				data: {
					username: 'user',
					email: 'email',
					password: 'pass',
					profilePictureUrl: 'pfp',
					emailVerified: true,
				},
			});
		});
	});

	describe('updateEmailVerifiedByUserId', () => {
		it('should call prisma.user.update with emailVerified', async () => {
			mockPrisma.user.update.mockResolvedValue({});
			await updateEmailVerifiedByUserId('u1', true);
			expect(mockPrisma.user.update).toHaveBeenCalledWith({
				where: { id: 'u1' },
				data: { emailVerified: true, updatedAt: expect.any(Date) },
			});
		});
	});
});
