import type { IPost, IPostPaginationData } from '$lib/shared/types/posts';
import { writable } from 'svelte/store';

export const postPaginationStore = writable<IPostPaginationData | null>(null);
export const postsPageStore = writable<IPost[]>([]);
export const originalPostsPageStore = writable<IPost[]>([]);
