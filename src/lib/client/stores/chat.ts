import { writable } from 'svelte/store';
import type { TChatMessage } from '../types/core';
import type { TChatStoreData } from '../types/stores';

export const chatStore = writable<TChatStoreData>({
	rooms: [],
	friends: [],
	manager: null,
	messages: new Map<string, TChatMessage[]>(),
});
