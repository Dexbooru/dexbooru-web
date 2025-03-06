import type { UserRole } from '@prisma/client';
import { getApiAuthHeaders } from '../helpers/auth';

export const updateUserRole = async (username: string, newRole: UserRole) => {
	return await fetch(`/api/user/${username}/promote`, {
		headers: getApiAuthHeaders(),
		method: 'PUT',
		body: JSON.stringify({ newRole }),
	});
};
