import { describe, it, expect } from 'vitest';
import { getUserNotificationsFromId } from '$lib/server/db/actions/notification';

describe('notification actions', () => {
	describe('getUserNotificationsFromId', () => {
		it('should return default notification data', async () => {
			const result = await getUserNotificationsFromId('u1');
			expect(result).toEqual({ todo: 0 });
		});
	});
});
