import { NULLABLE_USER_USER_PREFERENCES } from '$lib/shared/constants/auth';
import type { Prisma } from '@prisma/client';
import prisma from '../prisma';

export const getUserPreferences = async (userId: string) => {
	const preferences = await prisma.userPreference.findFirst({
		where: {
			userId,
		},
	});

	return preferences;
};

export const createUserPreferences = async (userId: string) => {
	await prisma.userPreference.create({
		data: {
			userId,
		},
	});
};

export const updateUserPreferences = async (
	userId: string,
	data: Prisma.UserPreferenceUpdateInput | Prisma.UserPreferenceCreateInput,
) => {
	await prisma.userPreference.upsert({
		where: {
			userId,
		},
		create: {
			...NULLABLE_USER_USER_PREFERENCES,
			userId,
		},
		update: data,
	});
};
