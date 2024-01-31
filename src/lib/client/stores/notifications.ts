import type { IUserNotifications } from '$lib/shared/types/notifcations';
import { writable } from 'svelte/store';

export const notificationStore = writable<IUserNotifications | null>(null);
