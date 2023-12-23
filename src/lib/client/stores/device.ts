import { writable } from 'svelte/store';
import type { IDeviceStoreData } from '../types/device';

export const deviceStore = writable<IDeviceStoreData>({
	isDesktop: false,
	isMobile: false,
	isTablet: false
});

export const isMobileStore = writable<boolean>(false);
export const isDesktopStore = writable<boolean>(false);
export const isTabletStore = writable<boolean>(false);
