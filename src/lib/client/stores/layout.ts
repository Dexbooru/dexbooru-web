import { writable } from 'svelte/store';
import type { IFooterData } from '../types/stores';

export const footerStore = writable<IFooterData>({
	height: 0,
	bottom: 0,
	element: null
});
