import { writable } from 'svelte/store';
import type { IFooterStoreData } from '../types/stores';

export const footerStore = writable<IFooterStoreData>({
	height: 0,
	bottom: 0,
	element: null
});
