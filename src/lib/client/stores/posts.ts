import type { IPostPaginationData, THiddenPagePostData, TPost } from '$lib/shared/types/posts';
import { writable } from 'svelte/store';

export const postPaginationStore = writable<IPostPaginationData | null>(null);
export const postsPageStore = writable<TPost[]>([]);
export const originalPostsPageStore = writable<TPost[]>([]);
export const blacklistedPostPageStore = writable<TPost[]>([]);
export const nsfwPostPageStore = writable<TPost[]>([]);
export const hiddenPostsPageStore = writable<THiddenPagePostData>({
	nsfwPosts: [],
	blacklistedPosts: [],
});
