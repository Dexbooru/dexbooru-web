import type { UserRole } from '$generated/prisma/browser';
import { getApiAuthHeaders } from '../helpers/auth';

export const updateUserRole = async (username: string, newRole: UserRole) => {
	return await fetch(`/api/user/${username}/promote`, {
		headers: getApiAuthHeaders(),
		method: 'PATCH',
		body: JSON.stringify({ newRole }),
	});
};
