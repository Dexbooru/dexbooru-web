import type { $Enums } from '$generated/prisma/client';

export const isModerationRole = (role: $Enums.UserRole) => {
	if (role === 'MODERATOR' || role === 'OWNER') {
		return true;
	}

	return false;
};
