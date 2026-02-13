import {
	checkIfUserIsFriended,
	createFriendRequest,
	deleteFriendRequest,
	findAllUserFriendRequests,
	findFriendRequestsSent,
	findFriendsForUser,
} from '$lib/server/db/actions/friend';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockPrisma } from '../../mocks/prisma';

describe('friend actions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('findAllUserFriendRequests', () => {
		it('should return sent and received friend requests', async () => {
			const userId = 'user1';
			const mockRequests = [
				{
					sentAt: new Date(),
					senderUser: { id: userId, username: 'user1' },
					receiverUser: { id: 'user2', username: 'user2' },
				},
				{
					sentAt: new Date(),
					senderUser: { id: 'user3', username: 'user3' },
					receiverUser: { id: userId, username: 'user1' },
				},
			];
			mockPrisma.friendRequest.findMany.mockResolvedValue(mockRequests);

			const result = await findAllUserFriendRequests(userId);

			expect(result.sentFriendRequests).toHaveLength(1);
			expect(result.receivedFriendRequests).toHaveLength(1);
			expect(result.sentFriendRequests[0]?.id ?? '').toBe('user2');
			expect(result.receivedFriendRequests[0]?.id ?? '').toBe('user3');
		});
	});

	describe('findFriendRequestsSent', () => {
		it('should call prisma.friendRequest.findMany with correct arguments', async () => {
			const userId = 'user1';
			const mockRequests = [
				{
					sentAt: new Date(),
					receiverUser: { id: 'user2', username: 'user2', profilePictureUrl: 'pfp' },
				},
			];
			mockPrisma.friendRequest.findMany.mockResolvedValue(mockRequests);

			const result = await findFriendRequestsSent(userId);

			expect(result).toEqual(mockRequests);
			expect(mockPrisma.friendRequest.findMany).toHaveBeenCalledWith({
				where: { senderUserId: userId },
				orderBy: { sentAt: 'desc' },
				select: {
					sentAt: true,
					receiverUser: {
						select: {
							id: true,
							username: true,
							profilePictureUrl: true,
						},
					},
				},
			});
		});
	});

	describe('createFriendRequest', () => {
		it('should call prisma.friendRequest.create with correct arguments', async () => {
			const senderUserId = 'user1';
			const receiverUserId = 'user2';
			mockPrisma.friendRequest.create.mockResolvedValue({});

			await createFriendRequest(senderUserId, receiverUserId);

			expect(mockPrisma.friendRequest.create).toHaveBeenCalledWith({
				data: {
					senderUserId,
					receiverUserId,
				},
			});
		});
	});

	describe('deleteFriendRequest', () => {
		it('should call prisma.friendRequest.deleteMany with correct arguments', async () => {
			const senderUserId = 'user1';
			const receiverUserId = 'user2';
			mockPrisma.friendRequest.deleteMany.mockResolvedValue({ count: 1 });

			const result = await deleteFriendRequest(senderUserId, receiverUserId);

			expect(result).toBe(true);
			expect(mockPrisma.friendRequest.deleteMany).toHaveBeenCalledWith({
				where: {
					OR: [
						{ senderUserId, receiverUserId },
						{ senderUserId: receiverUserId, receiverUserId: senderUserId },
					],
				},
			});
		});
	});

	describe('checkIfUserIsFriended', () => {
		it('should return true if friend request exists', async () => {
			mockPrisma.friendRequest.findFirst.mockResolvedValue({ id: 'req1' });
			const result = await checkIfUserIsFriended('u1', 'u2');
			expect(result).toBe(true);
		});

		it('should return false if friend request does not exist', async () => {
			mockPrisma.friendRequest.findFirst.mockResolvedValue(null);
			const result = await checkIfUserIsFriended('u1', 'u2');
			expect(result).toBe(false);
		});
	});

	describe('findFriendsForUser', () => {
		it('should call prisma.user.findFirst with correct arguments', async () => {
			const userId = 'user1';
			const mockFriends = [{ id: 'friend1', username: 'friend1' }];
			mockPrisma.user.findFirst.mockResolvedValue({ friends: mockFriends });

			const result = await findFriendsForUser(userId);

			expect(result).toEqual(mockFriends);
			expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
				where: { id: userId },
				select: {
					friends: {
						select: {
							id: true,
							username: true,
							profilePictureUrl: true,
						},
					},
				},
			});
		});
	});
});
