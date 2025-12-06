import type { UserRole } from '$generated/prisma/browser';

export const MODERATION_NAME_MAP: Record<UserRole, string> = {
	MODERATOR: 'Moderator',
	USER: 'User',
	OWNER: 'Owner',
};
