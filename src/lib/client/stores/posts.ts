import type { IPostPaginationData, TPost } from '$lib/shared/types/posts';
import { writable } from 'svelte/store';

export const postPaginationStore = writable<IPostPaginationData | null>(null);
export const postsPageStore = writable<TPost[]>([]);
export const originalPostsPageStore = writable<TPost[]>([]);
