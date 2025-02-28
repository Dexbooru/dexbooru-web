import type { $Enums } from '@prisma/client';

export const isModerationRole = (role: $Enums.UserRole) => {
	if (role === 'MODERATOR' || role === 'OWNER') {
		return true;
	}

	return false;
};
