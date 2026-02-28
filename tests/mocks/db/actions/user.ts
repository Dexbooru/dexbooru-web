import { vi } from 'vitest';

export const mockUserActions = {
	findLikedPostsByAuthorId: vi.fn(),
	updatePasswordByUserId: vi.fn(),
	findUserByEmail: vi.fn(),
	findUserByName: vi.fn(),
	findUserById: vi.fn(),
	findUserSelf: vi.fn(),
	getUserStatistics: vi.fn(),
	checkIfUsersAreFriends: vi.fn(),
	createUser: vi.fn(),
	deleteUserById: vi.fn(),
	findUserByNameOrEmail: vi.fn(),
	updateProfilePictureByUserId: vi.fn(),
	updateUsernameByUserId: vi.fn(),
	updateUserRoleById: vi.fn(),
	updateUserRoleByUsername: vi.fn(),
	updateEmailVerifiedByUserId: vi.fn(),
};

vi.mock('$lib/server/db/actions/user', () => mockUserActions);
