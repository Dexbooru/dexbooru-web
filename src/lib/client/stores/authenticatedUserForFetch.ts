import { NULLABLE_USER } from '$lib/shared/constants/auth';
import type { TUser } from '$lib/shared/types/users';
import { get } from 'svelte/store';
import { writable } from 'svelte/store';

const authenticatedUserForFetch = writable<TUser | null>(null);

export function setAuthenticatedUserForFetch(user: TUser | null): void {
	authenticatedUserForFetch.set(user);
}

export function getIsAuthenticatedForFetch(): boolean {
	const user = get(authenticatedUserForFetch);
	return user !== null && user.id !== NULLABLE_USER.id;
}
