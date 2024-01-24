import type { IUser } from '$lib/shared/types/users';
import { writable } from 'svelte/store';

export const authenticatedUserStore = writable<IUser | null>(null);
