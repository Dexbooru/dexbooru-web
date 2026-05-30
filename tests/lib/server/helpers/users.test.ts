import { describe, expect, it } from 'vitest';
import { NULLABLE_USER } from '$lib/shared/constants/auth';
import type { TUser } from '$lib/shared/types/users';
import { parseUser } from '$lib/server/helpers/users';

describe('parseUser', () => {
	it('returns null when user id matches nullable user', () => {
		const locals = { user: NULLABLE_USER } as App.Locals;

		expect(parseUser(locals)).toBeNull();
	});

	it('returns authenticated user when id is present', () => {
		const authenticatedUser: TUser = {
			...NULLABLE_USER,
			id: 'user-123',
			username: 'alice',
		};
		const locals = { user: authenticatedUser } as App.Locals;

		expect(parseUser(locals)).toBe(authenticatedUser);
	});
});
