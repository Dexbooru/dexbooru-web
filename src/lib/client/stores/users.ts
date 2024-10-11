import { NULLABLE_USER_USER_PREFERENCES } from '$lib/shared/constants/auth';
import type { IUser } from '$lib/shared/types/users';
import type { UserPreference } from '@prisma/client';
import { writable } from 'svelte/store';

export const authenticatedUserStore = writable<IUser | null>(null);
export const userPreferenceStore = writable<UserPreference>(NULLABLE_USER_USER_PREFERENCES);
