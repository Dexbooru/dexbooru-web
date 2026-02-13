import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockPrisma } from '../../mocks/prisma';
import {
	findUserPreferences,
	createUserPreferences,
	updateUserPreferences,
} from '$lib/server/db/actions/preference';

describe('preference actions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('findUserPreferences', () => {
		it('should call prisma.userPreference.findFirst with correct arguments', async () => {
			const userId = 'u1';
			mockPrisma.userPreference.findFirst.mockResolvedValue({ userId, autoBlurNsfw: true });
			const result = await findUserPreferences(userId);
			expect(result.autoBlurNsfw).toBe(true);
			expect(mockPrisma.userPreference.findFirst).toHaveBeenCalledWith({
				where: { userId },
			});
		});
	});

	describe('createUserPreferences', () => {
		it('should call prisma.userPreference.create with correct arguments', async () => {
			const userId = 'u1';
			await createUserPreferences(userId);
			expect(mockPrisma.userPreference.create).toHaveBeenCalledWith({
				data: { userId },
			});
		});
	});

	describe('updateUserPreferences', () => {
		it('should call prisma.userPreference.upsert with correct arguments', async () => {
			const userId = 'u1';
			const data = { autoBlurNsfw: false };
			await updateUserPreferences(userId, data);
			expect(mockPrisma.userPreference.upsert).toHaveBeenCalledWith({
				where: { userId },
				create: expect.objectContaining({ userId }),
				update: data,
			});
		});
	});
});
