import { writable } from 'svelte/store';
import type { IModalStoreData, IFooterStoreData } from '../types/stores';

export const footerStore = writable<IFooterStoreData>({
	height: 0,
	bottom: 0,
	element: null
});

export const modalStore = writable<IModalStoreData>({
	isOpen: false,
	focusedModalName: null
});
