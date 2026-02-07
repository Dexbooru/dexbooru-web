import type { TUserSelector } from '../types/users';

export const PUBLIC_USER_SELECTORS: TUserSelector = {
	id: true,
	username: true,
	createdAt: true,
	email: true,
	profilePictureUrl: true,
	role: true,
	moderationStatus: true,
};

export const JWT_USER_SELECTORS: TUserSelector = {
	id: true,
};
