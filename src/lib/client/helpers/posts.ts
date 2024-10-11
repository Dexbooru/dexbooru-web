import type { IPostPaginationData, TPost } from '$lib/shared/types/posts';
import { get } from 'svelte/store';
import {
	blacklistedPostPageStore,
	hiddenPostsPageStore,
	nsfwPostPageStore,
	originalPostsPageStore,
	postPaginationStore,
	postsPageStore,
} from '../stores/posts';
import { userPreferenceStore } from '../stores/users';

export function normalizeCount(count: number): string {
	if (count >= 1000000) {
		return (count / 1000000).toFixed(1) + 'M';
	}

	if (count >= 1000) {
		return (count / 1000).toFixed(1) + 'K';
	}

	return count.toString();
}

export function formatNumberWithCommas(target: number): string {
	return target.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function roundNumber(target: number, places: number = 0) {
	return Number(target.toFixed(places));
}

export const updatePostStores = (postPaginationData: IPostPaginationData) => {
	const userPreferences = get(userPreferenceStore);
	const { blacklistedArtists, blacklistedTags, browseInSafeMode } = userPreferences;

	const nsfwPosts: TPost[] = [];
	const blacklistedPosts: TPost[] = [];
	const displayPosts: TPost[] = [];
	for (const post of postPaginationData.posts) {
		const containsBlacklistedTag = post.tags.some((tag) => blacklistedTags.includes(tag.name));
		const containsBlacklistedArtist = post.artists.some((artist) =>
			blacklistedArtists.includes(artist.name),
		);

		let canDisplayPost = false;
		if (!containsBlacklistedArtist && !containsBlacklistedTag) {
			canDisplayPost = true;
		} else {
			blacklistedPosts.push(post);
		}

		if (browseInSafeMode && post.isNsfw) {
			nsfwPosts.push(post);
		} else {
			canDisplayPost = true;
		}

		if (canDisplayPost) {
			displayPosts.push(post);
		}
	}

	postPaginationStore.set(postPaginationData);
	postsPageStore.set(displayPosts);
	originalPostsPageStore.set(displayPosts);
	blacklistedPostPageStore.set(blacklistedPosts);
	nsfwPostPageStore.set(nsfwPosts);
	hiddenPostsPageStore.set({
		nsfwPosts,
		blacklistedPosts,
	});
};
