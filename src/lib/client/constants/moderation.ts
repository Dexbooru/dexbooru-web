import type { UserRole } from '@prisma/client';

export const MODERATION_NAME_MAP: Record<UserRole, string> = {
	MODERATOR: 'Moderator',
	USER: 'User',
	OWNER: 'Owner',
};
